"""
Database module for LabReport AI using SQLite.
Stores reference ranges, analyzer mappings, patients, reports, and report items.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "labreport.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Reference Ranges Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reference_ranges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        sex TEXT NOT NULL,          -- 'Male', 'Female', 'Any'
        min_age INTEGER NOT NULL,
        max_age INTEGER NOT NULL,
        lower_range REAL,
        upper_range REAL,
        unit TEXT NOT NULL,
        critical_low REAL,
        critical_high REAL,
        category TEXT DEFAULT 'General',
        notes TEXT,
        is_active INTEGER DEFAULT 1
    )
    """)

    # Analyzer Mappings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyzer_mappings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analyzer_code TEXT NOT NULL UNIQUE,
        standard_test_name TEXT NOT NULL,
        analyzer_name TEXT DEFAULT 'Generic Analyzer',
        sample_unit TEXT,
        notes TEXT
    )
    """)

    # Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL UNIQUE,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT NOT NULL,
        report_date TEXT NOT NULL,
        analyzer_name TEXT DEFAULT 'Multi-Analyzer',
        total_tests INTEGER DEFAULT 0,
        normal_count INTEGER DEFAULT 0,
        abnormal_count INTEGER DEFAULT 0,
        critical_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'NORMAL',  -- 'NORMAL', 'ABNORMAL', 'CRITICAL'
        raw_csv_source TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    )
    """)

    # Report Items Table (Individual test results in a report)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS report_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        test_name TEXT NOT NULL,
        raw_result REAL NOT NULL,
        raw_unit TEXT NOT NULL,
        normalized_result REAL NOT NULL,
        normalized_unit TEXT NOT NULL,
        lower_range REAL,
        upper_range REAL,
        critical_low REAL,
        critical_high REAL,
        status TEXT NOT NULL,   -- 'NORMAL', 'LOW', 'HIGH', 'CRITICAL LOW', 'CRITICAL HIGH', 'UNCLASSIFIED'
        conversion_applied TEXT,
        analyzer TEXT,
        notes TEXT,
        FOREIGN KEY (report_id) REFERENCES reports(report_id)
    )
    """)

    # CSV Upload Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS csv_uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        patient_count INTEGER NOT NULL,
        analyzers_detected TEXT,
        status TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
    )
    """)

    # Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # Patient Diet Plans Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_diet_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        report_id TEXT,
        age INTEGER,
        sex TEXT,
        plan_name TEXT NOT NULL,
        summary TEXT,
        status TEXT DEFAULT 'Active',
        primary_condition TEXT,
        dietary_preference TEXT DEFAULT 'Standard Balanced',
        calories_target INTEGER,
        water_target_liters REAL,
        sodium_limit_mg INTEGER,
        dietary_tags TEXT,
        macronutrients TEXT,
        clinical_triggers TEXT,
        foods_to_include TEXT,
        foods_to_avoid TEXT,
        weekly_meal_plan TEXT,
        lifestyle_guidelines TEXT,
        exercise_prescription TEXT,
        nutritionist_notes TEXT,
        assigned_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Ensure exercise_prescription column exists if table existed previously
    try:
        cursor.execute("PRAGMA table_info(patient_diet_plans)")
        columns = [row[1] for row in cursor.fetchall()]
        if "exercise_prescription" not in columns:
            cursor.execute("ALTER TABLE patient_diet_plans ADD COLUMN exercise_prescription TEXT")
    except Exception:
        pass

    conn.commit()

    # Seed Default Data if empty
    seed_default_data(cursor, conn)
    conn.close()

def seed_default_data(cursor, conn):
    # Check if reference ranges already seeded
    cursor.execute("SELECT COUNT(*) FROM reference_ranges")
    if cursor.fetchone()[0] == 0:
        default_ranges = [
            # Hemoglobin (g/dL)
            ("Hemoglobin", "Male", 18, 120, 13.0, 17.0, "g/dL", 7.0, 20.0, "Hematology", "Adult Male Standard"),
            ("Hemoglobin", "Female", 18, 120, 12.0, 15.5, "g/dL", 7.0, 20.0, "Hematology", "Adult Female Standard"),
            ("Hemoglobin", "Any", 0, 17, 11.0, 14.5, "g/dL", 6.5, 19.0, "Hematology", "Pediatric Standard"),

            # Fasting Glucose (mg/dL)
            ("Glucose", "Any", 0, 120, 70.0, 99.0, "mg/dL", 50.0, 300.0, "Biochemistry", "Fasting Blood Sugar standard"),
            ("Fasting Blood Sugar", "Any", 0, 120, 70.0, 99.0, "mg/dL", 50.0, 300.0, "Biochemistry", "Fasting Plasma Glucose"),
            ("Postprandial Glucose", "Any", 0, 120, 70.0, 140.0, "mg/dL", 50.0, 350.0, "Biochemistry", "2-hour postprandial"),
            ("HbA1c", "Any", 0, 120, 4.0, 5.6, "%", 3.0, 10.0, "Biochemistry", "Glycated Hemoglobin"),

            # Renal Profile
            ("Serum Creatinine", "Male", 18, 120, 0.7, 1.3, "mg/dL", 0.3, 4.0, "Renal", "Adult Male"),
            ("Serum Creatinine", "Female", 18, 120, 0.5, 1.1, "mg/dL", 0.3, 3.5, "Renal", "Adult Female"),
            ("Serum Creatinine", "Any", 0, 17, 0.3, 0.7, "mg/dL", 0.2, 2.5, "Renal", "Pediatric Creatinine"),
            ("Blood Urea Nitrogen", "Any", 0, 120, 7.0, 20.0, "mg/dL", 3.0, 60.0, "Renal", "BUN Standard"),
            ("Uric Acid", "Male", 18, 120, 3.4, 7.0, "mg/dL", 1.5, 12.0, "Renal", "Adult Male"),
            ("Uric Acid", "Female", 18, 120, 2.4, 6.0, "mg/dL", 1.5, 11.0, "Renal", "Adult Female"),

            # Lipid Profile (mg/dL)
            ("Total Cholesterol", "Any", 0, 120, 125.0, 200.0, "mg/dL", 80.0, 400.0, "Lipid", "Desirable: <200"),
            ("HDL Cholesterol", "Male", 18, 120, 40.0, 60.0, "mg/dL", 20.0, 100.0, "Lipid", "Male HDL"),
            ("HDL Cholesterol", "Female", 18, 120, 50.0, 70.0, "mg/dL", 20.0, 110.0, "Lipid", "Female HDL"),
            ("LDL Cholesterol", "Any", 0, 120, 50.0, 100.0, "mg/dL", 30.0, 250.0, "Lipid", "Optimal: <100"),
            ("Triglycerides", "Any", 0, 120, 50.0, 150.0, "mg/dL", 30.0, 500.0, "Lipid", "Normal: <150"),

            # Liver Function
            ("Total Bilirubin", "Any", 0, 120, 0.2, 1.2, "mg/dL", 0.1, 5.0, "Hepatic", "Total serum bilirubin"),
            ("Direct Bilirubin", "Any", 0, 120, 0.0, 0.3, "mg/dL", 0.0, 2.5, "Hepatic", "Conjugated"),
            ("AST (SGOT)", "Any", 0, 120, 8.0, 48.0, "U/L", 3.0, 200.0, "Hepatic", "Aspartate Aminotransferase"),
            ("ALT (SGPT)", "Male", 18, 120, 7.0, 55.0, "U/L", 3.0, 250.0, "Hepatic", "Alanine Aminotransferase Male"),
            ("ALT (SGPT)", "Female", 18, 120, 7.0, 45.0, "U/L", 3.0, 200.0, "Hepatic", "Alanine Aminotransferase Female"),
            ("Alkaline Phosphatase", "Any", 18, 120, 44.0, 147.0, "U/L", 20.0, 500.0, "Hepatic", "Adult ALP"),

            # Complete Blood Count (CBC)
            ("White Blood Cells (WBC)", "Any", 0, 120, 4.5, 11.0, "10^3/uL", 2.0, 30.0, "Hematology", "Leukocytes"),
            ("Platelet Count", "Any", 0, 120, 150.0, 450.0, "10^3/uL", 50.0, 1000.0, "Hematology", "Thrombocytes"),
            ("Red Blood Cells (RBC)", "Male", 18, 120, 4.5, 5.9, "10^6/uL", 2.5, 7.5, "Hematology", "Erythrocytes Male"),
            ("Red Blood Cells (RBC)", "Female", 18, 120, 4.1, 5.1, "10^6/uL", 2.5, 7.0, "Hematology", "Erythrocytes Female"),

            # Electrolytes
            ("Serum Potassium", "Any", 0, 120, 3.5, 5.1, "mmol/L", 2.8, 6.2, "Electrolytes", "Critical if <2.8 or >6.2"),
            ("Serum Sodium", "Any", 0, 120, 135.0, 145.0, "mmol/L", 120.0, 160.0, "Electrolytes", "Critical if <120 or >160"),
            ("Serum Calcium", "Any", 0, 120, 8.5, 10.2, "mg/dL", 6.0, 13.0, "Electrolytes", "Total Serum Calcium"),

            # Thyroid
            ("TSH", "Any", 0, 120, 0.4, 4.0, "uIU/mL", 0.05, 15.0, "Endocrine", "Thyroid Stimulating Hormone"),
        ]

        cursor.executemany("""
        INSERT INTO reference_ranges (test_name, sex, min_age, max_age, lower_range, upper_range, unit, critical_low, critical_high, category, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_ranges)

    # Check if analyzer mappings already seeded
    cursor.execute("SELECT COUNT(*) FROM analyzer_mappings")
    if cursor.fetchone()[0] == 0:
        default_mappings = [
            ("GLU", "Glucose", "Cobas 6000 / Sysmex", "mg/dL", "Common glucose code"),
            ("GLUCOSE", "Glucose", "Generic Analyzer", "mg/dL", "Full name glucose"),
            ("FBS", "Fasting Blood Sugar", "Beckman Coulter", "mg/dL", "Fasting blood sugar code"),
            ("PPBS", "Postprandial Glucose", "Beckman Coulter", "mg/dL", "Post meal sugar code"),
            ("HB", "Hemoglobin", "Sysmex XN-1000", "g/dL", "Short code for Hemoglobin"),
            ("HGB", "Hemoglobin", "Mindray BC-5000", "g/dL", "Standard abbreviation"),
            ("HEMOGLOBIN", "Hemoglobin", "Generic Analyzer", "g/dL", "Standard test name"),
            ("CHOL", "Total Cholesterol", "Roche Cobas", "mg/dL", "Total cholesterol short code"),
            ("CHOLESTEROL", "Total Cholesterol", "Generic Analyzer", "mg/dL", "Full cholesterol name"),
            ("HDL", "HDL Cholesterol", "Roche Cobas", "mg/dL", "High Density Lipoprotein"),
            ("LDL", "LDL Cholesterol", "Roche Cobas", "mg/dL", "Low Density Lipoprotein"),
            ("TRIG", "Triglycerides", "Roche Cobas", "mg/dL", "Triglycerides short code"),
            ("TG", "Triglycerides", "Mindray", "mg/dL", "Triglycerides alias"),
            ("CREAT", "Serum Creatinine", "Abbott Architect", "mg/dL", "Serum creatinine alias"),
            ("CREATININE", "Serum Creatinine", "Generic Analyzer", "mg/dL", "Standard creatinine"),
            ("BUN", "Blood Urea Nitrogen", "Abbott Architect", "mg/dL", "BUN alias"),
            ("SGPT", "ALT (SGPT)", "Roche Cobas", "U/L", "Alanine aminotransferase"),
            ("ALT", "ALT (SGPT)", "Generic Analyzer", "U/L", "ALT standard"),
            ("SGOT", "AST (SGOT)", "Roche Cobas", "U/L", "Aspartate aminotransferase"),
            ("AST", "AST (SGOT)", "Generic Analyzer", "U/L", "AST standard"),
            ("TBIL", "Total Bilirubin", "Roche Cobas", "mg/dL", "Total Bilirubin alias"),
            ("BILIRUBIN", "Total Bilirubin", "Generic Analyzer", "mg/dL", "Total Bilirubin standard"),
            ("WBC", "White Blood Cells (WBC)", "Sysmex XN-1000", "10^3/uL", "White Blood Cell Count"),
            ("PLT", "Platelet Count", "Sysmex XN-1000", "10^3/uL", "Platelet count alias"),
            ("PLATELETS", "Platelet Count", "Generic Analyzer", "10^3/uL", "Platelets standard"),
            ("RBC", "Red Blood Cells (RBC)", "Sysmex XN-1000", "10^6/uL", "Red Blood Cell Count"),
            ("K", "Serum Potassium", "Radiometer ABL", "mmol/L", "Potassium short code"),
            ("POTASSIUM", "Serum Potassium", "Generic Analyzer", "mmol/L", "Potassium standard"),
            ("NA", "Serum Sodium", "Radiometer ABL", "mmol/L", "Sodium short code"),
            ("SODIUM", "Serum Sodium", "Generic Analyzer", "mmol/L", "Sodium standard"),
            ("CA", "Serum Calcium", "Roche Cobas", "mg/dL", "Calcium short code"),
            ("CALCIUM", "Serum Calcium", "Generic Analyzer", "mg/dL", "Calcium standard"),
            ("TSH", "TSH", "Siemens Centaur", "uIU/mL", "Thyroid Stimulating Hormone"),
            ("HBA1C", "HbA1c", "Bio-Rad D-10", "%", "Glycated Hemoglobin HPLC"),
        ]

        cursor.executemany("""
        INSERT INTO analyzer_mappings (analyzer_code, standard_test_name, analyzer_name, sample_unit, notes)
        VALUES (?, ?, ?, ?, ?)
        """, default_mappings)

    # Seed default lab settings
    default_settings = [
        ("lab_name", "MetroHealth Advanced Pathology Laboratory"),
        ("lab_tagline", "NABL & CAP Accredited Diagnostic Center"),
        ("lab_address", "452 Medical Science Square, Health District, CA 94103"),
        ("lab_phone", "+1 (800) 555-LABS / (415) 890-2300"),
        ("lab_email", "reports@metrohealthpathology.org"),
        ("lab_director", "Dr. Sarah Jenkins, MD, FACP (Chief Pathologist)"),
        ("critical_notification_protocol", "Immediate clinician notification required within 15 minutes of verified critical result."),
        ("auto_convert_units", "true")
    ]
    for k, v in default_settings:
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()

# Initialize database on module load
init_db()
