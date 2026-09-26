import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-slate-100/90 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            <strong>Laboratory Notice:</strong> Reference ranges are laboratory-configured values intended for reporting support. Not a diagnostic AI.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">LabReport AI v2.4 • Clinical Support Engine</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0 mt-0.5">
        <Info className="w-4 h-4" />
      </div>
      <div>
        <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-0.5">
          Clinical Safety & Intended Use Disclaimer
        </h4>
        <p className="leading-relaxed">
          Reference ranges and critical thresholds are laboratory-configured values intended for reporting support. Results should be reviewed and validated by qualified laboratory or healthcare professionals. This system does not provide medical diagnosis, drug recommendations, or treatment plans.
        </p>
      </div>
    </div>
  );
};
