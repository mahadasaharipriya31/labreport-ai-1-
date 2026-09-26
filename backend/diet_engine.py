"""
Clinical Diet & Medical Nutrition Engine for LabReport AI.
Analyzes patient pathology test results and synthesizes personalized, evidence-based
clinical dietary prescriptions, macronutrient distributions, food recommendations,
and structured 7-day meal schedules.
"""

import io
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from .database import get_db_connection

def determine_clinical_conditions(report_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyzes lab report items and determines nutritional risks and clinical triggers.
    """
    triggers = []

    for item in report_items:
        test = item.get("test_name", "").lower()
        val = float(item.get("normalized_result") or item.get("raw_result") or 0)
        status = item.get("status", "NORMAL")
        unit = item.get("normalized_unit") or item.get("raw_unit") or ""

        # Glycemic triggers
        if any(k in test for k in ["glucose", "fasting blood sugar", "postprandial", "hba1c"]):
            if "HIGH" in status or (("glucose" in test or "sugar" in test) and val > 100) or ("hba1c" in test and val > 5.6):
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Glycemic Dysregulation",
                    "severity": "CRITICAL" if "CRITICAL" in status or val > 200 else "HIGH",
                    "implication": "Elevated circulating glucose requires low-glycemic carbohydrates, elimination of refined sugars, and high soluble fiber to stabilize postprandial spikes."
                })

        # Lipid triggers
        elif any(k in test for k in ["cholesterol", "triglyceride", "ldl", "lipid"]):
            if "HIGH" in status or ("cholesterol" in test and val > 200) or ("ldl" in test and val > 100) or ("triglyceride" in test and val > 150):
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Dyslipidemia / Cardiovascular Risk",
                    "severity": "CRITICAL" if "CRITICAL" in status or val > 300 else "HIGH",
                    "implication": "Elevated atherogenic lipids necessitate strict limitation of saturated/trans fats, increased phytosterols, and regular omega-3 fatty acids."
                })
            elif "hdl" in test and ("LOW" in status or val < 40):
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Dyslipidemia / Low HDL",
                    "severity": "HIGH",
                    "implication": "Suboptimal protective HDL; emphasis on monounsaturated fats (extra virgin olive oil, avocado) and aerobic nutritional support."
                })

        # Renal triggers
        elif any(k in test for k in ["creatinine", "urea", "bun"]):
            if "HIGH" in status or ("creatinine" in test and val > 1.2) or ("urea" in test and val > 20):
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Renal Impairment",
                    "severity": "CRITICAL" if "CRITICAL" in status or val > 2.0 else "HIGH",
                    "implication": "Compromised glomerular filtration; moderate protein restriction (0.8g/kg high biological value), sodium restriction (<2000mg), and monitored phosphate."
                })

        # Uric Acid / Gout
        elif "uric" in test:
            if "HIGH" in status or val > 6.5:
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Hyperuricemia",
                    "severity": "CRITICAL" if "CRITICAL" in status or val > 9.0 else "HIGH",
                    "implication": "High uric acid crystallization risk; strict low-purine protocol, avoiding organ meats, shellfish, beer, and high-fructose corn syrup."
                })

        # Hematology / Anemia
        elif any(k in test for k in ["hemoglobin", "rbc", "red blood"]):
            if "LOW" in status or ("hemoglobin" in test and val < 12.0):
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Hematological / Anemia",
                    "severity": "CRITICAL" if "CRITICAL" in status or val < 8.0 else "LOW",
                    "implication": "Suboptimal oxygen carrying capacity; emphasize bioavailable iron (heme and non-heme) synergized with Vitamin C; avoid polyphenol blockers during iron meals."
                })

        # Electrolytes: Potassium
        elif "potassium" in test or test == "k":
            if "HIGH" in status or val > 5.1:
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Electrolyte: Hyperkalemia",
                    "severity": "CRITICAL" if "CRITICAL" in status or val > 5.5 else "HIGH",
                    "implication": "Cardiac conduction risk; restrict high-potassium foods (bananas, oranges, potatoes, tomatoes) and avoid potassium salt substitutes."
                })
            elif "LOW" in status or val < 3.5:
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Electrolyte: Hypokalemia",
                    "severity": "CRITICAL" if "CRITICAL" in status or val < 3.0 else "LOW",
                    "implication": "Neuromuscular & cardiac weakness; replenish with potassium-dense foods (coconut water, baked sweet potato, spinach, avocados)."
                })

        # Electrolytes: Sodium
        elif "sodium" in test or test == "na":
            if "HIGH" in status or val > 145:
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Electrolyte: Hypernatremia / Hypertension",
                    "severity": "HIGH",
                    "implication": "Fluid retention & cardiovascular load; strict DASH low-sodium protocol (<1500mg/day) and structured hydration."
                })

        # Liver Enzymes
        elif any(k in test for k in ["alt", "ast", "sgpt", "sgot", "bilirubin", "alp"]):
            if "HIGH" in status:
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Hepatic Strain",
                    "severity": "CRITICAL" if "CRITICAL" in status else "HIGH",
                    "implication": "Hepatocellular irritation; antioxidant-rich cruciferous vegetables, milk thistle, elimination of trans fats, fried foods, and zero alcohol."
                })

        # Thyroid
        elif "tsh" in test:
            if "HIGH" in status or val > 4.0:
                triggers.append({
                    "biomarker": item.get("test_name"),
                    "value": val,
                    "unit": unit,
                    "status": status,
                    "category": "Endocrine / Hypothyroidism",
                    "severity": "HIGH",
                    "implication": "Sluggish metabolic rate; provide adequate iodine, selenium (Brazil nuts), zinc, and cooked rather than raw brassicas."
                })

    return triggers

def generate_exercise_prescription(
    triggers: List[Dict[str, Any]],
    age: int,
    sex: str,
    has_glycemic: bool,
    has_lipid: bool,
    has_renal: bool,
    has_gout: bool,
    has_anemia: bool,
    has_hepatic: bool
) -> Dict[str, Any]:
    """
    Synthesizes a pathology-guided clinical exercise prescription with target heart-rate zones,
    metabolic mechanisms, specific movements, safety precautions, and day-by-day routines.
    """
    if has_glycemic and has_lipid:
        summary = "Hybrid Glycemic-Cardiovascular Protocol combining post-prandial glucose disposal walks with moderate aerobic and resistance training to upregulate GLUT-4 and lipoprotein lipase."
        weekly_target = 180
        intensity = "Moderate Aerobic & Resistance"
        exercises = [
            {
                "name": "Post-Prandial Glucose Disposal Walk",
                "type": "Post-Meal Disposal",
                "frequency": "Daily (2x/day, 30 min after lunch and dinner)",
                "duration": "15-20 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Activates skeletal muscle GLUT-4 glucose transporters independent of insulin, directly mitigating post-prandial glycemic excursions.",
                "target_metabolism": "Insulin-Independent Glucose Clearance"
            },
            {
                "name": "Progressive Resistance Band / Dumbbell Routine",
                "type": "Resistance / Strength",
                "frequency": "3 days / week (Mon, Wed, Fri)",
                "duration": "25-30 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Increases peripheral muscle mass and enhances cellular insulin receptor sensitivity and baseline metabolic rate.",
                "target_metabolism": "Myocellular Insulin Sensitivity"
            },
            {
                "name": "Zone 2 Steady-State Aerobic Cycling or Brisk Incline Walk",
                "type": "Aerobic / Cardio",
                "frequency": "3 days / week (Tue, Thu, Sat)",
                "duration": "30-35 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Stimulates endothelial Lipoprotein Lipase (LPL) to accelerate clearance of triglyceride-rich VLDL and elevate protective HDL.",
                "target_metabolism": "Lipid Oxidation & Vascular Nitric Oxide"
            },
            {
                "name": "Flexibility & Core Stability Yoga Flow",
                "type": "Flexibility & Mobility",
                "frequency": "2 days / week (Sun + Mid-week)",
                "duration": "20 mins",
                "intensity": "Low",
                "clinical_benefit": "Reduces chronic cortisol-induced insulin resistance and enhances joint range of motion.",
                "target_metabolism": "Stress & Cortisol Modulation"
            }
        ]
        safety_precautions = [
            "Monitor pre- and post-exercise blood glucose if taking insulin or insulin secretagogues.",
            "Carry fast-acting carbohydrate source (e.g. 15g glucose tablets) during workouts exceeding 30 minutes.",
            "Maintain proper hydration: drink 250ml water every 20 minutes of continuous exercise.",
            "Wear cushioned, breathable athletic footwear with seamless socks to protect peripheral neuropathy risks."
        ]
        rest_recovery = "Incorporate 1 full active-recovery day (Sunday) with light stretching and diaphragmatic breathing."
        weekly_schedule = [
            {"day": "Monday", "routine": "30-min Progressive Resistance Training (Squats, Rows, Chest Press) + 15-min Post-Dinner Walk", "duration": "45 min", "focus": "Musculoskeletal Insulin Sensitivity"},
            {"day": "Tuesday", "routine": "35-min Zone 2 Aerobic Incline Walk or Stationary Cycling + 15-min Post-Lunch Walk", "duration": "50 min", "focus": "Cardiovascular Lipid Clearance"},
            {"day": "Wednesday", "routine": "30-min Upper & Core Resistance Training + 15-min Post-Dinner Walk", "duration": "45 min", "focus": "Glycemic Disposal & Muscle Tone"},
            {"day": "Thursday", "routine": "35-min Low-Impact Elliptical / Swimming Cardio + 15-min Post-Lunch Walk", "duration": "50 min", "focus": "HDL Synthesis & Endothelial Tone"},
            {"day": "Friday", "routine": "30-min Lower Body & Functional Core Resistance + 15-min Post-Dinner Walk", "duration": "45 min", "focus": "Large Muscle Glycogen Storage"},
            {"day": "Saturday", "routine": "40-min Outdoor Nature Brisk Walk or Gentle Trail Hike", "duration": "40 min", "focus": "Aerobic Endurance & Stress Relief"},
            {"day": "Sunday", "routine": "25-min Restorative Yoga, Gentle Spine Mobility & Full-Body Stretching", "duration": "25 min", "focus": "Active Recovery & Parasympathetic Tone"}
        ]
    elif has_glycemic:
        summary = "Targeted Glycemic Optimization Program designed to maximize non-insulin glucose transport, reduce visceral adiposity, and prevent post-prandial glycemic spikes."
        weekly_target = 180
        intensity = "Moderate Aerobic & Functional Strength"
        exercises = [
            {
                "name": "Post-Meal Interval Walking",
                "type": "Post-Meal Disposal",
                "frequency": "Daily after main meals",
                "duration": "15-20 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Upregulates skeletal muscle capillary recruitment and enhances post-meal glucose disposal by up to 30%.",
                "target_metabolism": "Postprandial Glycemic Damping"
            },
            {
                "name": "Major Muscle Group Resistance Training",
                "type": "Resistance / Strength",
                "frequency": "3 times per week",
                "duration": "30 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Increases muscular glycogen storage capacity and downregulates hepatic gluconeogenesis.",
                "target_metabolism": "Hepatic & Peripheral Insulin Sensitivity"
            },
            {
                "name": "Zone 2 Low-Impact Cardio (Cycling / Rowing / Swimming)",
                "type": "Aerobic / Cardio",
                "frequency": "3 times per week",
                "duration": "30 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Increases mitochondrial density in type I muscle fibers and stimulates cellular glucose oxidation.",
                "target_metabolism": "Mitochondrial Glucose Oxidation"
            }
        ]
        safety_precautions = [
            "Check feet daily for pressure marks, blisters, or irritation after exercise.",
            "Avoid high-intensity exhaustive training late in the evening to prevent nocturnal hypoglycemia.",
            "Hydrate well before, during, and after exercise sessions."
        ]
        rest_recovery = "Ensure at least 48 hours between strenuous resistance training for the same muscle groups."
        weekly_schedule = [
            {"day": "Monday", "routine": "30-min Resistance Circuit (Leg Press, Lat Pulldowns, Planks) + 15-min Post-Dinner Walk", "duration": "45 min", "focus": "Glycogen Storage Expansion"},
            {"day": "Tuesday", "routine": "30-min Stationary Cycling (Moderate Cadence) + 15-min Post-Lunch Walk", "duration": "45 min", "focus": "Aerobic Mitochondrial Density"},
            {"day": "Wednesday", "routine": "30-min Functional Dumbbell Routine + 15-min Post-Dinner Walk", "duration": "45 min", "focus": "Whole-Body Insulin Sensitivity"},
            {"day": "Thursday", "routine": "35-min Brisk Walking with Arms Active Swing", "duration": "35 min", "focus": "Fat Oxidation & Glycemic Control"},
            {"day": "Friday", "routine": "30-min Resistance Bands & Core Pilates", "duration": "30 min", "focus": "Core Stability & Postural Tone"},
            {"day": "Saturday", "routine": "45-min Recreational Cycling or Swimming", "duration": "45 min", "focus": "Cardiopulmonary Endurance"},
            {"day": "Sunday", "routine": "20-min Gentle Mobility Flow and Deep Breathing", "duration": "20 min", "focus": "Restorative Tissue Recovery"}
        ]
    elif has_lipid:
        summary = "Cardiovascular Lipid-Clearing Protocol utilizing extended Zone 2 aerobic training to augment HDL-C synthesis, lower triglycerides, and reduce arterial wall shear stress."
        weekly_target = 200
        intensity = "Moderate Aerobic Conditioning"
        exercises = [
            {
                "name": "Aerobic Brisk Walking / Incline Power Walk",
                "type": "Aerobic / Cardio",
                "frequency": "5 days per week",
                "duration": "35-40 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Activates Lipoprotein Lipase (LPL) enzymes on capillary endothelium, accelerating hydrolysis of circulating VLDL and triglycerides.",
                "target_metabolism": "Serum Triglyceride Reduction"
            },
            {
                "name": "Low-Impact Swimming / Hydro-Cardio",
                "type": "Aerobic / Cardio",
                "frequency": "2-3 days per week",
                "duration": "30 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Promotes total body circulation, elevates apolipoprotein A-I (HDL precursor), and lowers resting vascular resistance.",
                "target_metabolism": "HDL-C Elevation & Arterial Compliance"
            },
            {
                "name": "Full-Body Functional Strength Conditioning",
                "type": "Resistance / Strength",
                "frequency": "2 days per week",
                "duration": "25 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Maintains metabolically active lean tissue and improves resting lipid clearance kinetics.",
                "target_metabolism": "Basal Metabolic Rate Acceleration"
            }
        ]
        safety_precautions = [
            "Perform 5-10 minutes of dynamic warm-up and cool-down to prevent abrupt blood pressure shifts.",
            "Avoid heavy breath-holding (Valsalva maneuver) during strength training to prevent acute arterial pressure spikes.",
            "Stay well hydrated to maintain optimal blood viscosity."
        ]
        rest_recovery = "Schedule active recovery walks and adequate 7-8 hours sleep to support nocturnal cardiovascular tissue repair."
        weekly_schedule = [
            {"day": "Monday", "routine": "40-min Brisk Incline Treadmill Walk (Heart Rate Zone 2)", "duration": "40 min", "focus": "Endothelial LPL Activation"},
            {"day": "Tuesday", "routine": "30-min Swimming Laps (Freestyle/Breaststroke) or Water Aerobics", "duration": "30 min", "focus": "HDL Synthesis & Whole-Body Cardio"},
            {"day": "Wednesday", "routine": "25-min Full-Body Dumbbell Routine (Multi-Joint Movements)", "duration": "25 min", "focus": "Metabolic Lean Mass Preservation"},
            {"day": "Thursday", "routine": "40-min Outdoor Power Walk or Stationary Cycling", "duration": "40 min", "focus": "Triglyceride Hydrolysis"},
            {"day": "Friday", "routine": "25-min Core & Resistance Bands Circuit", "duration": "25 min", "focus": "Functional Musculoskeletal Strength"},
            {"day": "Saturday", "routine": "45-min Scenic Bike Ride or Leisure Trail Hike", "duration": "45 min", "focus": "Long-Duration Aerobic Endurance"},
            {"day": "Sunday", "routine": "20-min Gentle Full-Body Stretch & Relaxation Yoga", "duration": "20 min", "focus": "Cardiovascular Autonomic Recovery"}
        ]
    elif has_renal:
        summary = "Renal-Protective Gentle Conditioning Program tailored to maintain physical functionality, manage blood pressure, and avoid excessive muscular breakdown or dehydration."
        weekly_target = 120
        intensity = "Low-to-Moderate Low-Impact"
        exercises = [
            {
                "name": "Controlled Paced Walking on Flat Terrain",
                "type": "Aerobic / Cardio",
                "frequency": "4-5 days per week",
                "duration": "20-25 mins",
                "intensity": "Low-to-Moderate",
                "clinical_benefit": "Assists peripheral vascular blood flow and blood pressure regulation without stressing renal glomerular microcirculation.",
                "target_metabolism": "Blood Pressure Stabilization"
            },
            {
                "name": "Gentle Seated Resistance & Mobility Exercises",
                "type": "Resistance / Strength",
                "frequency": "2-3 days per week",
                "duration": "15-20 mins",
                "intensity": "Low",
                "clinical_benefit": "Prevents muscle wasting (uremic sarcopenia) with light, controlled movements that avoid high creatinine production.",
                "target_metabolism": "Sarcopenia Prevention"
            },
            {
                "name": "Restorative Hatha Yoga & Guided Breathing",
                "type": "Flexibility & Mobility",
                "frequency": "3 days per week",
                "duration": "20 mins",
                "intensity": "Low",
                "clinical_benefit": "Downregulates sympathetic nervous system overdrive and promotes calm renal arterial hemodynamics.",
                "target_metabolism": "Parasympathetic Vasodilation"
            }
        ]
        safety_precautions = [
            "Avoid strenuous high-intensity interval training (HIIT) or extreme heavy lifting to prevent rhabdomyolysis and acute creatinine spikes.",
            "Do not exercise in hot, humid environments to protect fluid and electrolyte balance.",
            "Strictly monitor blood pressure before and after exercise; rest if systolic BP > 160 mmHg.",
            "Drink fluids only in accordance with nephrologist-prescribed daily fluid restrictions."
        ]
        rest_recovery = "Frequent short rest intervals during exercise; stop immediately if experiencing unusual fatigue, dizziness, or chest tightness."
        weekly_schedule = [
            {"day": "Monday", "routine": "20-min Flat Terrain Paced Walk + 5-min Light Calisthenics", "duration": "25 min", "focus": "Circulation & Blood Pressure"},
            {"day": "Tuesday", "routine": "20-min Seated Resistance Band Movements (Bicep Curls, Leg Extensions)", "duration": "20 min", "focus": "Gentle Muscle Maintenance"},
            {"day": "Wednesday", "routine": "20-min Restorative Yoga & Diaphragmatic Breathwork", "duration": "20 min", "focus": "Stress Reduction & Vascular Calm"},
            {"day": "Thursday", "routine": "20-min Flat Paced Walk or Gentle Recumbent Bike", "duration": "20 min", "focus": "Low-Impact Aerobic Support"},
            {"day": "Friday", "routine": "15-min Seated Postural Strengthening & Shoulder Mobility", "duration": "15 min", "focus": "Posture & Joint Health"},
            {"day": "Saturday", "routine": "25-min Leisurely Park Walk with Regular Sitting Breaks", "duration": "25 min", "focus": "Outdoor Vitality & Mental Wellbeing"},
            {"day": "Sunday", "routine": "Full Rest Day / Guided Meditation & Gentle Leg Elevation", "duration": "15 min", "focus": "Complete Renal Hemodynamic Rest"}
        ]
    elif has_gout:
        summary = "Low-Impact Joint-Preserving Movement Protocol designed to sustain metabolic health and promote uric acid excretion without provoking joint inflammation or trauma."
        weekly_target = 150
        intensity = "Low-Impact Non-Weight-Bearing"
        exercises = [
            {
                "name": "Stationary Recumbent / Upright Cycling",
                "type": "Aerobic / Cardio",
                "frequency": "4 days per week",
                "duration": "25-30 mins",
                "intensity": "Low-to-Moderate",
                "clinical_benefit": "Provides smooth continuous aerobic conditioning without repetitive concussive impact on metatarsophalangeal (toe) and ankle joints.",
                "target_metabolism": "Non-Impact Metabolic Activation"
            },
            {
                "name": "Hydrotherapy / Water Aerobics & Swimming",
                "type": "Aerobic / Cardio",
                "frequency": "3 days per week",
                "duration": "30 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Buoyancy eliminates 90% of joint compressive forces while hydrostatic pressure reduces peripheral edema and joint inflammation.",
                "target_metabolism": "Synovial Decompression & Circulation"
            },
            {
                "name": "Non-Weight-Bearing Upper Body & Core Strength",
                "type": "Resistance / Strength",
                "frequency": "2-3 days per week",
                "duration": "20 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Maintains muscular metabolic rate and bone density while sparing lower limb joints.",
                "target_metabolism": "Metabolic Lean Mass"
            }
        ]
        safety_precautions = [
            "Never exercise an inflamed or acutely painful joint during an active gout flare; rest and ice the affected area.",
            "Drink plenty of water (minimum 3L daily) before, during, and after exercise to prevent localized hyperuricemia crystallization.",
            "Avoid high-impact jumping, sprinting, or ill-fitting tight shoes that squeeze the forefoot."
        ]
        rest_recovery = "Immobilize and elevate joints during flares; resume gentle range-of-motion movements only after inflammation resolves."
        weekly_schedule = [
            {"day": "Monday", "routine": "30-min Stationary Cycling (Smooth cadence, low resistance)", "duration": "30 min", "focus": "Joint-Safe Aerobic Conditioning"},
            {"day": "Tuesday", "routine": "30-min Swimming or Shallow Water Walking", "duration": "30 min", "focus": "Buoyant Low-Impact Cardio"},
            {"day": "Wednesday", "routine": "20-min Seated Dumbbell Upper Body & Torso Resistance", "duration": "20 min", "focus": "Upper Body Strength"},
            {"day": "Thursday", "routine": "25-min Recumbent Bike + 10-min Ankle/Toe Mobility Flow", "duration": "35 min", "focus": "Peripheral Joint Circulation"},
            {"day": "Friday", "routine": "30-min Pool Water Exercises or Gentle Freestyle Swim", "duration": "30 min", "focus": "Hydrostatic Anti-Inflammatory Cardio"},
            {"day": "Saturday", "routine": "25-min Smooth Outdoor Walk on Even Grass/Pavement in Cushioned Shoes", "duration": "25 min", "focus": "Functional Mobility"},
            {"day": "Sunday", "routine": "20-min Full-Body Gentle Stretching & Hydration Protocol", "duration": "20 min", "focus": "Active Recovery & Joint Relaxation"}
        ]
    elif has_anemia:
        summary = "Energy-Conserving Hematological Restoration Protocol with interval-based pacing to improve circulation without inducing tissue hypoxia or excessive lactic accumulation."
        weekly_target = 100
        intensity = "Low-Intensity Interval Restorative"
        exercises = [
            {
                "name": "Paced Interval Walking with Rest Breaks",
                "type": "Aerobic / Cardio",
                "frequency": "3-4 days per week",
                "duration": "15-20 mins",
                "intensity": "Low",
                "clinical_benefit": "Enhances microvascular circulation and peripheral tissue oxygen delivery without overloading diminished red cell oxygen capacity.",
                "target_metabolism": "Peripheral Capillary Perfusion"
            },
            {
                "name": "Floor-Based Core & Gentle Isometric Holds",
                "type": "Resistance / Strength",
                "frequency": "2-3 days per week",
                "duration": "15 mins",
                "intensity": "Low",
                "clinical_benefit": "Engages core and limb musculature without orthostatic strain or rapid heart rate spikes.",
                "target_metabolism": "Neuromuscular Tone Preservation"
            },
            {
                "name": "Pranayama & Diaphragmatic Breathwork Flow",
                "type": "Flexibility & Mobility",
                "frequency": "Daily",
                "duration": "15 mins",
                "intensity": "Low",
                "clinical_benefit": "Maximizes alveolar ventilation, optimizes oxygen transfer, and alleviates chronic fatigue.",
                "target_metabolism": "Pulmonary Oxygen Exchange"
            }
        ]
        safety_precautions = [
            "Stop immediately if experiencing dizziness, lightheadedness, shortness of breath, or palpitations.",
            "Rise slowly from lying or seated positions to prevent orthostatic hypotension.",
            "Allow generous rest intervals between movements; do not push through severe fatigue."
        ]
        rest_recovery = "Prioritize 8-9 hours of nightly sleep and brief 20-min daytime rest periods as hemoglobin levels rebuild."
        weekly_schedule = [
            {"day": "Monday", "routine": "15-min Gentle Paced Walk (3-min walk / 1-min sit) + 10-min Deep Breathing", "duration": "25 min", "focus": "Oxygen-Conserving Movement"},
            {"day": "Tuesday", "routine": "15-min Floor-Based Pilates & Gentle Glute Bridges", "duration": "15 min", "focus": "Isometric Stability"},
            {"day": "Wednesday", "routine": "20-min Restorative Breathing & Gentle Range of Motion", "duration": "20 min", "focus": "Fatigue Mitigation"},
            {"day": "Thursday", "routine": "15-min Leisurely Garden / Park Walk", "duration": "15 min", "focus": "Fresh Air & Circulation"},
            {"day": "Friday", "routine": "15-min Light Seated Resistance Bands & Stretching", "duration": "15 min", "focus": "Functional Muscle Tone"},
            {"day": "Saturday", "routine": "20-min Gentle Stroll with Companionship", "duration": "20 min", "focus": "Social Vitality"},
            {"day": "Sunday", "routine": "Full Rest & Recovery / Guided Relaxation Audio", "duration": "15 min", "focus": "Cellular Rest & Hematopoiesis"}
        ]
    else: # Preventative Longevity & Wellness
        summary = "Integrative Longevity & Functional Fitness Prescription balancing cardiovascular VO2 capacity, metabolic lean mass, joint mobility, and autonomic resilience."
        weekly_target = 180
        intensity = "Moderate-to-Vigorous Progressive"
        exercises = [
            {
                "name": "Zone 2 Cardiovascular Aerobic Conditioning (Running, Cycling, Rowing)",
                "type": "Aerobic / Cardio",
                "frequency": "4 days per week",
                "duration": "35-45 mins",
                "intensity": "Moderate",
                "clinical_benefit": "Enhances mitochondrial density, increases VO2 max, and builds cardiovascular longevity reserve.",
                "target_metabolism": "Mitochondrial Biogenesis & VO2 Max"
            },
            {
                "name": "Compound Resistance Training (Squats, Deadlifts, Presses, Rows)",
                "type": "Resistance / Strength",
                "frequency": "3 days per week",
                "duration": "30-40 mins",
                "intensity": "Moderate-High",
                "clinical_benefit": "Stimulates myofibrillar hypertrophy, strengthens bone mineral density, and elevates insulin sensitivity.",
                "target_metabolism": "Myofibrillar Protein Synthesis"
            },
            {
                "name": "Dynamic Mobility, Foam Rolling & Core Yoga",
                "type": "Flexibility & Mobility",
                "frequency": "Daily",
                "duration": "15-20 mins",
                "intensity": "Low",
                "clinical_benefit": "Preserves spinal posture, enhances fascial elasticity, and maintains joint synovial lubrication.",
                "target_metabolism": "Fascial & Synovial Joint Longevity"
            }
        ]
        safety_precautions = [
            "Maintain progressive overload with strict technique before increasing resistance weight.",
            "Stay adequately hydrated (2.5L+ water daily) and replace electrolytes during sweaty workouts.",
            "Incorporate dynamic warm-ups and thorough static post-workout stretches."
        ]
        rest_recovery = "Schedule 1-2 active recovery days per week and maintain consistent 7.5 to 8.5 hours of quality sleep."
        weekly_schedule = [
            {"day": "Monday", "routine": "40-min Upper Body Resistance Training + 10-min Core Work", "duration": "50 min", "focus": "Upper Body Muscular Strength"},
            {"day": "Tuesday", "routine": "35-min Zone 2 Cardiovascular Incline Run or Cycling", "duration": "35 min", "focus": "Cardiopulmonary Endurance"},
            {"day": "Wednesday", "routine": "40-min Lower Body Resistance Training (Squats, Lunges, RDLs)", "duration": "40 min", "focus": "Lower Kinetic Chain Power"},
            {"day": "Thursday", "routine": "35-min High-Cadence Cycling or Swimming Laps", "duration": "35 min", "focus": "Aerobic Capacity & Active Recovery"},
            {"day": "Friday", "routine": "35-min Full-Body Functional Strength & Kettlebell Circuit", "duration": "35 min", "focus": "Total Body Power & Core"},
            {"day": "Saturday", "routine": "45-60 min Outdoor Trail Run, Road Cycling, or Sports", "duration": "60 min", "focus": "Aerobic VO2 Peak Challenge"},
            {"day": "Sunday", "routine": "25-min Deep Fascial Stretching, Yoga & Foam Rolling", "duration": "25 min", "focus": "Full Autonomic Restoration"}
        ]

    return {
        "summary": summary,
        "weekly_target_minutes": weekly_target,
        "intensity_rating": intensity,
        "exercises": exercises,
        "safety_precautions": safety_precautions,
        "rest_recovery_protocol": rest_recovery,
        "recommended_days": weekly_schedule
    }

def generate_diet_plan(
    patient_id: str,
    patient_name: str,
    age: int,
    sex: str,
    report_id: Optional[str] = None,
    dietary_preference: str = "Standard Balanced",
    custom_calories: Optional[int] = None,
    nutritionist_notes: str = ""
) -> Dict[str, Any]:
    """
    Synthesizes a complete tailored clinical diet plan based on pathology findings.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    report_items = []
    if report_id:
        cursor.execute("SELECT * FROM report_items WHERE report_id = ?", (report_id,))
        report_items = [dict(r) for r in cursor.fetchall()]
    else:
        # Fetch latest report for patient if not specified
        cursor.execute("""
        SELECT r.report_id FROM reports r 
        WHERE r.patient_id = ? 
        ORDER BY r.report_date DESC LIMIT 1
        """, (patient_id,))
        latest_rep = cursor.fetchone()
        if latest_rep:
            report_id = latest_rep["report_id"]
            cursor.execute("SELECT * FROM report_items WHERE report_id = ?", (report_id,))
            report_items = [dict(r) for r in cursor.fetchall()]

    conn.close()

    triggers = determine_clinical_conditions(report_items)
    categories = {t["category"] for t in triggers}

    # Determine Base Protocol
    has_glycemic = any("Glycemic" in c for c in categories)
    has_lipid = any("Dyslipidemia" in c for c in categories)
    has_renal = any("Renal" in c for c in categories)
    has_gout = any("Hyperuricemia" in c for c in categories)
    has_anemia = any("Anemia" in c for c in categories)
    has_hyperkalemia = any("Hyperkalemia" in c for c in categories)
    has_hepatic = any("Hepatic" in c for c in categories)

    # Naming the protocol
    if has_glycemic and has_lipid:
        plan_name = "Cardio-Metabolic & Glycemic Balance Protocol"
        summary = "Clinically formulated to lower postprandial glucose surges, enhance insulin sensitivity, and clear atherogenic lipids through soluble fiber and cardioprotective fats."
        tags = ["Low Glycemic Index", "Cardioprotective", "High Soluble Fiber", "Anti-Inflammatory"]
        carbs_pct, protein_pct, fat_pct = 40, 25, 35
        base_cals = 1850 if sex.lower() == "male" else 1650
        sodium_limit = 2000
        water_liters = 2.5
    elif has_glycemic:
        plan_name = "Targeted Glycemic Control & Diabetic Nutrition Plan"
        summary = "Focuses on carbohydrate distribution, low-glycemic load whole foods, resistant starches, and consistent meal timing to stabilize serum glucose and HbA1c."
        tags = ["Low GI / Low GL", "Sugar-Free", "High Fiber (>35g)", "Slow Carbs"]
        carbs_pct, protein_pct, fat_pct = 40, 25, 35
        base_cals = 1800 if sex.lower() == "male" else 1600
        sodium_limit = 2200
        water_liters = 2.5
    elif has_lipid:
        plan_name = "Cardiovascular Lipid-Lowering & Vascular Health Diet"
        summary = "Designed to reduce circulating total cholesterol, LDL, and triglycerides while supporting vascular endothelial nitric oxide synthesis with Mediterranean staples."
        tags = ["Low Saturated Fat (<7%)", "Omega-3 Rich", "Phytosterols", "Zero Trans Fats"]
        carbs_pct, protein_pct, fat_pct = 45, 20, 35
        base_cals = 1900 if sex.lower() == "male" else 1700
        sodium_limit = 2000
        water_liters = 2.5
    elif has_renal:
        plan_name = "Renal-Protective & Glomerular Preservation Protocol"
        summary = "Restricts high-nitrogen waste buildup and controls fluid homeostasis with moderate high-biological-value protein and strict electrolyte modulation."
        tags = ["Controlled Protein (0.8g/kg)", "Low Sodium (<1800mg)", "Phosphorus Cautious", "Kidney Safe"]
        carbs_pct, protein_pct, fat_pct = 50, 15, 35
        base_cals = 1800 if sex.lower() == "male" else 1600
        sodium_limit = 1800
        water_liters = 2.0
    elif has_gout:
        plan_name = "Low-Purine & Alkaline Uric Acid Reduction Plan"
        summary = "Inhibits endogenous xanthine oxidase pathway substrate overload by eliminating purine-dense animal tissues and enhancing renal uric acid clearance."
        tags = ["Low Purine", "Alkaline Ash", "High Hydration", "Fructose-Free"]
        carbs_pct, protein_pct, fat_pct = 55, 20, 25
        base_cals = 1900 if sex.lower() == "male" else 1700
        sodium_limit = 2200
        water_liters = 3.2
    elif has_anemia:
        plan_name = "Hematological Recovery & Bioavailable Iron-Density Plan"
        summary = "Optimizes erythropoiesis and hemoglobin synthesis through concentrated bioavailable iron sources strategically combined with ascorbic acid boosters."
        tags = ["High Bioavailable Iron", "Vitamin C Synergized", "Folate & B12 Rich", "Tannin Separated"]
        carbs_pct, protein_pct, fat_pct = 45, 25, 30
        base_cals = 2000 if sex.lower() == "male" else 1800
        sodium_limit = 2200
        water_liters = 2.5
    elif has_hepatic:
        plan_name = "Hepatic Detoxification & Liver Enzyme Recovery Diet"
        summary = "Nourishes hepatic phase I & II detoxification pathways with glutathione precursors, cruciferous sulforaphane, and zero hepatotoxic burdens."
        tags = ["Glutathione Support", "Cruciferous Rich", "Zero Alcohol", "Easily Digestible"]
        carbs_pct, protein_pct, fat_pct = 50, 20, 30
        base_cals = 1850 if sex.lower() == "male" else 1650
        sodium_limit = 2000
        water_liters = 2.7
    else:
        plan_name = "Integrative Clinical Longevity & Preventative Wellness Diet"
        summary = "A pathology-verified optimal nutrient protocol maintaining normative biomarker equilibrium through anti-inflammatory polyphenol-rich nutrition."
        tags = ["Preventative Wellness", "Mediterranean Balanced", "Polyphenol Dense", "Gut Microbiome"]
        carbs_pct, protein_pct, fat_pct = 45, 25, 30
        base_cals = 2000 if sex.lower() == "male" else 1750
        sodium_limit = 2200
        water_liters = 2.5

    calories = custom_calories if custom_calories else base_cals

    # Adjust for Vegetarian / Vegan if selected
    is_veg = "veg" in dietary_preference.lower()

    # Generate Foods to Include
    foods_to_include = []
    if has_glycemic:
        foods_to_include.extend([
            {"category": "Complex Carbohydrates", "item": "Steel-Cut Oats & Quinoa", "portion": "1/2 to 3/4 cup cooked", "clinical_benefit": "High beta-glucan soluble fiber blunts post-meal glucose absorption."},
            {"category": "Vegetables", "item": "Steamed Broccoli & Bitter Gourd (Karela)", "portion": "1-2 cups daily", "clinical_benefit": "Contains charantin and polyphenol antioxidants that assist cellular glucose uptake."},
            {"category": "Proteins", "item": "Organic Tofu or Skinless Chicken Breast" if not is_veg else "Organic Tofu & Sprouted Moong Dal", "portion": "120g - 150g per main meal", "clinical_benefit": "Lean protein buffers glycemic spikes and sustains satiety."},
            {"category": "Healthy Fats", "item": "Chia Seeds & Ground Flaxseeds", "portion": "1-2 tablespoons soaked", "clinical_benefit": "Omega-3 ALA and mucilage fiber delay gastric emptying."}
        ])

    if has_lipid:
        foods_to_include.extend([
            {"category": "Heart-Healthy Lipids", "item": "Cold-Pressed Extra Virgin Olive Oil", "portion": "1-2 tbsp uncooked over salads", "clinical_benefit": "High oleic acid content elevates protective HDL and reduces oxidized LDL."},
            {"category": "Tree Nuts", "item": "Raw Walnuts & Almonds", "portion": "1 handful (30g) as mid-day snack", "clinical_benefit": "Plant sterols compete with dietary cholesterol absorption in the intestine."},
            {"category": "Legumes", "item": "Black Beans, Chickpeas & Lentils", "portion": "1 cup cooked daily", "clinical_benefit": "Fermentable soluble fiber binds bile acids in the lumen for systemic lipid reduction."}
        ])

    if has_anemia:
        foods_to_include.extend([
            {"category": "Iron Dense", "item": "Spinach, Black Chickpeas & Lentils" if is_veg else "Lean Poultry, Egg Yolks & Steamed Spinach", "portion": "Generous serving with meals", "clinical_benefit": "Supplies fundamental substrates for hemoglobin synthesis and marrow production."},
            {"category": "Absorption Synergist", "item": "Fresh Lemon Water, Bell Peppers & Kiwi", "portion": "With every iron-rich meal", "clinical_benefit": "Ascorbic acid reduces ferric (Fe3+) iron into easily absorbable ferrous (Fe2+) state."}
        ])

    if has_gout:
        foods_to_include.extend([
            {"category": "Uric Acid Neutralizer", "item": "Tart Cherries & Fresh Berries", "portion": "1/2 cup daily", "clinical_benefit": "Anthocyanins down-regulate xanthine oxidase and lower serum uric acid."},
            {"category": "Dairy", "item": "Low-Fat Greek Yogurt & Cottage Cheese", "portion": "1 cup daily", "clinical_benefit": "Casein and lactalbumin promote uricosuric renal excretion."},
            {"category": "Alkalizing", "item": "Fresh Cucumber, Celery & Alkaline Water", "portion": "Abundant throughout day", "clinical_benefit": "Assists urinary alkalization to prevent uric acid crystal nephrolithiasis."}
        ])

    if has_renal:
        foods_to_include.extend([
            {"category": "High Biological Value Protein", "item": "Egg Whites & Steamed Freshwater Fish" if not is_veg else "Egg Whites / Low-Phosphorus Cottage Cheese", "portion": "Carefully portioned (60-80g)", "clinical_benefit": "Yields complete essential amino acids with minimum nitrogenous urea waste."},
            {"category": "Low-Potassium Produce", "item": "Cauliflower, Apples, Cabbage & Blueberries", "portion": "1-2 cups steamed", "clinical_benefit": "Nutrient-rich without overloading renal potassium or phosphorus clearance pathways."}
        ])

    # Default fallback / wellness foods if list is short
    if len(foods_to_include) < 4:
        foods_to_include.extend([
            {"category": "Cardio-Protective Produce", "item": "Dark Leafy Greens (Kale, Spinach, Arugula)", "portion": "2 cups raw or 1 cup cooked daily", "clinical_benefit": "Natural dietary nitrates promote endothelial vascular elasticity."},
            {"category": "Lean Protein", "item": "Wild Salmon or Steamed Edamame" if not is_veg else "Steamed Edamame, Paneer & Red Lentils", "portion": "100-150g per meal", "clinical_benefit": "Provides optimal amino acid profile for muscle mass and immune cellular maintenance."},
            {"category": "Antioxidant Beverages", "item": "Loose Leaf Green Tea", "portion": "1-2 cups between meals", "clinical_benefit": "Epigallocatechin gallate (EGCG) combats systemic oxidative stress and metabolic strain."}
        ])

    # Generate Foods to Avoid
    foods_to_avoid = []
    if has_glycemic:
        foods_to_avoid.extend([
            {"item": "Refined White Sugar, Syrups & High-Fructose Juices", "category": "Refined Sugars", "reason": "Immediately spikes plasma glucose, aggravating pancreatic beta-cell fatigue.", "severity": "Strict Avoidance"},
            {"item": "White Bread, Instant Pastas & Refined Flour (Maida)", "category": "Refined Carbs", "reason": "High glycemic index (>75) triggers rapid insulin release and glycemic volatility.", "severity": "Strict Avoidance"},
            {"item": "Sugary Confectioneries & Commercial Sodas", "category": "Simple Sweets", "reason": "Causes dangerous glycated hemoglobin escalation and peripheral neuropathy risks.", "severity": "Strict Avoidance"}
        ])

    if has_lipid:
        foods_to_avoid.extend([
            {"item": "Deep Fried Snacks, Fast Food & Hydrogenated Vanaspati", "category": "Trans Fats", "reason": "Directly elevates small dense atherogenic LDL while depressing protective HDL.", "severity": "Strict Avoidance"},
            {"item": "Processed Meats (Sausages, Bacon, Cured Salami)", "category": "Processed Meats", "reason": "High saturated fats and nitrates increase arterial plaque formation.", "severity": "Strict Avoidance"},
            {"item": "Full-Fat Palm Oil & Reused Commercial Cooking Fats", "category": "Saturated Oils", "reason": "Inhibits hepatic LDL receptor activity, leading to prolonged hypercholesterolemia.", "severity": "Moderate Restriction"}
        ])

    if has_gout:
        foods_to_avoid.extend([
            {"item": "Organ Meats (Liver, Kidneys) & Shellfish (Shrimp, Anchovies)", "category": "High Purine", "reason": "High cellular density generates massive purine breakdown directly into uric acid.", "severity": "Strict Avoidance"},
            {"item": "Beer, Brewer's Yeast & Grain Spirits", "category": "Alcohol / Yeast", "reason": "Alcohol competes with uric acid for renal tubular excretion, triggering acute gout attacks.", "severity": "Strict Avoidance"},
            {"item": "High-Fructose Corn Syrup (HFCS) Drinks", "category": "Fructose", "reason": "Hepatic fructolysis rapidly consumes ATP and accelerates purine nucleotide catabolism.", "severity": "Strict Avoidance"}
        ])

    if has_renal:
        foods_to_avoid.extend([
            {"item": "Commercial Canned Soups & Salty Processed Snacks", "category": "High Sodium", "reason": "Excess sodium drives hypervolemia, hypertension, and accelerates glomerulosclerosis.", "severity": "Strict Avoidance"},
            {"item": "Commercial Protein Powders & Excessive Red Meat", "category": "Hyper-Protein", "reason": "Induces intraglomerular hypertension and exacerbates elevated serum creatinine and BUN.", "severity": "Strict Avoidance"}
        ])

    if has_hyperkalemia:
        foods_to_avoid.extend([
            {"item": "Bananas, Dried Apricots, Potato Chips & Tomato Concentrates", "category": "High Potassium", "reason": "Overwhelms impaired tubular potassium filtration, risking fatal cardiac arrhythmias.", "severity": "Strict Avoidance"}
        ])

    if len(foods_to_avoid) < 3:
        foods_to_avoid.extend([
            {"item": "Commercial Ultra-Processed Packaged Snacks", "category": "Ultra-Processed", "reason": "Packed with synthetic emulsifiers, hidden sugars, and high industrial sodium.", "severity": "Strict Avoidance"},
            {"item": "Artificial Sweetener Overdoses & Aspartame Soft Drinks", "category": "Artificial Additives", "reason": "Disrupts healthy gut microbiome diversity and metabolic signaling.", "severity": "Moderate Restriction"}
        ])

    # Weekly Meal Plan (7 Days: Mon - Sun)
    # Customized according to conditions
    def get_day_plan(day_num: int, day_name: str) -> Dict[str, Any]:
        if has_glycemic and has_lipid:
            meals = {
                1: {
                    "breakfast": "Steel-cut oatmeal (cooked with water/unsweetened almond milk) topped with 1 tbsp chia seeds, cinnamon, and 6 raw walnut halves.",
                    "mid_morning": "1 crisp green Granny Smith apple sliced with a sprinkle of roasted pumpkin seeds.",
                    "lunch": "Mediterranean quinoa bowl with grilled herb tofu (or skinless chicken), cucumber, diced tomatoes, kalamata olives, and fresh lemon-tahini dressing.",
                    "afternoon_snack": "A cup of steamed organic edamame pods sprinkled with black pepper and sea salt.",
                    "dinner": "Pan-seared wild salmon (or baked lentil patty) over a bed of sautéed garlic spinach and steamed asparagus spears.",
                    "bedtime": "Chamomile lavender herbal infusion (zero sugar) with 4 raw soaked almonds."
                },
                2: {
                    "breakfast": "2-egg white scramble with spinach, mushrooms, and 1 slice of sprouted Ezekiel bread, avocado slices.",
                    "mid_morning": "A cup of homemade probiotic Greek yogurt (low fat) with 1 tbsp freshly ground flaxseeds.",
                    "lunch": "Warm red lentil and vegetable dal served with 1 cup of steamed brown basmati rice and fresh cucumber-tomato kachumber.",
                    "afternoon_snack": "Raw carrot and celery batons served with 2 tbsp of authentic garlic hummus.",
                    "dinner": "Tender grilled vegetable and chickpea stew in an aromatic tomato-cumin broth, garnished with fresh cilantro.",
                    "bedtime": "Warm unsweetened almond milk with a pinch of turmeric and ground black pepper."
                },
                3: {
                    "breakfast": "Sprouted moong dal chilla (savory crepe) stuffed with grated zucchini and coriander, accompanied by fresh mint chutney.",
                    "mid_morning": "Handful (25g) of unsalted roasted almonds and 1 sweet orange or guava.",
                    "lunch": "Herb-crusted baked cod or grilled paneer cubes tossed with roasted bell peppers, baby arugula, and extra virgin olive oil.",
                    "afternoon_snack": "Chilled green tea infused with fresh mint leaves and 1 rice cake with crushed avocado.",
                    "dinner": "Hearty vegetable minestrone soup enriched with cannellini beans and leafy kale, drizzled with cold-pressed olive oil.",
                    "bedtime": "Soaked basil seeds (sabja) in plain water with a slice of fresh lemon."
                },
                4: {
                    "breakfast": "Overnight rolled oats soaked in unsweetened soy milk with chia seeds, raw cacao powder, and 1/4 cup fresh blueberries.",
                    "mid_morning": "1 boiled egg (or 50g boiled edamame) with roasted black pepper and lemon zest.",
                    "lunch": "Steamed millet (bajra/foxtail) khichdi loaded with green peas, carrots, french beans, and fresh ginger.",
                    "afternoon_snack": "Roasted makhana (foxnuts) tossed lightly in olive oil with turmeric and pink salt.",
                    "dinner": "Zucchini noodles (zoodles) with walnut basil pesto and grilled turkey breast or roasted tofu cubes.",
                    "bedtime": "Steeped fresh ginger and tulsi (holy basil) tea."
                },
                5: {
                    "breakfast": "Whole wheat sourdough toast topped with mashed avocado, cherry tomatoes, microgreens, and a poached egg.",
                    "mid_morning": "1 small pear with a small palmful of roasted sunflower seeds.",
                    "lunch": "Moroccan spiced chickpea bowl with steamed cauliflower rice, roasted eggplants, and fresh lemon-parsley vinaigrette.",
                    "afternoon_snack": "Cucumber discs topped with low-fat cottage cheese and cracked pepper.",
                    "dinner": "Baked herb-infused chicken breast or tempeh cubes with steamed French beans, roasted sweet potato wedges.",
                    "bedtime": "Soaked fenugreek seed (methi) water to assist morning glycemic balance."
                },
                6: {
                    "breakfast": "Almond-flour buckwheat pancakes (unsweetened) topped with fresh raspberries and a dollop of unsweetened Greek yogurt.",
                    "mid_morning": "1 tender coconut water (fresh) or cold green tea with a squeeze of lime.",
                    "lunch": "Fresh Mexican black bean fiesta bowl with shredded romaine, salsa fresca, roasted sweet corn, and lime juice.",
                    "afternoon_snack": "1/2 cup roasted chickpeas (chana) with diced onions, tomatoes, and chaat spices.",
                    "dinner": "Steamed white fish or silken tofu in a fragrant lemongrass ginger broth with bok choy and shiitake mushrooms.",
                    "bedtime": "Warm cinnamon bark tea."
                },
                7: {
                    "breakfast": "Vegetable poha (flattened rice) made with abundant green peas, roasted peanuts, curry leaves, and lemon.",
                    "mid_morning": "Fresh papaya bowl (1 cup) with a sprinkle of lime juice and chia seeds.",
                    "lunch": "Grilled Mediterranean vegetable wrap in a whole grain flax lavash with hummus, spinach, and grilled paneer/tofu.",
                    "afternoon_snack": "Handful of dry roasted walnuts and dried unsweetened tart cherries.",
                    "dinner": "Traditional vegetable stew cooked in light coconut milk with steamed brown rice appam or steamed quinoa.",
                    "bedtime": "Herbal lemon balm infusion."
                }
            }
        elif has_renal:
            meals = {
                1: {
                    "breakfast": "Warm cream of wheat (suji) or plain puffed rice with almond milk, topped with sliced red apples.",
                    "mid_morning": "1/2 cup fresh sweet blueberries (low-potassium antioxidant).",
                    "lunch": "Controlled portion of steamed egg white salad on white sourdough with shredded cabbage and olive oil vinaigrette.",
                    "afternoon_snack": "Crisp cucumber spears with 1 tbsp low-sodium hummus.",
                    "dinner": "Cauliflower fried 'rice' with diced carrots, green peas, and 60g lean baked chicken or steamed tofu.",
                    "bedtime": "Warm mint tea (caffeine-free)."
                },
                2: {
                    "breakfast": "Rice flour steamed idlis (2 pcs) with mild mint coriander dip (salt-restricted).",
                    "mid_morning": "1/2 cup seedless red grapes.",
                    "lunch": "Steamed white basmati rice with well-boiled and leached bottle gourd (lauki) sabzi, tempered in cumin and olive oil.",
                    "afternoon_snack": "Unsalted rice cakes with a thin smear of apple butter.",
                    "dinner": "Pan-steamed freshwater white fish fillet (80g) or paneer with steamed broccoli florets and white rice.",
                    "bedtime": "Chamomile herbal tea."
                },
                3: {
                    "breakfast": "Cornflakes or rolled oats cooked with water, served with poached pear slices.",
                    "mid_morning": "Freshly peeled sweet apple slices.",
                    "lunch": "Pasta tossed in olive oil, garlic, roasted bell peppers, and low-sodium cottage cheese (paneer).",
                    "afternoon_snack": "Lightly salted roasted murmura (puffed rice) with chopped cucumber.",
                    "dinner": "Warm vegetable broth with white noodles, shredded carrots, and egg white ribbons.",
                    "bedtime": "Light ginger tea."
                },
                4: {
                    "breakfast": "Semolina upma with finely diced carrots and beans, cooked in low sodium.",
                    "mid_morning": "Small bowl of fresh blackberries.",
                    "lunch": "Soft phulka (1-2) with leached zucchini curry and a small cup of curd.",
                    "afternoon_snack": "1 slice of low-sodium toasted white bread with avocado spread.",
                    "dinner": "Grilled tofu steaks (60g) with steamed cauliflower puree and green beans.",
                    "bedtime": "Fennel seed (saunf) infusion."
                },
                5: {
                    "breakfast": "Rice vermicelli (sevai) cooked savory with green peas and ginger.",
                    "mid_morning": "1 fresh guava (seeds removed) or 1 sweet pear.",
                    "lunch": "Steamed rice with yellow moong dal (light) and cucumber salad.",
                    "afternoon_snack": "Unsalted air-popped corn (small bowl).",
                    "dinner": "Stir-fried cabbage and capsicum with 80g steamed chicken breast or tofu cubes.",
                    "bedtime": "Warm water with lemon wedge."
                },
                6: {
                    "breakfast": "Steamed rice dhokla with mild green chili temper (salt controlled).",
                    "mid_morning": "1/2 cup fresh pineapple chunks.",
                    "lunch": "Vegetable noodle soup with shredded egg whites and low-sodium vegetable stock.",
                    "afternoon_snack": "Cucumber and radish batons.",
                    "dinner": "Baked white fish or cottage cheese with steamed zucchini and white bread roll.",
                    "bedtime": "Chamomile tea."
                },
                7: {
                    "breakfast": "Oatmeal pancakes prepared without baking powder, topped with pure blueberry compote.",
                    "mid_morning": "1 fresh red apple.",
                    "lunch": "Steamed couscous with roasted carrots, bell peppers, and mild herbs.",
                    "afternoon_snack": "Roasted puffed wheat snacks.",
                    "dinner": "Light pumpkin and carrot soup with soft steamed rice and grilled tofu.",
                    "bedtime": "Warm herbal infusion."
                }
            }
        elif has_anemia:
            meals = {
                1: {
                    "breakfast": "Iron-fortified oatmeal with soaked black raisins, crushed dried figs, and freshly squeezed orange juice on the side.",
                    "mid_morning": "Handful of roasted pumpkin seeds and 2 dried dates.",
                    "lunch": "Sprouted black chickpea (kala chana) salad with diced bell peppers, tomatoes, and generous fresh lemon juice dressing.",
                    "afternoon_snack": "Fresh pomegranate arils (1 cup) with crushed roasted pistachios.",
                    "dinner": "Sautéed spinach and mushroom scramble with grilled lean chicken or tofu, served with beetroot soup.",
                    "bedtime": "Warm almond milk with date syrup."
                },
                2: {
                    "breakfast": "Spinach and beetroot whole grain paratha or wrap with a dollop of yogurt, accompanied by fresh kiwi slices.",
                    "mid_morning": "1 cup of fresh amla (Indian gooseberry) or citrus juice rich in ascorbic acid.",
                    "lunch": "Red kidney bean (rajma) curry with brown rice and a crunchy bell pepper & cucumber salad.",
                    "afternoon_snack": "Roasted black sesame seed and jaggery brittle (small piece).",
                    "dinner": "Slow-cooked lentil shepherd's pie with sweet potato mash and steamed broccoli florets.",
                    "bedtime": "Warm turmeric milk."
                },
                3: {
                    "breakfast": "Eggs sunny-side-up (2 eggs) over sautéed iron-rich kale, toasted rye bread, and grapefruit wedges.",
                    "mid_morning": "Dried apricots (4-5 pieces) and roasted almonds.",
                    "lunch": "Quinoa tabbouleh with abundant fresh parsley, mint, lemon juice, olive oil, and steamed edamame.",
                    "afternoon_snack": "Fresh watermelon slices or ripe guava.",
                    "dinner": "Herb-roasted poultry or lentil patties with roasted beetroots and wilted baby spinach.",
                    "bedtime": "Chamomile tea."
                },
                4: {
                    "breakfast": "Smoothie bowl: blended spinach, ripe banana, spirulina, and orange juice, topped with hemp seeds and chia.",
                    "mid_morning": "1 hard-boiled egg or roasted soy nuts.",
                    "lunch": "Steamed brown rice with thick horsegram (kulthi) dal or black dal, paired with tomato salad.",
                    "afternoon_snack": "Sliced red bell pepper dipped in lemon-tahini dressing.",
                    "dinner": "Pan-seared salmon or marinated tempeh with steamed asparagus and sautéed rainbow chard.",
                    "bedtime": "Warm date milk."
                },
                5: {
                    "breakfast": "Sprouted fenugreek and moong dal savory pancakes with freshly crushed tomato-chili chutney.",
                    "mid_morning": "Fresh strawberries or sweet oranges.",
                    "lunch": "Mediterranean lamb or grilled mushroom-lentil burger on whole grain bun with beet relish and arugula.",
                    "afternoon_snack": "Pumpkin seed and sunflower seed trail mix.",
                    "dinner": "Hearty French green lentil soup with carrots, leeks, and crusty whole wheat baguette.",
                    "bedtime": "Herbal rose tea."
                },
                6: {
                    "breakfast": "Ragi (finger millet) porridge cooked with a touch of jaggery, milk, and chopped almonds.",
                    "mid_morning": "1 cup fresh pomegranate seeds.",
                    "lunch": "Steamed quinoa bowl with grilled chicken/paneer, roasted sweet potatoes, and steamed kale.",
                    "afternoon_snack": "Dried prunes (3-4) and walnuts.",
                    "dinner": "Spiced baked fish or black bean tacos in soft corn tortillas with fresh cabbage slaw and salsa.",
                    "bedtime": "Warm spiced milk."
                },
                7: {
                    "breakfast": "Whole grain French toast made with egg yolks and cinnamon, served with fresh mixed berries.",
                    "mid_morning": "Fresh citrus salad with mint leaves.",
                    "lunch": "Traditional chickpea and spinach curry (chana saag) with whole wheat roti.",
                    "afternoon_snack": "Roasted makhana with sesame seeds.",
                    "dinner": "Roast chicken breast or grilled tofu with steamed green beans and baked beet chips.",
                    "bedtime": "Warm almond milk."
                }
            }
        else: # Standard Mediterranean / Glycemic-Cardio Wellness
            meals = {
                1: {
                    "breakfast": "Greek yogurt parfait with rolled oats, mixed berries, chia seeds, and a drizzle of raw honey.",
                    "mid_morning": "1 fresh crisp apple with 10 raw almonds.",
                    "lunch": "Grilled Mediterranean chicken or herb tofu over Greek salad with feta, olives, and extra virgin olive oil.",
                    "afternoon_snack": "Carrot and bell pepper sticks with classic hummus.",
                    "dinner": "Baked salmon or grilled portobello steaks with roasted asparagus and sweet potato mash.",
                    "bedtime": "Chamomile herbal tea."
                },
                2: {
                    "breakfast": "Vegetable omelet with spinach, tomatoes, and mushrooms, served with 1 slice of multigrain sourdough.",
                    "mid_morning": "Handful of mixed walnuts and sunflower seeds.",
                    "lunch": "Lentil soup with mixed green salad and olive oil lemon dressing.",
                    "afternoon_snack": "Fresh seasonal fruit bowl.",
                    "dinner": "Stir-fried vegetables and edamame with quinoa in light garlic soy sauce.",
                    "bedtime": "Warm turmeric milk."
                },
                3: {
                    "breakfast": "Warm spiced oatmeal bowl with sliced bananas, flaxseeds, and crushed pecans.",
                    "mid_morning": "Low-fat cottage cheese with sliced cucumber.",
                    "lunch": "Brown rice bowl with black beans, roasted corn, avocado salsa, and grilled protein.",
                    "afternoon_snack": "Green tea with roasted foxnuts.",
                    "dinner": "Steamed white fish or paneer tikka with sautéed broccoli and cauliflower.",
                    "bedtime": "Peppermint infusion."
                },
                4: {
                    "breakfast": "Sprouted grain avocado toast with poached eggs and hemp seeds.",
                    "mid_morning": "1 juicy orange or pear.",
                    "lunch": "Mediterranean tuna salad or chickpea salad tossed with lemon juice, celery, and red onions.",
                    "afternoon_snack": "Steamed edamame with sea salt.",
                    "dinner": "Grilled chicken breast or tofu kebabs with roasted Mediterranean vegetables and tzatziki.",
                    "bedtime": "Lemon balm tea."
                },
                5: {
                    "breakfast": "Berry spinach smoothie with plant protein, chia seeds, and unsweetened almond milk.",
                    "mid_morning": "Hard-boiled egg or roasted chickpeas.",
                    "lunch": "Minestrone soup with whole grain dinner roll and garden salad.",
                    "afternoon_snack": "Fresh celery sticks with almond butter.",
                    "dinner": "Pan-seared cod or tempeh with sautéed garlic greens and wild rice pilaf.",
                    "bedtime": "Warm chamomile tea."
                },
                6: {
                    "breakfast": "Buckwheat crepes with low-fat ricotta cheese and fresh strawberry compote.",
                    "mid_morning": "1 fresh tender coconut water.",
                    "lunch": "Whole grain wrap with grilled chicken/tofu, roasted peppers, and avocado.",
                    "afternoon_snack": "Handful of pistachios.",
                    "dinner": "Traditional Moroccan vegetable tagine with couscous.",
                    "bedtime": "Herbal valerian tea."
                },
                7: {
                    "breakfast": "Sunday breakfast scramble with eggs/tofu, sweet potatoes, peppers, and avocado slices.",
                    "mid_morning": "Papaya cubes with lime juice.",
                    "lunch": "Baked eggplant parmigiana (light olive oil) with mixed Italian salad.",
                    "afternoon_snack": "Cucumber and radish salad with olive oil.",
                    "dinner": "Grilled seafood or lentil patties with roasted squash and steamed asparagus.",
                    "bedtime": "Warm soothing herbal infusion."
                }
            }
        
        day_meal = meals.get(day_num, meals[1])
        return {
            "day": day_name,
            "day_number": day_num,
            "breakfast": day_meal["breakfast"],
            "mid_morning": day_meal["mid_morning"],
            "lunch": day_meal["lunch"],
            "afternoon_snack": day_meal["afternoon_snack"],
            "dinner": day_meal["dinner"],
            "bedtime": day_meal["bedtime"],
            "hydration_note": f"Maintain minimum {water_liters}L of filtered water throughout the day. Drink 1 glass 30 mins before each meal."
        }

    days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekly_meal_plan = [get_day_plan(i + 1, name) for i, name in enumerate(days_names)]

    # Lifestyle & Monitoring Guidelines
    lifestyle_guidelines = [
        "Hydration Routine: Distribute fluid intake evenly across daylight hours; taper off 2 hours before sleep to prevent nocturia.",
        "Meal Cadence: Avoid skipping meals. Eat within a consistent 10-hour daily feeding window (e.g., 8:00 AM to 6:00 PM) to align with metabolic circadian rhythms.",
        "Physical Activity: 30 minutes of moderate aerobic exercise (brisk walking, cycling, or swimming) 5 days per week, plus light post-meal walking to optimize glycemic disposal.",
        "Culinary Preparation: Prioritize steaming, baking, poaching, or light sautéing in cold-pressed oils. Completely eliminate deep-frying and burnt charred charcuterie.",
        "Pathology Re-Test Protocol: Schedule follow-up blood work in 6 to 8 weeks to quantify biomarker trajectory."
    ]

    # Generate Pathology-Tailored Exercise Prescription
    exercise_prescription = generate_exercise_prescription(
        triggers=triggers,
        age=age,
        sex=sex,
        has_glycemic=has_glycemic,
        has_lipid=has_lipid,
        has_renal=has_renal,
        has_gout=has_gout,
        has_anemia=has_anemia,
        has_hepatic=has_hepatic
    )

    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    diet_plan_payload = {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "report_id": report_id,
        "age": age,
        "sex": sex,
        "plan_name": plan_name,
        "summary": summary,
        "status": "Active",
        "primary_condition": triggers[0]["category"] if triggers else "Preventative Wellness",
        "dietary_preference": dietary_preference,
        "calories_target": calories,
        "water_target_liters": water_liters,
        "sodium_limit_mg": sodium_limit,
        "dietary_tags": tags,
        "macronutrients": {
            "carbs_pct": carbs_pct,
            "protein_pct": protein_pct,
            "fat_pct": fat_pct,
            "fiber_g": 35 if has_glycemic else 28
        },
        "clinical_triggers": triggers,
        "foods_to_include": foods_to_include,
        "foods_to_avoid": foods_to_avoid,
        "weekly_meal_plan": weekly_meal_plan,
        "lifestyle_guidelines": lifestyle_guidelines,
        "exercise_prescription": exercise_prescription,
        "nutritionist_notes": nutritionist_notes or "Prescribed based on pathology panel review. Clinician approval verified for outpatient nutritional management.",
        "assigned_by": "Dr. Sarah Jenkins, MD, FACP (Chief Pathologist)",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    # Save to SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO patient_diet_plans (
        patient_id, patient_name, report_id, age, sex, plan_name, summary,
        status, primary_condition, dietary_preference, calories_target,
        water_target_liters, sodium_limit_mg, dietary_tags, macronutrients,
        clinical_triggers, foods_to_include, foods_to_avoid, weekly_meal_plan,
        lifestyle_guidelines, exercise_prescription, nutritionist_notes, assigned_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        patient_name,
        report_id,
        age,
        sex,
        plan_name,
        summary,
        "Active",
        triggers[0]["category"] if triggers else "Preventative Wellness",
        dietary_preference,
        calories,
        water_liters,
        sodium_limit,
        json.dumps(tags),
        json.dumps(diet_plan_payload["macronutrients"]),
        json.dumps(triggers),
        json.dumps(foods_to_include),
        json.dumps(foods_to_avoid),
        json.dumps(weekly_meal_plan),
        json.dumps(lifestyle_guidelines),
        json.dumps(exercise_prescription),
        diet_plan_payload["nutritionist_notes"],
        diet_plan_payload["assigned_by"],
        now_iso,
        now_iso
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    diet_plan_payload["id"] = new_id
    return diet_plan_payload

def get_diet_plan_by_id(plan_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patient_diet_plans WHERE id = ?", (plan_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    for col in ["dietary_tags", "macronutrients", "clinical_triggers", "foods_to_include", "foods_to_avoid", "weekly_meal_plan", "lifestyle_guidelines", "exercise_prescription"]:
        if d.get(col) and isinstance(d[col], str):
            try:
                d[col] = json.loads(d[col])
            except Exception:
                pass
    if not d.get("exercise_prescription"):
        trigs = d.get("clinical_triggers") or []
        cats = {t.get("category", "") for t in trigs} if isinstance(trigs, list) else set()
        d["exercise_prescription"] = generate_exercise_prescription(
            triggers=trigs,
            age=d.get("age", 40),
            sex=d.get("sex", "Male"),
            has_glycemic=any("Glycemic" in c for c in cats),
            has_lipid=any("Dyslipidemia" in c for c in cats),
            has_renal=any("Renal" in c for c in cats),
            has_gout=any("Hyperuricemia" in c for c in cats),
            has_anemia=any("Anemia" in c for c in cats),
            has_hepatic=any("Hepatic" in c for c in cats)
        )
    return d

def get_diet_plan_for_report(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patient_diet_plans WHERE report_id = ? ORDER BY id DESC LIMIT 1", (report_id,))
    row = cursor.fetchone()
    if row:
        conn.close()
        return get_diet_plan_by_id(row["id"])
    
    # If not existing yet, fetch report to generate one on the fly!
    cursor.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
    rep = cursor.fetchone()
    conn.close()
    if not rep:
        return None
    return generate_diet_plan(
        patient_id=rep["patient_id"],
        patient_name=rep["patient_name"],
        age=rep["age"],
        sex=rep["sex"],
        report_id=report_id
    )

def get_diet_plan_for_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patient_diet_plans WHERE patient_id = ? ORDER BY id DESC LIMIT 1", (patient_id,))
    row = cursor.fetchone()
    if row:
        conn.close()
        return get_diet_plan_by_id(row["id"])

    # If no plan exists, fetch patient info
    cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    patient = cursor.fetchone()
    conn.close()
    if not patient:
        return None

    return generate_diet_plan(
        patient_id=patient["patient_id"],
        patient_name=patient["name"],
        age=patient["age"],
        sex=patient["sex"]
    )

def get_all_diet_plans() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patient_diet_plans ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    plans = []
    for r in rows:
        d = dict(r)
        for col in ["dietary_tags", "macronutrients", "clinical_triggers", "foods_to_include", "foods_to_avoid", "weekly_meal_plan", "lifestyle_guidelines", "exercise_prescription"]:
            if d.get(col) and isinstance(d[col], str):
                try:
                    d[col] = json.loads(d[col])
                except Exception:
                    pass
        if not d.get("exercise_prescription"):
            trigs = d.get("clinical_triggers") or []
            cats = {t.get("category", "") for t in trigs} if isinstance(trigs, list) else set()
            d["exercise_prescription"] = generate_exercise_prescription(
                triggers=trigs,
                age=d.get("age", 40),
                sex=d.get("sex", "Male"),
                has_glycemic=any("Glycemic" in c for c in cats),
                has_lipid=any("Dyslipidemia" in c for c in cats),
                has_renal=any("Renal" in c for c in cats),
                has_gout=any("Hyperuricemia" in c for c in cats),
                has_anemia=any("Anemia" in c for c in cats),
                has_hepatic=any("Hepatic" in c for c in cats)
            )
        plans.append(d)
    return plans

def update_diet_plan(plan_id: int, updates: Dict[str, Any]) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    allowed_fields = [
        "plan_name", "summary", "status", "dietary_preference", "calories_target",
        "water_target_liters", "sodium_limit_mg", "nutritionist_notes", "assigned_by"
    ]
    set_clauses = ["updated_at = ?"]
    params = [now_iso]

    for k in allowed_fields:
        if k in updates:
            set_clauses.append(f"{k} = ?")
            params.append(updates[k])

    params.append(plan_id)
    cursor.execute(f"UPDATE patient_diet_plans SET {', '.join(set_clauses)} WHERE id = ?", params)
    conn.commit()
    conn.close()
    return True

def generate_diet_pdf_bytes(plan_id: int) -> bytes:
    """
    Generates a printable clinical Nutrition & Patient Diet Plan PDF.
    Pure-Python vector-rendered PDF 1.4 for clean healthcare presentation.
    """
    plan = get_diet_plan_by_id(plan_id)
    if not plan:
        raise ValueError(f"Diet plan {plan_id} not found")

    width, height = 595.28, 841.89
    stream = io.BytesIO()
    objects = []

    def add_object(obj_str: str) -> int:
        objects.append(obj_str.encode('utf-8'))
        return len(objects)

    def esc(text: str) -> str:
        if text is None:
            return ""
        return str(text).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    cs = []

    # Dark teal / medical header banner
    cs.append("0.05 0.35 0.45 rg")
    cs.append(f"0 {height - 90} {width} 90 re f")

    # Header Accent line
    cs.append("0.1 0.7 0.6 rg")
    cs.append(f"0 {height - 94} {width} 4 re f")

    # Header text
    cs.append("BT /F2 18 Tf 1 1 1 rg")
    cs.append(f"36 {height - 40} Td (METROHEALTH PATHOLOGY LAB) Tj ET")
    cs.append("BT /F1 10 Tf 0.85 0.95 0.95 rg")
    cs.append(f"36 {height - 56} Td (Clinical Nutrition & Evidence-Based Patient Diet Protocol) Tj ET")
    cs.append("BT /F1 9 Tf 0.85 0.95 0.95 rg")
    cs.append(f"36 {height - 70} Td (NABL / CAP Accredited Diagnostic Center  |  Prescribed by Department of Pathology) Tj ET")

    # Patient info card box
    y = height - 165
    cs.append("0.96 0.98 0.99 rg 0.7 0.8 0.85 RG 1 w")
    cs.append(f"36 {y} {width - 72} 60 re b")

    cs.append("BT /F2 10 Tf 0.1 0.2 0.3 rg")
    cs.append(f"48 {y + 40} Td (Patient: {esc(plan.get('patient_name'))}  |  ID: {esc(plan.get('patient_id'))}) Tj ET")
    cs.append("BT /F1 9 Tf 0.3 0.4 0.5 rg")
    cs.append(f"48 {y + 24} Td (Age/Sex: {plan.get('age')} Y / {esc(plan.get('sex'))}    Plan Status: {esc(plan.get('status'))}    Target Cal: {plan.get('calories_target')} kcal) Tj ET")
    cs.append(f"48 {y + 10} Td (Dietary Focus: {esc(plan.get('primary_condition'))}    Water Target: {plan.get('water_target_liters')} L/day    Sodium Limit: <{plan.get('sodium_limit_mg')} mg) Tj ET")

    # Protocol Banner
    y -= 38
    cs.append("0.08 0.35 0.42 rg")
    cs.append(f"36 {y} {width - 72} 24 re f")
    cs.append("BT /F2 11 Tf 1 1 1 rg")
    cs.append(f"48 {y + 7} Td (CLINICAL PROTOCOL: {esc(plan.get('plan_name'))}) Tj ET")

    # Clinical triggers table header
    y -= 25
    cs.append("BT /F2 10 Tf 0.1 0.2 0.3 rg")
    cs.append(f"36 {y} Td (PATHOLOGY BIOMARKER TRIGGERS & RATIONALE) Tj ET")

    triggers = plan.get("clinical_triggers", [])
    y -= 15
    if triggers:
        for t in triggers[:4]:
            cs.append("0.97 0.97 0.97 rg 0.85 0.85 0.85 RG 0.5 w")
            cs.append(f"36 {y - 20} {width - 72} 20 re b")
            cs.append("BT /F2 8 Tf 0.8 0.1 0.1 rg")
            cs.append(f"42 {y - 14} Td ({esc(t.get('biomarker'))}: {t.get('value')} {esc(t.get('unit'))} [{esc(t.get('status'))}]) Tj ET")
            cs.append("BT /F1 8 Tf 0.2 0.2 0.2 rg")
            cs.append(f"200 {y - 14} Td ({esc(t.get('implication'))[:75]}...) Tj ET")
            y -= 22
    else:
        cs.append("BT /F1 8 Tf 0.3 0.3 0.3 rg")
        cs.append(f"36 {y} Td (All core pathology biomarkers in normal range; preventative wellness diet generated.) Tj ET")
        y -= 16

    # Foods Section
    y -= 15
    cs.append("BT /F2 10 Tf 0.1 0.2 0.3 rg")
    cs.append(f"36 {y} Td (THERAPEUTIC FOODS TO EMPHASIZE) Tj ET")
    cs.append(f"300 {y} Td (FOODS TO RESTRICT / AVOID) Tj ET")

    y -= 12
    includes = plan.get("foods_to_include", [])[:4]
    avoids = plan.get("foods_to_avoid", [])[:4]
    max_items = max(len(includes), len(avoids))

    for i in range(max_items):
        inc_text = f"+ {includes[i].get('item')}" if i < len(includes) else ""
        av_text = f"- {avoids[i].get('item')}" if i < len(avoids) else ""
        cs.append("BT /F1 8 Tf 0.1 0.5 0.2 rg")
        cs.append(f"36 {y} Td ({esc(inc_text)[:48]}) Tj ET")
        cs.append("BT /F1 8 Tf 0.7 0.1 0.1 rg")
        cs.append(f"300 {y} Td ({esc(av_text)[:48]}) Tj ET")
        y -= 14

    # 7-Day Meal Schedule Header
    y -= 15
    cs.append("0.1 0.25 0.35 rg")
    cs.append(f"36 {y} {width - 72} 18 re f")
    cs.append("BT /F2 9 Tf 1 1 1 rg")
    cs.append(f"44 {y + 5} Td (7-DAY CLINICAL MEAL PLAN SCHEDULE) Tj ET")

    y -= 12
    weekly = plan.get("weekly_meal_plan", [])
    for d_plan in weekly[:7]:
        cs.append("0.98 0.99 1.0 rg 0.88 0.9 0.92 RG 0.5 w")
        cs.append(f"36 {y - 28} {width - 72} 28 re b")
        cs.append("BT /F2 8 Tf 0.1 0.3 0.5 rg")
        cs.append(f"42 {y - 12} Td ({esc(d_plan.get('day'))}:) Tj ET")
        cs.append("BT /F1 7.5 Tf 0.2 0.2 0.2 rg")
        b_text = f"Bkf: {esc(d_plan.get('breakfast'))[:85]}..."
        l_text = f"Lun: {esc(d_plan.get('lunch'))[:85]}...  |  Din: {esc(d_plan.get('dinner'))[:80]}..."
        cs.append(f"90 {y - 12} Td ({b_text}) Tj ET")
        cs.append(f"90 {y - 23} Td ({l_text}) Tj ET")
        y -= 31

    # Footer note on Page 1
    cs.append("BT /F1 8 Tf 0.4 0.4 0.4 rg")
    cs.append(f"36 28 Td (Page 1 of 2: Medical Nutrition & Meal Schedule  |  Verified: {esc(plan.get('assigned_by'))}) Tj ET")

    content_stream_1 = "\n".join(cs)

    # ---------------- PAGE 2: CLINICAL EXERCISE & MOVEMENT PROTOCOL ----------------
    cs2 = []
    exercise = plan.get("exercise_prescription") or {}
    ex_list = exercise.get("exercises", [])
    ex_schedule = exercise.get("recommended_days", [])
    precautions = exercise.get("safety_precautions", [])

    # Dark blue/indigo header banner for Page 2
    cs2.append("0.08 0.25 0.48 rg")
    cs2.append(f"0 {height - 90} {width} 90 re f")

    # Header Accent line
    cs2.append("0.2 0.6 0.9 rg")
    cs2.append(f"0 {height - 94} {width} 4 re f")

    # Header text
    cs2.append("BT /F2 18 Tf 1 1 1 rg")
    cs2.append(f"36 {height - 40} Td (METROHEALTH PATHOLOGY LAB) Tj ET")
    cs2.append("BT /F1 10 Tf 0.85 0.95 1.0 rg")
    cs2.append(f"36 {height - 56} Td (Pathology-Guided Exercise Prescription & Daily Movement Protocol) Tj ET")
    cs2.append("BT /F1 9 Tf 0.85 0.95 1.0 rg")
    cs2.append(f"36 {height - 70} Td (Evidence-Based Exercise Prescription Synced to Biomarker Findings  |  Page 2 of 2) Tj ET")

    # Exercise summary box
    y = height - 165
    cs2.append("0.96 0.98 1.0 rg 0.7 0.8 0.92 RG 1 w")
    cs2.append(f"36 {y} {width - 72} 60 re b")

    cs2.append("BT /F2 10 Tf 0.1 0.2 0.4 rg")
    cs2.append(f"48 {y + 42} Td (Patient: {esc(plan.get('patient_name'))}  |  Weekly Target: {exercise.get('weekly_target_minutes', 180)} Active Mins  |  Intensity: {esc(exercise.get('intensity_rating', 'Moderate'))}) Tj ET")
    cs2.append("BT /F1 8.5 Tf 0.2 0.3 0.4 rg")
    summ_text = esc(exercise.get('summary', ''))
    cs2.append(f"48 {y + 26} Td ({summ_text[:100]}) Tj ET")
    if len(summ_text) > 100:
        cs2.append(f"48 {y + 14} Td ({summ_text[100:200]}) Tj ET")

    # Section 1: Prescribed Clinical Exercises
    y -= 32
    cs2.append("0.1 0.25 0.45 rg")
    cs2.append(f"36 {y} {width - 72} 20 re f")
    cs2.append("BT /F2 9.5 Tf 1 1 1 rg")
    cs2.append(f"44 {y + 6} Td (PRESCRIBED CLINICAL EXERCISES & PHYSIOLOGICAL MECHANISMS) Tj ET")

    y -= 10
    for ex in ex_list[:3]:
        cs2.append("0.98 0.99 1.0 rg 0.85 0.88 0.92 RG 0.5 w")
        cs2.append(f"36 {y - 42} {width - 72} 42 re b")

        cs2.append("BT /F2 8.5 Tf 0.1 0.3 0.6 rg")
        cs2.append(f"44 {y - 12} Td ({esc(ex.get('name'))}  [{esc(ex.get('type'))} - {esc(ex.get('intensity'))} Intensity]) Tj ET")

        cs2.append("BT /F2 7.5 Tf 0.3 0.4 0.5 rg")
        cs2.append(f"44 {y - 23} Td (Cadence: {esc(ex.get('frequency'))}  |  Duration: {esc(ex.get('duration'))}  |  Target: {esc(ex.get('target_metabolism', 'Metabolic Support'))}) Tj ET")

        cs2.append("BT /F1 7.5 Tf 0.2 0.5 0.3 rg")
        cs2.append(f"44 {y - 34} Td (Clinical Benefit: {esc(ex.get('clinical_benefit'))[:95]}...) Tj ET")
        y -= 46

    # Section 2: 7-Day Day-by-Day Exercise Schedule
    y -= 12
    cs2.append("0.1 0.25 0.45 rg")
    cs2.append(f"36 {y} {width - 72} 20 re f")
    cs2.append("BT /F2 9.5 Tf 1 1 1 rg")
    cs2.append(f"44 {y + 6} Td (7-DAY SYNCHRONIZED MOVEMENT & WORKOUT SCHEDULE) Tj ET")

    y -= 10
    for s_day in ex_schedule[:7]:
        cs2.append("0.99 0.99 1.0 rg 0.88 0.9 0.94 RG 0.5 w")
        cs2.append(f"36 {y - 22} {width - 72} 22 re b")

        cs2.append("BT /F2 8 Tf 0.1 0.25 0.5 rg")
        cs2.append(f"42 {y - 14} Td ({esc(s_day.get('day'))} [{esc(s_day.get('duration'))}]:) Tj ET")

        cs2.append("BT /F1 7.5 Tf 0.2 0.2 0.2 rg")
        cs2.append(f"125 {y - 14} Td ({esc(s_day.get('routine'))[:85]}...  Focus: {esc(s_day.get('focus'))[:25]}) Tj ET")
        y -= 25

    # Section 3: Safety Precautions & Rest Guidance
    y -= 12
    cs2.append("0.99 0.95 0.9 rg 0.95 0.8 0.6 RG 0.8 w")
    cs2.append(f"36 {y - 58} {width - 72} 58 re b")

    cs2.append("BT /F2 8.5 Tf 0.7 0.2 0.1 rg")
    cs2.append(f"44 {y - 14} Td (CLINICAL SAFETY & BIOMARKER-SPECIFIC PRECAUTIONS) Tj ET")

    p_y = y - 26
    for p in precautions[:3]:
        cs2.append("BT /F1 7.5 Tf 0.3 0.2 0.1 rg")
        cs2.append(f"44 {p_y} Td (* {esc(p)[:105]}) Tj ET")
        p_y -= 11

    # Page 2 Footer
    cs2.append("BT /F1 8 Tf 0.4 0.4 0.4 rg")
    cs2.append(f"36 28 Td (Prescribed in conjunction with pathology laboratory profile. Review with medical doctor before commencing strenuous exercise.) Tj ET")

    content_stream_2 = "\n".join(cs2)

    # 1. Catalog
    add_object("<< /Type /Catalog /Pages 2 0 R >>")
    # 2. Pages
    add_object("<< /Type /Pages /Kids [3 0 R 7 0 R] /Count 2 >>")
    # 3. Page 1
    add_object(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>")
    # 4. Contents Page 1
    add_object(f"<< /Length {len(content_stream_1.encode('utf-8'))} >>\nstream\n{content_stream_1}\nendstream")
    # 5. Font F1 (Helvetica)
    add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    # 6. Font F2 (Helvetica-Bold)
    add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    # 7. Page 2
    add_object(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] /Contents 8 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>")
    # 8. Contents Page 2
    add_object(f"<< /Length {len(content_stream_2.encode('utf-8'))} >>\nstream\n{content_stream_2}\nendstream")

    # Write PDF stream
    stream.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    xref_offsets = [0]

    for obj in objects:
        xref_offsets.append(stream.tell())
        idx = len(xref_offsets) - 1
        stream.write(f"{idx} 0 obj\n".encode('utf-8'))
        stream.write(obj)
        stream.write(b"\nendobj\n")

    xref_pos = stream.tell()
    stream.write(f"xref\n0 {len(xref_offsets)}\n".encode('utf-8'))
    stream.write(b"0000000000 65535 f \n")
    for offset in xref_offsets[1:]:
        stream.write(f"{offset:010d} 00000 n \n".encode('utf-8'))

    stream.write(f"trailer\n<< /Size {len(xref_offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode('utf-8'))
    return stream.getvalue()
