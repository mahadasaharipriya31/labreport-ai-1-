"""
Main Backend Application for LabReport AI.
Implements the REST API endpoints for CSV parsing, patient reports,
reference ranges, analyzer mappings, and PDF export.
"""

import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import sys
import os
import traceback

from .database import get_db_connection, init_db
from .csv_processor import parse_and_validate_csv, process_and_save_csv
from .report_generator import get_report_by_id, generate_pdf_bytes
from .analyzer_mapper import get_all_mappings, add_or_update_mapping, delete_mapping
from .sample_data import get_sample_csv

PORT = int(os.environ.get("PYTHON_PORT", 8000))

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class LabReportAPIHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def _read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length)
        try:
            return json.loads(body.decode('utf-8'))
        except Exception:
            return {"raw": body.decode('utf-8', errors='ignore')}

    def _send_json(self, data, status=200):
        self._set_headers(status, "application/json")
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def _send_error(self, message, status=400):
        self._send_json({"success": False, "error": message}, status=status)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        try:
            # 1. Health check
            if path in ["/api/health", "/health"]:
                self._send_json({"status": "healthy", "service": "LabReport AI Engine"})
                return

            # 2. Overall statistics for Dashboard
            elif path == "/api/stats":
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

                # Status breakdowns
                cursor.execute("SELECT COUNT(*) FROM report_items WHERE status = 'LOW'")
                low_results = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM report_items WHERE status = 'HIGH'")
                high_results = cursor.fetchone()[0]

                # Fetch recent reports
                cursor.execute("""
                SELECT report_id, patient_id, patient_name, age, sex, report_date, total_tests, normal_count, abnormal_count, critical_count, status
                FROM reports 
                ORDER BY id DESC 
                LIMIT 10
                """)
                recent_reports = [dict(r) for r in cursor.fetchall()]

                # Fetch critical alert items list
                cursor.execute("""
                SELECT ri.*, r.patient_name, r.age, r.sex, r.report_date
                FROM report_items ri
                JOIN reports r ON ri.report_id = r.report_id
                WHERE ri.status IN ('CRITICAL LOW', 'CRITICAL HIGH')
                ORDER BY ri.id DESC
                LIMIT 10
                """)
                recent_criticals = [dict(r) for r in cursor.fetchall()]

                conn.close()

                self._send_json({
                    "total_reports": total_reports,
                    "total_patients": total_patients,
                    "total_csvs": total_csvs,
                    "normal_results": normal_results,
                    "abnormal_results": abnormal_results,
                    "critical_results": critical_results,
                    "low_results": low_results,
                    "high_results": high_results,
                    "recent_reports": recent_reports,
                    "recent_criticals": recent_criticals
                })
                return

            # 3. Sample CSV content
            elif path == "/api/sample-csv":
                sample_text = get_sample_csv()
                self._send_json({"csv": sample_text})
                return

            # 4. Patients list & Patient detail
            elif path == "/api/patients":
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
                self._send_json({"patients": patients})
                return

            elif path.startswith("/api/patients/"):
                pid = path.replace("/api/patients/", "")
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (pid,))
                p_row = cursor.fetchone()
                if not p_row:
                    conn.close()
                    self._send_error(f"Patient {pid} not found", status=404)
                    return

                patient = dict(p_row)
                cursor.execute("SELECT * FROM reports WHERE patient_id = ? ORDER BY report_date DESC", (pid,))
                patient["reports"] = [dict(r) for r in cursor.fetchall()]
                conn.close()
                self._send_json(patient)
                return

            # 5. Reports list & Report detail
            elif path == "/api/reports":
                status_filter = query.get("status", [None])[0]
                search = query.get("search", [None])[0]

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
                self._send_json({"reports": reports})
                return

            elif path.endswith("/pdf"):
                report_id = path.replace("/api/reports/", "").replace("/pdf", "")
                pdf_data = generate_pdf_bytes(report_id)
                self.send_response(200)
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Disposition", f'inline; filename="LabReport_{report_id}.pdf"')
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(pdf_data)
                return

            elif path.startswith("/api/reports/"):
                report_id = path.replace("/api/reports/", "")
                report = get_report_by_id(report_id)
                if not report:
                    self._send_error(f"Report {report_id} not found", status=404)
                    return
                self._send_json(report)
                return

            # 6. Reference Ranges
            elif path == "/api/reference-ranges":
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM reference_ranges ORDER BY test_name ASC, sex ASC, min_age ASC")
                ranges = [dict(r) for r in cursor.fetchall()]
                conn.close()
                self._send_json({"reference_ranges": ranges})
                return

            # 7. Analyzer Mappings
            elif path == "/api/analyzer-mappings":
                mappings = get_all_mappings()
                self._send_json({"mappings": mappings})
                return

            # 8. Settings
            elif path == "/api/settings":
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT key, value FROM settings")
                settings_dict = {r["key"]: r["value"] for r in cursor.fetchall()}
                conn.close()
                self._send_json({"settings": settings_dict})
                return

            else:
                self._send_error("Endpoint not found", status=404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(str(e), status=500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_json_body()

            # 1. Preview / Validate CSV without committing
            if path == "/api/upload-csv":
                csv_text = body.get("csv_content", "")
                if not csv_text:
                    self._send_error("No CSV content provided")
                    return
                res = parse_and_validate_csv(csv_text)
                self._send_json(res)
                return

            # 2. Process and Save CSV
            elif path == "/api/process-csv":
                csv_text = body.get("csv_content", "")
                filename = body.get("filename", "analyser_output.csv")
                if not csv_text:
                    self._send_error("No CSV content provided")
                    return
                res = process_and_save_csv(csv_text, filename)
                self._send_json(res)
                return

            # 3. Load & Process Sample Data (Key Hackathon Demo Button)
            elif path == "/api/sample-data":
                sample_csv = get_sample_csv()
                res = process_and_save_csv(sample_csv, "sample_analyser_batch.csv")
                self._send_json(res)
                return

            # 4. Generate PDF
            elif path.endswith("/pdf") and path.startswith("/api/reports/"):
                report_id = path.replace("/api/reports/", "").replace("/pdf", "")
                pdf_data = generate_pdf_bytes(report_id)
                self.send_response(200)
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Disposition", f'inline; filename="LabReport_{report_id}.pdf"')
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(pdf_data)
                return

            # 5. Create Reference Range
            elif path == "/api/reference-ranges":
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
                self._send_json({"success": True, "id": new_id, "message": "Reference range added successfully."})
                return

            # 6. Create / Update Analyzer Mapping
            elif path == "/api/analyzer-mappings":
                add_or_update_mapping(
                    analyzer_code=body.get("analyzer_code", ""),
                    standard_test_name=body.get("standard_test_name", ""),
                    analyzer_name=body.get("analyzer_name", "Generic"),
                    sample_unit=body.get("sample_unit", ""),
                    notes=body.get("notes", "")
                )
                self._send_json({"success": True, "message": "Mapping saved."})
                return

            # 7. Update Settings
            elif path == "/api/settings":
                conn = get_db_connection()
                cursor = conn.cursor()
                for k, v in body.items():
                    cursor.execute("""
                    INSERT INTO settings (key, value) VALUES (?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value
                    """, (k, str(v)))
                conn.commit()
                conn.close()
                self._send_json({"success": True, "message": "Settings updated."})
                return

            # 8. Reset Database
            elif path == "/api/reset-db":
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM report_items")
                cursor.execute("DELETE FROM reports")
                cursor.execute("DELETE FROM patients")
                cursor.execute("DELETE FROM csv_uploads")
                conn.commit()
                conn.close()
                self._send_json({"success": True, "message": "Database cleared."})
                return

            else:
                self._send_error("Endpoint not found", status=404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(str(e), status=500)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_json_body()

            if path.startswith("/api/reference-ranges/"):
                range_id = int(path.replace("/api/reference-ranges/", ""))
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
                self._send_json({"success": True, "message": "Reference range updated."})
                return

            elif path.startswith("/api/analyzer-mappings/"):
                mapping_id = int(path.replace("/api/analyzer-mappings/", ""))
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("""
                UPDATE analyzer_mappings SET
                    analyzer_code = ?, standard_test_name = ?,
                    analyzer_name = ?, sample_unit = ?, notes = ?
                WHERE id = ?
                """, (
                    body.get("analyzer_code", "").strip(),
                    body.get("standard_test_name", "").strip(),
                    body.get("analyzer_name", "Generic").strip(),
                    body.get("sample_unit", "").strip(),
                    body.get("notes", "").strip(),
                    mapping_id
                ))
                conn.commit()
                conn.close()
                self._send_json({"success": True, "message": "Mapping updated."})
                return

            else:
                self._send_error("Endpoint not found", status=404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(str(e), status=500)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            if path.startswith("/api/reference-ranges/"):
                range_id = int(path.replace("/api/reference-ranges/", ""))
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM reference_ranges WHERE id = ?", (range_id,))
                conn.commit()
                conn.close()
                self._send_json({"success": True, "message": "Reference range deleted."})
                return

            elif path.startswith("/api/analyzer-mappings/"):
                mapping_id = int(path.replace("/api/analyzer-mappings/", ""))
                delete_mapping(mapping_id)
                self._send_json({"success": True, "message": "Mapping deleted."})
                return

            else:
                self._send_error("Endpoint not found", status=404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(str(e), status=500)


def run_server(port=PORT):
    init_db()
    server_address = ('0.0.0.0', port)
    httpd = ThreadedHTTPServer(server_address, LabReportAPIHandler)
    print(f"LabReport AI Python API Server running on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    run_server()
