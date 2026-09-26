import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  Eye,
  FileText,
} from 'lucide-react';
import { CSVValidationResponse, CSVPreviewRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { PageId } from '../components/Sidebar';

interface UploadPageProps {
  onNavigate: (page: PageId) => void;
  onSelectReport: (reportId: string) => void;
  onRefreshStats: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onNavigate,
  onSelectReport,
  onRefreshStats,
}) => {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<CSVValidationResponse | null>(null);
  const [processResult, setProcessResult] = useState<{
    success: boolean;
    message: string;
    reports_generated_count: number;
    report_ids: string[];
    stats?: any;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorMsg('Please select a valid .csv file.');
      return;
    }

    setFileName(file.name);
    setErrorMsg(null);
    setProcessResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      validateCSVData(text);
    };
    reader.readAsText(file);
  };

  const loadSampleCSV = async () => {
    try {
      setIsValidating(true);
      setErrorMsg(null);
      setProcessResult(null);
      const res = await api.getSampleCSV();
      setFileName('sample_analyser_batch.csv');
      setCsvContent(res.csv);
      await validateCSVData(res.csv);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample CSV.');
    } finally {
      setIsValidating(false);
    }
  };

  const validateCSVData = async (text: string) => {
    setIsValidating(true);
    setErrorMsg(null);
    try {
      const valRes = await api.validateCSV(text);
      if (!valRes.success) {
        setErrorMsg(valRes.error || 'Failed to validate CSV format.');
        setValidationResult(null);
      } else {
        setValidationResult(valRes);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during CSV validation.');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleProcessCSV = async () => {
    if (!csvContent) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await api.processCSV(csvContent, fileName || 'upload.csv');
      setProcessResult(res);
      onRefreshStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process CSV records.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('upload.title', 'Upload Analyzer Output')}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {t('upload.subtitle', 'Upload a pathology analyser CSV file to automatically generate patient reports with age/sex reference intervals.')}
        </p>
      </div>

      {/* 6 Step Demo Workflow Tracker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Processing Pipeline Workflow
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { step: 1, label: 'Validate CSV', done: !!validationResult },
            { step: 2, label: 'Preview Data', done: !!validationResult },
            { step: 3, label: 'Process Data', done: !!processResult },
            { step: 4, label: 'Reference Ranges', done: !!processResult },
            { step: 5, label: 'Detect Abnormalities', done: !!processResult },
            { step: 6, label: 'Generate Reports', done: !!processResult },
          ].map((s) => (
            <div
              key={s.step}
              className={`p-2.5 rounded-lg border text-xs transition-all ${
                s.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>Step {s.step}</span>
                {s.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <div className="text-[11px] font-medium leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Drag and Drop Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-white ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50 shadow-inner ring-4 ring-blue-100'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-4 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Drag & Drop your Analyser CSV here
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports Cobas, Sysmex, Abbott, Beckman, Mindray, and standard CSV formats.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Browse CSV File
            </button>

            <button
              onClick={loadSampleCSV}
              disabled={isValidating}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Sample CSV</span>
            </button>
          </div>

          {fileName && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>{fileName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-950">CSV Processing Error</h4>
            <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Processing Success Alert & Direct Report Links */}
      {processResult && processResult.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-950">
                Reports Successfully Generated!
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                {processResult.message}
              </p>

              {processResult.stats && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/80 p-2 rounded border border-emerald-200">
                    <span className="text-slate-500">Patients:</span>{' '}
                    <span className="font-bold text-slate-900">{processResult.stats.total_patients}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-emerald-200">
                    <span className="text-slate-500">Normal:</span>{' '}
                    <span className="font-bold text-emerald-700">{processResult.stats.normal_results}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-emerald-200">
                    <span className="text-slate-500">Abnormal:</span>{' '}
                    <span className="font-bold text-amber-700">{processResult.stats.abnormal_results}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-emerald-200">
                    <span className="text-slate-500">Critical:</span>{' '}
                    <span className="font-bold text-rose-700">{processResult.stats.critical_results}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigate('reports')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>View All Generated Reports</span>
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-3.5 py-2 bg-white text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation & Preview Section */}
      {validationResult && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {/* Summary Header */}
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Validated Analyser Data Preview</h3>
              <p className="text-xs text-slate-500">
                Pre-processed records with automatic alias mapping and age/sex reference previews
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleProcessCSV}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                )}
                <span>{isProcessing ? 'Processing...' : t('action.process_csv', 'Process CSV')}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-b border-slate-200 p-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Total Records:</span>
              <span className="font-bold text-slate-900 text-sm">{validationResult.total_records} rows</span>
            </div>
            <div>
              <span className="text-slate-500 block">Detected Patients:</span>
              <span className="font-bold text-slate-900 text-sm">{validationResult.total_patients} patients</span>
            </div>
            <div>
              <span className="text-slate-500 block">Detected Analyzers:</span>
              <span className="font-bold text-slate-900 text-sm">
                {validationResult.detected_analyzers.join(', ') || 'Standard'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Detected Units:</span>
              <span className="font-bold text-slate-900 text-sm">
                {validationResult.detected_units.join(', ') || 'Standard'}
              </span>
            </div>
          </div>

          {/* Validation Warnings (if any) */}
          {validationResult.validation_issues_count > 0 && (
            <div className="p-4 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{validationResult.validation_issues_count} Validation Issue(s) detected:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {validationResult.validation_issues.map((iss, i) => (
                  <li key={i}>
                    Row {iss.row} (PID: {iss.patient_id}, Test: {iss.test}): {iss.issues.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 sticky top-0 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-2">Age/Sex</th>
                  <th className="py-2.5 px-3">Raw Analyte</th>
                  <th className="py-2.5 px-3">Mapped Standard</th>
                  <th className="py-2.5 px-3 text-right">Raw Result</th>
                  <th className="py-2.5 px-3 text-right">Normalized</th>
                  <th className="py-2.5 px-3">Ref Range</th>
                  <th className="py-2.5 px-3">Preview Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {validationResult.preview_records.map((rec, i) => {
                  const c = rec.classification;
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-mono font-semibold text-blue-700">
                        {rec.patient_id}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {rec.patient_name}
                      </td>
                      <td className="py-2 px-2 text-slate-600">
                        {rec.age}y / {rec.sex}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-600">
                        {rec.raw_test_name}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {rec.standard_test_name}
                        {rec.mapping_note && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {rec.mapping_note}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-slate-600">
                        {rec.raw_result} {rec.raw_unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {c.normalized_result} {c.normalized_unit}
                        {c.conversion_applied && (
                          <span className="block text-[10px] text-blue-600 font-normal">
                            {c.conversion_applied}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {c.lower_range !== null && c.upper_range !== null
                          ? `${c.lower_range} – ${c.upper_range}`
                          : 'No Range'}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expected Format Documentation */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-2">Expected CSV File Structure</h4>
        <p className="text-slate-600 leading-relaxed mb-3">
          The engine reads pathology analyser output CSV files with the following column headers (case-insensitive):
        </p>
        <div className="bg-white border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-700 overflow-x-auto">
          Patient ID, Patient Name, Age, Sex, Test Name, Result, Unit, Analyzer, Date
        </div>
        <p className="text-slate-500 text-[11px] mt-2">
          Tip: Test names can be raw analyzer codes (e.g., <code>GLU</code>, <code>HB</code>, <code>CREAT</code>) which are mapped via the Analyzer Mapping module. Units like <code>mmol/L</code> are automatically normalized to <code>mg/dL</code> for reference range comparisons.
        </p>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
