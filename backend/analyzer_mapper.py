"""
Analyzer Mapping Module.
Maps raw test codes from different pathology analysers (Sysmex, Roche Cobas, Abbott, Beckman, Mindray)
to standardized laboratory test names.
"""

import sqlite3
from .database import get_db_connection

def resolve_test_name(raw_test_name: str) -> tuple[str, str | None]:
    """
    Looks up standard test name for raw_test_name in the database.
    Returns (standard_name, matched_mapping_notes)
    """
    if not raw_test_name:
        return "", None

    raw_clean = raw_test_name.strip()
    raw_upper = raw_clean.upper()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Exact case-insensitive match on analyzer_code
    cursor.execute("""
    SELECT standard_test_name, analyzer_name, notes 
    FROM analyzer_mappings 
    WHERE UPPER(analyzer_code) = ?
    """, (raw_upper,))
    row = cursor.fetchone()

    if row:
        conn.close()
        return row["standard_test_name"], f"Mapped from analyzer code '{raw_clean}' ({row['analyzer_name']})"

    # Check if raw_test_name already matches standard_test_name directly
    cursor.execute("""
    SELECT standard_test_name 
    FROM analyzer_mappings 
    WHERE UPPER(standard_test_name) = ?
    """, (raw_upper,))
    std_row = cursor.fetchone()
    if std_row:
        conn.close()
        return std_row["standard_test_name"], "Direct standard name match"

    # Check if raw_test_name exists in reference_ranges table
    cursor.execute("""
    SELECT test_name 
    FROM reference_ranges 
    WHERE UPPER(test_name) = ?
    LIMIT 1
    """, (raw_upper,))
    ref_row = cursor.fetchone()
    conn.close()

    if ref_row:
        return ref_row["test_name"], "Direct reference range match"

    # Return original trimmed string if no mapping found
    return raw_clean, None

def get_all_mappings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyzer_mappings ORDER BY standard_test_name ASC, analyzer_code ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_or_update_mapping(analyzer_code: str, standard_test_name: str, analyzer_name: str = "Generic", sample_unit: str = "", notes: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO analyzer_mappings (analyzer_code, standard_test_name, analyzer_name, sample_unit, notes)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(analyzer_code) DO UPDATE SET
        standard_test_name = excluded.standard_test_name,
        analyzer_name = excluded.analyzer_name,
        sample_unit = excluded.sample_unit,
        notes = excluded.notes
    """, (analyzer_code.strip(), standard_test_name.strip(), analyzer_name.strip(), sample_unit.strip(), notes.strip()))
    conn.commit()
    conn.close()

def delete_mapping(mapping_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM analyzer_mappings WHERE id = ?", (mapping_id,))
    conn.commit()
    conn.close()
