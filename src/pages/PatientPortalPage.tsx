import React, { useState, useEffect } from 'react';
import {
  User,
  Activity,
  FileText,
  Calendar,
  Apple,
  Dumbbell,
  Download,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Droplets,
  Flame,
  ShieldCheck,
  Stethoscope,
  Phone,
  Mail,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  LogOut,
  Sliders,
  Gauge,
  Timer,
  Zap,
} from 'lucide-react';
import { useAuth, DEMO_PATIENTS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { ReportSummary, ReportDetail, PatientDietPlan, DailyMealPlan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { LanguageSelector } from '../components/LanguageSelector';

interface PatientPortalPageProps {
  onSwitchToDoctor?: () => void;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ onSwitchToDoctor }) => {
  const { user, logout, switchRole } = useAuth();
  const { t } = useLanguage();

  const patientId = user?.patientId || 'P001';
  const demoProfile = DEMO_PATIENTS.find((p) => p.id === patientId) || DEMO_PATIENTS[0];

  const [activeTab, setActiveTab] = useState<'reports' | 'diet' | 'exercise' | 'trends' | 'profile'>('reports');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<ReportDetail | null>(null);
  const [dietPlan, setDietPlan] = useState<PatientDietPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Load Patient Reports and Diet Plan
  useEffect(() => {
    let isMounted = true;

    async function loadPatientData() {
      setIsLoading(true);
      try {
        // Fetch all reports matching patient ID
        const reportsRes = await api.getReports({ search: patientId });
        if (isMounted && reportsRes.reports) {
          setReports(reportsRes.reports);
          if (reportsRes.reports.length > 0) {
            const firstReportId = reportsRes.reports[0].report_id;
            setSelectedReportId(firstReportId);
            const detail = await api.getReport(firstReportId);
            if (isMounted) setReportDetail(detail);
          }
        }

        // Fetch Diet Plan for Patient
        try {
          const diet = await api.getDietPlanByPatient(patientId);
          if (isMounted && diet) {
            setDietPlan(diet);
          }
        } catch (e) {
          console.log('No existing diet plan found for patient', e);
        }
      } catch (err) {
        console.error('Failed to load patient portal data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPatientData();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Load specific report detail when selected
  const handleSelectReport = async (repId: string) => {
    setSelectedReportId(repId);
    try {
      const detail = await api.getReport(repId);
      setReportDetail(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedReportId) return;
    setIsDownloadingPdf(true);
    const link = document.createElement('a');
    link.href = api.getReportPdfUrl(selectedReportId);
    link.target = '_blank';
    link.download = `LabReport_${selectedReportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingPdf(false), 1000);
  };

  const handleDownloadDietPdf = () => {
    if (!dietPlan?.id) return;
    const link = document.createElement('a');
    link.href = api.getDietPlanPdfUrl(dietPlan.id);
    link.target = '_blank';
    link.download = `DietPlan_${patientId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentMealPlan: DailyMealPlan | undefined = dietPlan?.weekly_meal_plan?.[selectedDayIndex];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-teal-600 selection:text-white">
      {/* Top Patient Portal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  {t('portal.title')}
                </span>
                <span className="text-[11px] bg-teal-50 text-teal-700 font-extrabold px-2 py-0.5 rounded-full border border-teal-200">
                  {t('portal.patient_id')}: {patientId}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('portal.tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSelector variant="full" />
            {onSwitchToDoctor && (
              <button
                onClick={onSwitchToDoctor}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-300"
                title="Switch back to Doctor & Laboratory Staff View"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('portal.doctor_portal')}</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.initials || 'PT'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.name || demoProfile.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {user?.sex || demoProfile.sex}, {user?.age || demoProfile.age} yrs
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title={t('portal.sign_out')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Welcome & Patient Demographics Hero Card */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('portal.active_profile')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('portal.welcome')} {user?.name || demoProfile.name}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t('portal.primary_condition')}{' '}
                <span className="font-bold text-teal-300">
                  {dietPlan?.primary_condition || demoProfile.primaryCondition}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <span>{t('portal.attending_doctor')} <strong>{demoProfile.assignedDoctor}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>MetroHealth Central Diagnostic Wing</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{t('portal.latest_specimen')} {demoProfile.lastReportDate}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions / Download CTA */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              {selectedReportId && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : t('portal.download_report')}</span>
                </button>
              )}
              {dietPlan && (
                <button
                  onClick={handleDownloadDietPdf}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Apple className="w-4 h-4 text-teal-300" />
                  <span>{t('portal.download_diet')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vital Health Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>{t('portal.daily_calories')}</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {dietPlan?.calories_target || 1850} <span className="text-xs font-normal text-slate-500">kcal/day</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{t('portal.metabolic_target')}</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>{t('portal.hydration')}</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {dietPlan?.water_target_liters || 2.8} <span className="text-xs font-normal text-slate-500">L/day</span>
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5 font-medium">{t('portal.water_glasses')}</div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>{t('portal.exercise_goal')}</span>
              <Dumbbell className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-teal-900 mt-1.5">
              {dietPlan?.exercise_prescription?.weekly_target_minutes || 180}{' '}
              <span className="text-xs font-normal text-slate-500">min/wk</span>
            </div>
            <div className="text-[11px] text-teal-700 mt-0.5 font-semibold">
              {dietPlan?.exercise_prescription?.intensity_rating || 'Moderate Intensity'}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>{t('portal.sodium_ceiling')}</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              &lt; {dietPlan?.sodium_limit_mg || 2000} <span className="text-xs font-normal text-slate-500">mg</span>
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5 font-medium">{t('portal.dash_limit')}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 sm:px-6 flex flex-wrap items-center gap-4 text-xs font-bold bg-slate-50/70">
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'border-teal-600 text-teal-800 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t('portal.tab_reports')}</span>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {reports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('diet')}
              className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'diet'
                  ? 'border-teal-600 text-teal-800 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>{t('portal.tab_diet')}</span>
            </button>

            <button
              onClick={() => setActiveTab('exercise')}
              className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'exercise'
                  ? 'border-teal-600 text-teal-800 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Dumbbell className="w-4 h-4 text-blue-600" />
              <span>{t('portal.tab_exercise')}</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {dietPlan?.exercise_prescription?.weekly_target_minutes || 180}m
              </span>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'trends'
                  ? 'border-teal-600 text-teal-800 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>{t('portal.tab_trends')}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-teal-600 text-teal-800 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>{t('portal.tab_profile')}</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="p-6">
            {/* 1. Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                {/* Available Reports Selector */}
                {reports.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 mr-2">{t('portal.select_record')}</span>
                    {reports.map((r) => (
                      <button
                        key={r.report_id}
                        onClick={() => handleSelectReport(r.report_id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selectedReportId === r.report_id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {r.report_id} ({r.report_date})
                      </button>
                    ))}
                  </div>
                )}

                {isLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-2" />
                    <p className="text-xs font-medium">{t('portal.loading_records')}</p>
                  </div>
                ) : reportDetail ? (
                  <div className="space-y-6">
                    {/* Report Header Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-extrabold text-base text-slate-900">
                            Laboratory Report #{reportDetail.report_id}
                          </h3>
                          <StatusBadge status={reportDetail.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Collection Date: <strong>{reportDetail.report_date}</strong> • Total Analytes Tested:{' '}
                          <strong>{reportDetail.total_tests}</strong> ({reportDetail.normal_count} Normal,{' '}
                          {reportDetail.abnormal_count} Abnormal, {reportDetail.critical_count} Critical)
                        </p>
                      </div>

                      <button
                        onClick={handleDownloadPdf}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>

                    {/* Pathology Test Items Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                        <span className="text-xs font-extrabold tracking-wider uppercase flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal-400" />
                          <span>Analyte Diagnostic Breakdown</span>
                        </span>
                        <span className="text-[11px] text-slate-400">SI-Unit Normalized</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="py-3 px-4">Test / Biomarker</th>
                              <th className="py-3 px-4">Patient Result</th>
                              <th className="py-3 px-4">Normal Reference Range</th>
                              <th className="py-3 px-4">Status & Flag</th>
                              <th className="py-3 px-4">Analyzer</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportDetail.items?.map((item, idx) => (
                              <tr
                                key={idx}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                  item.status.includes('CRITICAL')
                                    ? 'bg-rose-50/40 font-semibold'
                                    : item.status !== 'NORMAL'
                                    ? 'bg-amber-50/30'
                                    : ''
                                }`}
                              >
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {item.test_name}
                                </td>
                                <td className="py-3 px-4 font-extrabold text-slate-900">
                                  {item.normalized_result || item.raw_result}{' '}
                                  <span className="font-normal text-slate-500">
                                    {item.normalized_unit || item.raw_unit}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {item.lower_range !== null && item.upper_range !== null
                                    ? `${item.lower_range} - ${item.upper_range} ${item.normalized_unit}`
                                    : 'Clinical Normal Cohort'}
                                </td>
                                <td className="py-3 px-4">
                                  <StatusBadge status={item.status} size="sm" />
                                </td>
                                <td className="py-3 px-4 text-slate-400 text-[11px]">
                                  {item.analyzer || 'Automated Analyser'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Attending Physician Impressions */}
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
                      <Stethoscope className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                          Attending Physician & Pathologist Verification
                        </h4>
                        <p className="text-xs text-teal-900 leading-relaxed">
                          Laboratory values have been reviewed by Dr. Sarah Jenkins, MD and Dr. Michael Chang, MD.
                          Follow personalized dietary and physical activity protocols below. Schedule a follow-up test in 6–8 weeks for abnormal markers.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {t('portal.no_reports')} {patientId}.
                  </div>
                )}
              </div>
            )}

            {/* 2. Diet Plan Tab */}
            {activeTab === 'diet' && dietPlan && (
              <div className="space-y-6">
                {/* Diet Summary Banner */}
                <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] bg-teal-500/20 text-teal-300 font-extrabold px-2 py-0.5 rounded-full border border-teal-400/30 uppercase">
                      Clinical Nutrition Plan
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{dietPlan.plan_name}</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">{dietPlan.summary}</p>
                  </div>
                  <button
                    onClick={handleDownloadDietPdf}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Diet Plan PDF</span>
                  </button>
                </div>

                {/* Day selector pills */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                    Select Day of the Week:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {dietPlan.weekly_meal_plan?.map((dayPlan, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedDayIndex === idx
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dayPlan.day}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Meal Schedule Card */}
                {currentMealPlan && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-teal-50 border-b border-teal-200 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-teal-950 uppercase tracking-wider">
                        {currentMealPlan.day} Daily Nutritional Schedule
                      </span>
                      <span className="text-[11px] text-teal-800 font-semibold">
                        Target: {dietPlan.calories_target} kcal
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 hover:bg-slate-50/50">
                        <span className="w-32 text-xs font-bold text-amber-700 shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Breakfast (8:00 AM)
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {currentMealPlan.breakfast}
                        </p>
                      </div>

                      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 hover:bg-slate-50/50">
                        <span className="w-32 text-xs font-bold text-teal-700 shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          Mid-Morning
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {currentMealPlan.mid_morning}
                        </p>
                      </div>

                      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 hover:bg-slate-50/50">
                        <span className="w-32 text-xs font-bold text-emerald-700 shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Lunch (1:00 PM)
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {currentMealPlan.lunch}
                        </p>
                      </div>

                      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 hover:bg-slate-50/50">
                        <span className="w-32 text-xs font-bold text-indigo-700 shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          Afternoon Snack
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {currentMealPlan.afternoon_snack}
                        </p>
                      </div>

                      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 hover:bg-slate-50/50">
                        <span className="w-32 text-xs font-bold text-purple-700 shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          Dinner (7:30 PM)
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {currentMealPlan.dinner}
                        </p>
                      </div>

                      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 hover:bg-slate-50/50">
                        <span className="w-32 text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Bedtime
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {currentMealPlan.bedtime}
                        </p>
                      </div>
                    </div>

                    {currentMealPlan.hydration_note && (
                      <div className="p-3 bg-blue-50/80 border-t border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{currentMealPlan.hydration_note}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Foods to Include & Foods to Avoid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Therapeutic Foods to Prioritize</span>
                    </div>
                    <div className="p-4 divide-y divide-slate-100">
                      {dietPlan.foods_to_include?.slice(0, 5).map((f, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="font-bold text-slate-900 text-xs">{f.item}</div>
                          <div className="text-[11px] text-emerald-800 mt-0.5">{f.clinical_benefit}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Foods to Restrict / Avoid</span>
                    </div>
                    <div className="p-4 divide-y divide-slate-100">
                      {dietPlan.foods_to_avoid?.slice(0, 5).map((f, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="font-bold text-slate-900 text-xs">{f.item}</div>
                          <div className="text-[11px] text-rose-800 mt-0.5">{f.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Exercise Tab */}
            {activeTab === 'exercise' && dietPlan?.exercise_prescription && (
              <div className="space-y-6">
                {/* Exercise Prescription Header */}
                <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] bg-blue-500/20 text-blue-300 font-extrabold px-2 py-0.5 rounded-full border border-blue-400/30 uppercase">
                      Physician-Prescribed Movement Protocol
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">
                      Weekly Goal: {dietPlan.exercise_prescription.weekly_target_minutes} Active Minutes
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      {dietPlan.exercise_prescription.summary}
                    </p>
                  </div>
                  <div className="bg-blue-950/80 border border-blue-400/30 px-4 py-2.5 rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-300">Prescribed Intensity</div>
                    <div className="text-sm font-black text-white mt-0.5">
                      {dietPlan.exercise_prescription.intensity_rating}
                    </div>
                  </div>
                </div>

                {/* Specific Exercise Cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-blue-600" />
                    <span>Prescribed Exercise Modalities</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dietPlan.exercise_prescription.exercises?.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{ex.name}</h5>
                          <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                            {ex.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{ex.frequency}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{ex.duration}</span>
                          <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-semibold">
                            {ex.intensity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                          <span className="font-bold text-slate-700">Health Benefit: </span>
                          {ex.clinical_benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Movement Schedule */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>7-Day Movement Schedule</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                    {dietPlan.exercise_prescription.recommended_days?.map((sDay, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="font-extrabold text-xs text-slate-900">{sDay.day}</span>
                            <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                              {sDay.duration}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-2 font-medium leading-snug">
                            {sDay.routine}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold truncate">
                          Focus: {sDay.focus}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety & Precautions */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Safety Precautions & Medical Warnings</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-900/90 pl-1">
                    {dietPlan.exercise_prescription.safety_precautions?.map((prec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 4. Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Biomarker Longitudinal Trends</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualizing your analyte stability and progress across diagnostic checkpoints
                    </p>
                  </div>
                  <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-1 rounded-full">
                    {reports.length} Recorded Tests
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Fasting Blood Glucose</span>
                      <span className="text-xs font-extrabold text-teal-600">Stable</span>
                    </div>
                    <div className="h-32 flex items-end gap-3 pt-4 px-2 border-b border-slate-100">
                      <div className="flex-1 bg-teal-100 rounded-t-md h-[60%] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-900">
                          112 mg/dL
                        </div>
                      </div>
                      <div className="flex-1 bg-teal-200 rounded-t-md h-[75%] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-900">
                          138 mg/dL
                        </div>
                      </div>
                      <div className="flex-1 bg-teal-600 rounded-t-md h-[55%] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-slate-900 px-1 rounded">
                          104 mg/dL
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>2 Months Ago</span>
                      <span>1 Month Ago</span>
                      <span>Current Specimen</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Total Serum Cholesterol</span>
                      <span className="text-xs font-extrabold text-emerald-600">Improving (-18%)</span>
                    </div>
                    <div className="h-32 flex items-end gap-3 pt-4 px-2 border-b border-slate-100">
                      <div className="flex-1 bg-amber-100 rounded-t-md h-[85%] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-900">
                          248 mg/dL
                        </div>
                      </div>
                      <div className="flex-1 bg-amber-200 rounded-t-md h-[70%] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-900">
                          220 mg/dL
                        </div>
                      </div>
                      <div className="flex-1 bg-emerald-600 rounded-t-md h-[50%] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-slate-900 px-1 rounded">
                          188 mg/dL
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>2 Months Ago</span>
                      <span>1 Month Ago</span>
                      <span>Current Specimen</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                    Patient Demographics & Medical Identification
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Full Name:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{user?.name || demoProfile.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Patient Identifier (MRN):</span>
                      <p className="font-mono font-bold text-teal-700 mt-0.5">{patientId}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Age & Biological Sex:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {user?.age || demoProfile.age} Years • {user?.sex || demoProfile.sex}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Registered Email:</span>
                      <p className="font-mono text-slate-800 mt-0.5">{user?.email || demoProfile.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contact Telephone:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{user?.phone || demoProfile.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Primary Hospital Facility:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{user?.facility || 'MetroHealth Memorial Clinic'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">Assigned Medical Care Team</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      DR
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{demoProfile.assignedDoctor}</div>
                      <div className="text-[11px] text-slate-500">
                        MetroHealth Central Pathology & Internal Medicine
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        <DisclaimerBanner compact />
        <div className="mt-2 text-[11px]">
          MetroHealth Patient Portal • Powered by LabReport AI • Protected under HIPAA & HITECH
        </div>
      </footer>
    </div>
  );
};
