"""
Reference Range Engine.
Selects age- and sex-specific clinical reference ranges and classifies test results into
NORMAL, LOW, HIGH, CRITICAL LOW, and CRITICAL HIGH.
"""

from typing import Optional, Dict, Any, Tuple
from .database import get_db_connection
from .unit_converter import normalize_unit

def find_reference_range(test_name: str, age: int, sex: str) -> Optional[Dict[str, Any]]:
    """
    Searches the database for the most appropriate reference range based on:
    1. Standard test name
    2. Patient Sex ('Male', 'Female' or fallback to 'Any')
    3. Patient Age between min_age and max_age
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    normalized_sex = "Male" if sex.strip().lower() in ["m", "male"] else ("Female" if sex.strip().lower() in ["f", "female"] else "Any")

    # Step 1: Look for exact sex and age match
    cursor.execute("""
    SELECT * FROM reference_ranges 
    WHERE UPPER(test_name) = UPPER(?) 
      AND (sex = ? OR sex = 'Any' OR sex = 'All')
      AND min_age <= ? AND max_age >= ?
      AND is_active = 1
    ORDER BY 
      CASE WHEN sex = ? THEN 1 WHEN sex = 'Any' THEN 2 ELSE 3 END,
      (max_age - min_age) ASC
    LIMIT 1
    """, (test_name, normalized_sex, age, age, normalized_sex))
    
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    
    return None

def classify_result(raw_result: float, raw_unit: str, ref_range: Optional[Dict[str, Any]], test_name: str) -> Dict[str, Any]:
    """
    Classifies a test result against a reference range, performing unit conversion if necessary.
    Returns structured analysis:
    {
        "status": "NORMAL" | "LOW" | "HIGH" | "CRITICAL LOW" | "CRITICAL HIGH" | "NO_RANGE_CONFIGURED" | "UNIT_ERROR",
        "normalized_result": float,
        "normalized_unit": str,
        "lower_range": float or None,
        "upper_range": float or None,
        "critical_low": float or None,
        "critical_high": float or None,
        "conversion_applied": str or None,
        "is_abnormal": bool,
        "is_critical": bool,
        "alert_message": str or None,
        "unit_error": str or None
    }
    """
    if not ref_range:
        return {
            "status": "NO_RANGE_CONFIGURED",
            "normalized_result": raw_result,
            "normalized_unit": raw_unit,
            "lower_range": None,
            "upper_range": None,
            "critical_low": None,
            "critical_high": None,
            "conversion_applied": None,
            "is_abnormal": False,
            "is_critical": False,
            "alert_message": f"Reference range not configured for '{test_name}'.",
            "unit_error": None
        }

    target_unit = ref_range["unit"]
    conv_result = normalize_unit(test_name, raw_result, raw_unit, target_unit)

    if not conv_result["success"]:
        return {
            "status": "UNIT_ERROR",
            "normalized_result": raw_result,
            "normalized_unit": raw_unit,
            "lower_range": ref_range["lower_range"],
            "upper_range": ref_range["upper_range"],
            "critical_low": ref_range["critical_low"],
            "critical_high": ref_range["critical_high"],
            "conversion_applied": None,
            "is_abnormal": True,
            "is_critical": False,
            "alert_message": conv_result["error"] or "Unable to normalize unit",
            "unit_error": conv_result["error"]
        }

    norm_val = conv_result["normalized_value"]
    c_low = ref_range["critical_low"]
    c_high = ref_range["critical_high"]
    r_low = ref_range["lower_range"]
    r_high = ref_range["upper_range"]

    # Result Classification Logic as specified
    if c_low is not None and norm_val < c_low:
        status = "CRITICAL LOW"
        is_abnormal = True
        is_critical = True
        alert_message = f"CRITICAL LOW: Result {norm_val} {target_unit} is below critical threshold ({c_low} {target_unit})."
    elif r_low is not None and norm_val < r_low:
        status = "LOW"
        is_abnormal = True
        is_critical = False
        alert_message = f"Below normal reference interval ({r_low}–{r_high} {target_unit})."
    elif c_high is not None and norm_val > c_high:
        status = "CRITICAL HIGH"
        is_abnormal = True
        is_critical = True
        alert_message = f"CRITICAL HIGH: Result {norm_val} {target_unit} exceeds critical threshold ({c_high} {target_unit})."
    elif r_high is not None and norm_val > r_high:
        status = "HIGH"
        is_abnormal = True
        is_critical = False
        alert_message = f"Above normal reference interval ({r_low}–{r_high} {target_unit})."
    else:
        status = "NORMAL"
        is_abnormal = False
        is_critical = False
        alert_message = f"Within standard reference interval ({r_low}–{r_high} {target_unit})."

    return {
        "status": status,
        "normalized_result": norm_val,
        "normalized_unit": target_unit,
        "lower_range": r_low,
        "upper_range": r_high,
        "critical_low": c_low,
        "critical_high": c_high,
        "conversion_applied": conv_result.get("conversion_applied"),
        "is_abnormal": is_abnormal,
        "is_critical": is_critical,
        "alert_message": alert_message,
        "unit_error": None
    }
