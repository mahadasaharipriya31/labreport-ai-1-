import React from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert } from 'lucide-react';
import { ReportItem } from '../types';

interface CriticalAlertCardProps {
  criticalItems: (ReportItem & {
    patient_name?: string;
    patient_id?: string;
    age?: number;
    sex?: string;
    report_date?: string;
  })[];
  onViewReport?: (reportId: string) => void;
}

export const CriticalAlertCard: React.FC<CriticalAlertCardProps> = ({
  criticalItems,
  onViewReport,
}) => {
  if (!criticalItems || criticalItems.length === 0) return null;

  return (
    <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg shrink-0 ring-4 ring-rose-50">
          <AlertOctagon className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
              <span>CRITICAL RESULTS DETECTED</span>
              <span className="bg-rose-200/80 text-rose-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {criticalItems.length} Urgent {criticalItems.length === 1 ? 'Action' : 'Actions'}
              </span>
            </h3>
            <div className="flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-md">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Critical Review Protocol Active</span>
            </div>
          </div>

          <p className="text-xs text-rose-800 mt-1">
            Laboratory alert: These results meet or exceed configured critical alert thresholds. Follow applicable laboratory review and clinician notification procedures.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white border border-rose-200 rounded-lg p-3.5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-800">
                      {item.patient_name || `Patient ${item.patient_id}`}
                    </span>
                    {item.report_date && <span>{item.report_date}</span>}
                  </div>
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>{item.test_name}</span>
                    <span className="text-rose-600 font-extrabold text-base">
                      {item.normalized_result} <span className="text-xs font-medium text-slate-500">{item.normalized_unit}</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                    <span>Ref: {item.lower_range ?? '—'} – {item.upper_range ?? '—'}</span>
                    <span className="inline-block font-bold text-[11px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      {item.status}
                    </span>
                  </div>
                </div>

                {onViewReport && item.report_id && (
                  <button
                    onClick={() => onViewReport(item.report_id)}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 text-left underline cursor-pointer"
                  >
                    View Report Details →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
