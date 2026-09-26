"""
CLI Dispatcher for LabReport AI Python Engine.
Enables direct invocation from server.ts for zero-network execution overhead.
"""

import sys
import json
import base64
import traceback
from datetime import datetime, timedelta, date
from .database import get_db_connection, init_db
from .csv_processor import parse_and_validate_csv, process_and_save_csv
from .report_generator import get_report_by_id, generate_pdf_bytes
from .analyzer_mapper import get_all_mappings, add_or_update_mapping, delete_mapping
from .sample_data import get_sample_csv
from .diet_engine import (
    generate_diet_plan,
    get_diet_plan_by_id,
    get_diet_plan_for_report,
    get_diet_plan_for_patient,
    get_all_diet_plans,
    update_diet_plan as update_diet_plan_db,
    generate_diet_pdf_bytes
)

def handle_request(payload: dict) -> dict:
    endpoint = payload.get("endpoint", "")
    method = payload.get("method", "GET").upper()
    body = payload.get("body", {})

    init_db()

    # 1. Stats
    if endpoint == "/api/stats":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM reports")
        total_reports = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM patients")
        total_patients = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM csv_uploads")
        total_csvs = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM report_items WHERE status = 'NORMAL'")
        normal_results = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM report_items WHERE status IN ('LOW', 'HIGH')")
        abnormal_results = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM report_items WHERE status IN ('CRITICAL LOW', 'CRITICAL HIGH')")
        critical_results = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM report_items WHERE status = 'LOW'")
        low_results = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM report_items WHERE status = 'HIGH'")
        high_results = cursor.fetchone()[0]

        cursor.execute("""
        SELECT report_id, patient_id, patient_name, age, sex, report_date, total_tests, normal_count, abnormal_count, critical_count, status
        FROM reports 
        ORDER BY id DESC 
        LIMIT 10
        """)
        recent_reports = [dict(r) for r in cursor.fetchall()]

        cursor.execute("""
        SELECT ri.*, r.patient_name, r.age, r.sex, r.report_date
        FROM report_items ri
        JOIN reports r ON ri.report_id = r.report_id
        WHERE ri.status IN ('CRITICAL LOW', 'CRITICAL HIGH')
        ORDER BY ri.id DESC
        LIMIT 10
        """)
        recent_criticals = [dict(r) for r in cursor.fetchall()]

        # 30-Day Trend calculation for report statuses (Normal vs. Abnormal vs. Critical)
        cursor.execute("""
        SELECT 
            report_date,
            SUM(CASE WHEN status = 'NORMAL' THEN 1 ELSE 0 END) as normal_count,
            SUM(CASE WHEN status = 'ABNORMAL' THEN 1 ELSE 0 END) as abnormal_count,
            SUM(CASE WHEN status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
            COUNT(*) as total_count
        FROM reports
        GROUP BY report_date
        ORDER BY report_date ASC
        """)
        trend_rows = cursor.fetchall()
        date_map = {}
        for r in trend_rows:
            date_map[r["report_date"]] = {
                "normal": int(r["normal_count"] or 0),
                "abnormal": int(r["abnormal_count"] or 0),
                "critical": int(r["critical_count"] or 0),
                "total": int(r["total_count"] or 0),
            }

        # Determine reference date (max date in database or current date)
        today_obj = datetime.now().date()
        if date_map:
            try:
                # Find maximum valid date string in date_map
                valid_dates = []
                for d_k in date_map.keys():
                    try:
                        valid_dates.append(datetime.strptime(d_k, "%Y-%m-%d").date())
                    except Exception:
                        pass
                ref_date = max(valid_dates) if valid_dates else today_obj
            except Exception:
                ref_date = today_obj
        else:
            ref_date = today_obj

        # Generate last 30 days array
        status_trend_30d = []
        for i in range(29, -1, -1):
            day = ref_date - timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            display_str = day.strftime("%b %d")
            day_stats = date_map.get(day_str, {"normal": 0, "abnormal": 0, "critical": 0, "total": 0})
            status_trend_30d.append({
                "date": day_str,
                "display_date": display_str,
                "normal": day_stats["normal"],
                "abnormal": day_stats["abnormal"],
                "critical": day_stats["critical"],
                "total": day_stats["total"],
            })

        conn.close()

        return {
            "status": 200,
            "data": {
                "total_reports": total_reports,
                "total_patients": total_patients,
                "total_csvs": total_csvs,
                "normal_results": normal_results,
                "abnormal_results": abnormal_results,
                "critical_results": critical_results,
                "low_results": low_results,
                "high_results": high_results,
                "status_trend_30d": status_trend_30d,
                "recent_reports": recent_reports,
                "recent_criticals": recent_criticals
            }
        }

    # 2. Sample Data
    elif endpoint == "/api/sample-csv":
        return {"status": 200, "data": {"csv": get_sample_csv()}}

    elif endpoint == "/api/sample-data":
        res = process_and_save_csv(get_sample_csv(), "sample_analyser_batch.csv")
        # Pre-generate clinical diet plans for sample reports for instant demo readiness
        for rid in res.get("report_ids", []):
            try:
                get_diet_plan_for_report(rid)
            except Exception as e:
                pass
        return {"status": 200, "data": res}

    # 3. CSV Upload & Process
    elif endpoint == "/api/upload-csv":
        csv_text = body.get("csv_content", "")
        res = parse_and_validate_csv(csv_text)
        return {"status": 200 if res["success"] else 400, "data": res}

    elif endpoint == "/api/process-csv":
        csv_text = body.get("csv_content", "")
        filename = body.get("filename", "analyser_upload.csv")
        res = process_and_save_csv(csv_text, filename)
        return {"status": 200 if res["success"] else 400, "data": res}

    # 4. Patients
    elif endpoint == "/api/patients":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT p.*, 
               COUNT(r.id) as reports_count,
               MAX(r.report_date) as latest_report_date,
               CASE 
                 WHEN SUM(CASE WHEN r.status = 'CRITICAL' THEN 1 ELSE 0 END) > 0 THEN 'CRITICAL'
                 WHEN SUM(CASE WHEN r.status = 'ABNORMAL' THEN 1 ELSE 0 END) > 0 THEN 'ABNORMAL'
                 ELSE 'NORMAL'
               END as patient_status
        FROM patients p
        LEFT JOIN reports r ON p.patient_id = r.patient_id
        GROUP BY p.patient_id
        ORDER BY p.id DESC
        """)
        patients = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"status": 200, "data": {"patients": patients}}

    elif endpoint.startswith("/api/patients/"):
        pid = endpoint.replace("/api/patients/", "")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (pid,))
        p_row = cursor.fetchone()
        if not p_row:
            conn.close()
            return {"status": 404, "data": {"error": "Patient not found"}}
        patient = dict(p_row)
        cursor.execute("SELECT * FROM reports WHERE patient_id = ? ORDER BY report_date DESC", (pid,))
        patient["reports"] = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"status": 200, "data": patient}

    # 5. Reports
    elif endpoint.startswith("/api/reports") and endpoint.endswith("/pdf"):
        report_id = endpoint.replace("/api/reports/", "").replace("/pdf", "").split("?")[0]
        pdf_bytes = generate_pdf_bytes(report_id)
        return {
            "status": 200,
            "is_base64": True,
            "content_type": "application/pdf",
            "filename": f"LabReport_{report_id}.pdf",
            "data": base64.b64encode(pdf_bytes).decode('ascii')
        }

    elif endpoint.startswith("/api/reports/"):
        report_id = endpoint.replace("/api/reports/", "").split("?")[0]
        rep = get_report_by_id(report_id)
        if not rep:
            return {"status": 404, "data": {"error": "Report not found"}}
        return {"status": 200, "data": rep}

    elif endpoint.startswith("/api/reports"):
        status_filter = payload.get("query", {}).get("status")
        search = payload.get("query", {}).get("search")

        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "SELECT * FROM reports WHERE 1=1"
        params = []
        if status_filter and status_filter.upper() != "ALL":
            sql += " AND status = ?"
            params.append(status_filter.upper())
        if search:
            sql += " AND (patient_id LIKE ? OR patient_name LIKE ? OR report_id LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])
        sql += " ORDER BY id DESC"
        cursor.execute(sql, params)
        reports = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"status": 200, "data": {"reports": reports}}

    # 6. Reference Ranges
    elif endpoint == "/api/reference-ranges" and method == "GET":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reference_ranges ORDER BY test_name ASC, sex ASC, min_age ASC")
        ranges = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"status": 200, "data": {"reference_ranges": ranges}}

    elif endpoint == "/api/reference-ranges" and method == "POST":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO reference_ranges (test_name, sex, min_age, max_age, lower_range, upper_range, unit, critical_low, critical_high, category, notes, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            body.get("test_name", "").strip(),
            body.get("sex", "Any").strip(),
            int(body.get("min_age", 0)),
            int(body.get("max_age", 120)),
            float(body["lower_range"]) if body.get("lower_range") is not None and str(body["lower_range"]).strip() != "" else None,
            float(body["upper_range"]) if body.get("upper_range") is not None and str(body["upper_range"]).strip() != "" else None,
            body.get("unit", "").strip(),
            float(body["critical_low"]) if body.get("critical_low") is not None and str(body["critical_low"]).strip() != "" else None,
            float(body["critical_high"]) if body.get("critical_high") is not None and str(body["critical_high"]).strip() != "" else None,
            body.get("category", "General"),
            body.get("notes", ""),
            1
        ))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {"status": 200, "data": {"success": True, "id": new_id, "message": "Reference range added."}}

    elif endpoint.startswith("/api/reference-ranges/") and method == "PUT":
        range_id = int(endpoint.replace("/api/reference-ranges/", ""))
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE reference_ranges SET
            test_name = ?, sex = ?, min_age = ?, max_age = ?,
            lower_range = ?, upper_range = ?, unit = ?,
            critical_low = ?, critical_high = ?, category = ?, notes = ?
        WHERE id = ?
        """, (
            body.get("test_name", "").strip(),
            body.get("sex", "Any").strip(),
            int(body.get("min_age", 0)),
            int(body.get("max_age", 120)),
            float(body["lower_range"]) if body.get("lower_range") is not None and str(body["lower_range"]).strip() != "" else None,
            float(body["upper_range"]) if body.get("upper_range") is not None and str(body["upper_range"]).strip() != "" else None,
            body.get("unit", "").strip(),
            float(body["critical_low"]) if body.get("critical_low") is not None and str(body["critical_low"]).strip() != "" else None,
            float(body["critical_high"]) if body.get("critical_high") is not None and str(body["critical_high"]).strip() != "" else None,
            body.get("category", "General"),
            body.get("notes", ""),
            range_id
        ))
        conn.commit()
        conn.close()
        return {"status": 200, "data": {"success": True, "message": "Reference range updated."}}

    elif endpoint.startswith("/api/reference-ranges/") and method == "DELETE":
        range_id = int(endpoint.replace("/api/reference-ranges/", ""))
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reference_ranges WHERE id = ?", (range_id,))
        conn.commit()
        conn.close()
        return {"status": 200, "data": {"success": True, "message": "Reference range deleted."}}

    # 7. Analyzer Mappings
    elif endpoint == "/api/analyzer-mappings" and method == "GET":
        mappings = get_all_mappings()
        return {"status": 200, "data": {"mappings": mappings}}

    elif endpoint == "/api/analyzer-mappings" and method == "POST":
        add_or_update_mapping(
            analyzer_code=body.get("analyzer_code", ""),
            standard_test_name=body.get("standard_test_name", ""),
            analyzer_name=body.get("analyzer_name", "Generic"),
            sample_unit=body.get("sample_unit", ""),
            notes=body.get("notes", "")
        )
        return {"status": 200, "data": {"success": True, "message": "Mapping saved."}}

    elif endpoint.startswith("/api/analyzer-mappings/") and method == "DELETE":
        mapping_id = int(endpoint.replace("/api/analyzer-mappings/", ""))
        delete_mapping(mapping_id)
        return {"status": 200, "data": {"success": True, "message": "Mapping deleted."}}

    # 8. Settings
    elif endpoint == "/api/settings" and method == "GET":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        settings_dict = {r["key"]: r["value"] for r in cursor.fetchall()}
        conn.close()
        return {"status": 200, "data": {"settings": settings_dict}}

    elif endpoint == "/api/settings" and method == "POST":
        conn = get_db_connection()
        cursor = conn.cursor()
        for k, v in body.items():
            cursor.execute("""
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """, (k, str(v)))
        conn.commit()
        conn.close()
        return {"status": 200, "data": {"success": True, "message": "Settings saved."}}

    # 9. Patient Diet Plans
    elif endpoint == "/api/diet-plans" and method == "GET":
        plans = get_all_diet_plans()
        return {"status": 200, "data": {"diet_plans": plans}}

    elif endpoint.startswith("/api/diet-plans/report/") and method == "GET":
        rid = endpoint.replace("/api/diet-plans/report/", "").strip()
        plan = get_diet_plan_for_report(rid)
        if not plan:
            return {"status": 404, "data": {"error": f"Diet plan could not be generated for report {rid}"}}
        return {"status": 200, "data": plan}

    elif endpoint.startswith("/api/diet-plans/patient/") and method == "GET":
        pid = endpoint.replace("/api/diet-plans/patient/", "").strip()
        plan = get_diet_plan_for_patient(pid)
        if not plan:
            return {"status": 404, "data": {"error": f"Diet plan could not be found for patient {pid}"}}
        return {"status": 200, "data": plan}

    elif endpoint.startswith("/api/diet-plans/") and endpoint.endswith("/pdf") and method == "GET":
        plan_id_str = endpoint.replace("/api/diet-plans/", "").replace("/pdf", "").split("?")[0]
        try:
            plan_id = int(plan_id_str)
            pdf_bytes = generate_diet_pdf_bytes(plan_id)
            return {
                "status": 200,
                "is_base64": True,
                "content_type": "application/pdf",
                "filename": f"DietPlan_{plan_id}.pdf",
                "data": base64.b64encode(pdf_bytes).decode('ascii')
            }
        except Exception as e:
            return {"status": 500, "data": {"error": f"Failed to generate diet plan PDF: {str(e)}"}}

    elif endpoint.startswith("/api/diet-plans/") and method == "GET":
        plan_id_str = endpoint.replace("/api/diet-plans/", "").strip()
        try:
            plan_id = int(plan_id_str)
            plan = get_diet_plan_by_id(plan_id)
            if not plan:
                return {"status": 404, "data": {"error": "Diet plan not found"}}
            return {"status": 200, "data": plan}
        except Exception as e:
            return {"status": 400, "data": {"error": "Invalid plan ID"}}

    elif endpoint == "/api/diet-plans/generate" and method == "POST":
        p_id = body.get("patient_id", "")
        p_name = body.get("patient_name", "Anonymous Patient")
        p_age = int(body.get("age", 35))
        p_sex = body.get("sex", "Any")
        rep_id = body.get("report_id")
        diet_pref = body.get("dietary_preference", "Standard Balanced")
        cals = body.get("custom_calories")
        notes = body.get("nutritionist_notes", "")

        plan = generate_diet_plan(
            patient_id=p_id,
            patient_name=p_name,
            age=p_age,
            sex=p_sex,
            report_id=rep_id,
            dietary_preference=diet_pref,
            custom_calories=int(cals) if cals else None,
            nutritionist_notes=notes
        )
        return {"status": 200, "data": plan}

    elif endpoint.startswith("/api/diet-plans/") and method == "PUT":
        plan_id_str = endpoint.replace("/api/diet-plans/", "").strip()
        try:
            plan_id = int(plan_id_str)
            update_diet_plan_db(plan_id, body)
            updated_plan = get_diet_plan_by_id(plan_id)
            return {"status": 200, "data": {"success": True, "diet_plan": updated_plan}}
        except Exception as e:
            return {"status": 400, "data": {"error": f"Failed to update diet plan: {str(e)}"}}

    # 10. Reset DB
    elif endpoint == "/api/reset-db":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM report_items")
        cursor.execute("DELETE FROM reports")
        cursor.execute("DELETE FROM patients")
        cursor.execute("DELETE FROM csv_uploads")
        cursor.execute("DELETE FROM patient_diet_plans")
        conn.commit()
        conn.close()
        return {"status": 200, "data": {"success": True, "message": "Database reset."}}

    return {"status": 404, "data": {"error": f"Endpoint not found: {endpoint}"}}

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"status": 400, "data": {"error": "Empty input payload"}}))
            return
        payload = json.loads(raw_input)
        response = handle_request(payload)
        print(json.dumps(response, default=str))
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"status": 500, "data": {"error": str(e)}}))

if __name__ == "__main__":
    main()
