import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ReportSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface ReportsPageProps {
  onSelectReport: (reportId: string) => void;
  onLoadSampleData: () => void;
  isLoadingSample?: boolean;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  onSelectReport,
  onLoadSampleData,
  isLoadingSample = false,
}) => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReports({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      setReports(res.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pathology Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Diagnostic reports generated with automated age & sex reference intervals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadSampleData}
            disabled={isLoadingSample}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isLoadingSample ? 'Processing...' : 'Load Sample Reports'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          {[
            { id: 'ALL', label: 'All Reports' },
            { id: 'NORMAL', label: 'Normal' },
            { id: 'ABNORMAL', label: 'Abnormal' },
            { id: 'CRITICAL', label: 'Critical Alert' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Patient Name, PID, Report ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Report ID</th>
                <th className="py-3.5 px-4">{t('col.patient_id', 'Patient ID')}</th>
                <th className="py-3.5 px-4">{t('col.patient_name', 'Patient Name')}</th>
                <th className="py-3.5 px-3">{t('col.age_sex', 'Age / Sex')}</th>
                <th className="py-3.5 px-4">{t('col.report_date', 'Report Date')}</th>
                <th className="py-3.5 px-3 text-center">{t('col.tests', 'Tests')}</th>
                <th className="py-3.5 px-3 text-center">Normal</th>
                <th className="py-3.5 px-3 text-center">{t('col.abnormal', 'Abnormal')}</th>
                <th className="py-3.5 px-3 text-center">{t('col.critical', 'Critical')}</th>
                <th className="py-3.5 px-3">{t('col.status', 'Status')}</th>
                <th className="py-3.5 px-4 text-right">{t('col.action', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading pathology reports...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((rep) => (
                  <tr key={rep.report_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {rep.report_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                      {rep.patient_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {rep.patient_name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {rep.age}y • {rep.sex}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {rep.report_date}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold">
                      {rep.total_tests}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {rep.normal_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {rep.abnormal_count > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {rep.abnormal_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {rep.critical_count > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 ring-1 ring-rose-300 px-2 py-0.5 rounded">
                          {rep.critical_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={rep.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onSelectReport(rep.report_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold transition-colors cursor-pointer"
                        title="View Full Report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <a
                        href={api.getReportPdfUrl(rep.report_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold transition-colors"
                        title="Download PDF Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-sm">No pathology reports matching your criteria.</p>
                    <button
                      onClick={onLoadSampleData}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Click here to populate sample data
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
