export type UserRole = 'doctor' | 'pathologist' | 'technologist' | 'compliance' | 'admin' | 'patient';

export interface AuthUser {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  email: string;
  initials: string;
  facility: string;
  licenseNumber: string;
  avatarUrl?: string;
  lastLogin?: string;
  patientId?: string;
  age?: number;
  sex?: string;
  phone?: string;
}

export interface ReferenceRange {
  id?: number;
  test_name: string;
  sex: string; // 'Male' | 'Female' | 'Any'
  min_age: number;
  max_age: number;
  lower_range: number | null;
  upper_range: number | null;
  unit: string;
  critical_low: number | null;
  critical_high: number | null;
  category?: string;
  notes?: string;
  is_active?: number;
}

export interface AnalyzerMapping {
  id?: number;
  analyzer_code: string;
  standard_test_name: string;
  analyzer_name?: string;
  sample_unit?: string;
  notes?: string;
}

export interface Patient {
  id?: number;
  patient_id: string;
  name: string;
  age: number;
  sex: string;
  phone?: string;
  email?: string;
  created_at?: string;
  reports_count?: number;
  latest_report_date?: string;
  patient_status?: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  reports?: ReportSummary[];
}

export interface ReportItem {
  id?: number;
  report_id: string;
  patient_id: string;
  test_name: string;
  raw_result: number;
  raw_unit: string;
  normalized_result: number;
  normalized_unit: string;
  lower_range: number | null;
  upper_range: number | null;
  critical_low: number | null;
  critical_high: number | null;
  status: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL LOW' | 'CRITICAL HIGH' | 'NO_RANGE_CONFIGURED' | 'UNIT_ERROR';
  conversion_applied?: string;
  analyzer?: string;
  notes?: string;
}

export interface ReportSummary {
  id?: number;
  report_id: string;
  patient_id: string;
  patient_name: string;
  age: number;
  sex: string;
  report_date: string;
  analyzer_name: string;
  total_tests: number;
  normal_count: number;
  abnormal_count: number;
  critical_count: number;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  created_at?: string;
}

export interface ReportDetail extends ReportSummary {
  patient: Patient;
  items: ReportItem[];
  critical_items: ReportItem[];
  abnormal_items: ReportItem[];
  lab_settings?: Record<string, string>;
}

export interface StatusTrendItem {
  date: string;
  display_date: string;
  normal: number;
  abnormal: number;
  critical: number;
  total: number;
}

export interface DashboardStats {
  total_reports: number;
  total_patients: number;
  total_csvs: number;
  normal_results: number;
  abnormal_results: number;
  critical_results: number;
  low_results: number;
  high_results: number;
  status_trend_30d?: StatusTrendItem[];
  recent_reports: ReportSummary[];
  recent_criticals: (ReportItem & {
    patient_name: string;
    age: number;
    sex: string;
    report_date: string;
  })[];
}

export interface CSVPreviewRecord {
  row_number: number;
  patient_id: string;
  patient_name: string;
  age: number;
  sex: string;
  raw_test_name: string;
  standard_test_name: string;
  mapping_note?: string;
  raw_result: number;
  raw_unit: string;
  analyzer: string;
  date: string;
  classification: {
    status: string;
    normalized_result: number;
    normalized_unit: string;
    lower_range: number | null;
    upper_range: number | null;
    critical_low: number | null;
    critical_high: number | null;
    conversion_applied?: string;
    is_abnormal: boolean;
    is_critical: boolean;
    alert_message?: string;
    unit_error?: string;
  };
  has_error: boolean;
  error_details: string[];
}

export interface CSVValidationResponse {
  success: boolean;
  error?: string;
  total_records: number;
  total_patients: number;
  detected_analyzers: string[];
  detected_units: string[];
  detected_tests: string[];
  validation_issues_count: number;
  validation_issues: Array<{
    row: number;
    patient_id: string;
    test: string;
    issues: string[];
  }>;
  preview_records: CSVPreviewRecord[];
}

export interface DietClinicalTrigger {
  biomarker: string;
  value: number;
  unit: string;
  status: string;
  category: string;
  severity: 'HIGH' | 'CRITICAL' | 'LOW';
  implication: string;
}

export interface DietFoodItem {
  category?: string;
  item: string;
  portion?: string;
  clinical_benefit?: string;
  reason?: string;
  severity?: string;
}

export interface DailyMealPlan {
  day: string;
  day_number: number;
  breakfast: string;
  mid_morning: string;
  lunch: string;
  afternoon_snack: string;
  dinner: string;
  bedtime: string;
  hydration_note: string;
}

export interface ExerciseItem {
  name: string;
  type: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Moderate' | 'Moderate-High' | 'Low-to-Moderate' | string;
  clinical_benefit: string;
  target_metabolism?: string;
}

export interface ExerciseScheduleDay {
  day: string;
  routine: string;
  duration: string;
  focus: string;
}

export interface ExercisePrescription {
  summary: string;
  weekly_target_minutes: number;
  intensity_rating: string;
  exercises: ExerciseItem[];
  safety_precautions: string[];
  rest_recovery_protocol: string;
  recommended_days: ExerciseScheduleDay[];
}

export interface PatientDietPlan {
  id: number;
  patient_id: string;
  patient_name: string;
  report_id?: string;
  age: number;
  sex: string;
  plan_name: string;
  summary: string;
  status: 'Active' | 'Under Review' | 'Completed' | 'Archived';
  primary_condition: string;
  dietary_preference: string;
  calories_target: number;
  water_target_liters: number;
  sodium_limit_mg: number;
  dietary_tags: string[];
  macronutrients: {
    carbs_pct: number;
    protein_pct: number;
    fat_pct: number;
    fiber_g: number;
  };
  clinical_triggers: DietClinicalTrigger[];
  foods_to_include: DietFoodItem[];
  foods_to_avoid: DietFoodItem[];
  weekly_meal_plan: DailyMealPlan[];
  lifestyle_guidelines: string[];
  exercise_prescription?: ExercisePrescription;
  nutritionist_notes: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}
