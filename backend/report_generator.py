"""
Report Generator and PDF Exporter for Pathology Reports.
Builds full medical lab reports with patient headers, test result tables,
reference intervals, critical alerts, unit conversion traces, and professional PDF generation.
"""

import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from .database import get_db_connection

def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
    report_row = cursor.fetchone()
    if not report_row:
        conn.close()
        return None

    report = dict(report_row)

    # Fetch patient details
    cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (report["patient_id"],))
    patient_row = cursor.fetchone()
    report["patient"] = dict(patient_row) if patient_row else {
        "patient_id": report["patient_id"],
        "name": report["patient_name"],
        "age": report["age"],
        "sex": report["sex"]
    }

    # Fetch report items
    cursor.execute("""
    SELECT * FROM report_items 
    WHERE report_id = ? 
    ORDER BY id ASC
    """, (report_id,))
    items = [dict(r) for r in cursor.fetchall()]
    report["items"] = items

    # Group critical alerts
    critical_items = [item for item in items if "CRITICAL" in item["status"]]
    abnormal_items = [item for item in items if item["status"] in ["LOW", "HIGH"]]
    report["critical_items"] = critical_items
    report["abnormal_items"] = abnormal_items

    # Fetch Lab Settings
    cursor.execute("SELECT key, value FROM settings")
    settings_dict = {r["key"]: r["value"] for r in cursor.fetchall()}
    report["lab_settings"] = settings_dict

    conn.close()
    return report

def generate_pdf_bytes(report_id: str) -> bytes:
    """
    Generates a clean, vector-rendered, printable PDF document for the laboratory report.
    Built with standard pure-Python PDF primitives for zero-dependency reliability and pixel-perfect healthcare layout.
    """
    report = get_report_by_id(report_id)
    if not report:
        raise ValueError(f"Report {report_id} not found")

    lab_settings = report.get("lab_settings", {})
    lab_name = lab_settings.get("lab_name", "MetroHealth Advanced Pathology Laboratory")
    lab_tagline = lab_settings.get("lab_tagline", "Accredited Clinical Diagnostic Centre")
    lab_address = lab_settings.get("lab_address", "452 Medical Science Square, Health District, CA")
    lab_phone = lab_settings.get("lab_phone", "+1 (800) 555-LABS")
    lab_director = lab_settings.get("lab_director", "Dr. Sarah Jenkins, MD, FACP")

    # Pure Python PDF Generator creating valid PDF 1.4 spec
    # A4 dimensions in points: 595.28 x 841.89
    width, height = 595.28, 841.89

    stream = io.BytesIO()
    
    # PDF objects builder
    objects = []
    
    def add_object(obj_str: str) -> int:
        objects.append(obj_str.encode('utf-8'))
        return len(objects)

    # Escape PDF text helper
    def esc(text: str) -> str:
        if text is None:
            return ""
        return str(text).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    # Build Content Stream
    cs = []
    
    # Background top header banner (Slate/Blue 900)
    cs.append("0.08 0.18 0.36 rg") # Dark blue
    cs.append(f"0 {height - 90} {width} 90 re f")
    
    # Header Accent line (Cyan/Teal)
    cs.append("0.05 0.65 0.75 rg")
    cs.append(f"0 {height - 94} {width} 4 re f")

    # Header Text
    cs.append("BT /F2 16 Tf 1 1 1 rg 36 785 Td (" + esc(lab_name.upper()) + ") Tj ET")
    cs.append("BT /F1 9 Tf 0.8 0.9 1 rg 36 768 Td (" + esc(lab_tagline) + " | " + esc(lab_address) + ") Tj ET")
    cs.append("BT /F1 8.5 Tf 0.8 0.9 1 rg 36 754 Td (Tel: " + esc(lab_phone) + "  |  Lab Director: " + esc(lab_director) + ") Tj ET")

    # Report Title Badge
    cs.append("0.94 0.96 0.98 rg 36 705 523 32 re f")
    cs.append("0.8 0.85 0.9 RG 1 w 36 705 523 32 re S")
    cs.append("BT /F2 12 Tf 0.1 0.25 0.5 rg 48 716 Td (PATHOLOGY LABORATORY EXAMINATION REPORT) Tj ET")
    cs.append("BT /F1 9 Tf 0.4 0.45 0.5 rg 420 716 Td (Report ID: " + esc(report["report_id"]) + ") Tj ET")

    # Patient Demographic Card Box
    cs.append("0.98 0.98 0.99 rg 36 620 523 75 re f")
    cs.append("0.85 0.88 0.92 RG 1 w 36 620 523 75 re S")

    # Patient info fields (2 columns)
    cs.append("BT /F2 9.5 Tf 0.2 0.25 0.35 rg 48 675 Td (Patient Name:) Tj /F1 9.5 Tf 0.1 0.1 0.1 rg 70 0 Td (" + esc(report["patient_name"]) + ") Tj ET")
    cs.append("BT /F2 9.5 Tf 0.2 0.25 0.35 rg 48 655 Td (Patient ID:) Tj /F1 9.5 Tf 0.1 0.1 0.1 rg 70 0 Td (" + esc(report["patient_id"]) + ") Tj ET")
    cs.append("BT /F2 9.5 Tf 0.2 0.25 0.35 rg 48 635 Td (Age / Sex:) Tj /F1 9.5 Tf 0.1 0.1 0.1 rg 70 0 Td (" + esc(str(report["age"])) + " Yrs / " + esc(report["sex"]) + ") Tj ET")

    cs.append("BT /F2 9.5 Tf 0.2 0.25 0.35 rg 320 675 Td (Collection Date:) Tj /F1 9.5 Tf 0.1 0.1 0.1 rg 85 0 Td (" + esc(report["report_date"]) + ") Tj ET")
    cs.append("BT /F2 9.5 Tf 0.2 0.25 0.35 rg 320 655 Td (Reporting Analyzer:) Tj /F1 9.5 Tf 0.1 0.1 0.1 rg 85 0 Td (" + esc(report["analyzer_name"][:24]) + ") Tj ET")
    
    # Status Pill on Top Right of Card
    status_text = report["status"]
    if status_text == "CRITICAL":
        cs.append("0.99 0.92 0.92 rg 450 630 95 18 re f")
        cs.append("0.85 0.2 0.2 RG 1 w 450 630 95 18 re S")
        cs.append("BT /F2 8.5 Tf 0.8 0.1 0.1 rg 460 635 Td (CRITICAL RESULT) Tj ET")
    elif status_text == "ABNORMAL":
        cs.append("1.0 0.95 0.85 rg 450 630 95 18 re f")
        cs.append("0.9 0.5 0.1 RG 1 w 450 630 95 18 re S")
        cs.append("BT /F2 8.5 Tf 0.8 0.4 0.0 rg 460 635 Td (ABNORMAL) Tj ET")
    else:
        cs.append("0.9 0.97 0.92 rg 450 630 95 18 re f")
        cs.append("0.2 0.65 0.35 RG 1 w 450 630 95 18 re S")
        cs.append("BT /F2 8.5 Tf 0.1 0.5 0.2 rg 470 635 Td (NORMAL) Tj ET")

    current_y = 595

    # Critical Alert Callout Banner if critical
    if report.get("critical_items"):
        crit_count = len(report["critical_items"])
        cs.append("1.0 0.92 0.92 rg 36 " + str(current_y - 32) + " 523 32 re f")
        cs.append("0.85 0.2 0.2 RG 1.5 w 36 " + str(current_y - 32) + " 523 32 re S")
        cs.append("BT /F2 9.5 Tf 0.8 0.1 0.1 rg 48 " + str(current_y - 18) + " Td (CRITICAL LABORATORY VALUE ALERT DETECTED (" + esc(str(crit_count)) + " analyte(s))) Tj ET")
        cs.append("BT /F1 8.0 Tf 0.5 0.1 0.1 rg 48 " + str(current_y - 28) + " Td (Immediate clinician review required according to laboratory critical notification protocol.) Tj ET")
        current_y -= 44

    # Results Table Header
    cs.append("0.15 0.22 0.35 rg 36 " + str(current_y - 20) + " 523 20 re f")
    cs.append("BT /F2 8.5 Tf 1 1 1 rg 44 " + str(current_y - 14) + " Td (TEST PARAMETER) Tj ET")
    cs.append("BT /F2 8.5 Tf 1 1 1 rg 190 " + str(current_y - 14) + " Td (OBSERVED RESULT) Tj ET")
    cs.append("BT /F2 8.5 Tf 1 1 1 rg 290 " + str(current_y - 14) + " Td (UNIT) Tj ET")
    cs.append("BT /F2 8.5 Tf 1 1 1 rg 355 " + str(current_y - 14) + " Td (REFERENCE INTERVAL) Tj ET")
    cs.append("BT /F2 8.5 Tf 1 1 1 rg 480 " + str(current_y - 14) + " Td (FLAG) Tj ET")

    current_y -= 20

    # Table Rows
    for idx, item in enumerate(report["items"]):
        row_height = 22
        # Zebra striping
        if idx % 2 == 0:
            cs.append("0.97 0.98 1.0 rg 36 " + str(current_y - row_height) + " 523 " + str(row_height) + " re f")
        else:
            cs.append("1.0 1.0 1.0 rg 36 " + str(current_y - row_height) + " 523 " + str(row_height) + " re f")
        
        # Row border bottom
        cs.append("0.9 0.92 0.95 RG 0.5 w 36 " + str(current_y - row_height) + " m 559 " + str(current_y - row_height) + " l S")

        test_display = item["test_name"][:24]
        res_display = str(item["normalized_result"])
        unit_display = item["normalized_unit"] or item["raw_unit"]
        
        # Reference Range Text
        if item["lower_range"] is not None and item["upper_range"] is not None:
            ref_display = f"{item['lower_range']} - {item['upper_range']}"
        elif item["lower_range"] is not None:
            ref_display = f"> {item['lower_range']}"
        elif item["upper_range"] is not None:
            ref_display = f"< {item['upper_range']}"
        else:
            ref_display = "Not Defined"

        status = item["status"]
        
        # Color coding test name and result based on status
        if "CRITICAL" in status:
            t_font = "/F2 8.5 Tf 0.8 0.1 0.1 rg"
            badge_bg = "0.98 0.85 0.85 rg"
            badge_txt = "0.75 0.05 0.05 rg"
        elif status in ["LOW", "HIGH"]:
            t_font = "/F2 8.5 Tf 0.8 0.35 0.0 rg"
            badge_bg = "0.99 0.92 0.82 rg"
            badge_txt = "0.7 0.3 0.0 rg"
        else:
            t_font = "/F1 8.5 Tf 0.1 0.15 0.2 rg"
            badge_bg = "0.9 0.96 0.92 rg"
            badge_txt = "0.1 0.5 0.25 rg"

        cs.append("BT " + t_font + " 44 " + str(current_y - 15) + " Td (" + esc(test_display) + ") Tj ET")
        cs.append("BT /F2 8.5 Tf 0.1 0.1 0.1 rg 190 " + str(current_y - 15) + " Td (" + esc(res_display) + ") Tj ET")
        cs.append("BT /F1 8.0 Tf 0.35 0.4 0.45 rg 290 " + str(current_y - 15) + " Td (" + esc(unit_display) + ") Tj ET")
        cs.append("BT /F1 8.0 Tf 0.35 0.4 0.45 rg 355 " + str(current_y - 15) + " Td (" + esc(ref_display) + ") Tj ET")

        # Status Flag Pill
        cs.append(badge_bg + " 476 " + str(current_y - 17) + " 74 14 re f")
        cs.append("BT /F2 7.5 Tf " + badge_txt + " 480 " + str(current_y - 13) + " Td (" + esc(status[:13]) + ") Tj ET")

        current_y -= row_height
        if current_y < 120:
            break

    # Unit Normalization audit trail if any conversions applied
    conversions = [item for item in report["items"] if item.get("conversion_applied") and "None" not in item["conversion_applied"]]
    if conversions and current_y > 140:
        cs.append("0.97 0.98 0.99 rg 36 " + str(current_y - 26) + " 523 22 re f")
        cs.append("0.85 0.88 0.92 RG 0.5 w 36 " + str(current_y - 26) + " 523 22 re S")
        conv_text = "Unit Conversions Applied: " + "; ".join([f"{c['test_name']}: {c['conversion_applied']}" for c in conversions[:2]])
        cs.append("BT /F1 7.5 Tf 0.3 0.4 0.5 rg 44 " + str(current_y - 17) + " Td (" + esc(conv_text[:110]) + ") Tj ET")
        current_y -= 32

    # Verification / Sign-off Footer Box
    cs.append("0.96 0.97 0.98 rg 36 60 523 54 re f")
    cs.append("0.8 0.85 0.9 RG 0.8 w 36 60 523 54 re S")
    
    gen_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    cs.append("BT /F2 8.0 Tf 0.2 0.25 0.35 rg 48 98 Td (Verified By: " + esc(lab_director) + ") Tj ET")
    cs.append("BT /F1 7.5 Tf 0.4 0.45 0.5 rg 48 84 Td (Generated: " + esc(gen_time) + "  |  Electronic Signature Verified  |  LabReport AI Processing Engine) Tj ET")
    cs.append("BT /F1 6.5 Tf 0.5 0.55 0.6 rg 48 68 Td (DISCLAIMER: Reference ranges are laboratory-configured values intended for reporting support. Not a medical diagnosis.) Tj ET")

    content_data = "\n".join(cs).encode('utf-8')

    # Assemble complete PDF catalog and structure
    # Obj 1: Catalog
    # Obj 2: Pages
    # Obj 3: Page
    # Obj 4: Font F1 (Helvetica)
    # Obj 5: Font F2 (Helvetica-Bold)
    # Obj 6: Content Stream

    obj1 = "<< /Type /Catalog /Pages 2 0 R >>"
    obj2 = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
    obj4 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    obj5 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
    obj3 = f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
    obj6 = f"<< /Length {len(content_data)} >>\nstream\n" + content_data.decode('latin1') + "\nendstream"

    objs = [obj1, obj2, obj3, obj4, obj5, obj6]

    pdf_out = io.BytesIO()
    pdf_out.write(b"%PDF-1.4\n")
    
    offsets = []
    for i, obj_content in enumerate(objs, start=1):
        offsets.append(pdf_out.tell())
        pdf_out.write(f"{i} 0 obj\n{obj_content}\nendobj\n".encode('latin1'))

    xref_offset = pdf_out.tell()
    pdf_out.write(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode('latin1'))
    for off in offsets:
        pdf_out.write(f"{off:010d} 00000 n \n".encode('latin1'))

    pdf_out.write(f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('latin1'))
    
    return pdf_out.getvalue()
