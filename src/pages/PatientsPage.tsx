import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  FileText,
  Calendar,
  ChevronRight,
  User,
  Activity,
  Download,
  Eye,
  Salad,
} from 'lucide-react';
import { Patient } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';

interface PatientsPageProps {
  onSelectReport: (reportId: string) => void;
  onViewDietPlan?: (patientId?: string) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({ onSelectReport, onViewDietPlan }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPatients();
      setPatients(res.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientClick = async (p: Patient) => {
    try {
      const detail = await api.getPatient(p.patient_id);
      setSelectedPatient(detail);
    } catch (err) {
      setSelectedPatient(p);
    }
  };

  const filtered = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.patient_id.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.sex.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registered patients with historical diagnostic reports and risk classifications
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
          />
        </div>
      </div>

      {/* Main Grid: Patients Table & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Patients Record ({filtered.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-3">Age / Sex</th>
                  <th className="py-3 px-3 text-center">Reports</th>
                  <th className="py-3 px-4">Latest Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading patients...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((p) => {
                    const isSelected = selectedPatient?.patient_id === p.patient_id;
                    return (
                      <tr
                        key={p.patient_id}
                        onClick={() => handlePatientClick(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {p.patient_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {p.age}y • {p.sex}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {p.reports_count ?? 1}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {p.latest_report_date || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={p.patient_status || 'NORMAL'} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No patients found matching "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Patient Quick Detail & History Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          {selectedPatient ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                  <div className="text-xs font-mono text-blue-700 font-semibold mt-0.5">
                    {selectedPatient.patient_id}
                  </div>
                </div>
                <StatusBadge status={selectedPatient.patient_status || 'NORMAL'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Age:</span>
                  <span className="font-bold text-slate-800">{selectedPatient.age} Years</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Sex:</span>
                  <span className="font-bold text-slate-800">{selectedPatient.sex}</span>
                </div>
              </div>

              {/* View Diet Plan Quick Action */}
              {onViewDietPlan && (
                <button
                  onClick={() => onViewDietPlan(selectedPatient.patient_id)}
                  className="w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Salad className="w-3.5 h-3.5 text-teal-600" />
                  <span>View Tailored Clinical Diet Plan</span>
                </button>
              )}

              {/* Reports History */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Report History</span>
                </h4>

                {selectedPatient.reports && selectedPatient.reports.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedPatient.reports.map((rep) => (
                      <div
                        key={rep.report_id}
                        className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-lg border border-slate-200 transition-colors flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>{rep.report_date}</span>
                            <StatusBadge status={rep.status} size="sm" showIcon={false} />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {rep.total_tests} Tests • {rep.analyzer_name}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onSelectReport(rep.report_id)}
                            className="p-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 rounded border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                            title="View Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={api.getReportPdfUrl(rep.report_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 rounded border border-slate-200 text-xs font-semibold transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-lg">
                    No reports attached to this record yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Select a patient from the table to inspect their medical history and reports.</p>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Pathology Laboratory Patient Management • NABL/CAP
          </div>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
