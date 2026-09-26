"""
Sample CSV Data Provider for Pathology Lab Demonstrations.
Contains diverse multi-patient analyser outputs with normal, abnormal, and critical results,
age/sex variations, and unit variations (mmol/L, µmol/L, g/L, mg/dL).
"""

SAMPLE_CSV_CONTENT = """Patient ID,Patient Name,Age,Sex,Test Name,Result,Unit,Analyzer,Date
P001,Ravi Kumar,45,Male,GLU,145,mg/dL,Cobas-6000,2026-09-23
P001,Ravi Kumar,45,Male,HB,14.2,g/dL,Sysmex-XN,2026-09-23
P001,Ravi Kumar,45,Male,CHOL,248,mg/dL,Cobas-6000,2026-09-23
P001,Ravi Kumar,45,Male,CREAT,1.1,mg/dL,Abbott-Architect,2026-09-23
P001,Ravi Kumar,45,Male,SGPT,38,U/L,Cobas-6000,2026-09-23
P001,Ravi Kumar,45,Male,PLT,220,10^3/uL,Sysmex-XN,2026-09-23
P002,Sita Devi,32,Female,Hemoglobin,8.4,g/dL,Sysmex-XN,2026-09-22
P002,Sita Devi,32,Female,Glucose,92,mg/dL,Cobas-6000,2026-09-22
P002,Sita Devi,32,Female,TSH,6.8,uIU/mL,Siemens-Centaur,2026-09-22
P002,Sita Devi,32,Female,Platelet Count,290,10^3/uL,Sysmex-XN,2026-09-22
P002,Sita Devi,32,Female,Total Bilirubin,0.8,mg/dL,Cobas-6000,2026-09-22
P003,Arthur Pendelton,68,Male,Glucose,365,mg/dL,Cobas-6000,2026-09-20
P003,Arthur Pendelton,68,Male,Serum Potassium,6.8,mmol/L,Radiometer-ABL,2026-09-20
P003,Arthur Pendelton,68,Male,Serum Creatinine,3.6,mg/dL,Abbott-Architect,2026-09-20
P003,Arthur Pendelton,68,Male,Blood Urea Nitrogen,48,mg/dL,Abbott-Architect,2026-09-20
P003,Arthur Pendelton,68,Male,Hemoglobin,10.5,g/dL,Sysmex-XN,2026-09-20
P004,Elena Rostova,24,Female,Glucose,4.8,mmol/L,Cobas-International,2026-09-17
P004,Elena Rostova,24,Female,Hemoglobin,135,g/L,Sysmex-International,2026-09-17
P004,Elena Rostova,24,Female,Total Cholesterol,6.2,mmol/L,Cobas-International,2026-09-17
P004,Elena Rostova,24,Female,ALT,24,U/L,Cobas-6000,2026-09-17
P004,Elena Rostova,24,Female,WBC,6.8,10^3/uL,Sysmex-XN,2026-09-17
P005,Master Aarav Sharma,8,Male,Hemoglobin,12.4,g/dL,Sysmex-XN,2026-09-14
P005,Master Aarav Sharma,8,Male,Creatinine,44,umol/L,Abbott-Architect,2026-09-14
P005,Master Aarav Sharma,8,Male,WBC,14.8,10^3/uL,Sysmex-XN,2026-09-14
P005,Master Aarav Sharma,8,Male,Serum Sodium,139,mmol/L,Radiometer-ABL,2026-09-14
P006,Margaret Lee,74,Female,Serum Potassium,2.5,mmol/L,Radiometer-ABL,2026-09-10
P006,Margaret Lee,74,Female,Hemoglobin,6.5,g/dL,Sysmex-XN,2026-09-10
P006,Margaret Lee,74,Female,Serum Calcium,11.8,mg/dL,Cobas-6000,2026-09-10
P006,Margaret Lee,74,Female,Glucose,95,mg/dL,Cobas-6000,2026-09-10
P007,David Chen,52,Male,Glucose,88,mg/dL,Cobas-6000,2026-09-06
P007,David Chen,52,Male,Hemoglobin,15.1,g/dL,Sysmex-XN,2026-09-06
P007,David Chen,52,Male,Total Cholesterol,180,mg/dL,Cobas-6000,2026-09-06
P007,David Chen,52,Male,Serum Creatinine,0.9,mg/dL,Abbott-Architect,2026-09-06
P008,Hannah Abbott,29,Female,Glucose,98,mg/dL,Cobas-6000,2026-09-01
P008,Hannah Abbott,29,Female,Hemoglobin,13.8,g/dL,Sysmex-XN,2026-09-01
P008,Hannah Abbott,29,Female,Serum Potassium,4.1,mmol/L,Radiometer-ABL,2026-09-01
P008,Hannah Abbott,29,Female,Platelet Count,250,10^3/uL,Sysmex-XN,2026-09-01
P009,Carlos Santana,61,Male,Glucose,210,mg/dL,Cobas-6000,2026-08-28
P009,Carlos Santana,61,Male,HbA1c,8.2,%,Bio-Rad-D10,2026-08-28
P009,Carlos Santana,61,Male,Serum Potassium,5.9,mmol/L,Radiometer-ABL,2026-08-28
P009,Carlos Santana,61,Male,Serum Creatinine,1.8,mg/dL,Abbott-Architect,2026-08-28
"""

def get_sample_csv() -> str:
    return SAMPLE_CSV_CONTENT.strip()
