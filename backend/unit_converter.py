"""
Unit Conversion and Normalization Engine for Pathology Laboratory Analysers.
Handles medical unit conversions between conventional and SI units (mg/dL, mmol/L, g/dL, g/L, µmol/L, etc.).
"""

import re

def clean_unit(unit_str: str) -> str:
    if not unit_str:
        return ""
    # Normalize unicode mu, spaces, lowercase
    u = unit_str.strip().lower()
    u = u.replace("μ", "u").replace("µ", "u").replace(" ", "")
    return u

# Conversion tables keyed by (clean_source_unit, clean_target_unit, standard_test_name_pattern)
# Or by general unit rules

def normalize_unit(test_name: str, raw_value: float, source_unit: str, target_unit: str) -> dict:
    """
    Attempts to normalize raw_value from source_unit to target_unit for a given test.
    Returns:
    {
        "success": bool,
        "normalized_value": float,
        "target_unit": str,
        "conversion_applied": str or None,
        "error": str or None
    }
    """
    src = clean_unit(source_unit)
    tgt = clean_unit(target_unit)
    test_clean = test_name.strip().lower()

    if not source_unit:
        return {
            "success": False,
            "normalized_value": raw_value,
            "target_unit": target_unit,
            "conversion_applied": None,
            "error": "Missing source unit"
        }

    # If already same unit
    if src == tgt:
        return {
            "success": True,
            "normalized_value": round(raw_value, 2),
            "target_unit": target_unit,
            "conversion_applied": "None (Units match)",
            "error": None
        }

    # 1. Glucose / Fasting Blood Sugar / Postprandial Glucose
    if any(k in test_clean for k in ["glucose", "sugar", "fbs", "ppbs"]):
        if src in ["mmol/l", "mmoll"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value * 18.0182, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mmol/L × 18.018 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["mmol/l", "mmoll"]:
            conv_val = round(raw_value / 18.0182, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL ÷ 18.018 = {conv_val} mmol/L",
                "error": None
            }

    # 2. Total Cholesterol / HDL / LDL
    if any(k in test_clean for k in ["cholesterol", "hdl", "ldl"]) and "triglyceride" not in test_clean:
        if src in ["mmol/l", "mmoll"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value * 38.67, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mmol/L × 38.67 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["mmol/l", "mmoll"]:
            conv_val = round(raw_value / 38.67, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL ÷ 38.67 = {conv_val} mmol/L",
                "error": None
            }

    # 3. Triglycerides
    if "triglyceride" in test_clean or "tg" == test_clean or "trig" == test_clean:
        if src in ["mmol/l", "mmoll"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value * 88.57, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mmol/L × 88.57 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["mmol/l", "mmoll"]:
            conv_val = round(raw_value / 88.57, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL ÷ 88.57 = {conv_val} mmol/L",
                "error": None
            }

    # 4. Serum Creatinine
    if "creatinine" in test_clean or "creat" in test_clean:
        if src in ["umol/l", "umoll", "micromol/l"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value / 88.4, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} µmol/L ÷ 88.4 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["umol/l", "umoll", "micromol/l"]:
            conv_val = round(raw_value * 88.4, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL × 88.4 = {conv_val} µmol/L",
                "error": None
            }

    # 5. Bilirubin (Total / Direct)
    if "bilirubin" in test_clean:
        if src in ["umol/l", "umoll", "micromol/l"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value / 17.1, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} µmol/L ÷ 17.1 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["umol/l", "umoll", "micromol/l"]:
            conv_val = round(raw_value * 17.1, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL × 17.1 = {conv_val} µmol/L",
                "error": None
            }

    # 6. Hemoglobin (g/dL <-> g/L)
    if "hemoglobin" in test_clean or test_clean in ["hb", "hgb"]:
        if src in ["g/l", "gl"] and tgt in ["g/dl", "gdl"]:
            conv_val = round(raw_value / 10.0, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} g/L ÷ 10 = {conv_val} g/dL",
                "error": None
            }
        elif src in ["g/dl", "gdl"] and tgt in ["g/l", "gl"]:
            conv_val = round(raw_value * 10.0, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} g/dL × 10 = {conv_val} g/L",
                "error": None
            }

    # 7. Blood Urea Nitrogen / Urea
    if any(k in test_clean for k in ["bun", "urea"]):
        if src in ["mmol/l", "mmoll"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value * 2.8, 1)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mmol/L × 2.8 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["mmol/l", "mmoll"]:
            conv_val = round(raw_value / 2.8, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL ÷ 2.8 = {conv_val} mmol/L",
                "error": None
            }

    # 8. Calcium
    if "calcium" in test_clean or test_clean == "ca":
        if src in ["mmol/l", "mmoll"] and tgt in ["mg/dl", "mgdl"]:
            conv_val = round(raw_value * 4.008, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mmol/L × 4.008 = {conv_val} mg/dL",
                "error": None
            }
        elif src in ["mg/dl", "mgdl"] and tgt in ["mmol/l", "mmoll"]:
            conv_val = round(raw_value / 4.008, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} mg/dL ÷ 4.008 = {conv_val} mmol/L",
                "error": None
            }

    # 9. WBC & Platelets (/uL <-> 10^3/uL or 10^9/L)
    if any(k in test_clean for k in ["wbc", "platelet", "plt", "white blood", "leukocyte", "thrombocyte"]):
        if src in ["/ul", "cells/ul", "cells/cumm", "/cumm", "cumm"] and tgt in ["10^3/ul", "10*3/ul", "k/ul", "10^9/l"]:
            conv_val = round(raw_value / 1000.0, 2)
            return {
                "success": True,
                "normalized_value": conv_val,
                "target_unit": target_unit,
                "conversion_applied": f"{raw_value} /µL ÷ 1,000 = {conv_val} ×10³/µL",
                "error": None
            }
        elif src in ["10^9/l", "10*9/l", "g/l"] and tgt in ["10^3/ul", "10*3/ul", "k/ul"]:
            return {
                "success": True,
                "normalized_value": raw_value,
                "target_unit": target_unit,
                "conversion_applied": "1:1 Unit equivalent (10^9/L == 10^3/µL)",
                "error": None
            }

    # 10. Electrolytes mEq/L == mmol/L
    if any(k in test_clean for k in ["potassium", "sodium", "chloride", "k", "na", "cl"]):
        if (src in ["meq/l", "meql"] and tgt in ["mmol/l", "mmoll"]) or (src in ["mmol/l", "mmoll"] and tgt in ["meq/l", "meql"]):
            return {
                "success": True,
                "normalized_value": raw_value,
                "target_unit": target_unit,
                "conversion_applied": "1:1 Equivalent (mEq/L == mmol/L for monovalent ions)",
                "error": None
            }

    # Unsupported or unknown unit conversion
    return {
        "success": False,
        "normalized_value": raw_value,
        "target_unit": target_unit,
        "conversion_applied": None,
        "error": f"Unable to normalize unit: '{source_unit}' to '{target_unit}' for {test_name}"
    }
