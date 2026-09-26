import {
  DashboardStats,
  Patient,
  ReportDetail,
  ReportSummary,
  ReferenceRange,
  AnalyzerMapping,
  CSVValidationResponse,
  PatientDietPlan,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Sample CSV / Data
  async getSampleCSV(): Promise<{ csv: string }> {
    const res = await fetch(`${API_BASE}/sample-csv`);
    if (!res.ok) throw new Error('Failed to fetch sample CSV');
    return res.json();
  },

  async loadSampleData(): Promise<{ success: boolean; message: string; report_ids: string[] }> {
    const res = await fetch(`${API_BASE}/sample-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to load sample data');
    return res.json();
  },

  // CSV Validation & Processing
  async validateCSV(csv_content: string): Promise<CSVValidationResponse> {
    const res = await fetch(`${API_BASE}/upload-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv_content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to validate CSV');
    return data;
  },

  async processCSV(csv_content: string, filename: string = 'analyser_upload.csv'): Promise<{
    success: boolean;
    message: string;
    reports_generated_count: number;
    report_ids: string[];
    stats: any;
  }> {
    const res = await fetch(`${API_BASE}/process-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv_content, filename }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process CSV');
    return data;
  },

  // Patients
  async getPatients(): Promise<{ patients: Patient[] }> {
    const res = await fetch(`${API_BASE}/patients`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    return res.json();
  },

  async getPatient(id: string): Promise<Patient> {
    const res = await fetch(`${API_BASE}/patients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient details');
    return res.json();
  },

  // Reports
  async getReports(params?: { status?: string; search?: string }): Promise<{ reports: ReportSummary[] }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async getReport(reportId: string): Promise<ReportDetail> {
    const res = await fetch(`${API_BASE}/reports/${reportId}`);
    if (!res.ok) throw new Error('Failed to fetch report details');
    return res.json();
  },

  getReportPdfUrl(reportId: string): string {
    return `${API_BASE}/reports/${reportId}/pdf`;
  },

  // Reference Ranges
  async getReferenceRanges(): Promise<{ reference_ranges: ReferenceRange[] }> {
    const res = await fetch(`${API_BASE}/reference-ranges`);
    if (!res.ok) throw new Error('Failed to fetch reference ranges');
    return res.json();
  },

  async createReferenceRange(data: Partial<ReferenceRange>): Promise<{ success: boolean; id: number }> {
    const res = await fetch(`${API_BASE}/reference-ranges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create reference range');
    return res.json();
  },

  async updateReferenceRange(id: number, data: Partial<ReferenceRange>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/reference-ranges/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update reference range');
    return res.json();
  },

  async deleteReferenceRange(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/reference-ranges/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete reference range');
    return res.json();
  },

  // Analyzer Mappings
  async getAnalyzerMappings(): Promise<{ mappings: AnalyzerMapping[] }> {
    const res = await fetch(`${API_BASE}/analyzer-mappings`);
    if (!res.ok) throw new Error('Failed to fetch analyzer mappings');
    return res.json();
  },

  async saveAnalyzerMapping(data: Partial<AnalyzerMapping>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/analyzer-mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save analyzer mapping');
    return res.json();
  },

  async updateAnalyzerMapping(id: number, data: Partial<AnalyzerMapping>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/analyzer-mappings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update analyzer mapping');
    return res.json();
  },

  async deleteAnalyzerMapping(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/analyzer-mappings/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete analyzer mapping');
    return res.json();
  },

  // Diet Plans
  async getDietPlans(): Promise<{ diet_plans: PatientDietPlan[] }> {
    const res = await fetch(`${API_BASE}/diet-plans`);
    if (!res.ok) throw new Error('Failed to fetch patient diet plans');
    return res.json();
  },

  async getDietPlan(planId: number): Promise<PatientDietPlan> {
    const res = await fetch(`${API_BASE}/diet-plans/${planId}`);
    if (!res.ok) throw new Error('Failed to fetch diet plan');
    return res.json();
  },

  async getDietPlanByReport(reportId: string): Promise<PatientDietPlan> {
    const res = await fetch(`${API_BASE}/diet-plans/report/${reportId}`);
    if (!res.ok) throw new Error('Failed to fetch diet plan for report');
    return res.json();
  },

  async getDietPlanByPatient(patientId: string): Promise<PatientDietPlan> {
    const res = await fetch(`${API_BASE}/diet-plans/patient/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch diet plan for patient');
    return res.json();
  },

  async generateDietPlan(payload: {
    patient_id: string;
    patient_name: string;
    age: number;
    sex: string;
    report_id?: string;
    dietary_preference?: string;
    custom_calories?: number;
    nutritionist_notes?: string;
  }): Promise<PatientDietPlan> {
    const res = await fetch(`${API_BASE}/diet-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate diet plan');
    return res.json();
  },

  async updateDietPlan(planId: number, data: Partial<PatientDietPlan>): Promise<{ success: boolean; diet_plan: PatientDietPlan }> {
    const res = await fetch(`${API_BASE}/diet-plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update diet plan');
    return res.json();
  },

  getDietPlanPdfUrl(planId: number): string {
    return `${API_BASE}/diet-plans/${planId}/pdf`;
  },

  // Settings
  async getSettings(): Promise<{ settings: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Record<string, string>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  async resetDatabase(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/reset-db`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  },
};
