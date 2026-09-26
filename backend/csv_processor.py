"""
CSV Processing and Validation Engine.
Ingests analyser output CSVs, validates rows, resolves test codes, calculates reference ranges,
and commits structured patients, reports, and report items to SQLite.
"""

import csv
import io
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple
from .database import get_db_connection
from .analyzer_mapper import resolve_test_name
from .reference_engine import find_reference_range, classify_result

REQUIRED_FIELDS = ["Patient ID", "Patient Name", "Age", "Sex", "Test Name", "Result", "Unit", "Analyzer", "Date"]

# Header aliases map for resilient CSV column matching
HEADER_ALIASES = {
    "patient id": "Patient ID",
    "patient_id": "Patient ID",
    "pid": "Patient ID",
    "patientid": "Patient ID",
    "mrn": "Patient ID",
    "patient name": "Patient Name",
    "patient_name": "Patient Name",
    "name": "Patient Name",
    "age": "Age",
    "sex": "Sex",
    "gender": "Sex",
    "test name": "Test Name",
    "test_name": "Test Name",
    "test": "Test Name",
    "parameter": "Test Name",
    "analyte": "Test Name",
    "result": "Result",
    "value": "Result",
    "test_result": "Result",
    "unit": "Unit",
    "units": "Unit",
    "analyzer": "Analyzer",
    "analyser": "Analyzer",
    "machine": "Analyzer",
    "instrument": "Analyzer",
    "date": "Date",
    "test_date": "Date",
    "report_date": "Date",
}

def parse_and_validate_csv(csv_content: str) -> Dict[str, Any]:
    """
    Parses CSV content and performs validation checks.
    Returns preview data, statistics, detected analyzers, detected units, and validation warnings/errors.
    """
    lines = csv_content.strip().splitlines()
    if not lines:
        return {
            "success": False,
            "error": "CSV file is completely empty."
        }

    # Use csv.reader or csv.DictReader
    reader = csv.reader(lines)
    try:
        raw_headers = next(reader)
    except StopIteration:
        return {"success": False, "error": "Unable to read CSV header row."}

    # Normalize header mapping
    header_map = {}
    for idx, h in enumerate(raw_headers):
        clean_h = h.strip().lower()
        if clean_h in HEADER_ALIASES:
            header_map[HEADER_ALIASES[clean_h]] = idx

    # Check for critical missing columns
    essential = ["Patient ID", "Test Name", "Result"]
    missing = [col for col in essential if col not in header_map]
    if missing:
        return {
            "success": False,
            "error": f"Missing mandatory CSV columns: {', '.join(missing)}. Expected headers such as: Patient ID, Patient Name, Age, Sex, Test Name, Result, Unit, Analyzer, Date."
        }

    parsed_rows = []
    validation_issues = []
    patient_ids = set()
    analyzers = set()
    units = set()
    tests = set()

    row_num = 1
    for raw_row in reader:
        row_num += 1
        if not raw_row or not any(raw_row):
            continue  # skip blank lines

        # Extract columns
        def get_val(col_name: str, default: str = "") -> str:
            if col_name in header_map and header_map[col_name] < len(raw_row):
                return raw_row[header_map[col_name]].strip()
            return default

        p_id = get_val("Patient ID", f"UNK-{row_num}")
        p_name = get_val("Patient Name", "Anonymous Patient")
        raw_age = get_val("Age", "30")
        raw_sex = get_val("Sex", "Any")
        raw_test = get_val("Test Name", "")
        raw_result_str = get_val("Result", "")
        unit = get_val("Unit", "")
        analyzer = get_val("Analyzer", "General Lab Analyzer")
        date_val = get_val("Date", datetime.now().strftime("%Y-%m-%d"))

        # Validation Checks
        row_errors = []

        if not raw_test:
            row_errors.append("Empty test name")

        # Age validation
        try:
            age = int(float(raw_age))
            if age < 0 or age > 130:
                row_errors.append(f"Invalid age ({raw_age})")
                age = 30
        except ValueError:
            row_errors.append(f"Non-numeric age '{raw_age}'")
            age = 30

        # Sex validation
        sex_clean = raw_sex.strip().capitalize()
        if sex_clean not in ["Male", "Female", "M", "F", "Any", "Other"]:
            sex_clean = "Any"

        # Result numeric validation
        try:
            # Clean possible special chars like '< 0.05' or trailing commas
            cleaned_num_str = re.sub(r"[^\d.-]", "", raw_result_str)
            if not cleaned_num_str:
                raise ValueError("No digits")
            result_val = float(cleaned_num_str)
        except ValueError:
            row_errors.append(f"Result must be numeric (found '{raw_result_str}')")
            result_val = 0.0

        if row_errors:
            validation_issues.append({
                "row": row_num,
                "patient_id": p_id,
                "test": raw_test,
                "issues": row_errors
            })

        patient_ids.add(p_id)
        if analyzer: analyzers.add(analyzer)
        if unit: units.add(unit)
        if raw_test: tests.add(raw_test)

        # Resolve standard test name
        std_test_name, map_note = resolve_test_name(raw_test)

        # Find reference range
        ref_range = find_reference_range(std_test_name, age, sex_clean)
        classification = classify_result(result_val, unit, ref_range, std_test_name)

        parsed_rows.append({
            "row_number": row_num,
            "patient_id": p_id,
            "patient_name": p_name,
            "age": age,
            "sex": sex_clean,
            "raw_test_name": raw_test,
            "standard_test_name": std_test_name,
            "mapping_note": map_note,
            "raw_result": result_val,
            "raw_unit": unit,
            "analyzer": analyzer,
            "date": date_val,
            "classification": classification,
            "has_error": len(row_errors) > 0,
            "error_details": row_errors
        })

    return {
        "success": True,
        "total_records": len(parsed_rows),
        "total_patients": len(patient_ids),
        "detected_analyzers": sorted(list(analyzers)),
        "detected_units": sorted(list(units)),
        "detected_tests": sorted(list(tests)),
        "validation_issues_count": len(validation_issues),
        "validation_issues": validation_issues[:20],  # preview top 20
        "preview_records": parsed_rows[:50],          # preview top 50
        "all_records": parsed_rows
    }

def process_and_save_csv(csv_content: str, filename: str = "upload.csv") -> Dict[str, Any]:
    """
    Processes CSV records, groups them into Patient Reports, computes aggregate statistics,
    and commits everything to the SQLite database.
    """
    validation_data = parse_and_validate_csv(csv_content)
    if not validation_data["success"]:
        return validation_data

    records = validation_data["all_records"]
    if not records:
        return {"success": False, "error": "No valid data rows found in CSV."}

    conn = get_db_connection()
    cursor = conn.cursor()

    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Group records by (patient_id, date)
    patient_reports_map: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
    patient_info_map: Dict[str, Dict[str, Any]] = {}

    for rec in records:
        pid = rec["patient_id"]
        pdate = rec["date"]
        key = (pid, pdate)
        if key not in patient_reports_map:
            patient_reports_map[key] = []
        patient_reports_map[key].append(rec)

        # Cache patient demographics
        patient_info_map[pid] = {
            "name": rec["patient_name"],
            "age": rec["age"],
            "sex": rec["sex"]
        }

    # Upsert Patients
    for pid, pinfo in patient_info_map.items():
        cursor.execute("""
        INSERT INTO patients (patient_id, name, age, sex, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(patient_id) DO UPDATE SET
            name = excluded.name,
            age = excluded.age,
            sex = excluded.sex
        """, (pid, pinfo["name"], pinfo["age"], pinfo["sex"], now_iso))

    generated_report_ids = []
    total_normal = 0
    total_abnormal = 0
    total_critical = 0

    # Create Reports and Report Items
    for (pid, pdate), items in patient_reports_map.items():
        pinfo = patient_info_map[pid]
        report_id = f"REP-{pid}-{pdate.replace('-', '')}"

        # Analyze status counts
        n_count = 0
        abn_count = 0
        crit_count = 0
        analyzer_set = set()

        for item in items:
            c = item["classification"]
            analyzer_set.add(item["analyzer"])
            if c["is_critical"]:
                crit_count += 1
            elif c["is_abnormal"]:
                abn_count += 1
            elif c["status"] == "NORMAL":
                n_count += 1

        overall_status = "CRITICAL" if crit_count > 0 else ("ABNORMAL" if abn_count > 0 else "NORMAL")
        analyzers_str = ", ".join(sorted(list(analyzer_set))) if analyzer_set else "Auto Analyzer"

        total_normal += n_count
        total_abnormal += abn_count
        total_critical += crit_count

        # Upsert Report Header
        cursor.execute("""
        INSERT INTO reports (
            report_id, patient_id, patient_name, age, sex, report_date,
            analyzer_name, total_tests, normal_count, abnormal_count, critical_count,
            status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(report_id) DO UPDATE SET
            patient_name = excluded.patient_name,
            age = excluded.age,
            sex = excluded.sex,
            analyzer_name = excluded.analyzer_name,
            total_tests = excluded.total_tests,
            normal_count = excluded.normal_count,
            abnormal_count = excluded.abnormal_count,
            critical_count = excluded.critical_count,
            status = excluded.status
        """, (
            report_id, pid, pinfo["name"], pinfo["age"], pinfo["sex"], pdate,
            analyzers_str, len(items), n_count, abn_count, crit_count,
            overall_status, now_iso
        ))

        # Delete existing items for this report to prevent duplicates upon re-upload
        cursor.execute("DELETE FROM report_items WHERE report_id = ?", (report_id,))

        # Insert Report Items
        for item in items:
            c = item["classification"]
            cursor.execute("""
            INSERT INTO report_items (
                report_id, patient_id, test_name, raw_result, raw_unit,
                normalized_result, normalized_unit, lower_range, upper_range,
                critical_low, critical_high, status, conversion_applied,
                analyzer, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report_id,
                pid,
                item["standard_test_name"] or item["raw_test_name"],
                item["raw_result"],
                item["raw_unit"],
                c["normalized_result"],
                c["normalized_unit"],
                c["lower_range"],
                c["upper_range"],
                c["critical_low"],
                c["critical_high"],
                c["status"],
                c["conversion_applied"],
                item["analyzer"],
                item["mapping_note"] or c.get("alert_message")
            ))

        generated_report_ids.append(report_id)

    # Log CSV Upload
    cursor.execute("""
    INSERT INTO csv_uploads (filename, row_count, patient_count, analyzers_detected, status, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        filename,
        len(records),
        len(patient_info_map),
        ", ".join(validation_data["detected_analyzers"]),
        "Processed",
        now_iso
    ))

    conn.commit()
    conn.close()

    # Automatically synthesize pathology-tailored patient diet plans
    try:
        from .diet_engine import get_diet_plan_for_report
        for rid in generated_report_ids:
            get_diet_plan_for_report(rid)
    except Exception as e:
        pass

    return {
        "success": True,
        "message": f"Successfully processed {len(records)} test records for {len(patient_info_map)} patients.",
        "reports_generated_count": len(generated_report_ids),
        "report_ids": generated_report_ids,
        "stats": {
            "total_records": len(records),
            "total_patients": len(patient_info_map),
            "normal_results": total_normal,
            "abnormal_results": total_abnormal,
            "critical_results": total_critical
        }
    }
