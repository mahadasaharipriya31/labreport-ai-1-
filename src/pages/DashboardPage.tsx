import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Users,
  FileSpreadsheet,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Eye,
  Download,
  Sliders,
  ShieldCheck,
  Zap,
  Salad,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CriticalAlertCard } from '../components/CriticalAlertCard';
import { StatusTrendChart } from '../components/StatusTrendChart';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageId } from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface DashboardPageProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  onNavigate: (page: PageId) => void;
  onSelectReport: (reportId: string) => void;
  onLoadSampleData: () => void;
  isLoadingSample?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  isLoading,
  onNavigate,
  onSelectReport,
  onLoadSampleData,
  isLoadingSample = false,
}) => {
  const { t } = useLanguage();
  const totalTests =
    (stats?.normal_results || 0) +
    (stats?.abnormal_results || 0) +
    (stats?.critical_results || 0);

  const normalPct = totalTests > 0 ? Math.round(((stats?.normal_results || 0) / totalTests) * 100) : 0;
  const lowPct = totalTests > 0 ? Math.round(((stats?.low_results || 0) / totalTests) * 100) : 0;
  const highPct = totalTests > 0 ? Math.round(((stats?.high_results || 0) / totalTests) * 100) : 0;
  const critPct = totalTests > 0 ? Math.round(((stats?.critical_results || 0) / totalTests) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pathology Analyser Automation Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            {t('dash.title')}
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 font-medium mt-1">
            {t('dash.tagline')}
          </p>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            {t('dash.description')}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t('action.upload_csv')}</span>
            </button>

            <button
              onClick={onLoadSampleData}
              disabled={isLoadingSample}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isLoadingSample ? '...' : t('nav.try_sample')}</span>
            </button>

            <button
              onClick={() => onNavigate('diet-plans')}
              className="px-3.5 py-2.5 bg-teal-600/30 hover:bg-teal-600/40 text-teal-200 border border-teal-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Salad className="w-3.5 h-3.5 text-teal-300" />
              <span>{t('dash.diet_plans_btn')}</span>
            </button>

            <button
              onClick={() => onNavigate('reference-ranges')}
              className="px-3.5 py-2.5 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('nav.reference_ranges')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature Highlights on Hero */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>Reference-Aware</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Dynamic matching tailored by patient age brackets and biological sex.
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Automatic Detection</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Instant classification of NORMAL, LOW, HIGH, and urgent CRITICAL findings.
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Professional Reports</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Publication-ready vector PDF exports with electronic sign-off format.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Alert Callout if critical results exist */}
      {stats && stats.recent_criticals && stats.recent_criticals.length > 0 && (
        <CriticalAlertCard
          criticalItems={stats.recent_criticals}
          onViewReport={onSelectReport}
        />
      )}

      {/* 6 Key Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Reports */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{t('dash.total_reports')}</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total_reports ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Generated cases</div>
        </div>

        {/* 2. Normal Results */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{t('dash.normal_results')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats?.normal_results ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Within standard range</div>
        </div>

        {/* 3. Abnormal Results */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{t('dash.abnormal_results')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.abnormal_results ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Low / High alerts</div>
        </div>

        {/* 4. Critical Results */}
        <div className="bg-white rounded-xl p-4 border border-rose-200/90 shadow-xs hover:border-rose-300 transition-all bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold">{t('dash.critical_results')}</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats?.critical_results ?? 0}</div>
          <div className="text-[11px] text-rose-500/80 mt-1 font-semibold">Urgent review</div>
        </div>

        {/* 5. Patients Processed */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{t('dash.patients_processed')}</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total_patients ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Distinct patient records</div>
        </div>

        {/* 6. CSV Files Processed */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{t('dash.csv_processed')}</span>
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total_csvs ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Analyser file batches</div>
        </div>
      </div>

      {/* 30-Day Trend Chart: Normal vs. Abnormal vs. Critical */}
      <StatusTrendChart
        data={stats?.status_trend_30d}
        onLoadSampleData={onLoadSampleData}
        isLoadingSample={isLoadingSample}
      />

      {/* Visual Result Distribution Breakdown */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Analyte Classification Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution of evaluated clinical parameters</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            Total Analytes: {totalTests}
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${normalPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Normal: ${stats?.normal_results || 0} (${normalPct}%)`}
          />
          <div
            style={{ width: `${lowPct}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Low: ${stats?.low_results || 0} (${lowPct}%)`}
          />
          <div
            style={{ width: `${highPct}%` }}
            className="bg-orange-500 h-full transition-all duration-500"
            title={`High: ${stats?.high_results || 0} (${highPct}%)`}
          />
          <div
            style={{ width: `${critPct}%` }}
            className="bg-rose-600 h-full transition-all duration-500"
            title={`Critical: ${stats?.critical_results || 0} (${critPct}%)`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-medium">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <div className="font-bold text-slate-800">Normal</div>
              <div className="text-slate-500">{stats?.normal_results ?? 0} ({normalPct}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-800">Low</div>
              <div className="text-slate-500">{stats?.low_results ?? 0} ({lowPct}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/60 border border-orange-100">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
            <div>
              <div className="font-bold text-slate-800">High</div>
              <div className="text-slate-500">{stats?.high_results ?? 0} ({highPct}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 border border-rose-100">
            <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
            <div>
              <div className="font-bold text-rose-900">Critical</div>
              <div className="text-rose-700">{stats?.critical_results ?? 0} ({critPct}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('dash.recent_reports')}</h3>
            <p className="text-xs text-slate-500">Processed pathology reports with clinical flags</p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{t('col.action')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{t('col.patient_id')}</th>
                <th className="py-3 px-4">{t('col.patient_name')}</th>
                <th className="py-3 px-3">{t('col.age_sex')}</th>
                <th className="py-3 px-4">{t('col.report_date')}</th>
                <th className="py-3 px-3 text-center">{t('col.tests')}</th>
                <th className="py-3 px-3 text-center">{t('col.abnormal')}</th>
                <th className="py-3 px-3 text-center">{t('col.critical')}</th>
                <th className="py-3 px-3">{t('col.status')}</th>
                <th className="py-3 px-4 text-right">{t('col.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recent_reports && stats.recent_reports.length > 0 ? (
                stats.recent_reports.map((rep) => (
                  <tr key={rep.report_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                      {rep.patient_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rep.patient_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {rep.age}y • {rep.sex}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {rep.report_date}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">
                      {rep.total_tests}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {rep.abnormal_count > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {rep.abnormal_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {rep.critical_count > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 ring-1 ring-rose-300 px-2 py-0.5 rounded">
                          {rep.critical_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={rep.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectReport(rep.report_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded font-semibold transition-colors cursor-pointer"
                        title="View Report Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <a
                        href={api.getReportPdfUrl(rep.report_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <p className="font-medium">No reports generated yet.</p>
                    <button
                      onClick={onLoadSampleData}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Click here to load demo analyzer data
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Required Clinical Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
