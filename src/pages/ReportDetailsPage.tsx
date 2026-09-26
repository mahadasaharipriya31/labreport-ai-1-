import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Printer,
  FileCheck2,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Salad,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ReportDetail, ReportItem, PatientDietPlan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';

interface ReportDetailsPageProps {
  reportId: string;
  onBack: () => void;
  onViewDietPlan?: (patientId?: string) => void;
}

export const ReportDetailsPage: React.FC<ReportDetailsPageProps> = ({
  reportId,
  onBack,
  onViewDietPlan,
}) => {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [dietPlan, setDietPlan] = useState<PatientDietPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDietSection, setShowDietSection] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await api.getReport(reportId);
        setReport(data);

        // Fetch tailored diet plan for this report
        try {
          const plan = await api.getDietPlanByReport(reportId);
          setDietPlan(plan);
        } catch (dietErr) {
          console.warn('Diet plan not yet generated for report:', dietErr);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Generating Laboratory Report View...</p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-800 space-y-3">
        <AlertOctagon className="w-8 h-8 mx-auto text-rose-600" />
        <h3 className="font-bold text-base">Error Loading Report</h3>
        <p className="text-xs">{errorMsg || 'Report not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const labSettings = report.lab_settings || {};
  const labName = labSettings.lab_name || 'MetroHealth Advanced Pathology Laboratory';
  const labTagline = labSettings.lab_tagline || 'NABL & CAP Accredited Diagnostic Center';
  const labAddress = labSettings.lab_address || '452 Medical Science Square, CA 94103';
  const labPhone = labSettings.lab_phone || '+1 (800) 555-LABS';
  const labDirector = labSettings.lab_director || 'Dr. Sarah Jenkins, MD, FACP (Chief Pathologist)';

  const pdfUrl = api.getReportPdfUrl(report.report_id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Bar (Not visible on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </button>

        <div className="flex items-center gap-2">
          {onViewDietPlan && (
            <button
              onClick={() => onViewDietPlan(report.patient_id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 border border-teal-300 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Salad className="w-4 h-4 text-teal-600" />
              <span>Patient Diet Plan</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Printable Clinical Report Paper */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-10 print:border-none print:shadow-none print:p-0">
        {/* Laboratory Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-blue-900 tracking-tight">
                  LABREPORT AI
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Pathology Laboratory
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-800 mt-1">{labName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{labTagline} • {labAddress}</p>
              <p className="text-xs text-slate-500">Tel: {labPhone}</p>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Lab Examination Report
              </div>
              <div className="text-sm font-mono font-extrabold text-blue-700 mt-1">
                {report.report_id}
              </div>
              <div className="mt-1">
                <StatusBadge status={report.status} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Patient Demographics Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Patient Name</span>
              <span className="font-extrabold text-slate-900 text-sm">{report.patient_name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Patient ID</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{report.patient_id}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Age / Sex</span>
              <span className="font-bold text-slate-800 text-sm">{report.age} Years / {report.sex}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Collection Date</span>
              <span className="font-bold text-slate-800 text-sm">{report.report_date}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>Reporting Instrument(s): <strong>{report.analyzer_name}</strong></span>
            <span>Total Evaluated Analytes: <strong>{report.total_tests}</strong></span>
          </div>
        </div>

        {/* Dedicated Critical Alert Box if critical findings exist */}
        {report.critical_items && report.critical_items.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-rose-950 uppercase tracking-wide">
                    CRITICAL LABORATORY ALERT DETECTED
                  </h4>
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                    Immediate Action Required
                  </span>
                </div>
                <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                  Laboratory alert: This result meets the configured critical threshold. Follow applicable laboratory review and notification procedures.
                </p>

                <div className="mt-3 space-y-1.5">
                  {report.critical_items.map((ci) => (
                    <div
                      key={ci.id}
                      className="bg-white border border-rose-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{ci.test_name}:</span>{' '}
                        <span className="text-rose-700 font-extrabold text-sm">
                          {ci.normalized_result} {ci.normalized_unit}
                        </span>
                        <span className="text-slate-500 ml-2">
                          (Ref: {ci.lower_range ?? '—'} – {ci.upper_range ?? '—'} {ci.normalized_unit})
                        </span>
                      </div>
                      <StatusBadge status={ci.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4 text-right">Result</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {report.items.map((item, idx) => {
                const isCrit = item.status.includes('CRITICAL');
                const isAbnormal = ['LOW', 'HIGH'].includes(item.status);

                let rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                if (isCrit) rowBg = 'bg-rose-50/40';

                const refDisplay =
                  item.lower_range !== null && item.upper_range !== null
                    ? `${item.lower_range} – ${item.upper_range}`
                    : item.lower_range !== null
                    ? `> ${item.lower_range}`
                    : item.upper_range !== null
                    ? `< ${item.upper_range}`
                    : 'Not Configured';

                return (
                  <tr key={item.id || idx} className={`${rowBg} hover:bg-blue-50/40 transition-colors`}>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.test_name}</div>
                      {item.analyzer && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Inst: {item.analyzer}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={isCrit ? 'text-rose-600' : isAbnormal ? 'text-amber-700' : 'text-slate-900'}>
                        {item.normalized_result}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {item.normalized_unit}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <div>{refDisplay} <span className="text-[10px] text-slate-400">{item.normalized_unit}</span></div>
                      <div className="text-[10px] text-slate-400">
                        Criteria: {report.sex} • {report.age}y
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Unit Normalization Audit Trail if any conversions occurred */}
        {report.items.some((i) => i.conversion_applied && !i.conversion_applied.includes('None')) && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
            <h5 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Unit Normalization & Standardization Audit</span>
            </h5>
            <div className="space-y-1 mt-1 text-[11px]">
              {report.items
                .filter((i) => i.conversion_applied && !i.conversion_applied.includes('None'))
                .map((i, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{i.test_name}:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-800">
                      {i.conversion_applied}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Clinical Nutrition & Diet Protocol Section */}
        {dietPlan && (
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-5 mb-6 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-200/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Salad className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>Clinical Nutrition & Diet Protocol</span>
                    <span className="text-[10px] bg-teal-200/60 text-teal-900 font-bold px-1.5 py-0.2 rounded">
                      Tailored to Analytes
                    </span>
                  </div>
                  <div className="text-[11px] text-teal-800 font-medium">
                    {dietPlan.plan_name} • {dietPlan.calories_target} kcal/day target
                  </div>
                </div>
              </div>

              {onViewDietPlan && (
                <button
                  onClick={() => onViewDietPlan(report.patient_id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Open Full 7-Day Meal Schedule</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-slate-600 text-[11px] mt-2.5 leading-relaxed">
              {dietPlan.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-teal-200/40">
              <div className="bg-white p-3 rounded-lg border border-teal-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Therapeutic Focus Foods:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {dietPlan.foods_to_include?.slice(0, 3).map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{f.item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-teal-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                  Restricted / Avoidance Items:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {dietPlan.foods_to_avoid?.slice(0, 3).map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{f.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Sign-off & Verification Footer */}
        <div className="border-t-2 border-slate-900 pt-6 mt-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-md text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified by Automated Pathology Rule Engine & Lab Supervisor</span>
              </div>
              <p>
                Report generated on {report.created_at || report.report_date}. Reference intervals are validated for clinical diagnostic reporting support.
              </p>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-sm text-slate-700 border-b border-slate-300 pb-1 px-4">
                {labDirector.split('(')[0]}
              </div>
              <div className="text-[11px] font-bold text-slate-800 mt-1">{labDirector}</div>
              <div className="text-[10px] text-slate-400">Electronic Authentication Signature</div>
            </div>
          </div>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
