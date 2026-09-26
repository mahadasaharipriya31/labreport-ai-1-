import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Cpu,
  ArrowRight,
  Database,
} from 'lucide-react';
import { AnalyzerMapping } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';

export const AnalyzerMappingPage: React.FC = () => {
  const [mappings, setMappings] = useState<AnalyzerMapping[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<AnalyzerMapping>>({
    analyzer_code: '',
    standard_test_name: '',
    analyzer_name: 'Roche Cobas / Sysmex',
    sample_unit: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalyzerMappings();
      setMappings(res.mappings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      analyzer_code: '',
      standard_test_name: '',
      analyzer_name: 'Sysmex XN-1000',
      sample_unit: '',
      notes: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AnalyzerMapping) => {
    setEditingId(item.id || null);
    setFormData({ ...item });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this analyzer code mapping?')) {
      try {
        await api.deleteAnalyzerMapping(id);
        fetchMappings();
      } catch (err: any) {
        alert(err.message || 'Failed to delete mapping');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.analyzer_code?.trim() || !formData.standard_test_name?.trim()) {
      setErrorMsg('Both Analyzer Code and Standard Test Name are required');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (editingId) {
        await api.updateAnalyzerMapping(editingId, formData);
      } else {
        await api.saveAnalyzerMapping(formData);
      }
      setIsModalOpen(false);
      fetchMappings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save mapping');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = mappings.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.analyzer_code.toLowerCase().includes(term) ||
      m.standard_test_name.toLowerCase().includes(term) ||
      (m.analyzer_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analyzer Code Mapping</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Map proprietary instrument analyte codes (e.g. GLU, HB, HGB) to standardized clinical test nomenclature.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Code Mapping</span>
        </button>
      </div>

      {/* Search & Info Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>
            Total configured alias rules: <strong>{mappings.length}</strong>
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mappings Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Raw Analyzer Code</th>
                <th className="py-3 px-3 text-center">→</th>
                <th className="py-3 px-4">Standard Laboratory Analyte</th>
                <th className="py-3 px-4">Instrument / Platform</th>
                <th className="py-3 px-3">Default Unit</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading analyzer mappings...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 bg-blue-50/30">
                      {m.analyzer_code}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5 inline" />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.standard_test_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {m.analyzer_name || 'Generic Analyzer'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {m.sample_unit || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {m.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors cursor-pointer"
                        title="Edit Mapping"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => m.id && handleDelete(m.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete Mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No mapping found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Code Mapping' : 'Add Analyzer Code Mapping'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Raw Analyzer Code (as in CSV) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.analyzer_code}
                  onChange={(e) => setFormData({ ...formData, analyzer_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. GLU, HB, HGB, CREAT"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Standard Test Name (matches Reference Range) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.standard_test_name}
                  onChange={(e) => setFormData({ ...formData, standard_test_name: e.target.value })}
                  placeholder="e.g. Glucose, Hemoglobin, Serum Creatinine"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Analyzer Instrument Brand / Model
                </label>
                <input
                  type="text"
                  value={formData.analyzer_name || ''}
                  onChange={(e) => setFormData({ ...formData, analyzer_name: e.target.value })}
                  placeholder="e.g. Roche Cobas 6000, Sysmex XN-1000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Unit</label>
                <input
                  type="text"
                  value={formData.sample_unit || ''}
                  onChange={(e) => setFormData({ ...formData, sample_unit: e.target.value })}
                  placeholder="e.g. mg/dL, g/dL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Serum hexokinase assay"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-bold transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Mapping' : 'Save Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
};
