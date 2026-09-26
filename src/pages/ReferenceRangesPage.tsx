import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ReferenceRange } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';

export const ReferenceRangesPage: React.FC = () => {
  const [ranges, setRanges] = useState<ReferenceRange[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sexFilter, setSexFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<ReferenceRange>>({
    test_name: '',
    sex: 'Any',
    min_age: 0,
    max_age: 120,
    lower_range: 0,
    upper_range: 100,
    unit: 'mg/dL',
    critical_low: null,
    critical_high: null,
    category: 'General',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRanges = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReferenceRanges();
      setRanges(res.reference_ranges || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRanges();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      test_name: '',
      sex: 'Any',
      min_age: 0,
      max_age: 120,
      lower_range: 70,
      upper_range: 110,
      unit: 'mg/dL',
      critical_low: 50,
      critical_high: 300,
      category: 'General',
      notes: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ReferenceRange) => {
    setEditingId(item.id || null);
    setFormData({ ...item });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this reference range?')) {
      try {
        await api.deleteReferenceRange(id);
        fetchRanges();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.test_name?.trim()) {
      setErrorMsg('Test Name is required');
      return;
    }
    if (!formData.unit?.trim()) {
      setErrorMsg('Unit is required');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (editingId) {
        await api.updateReferenceRange(editingId, formData);
      } else {
        await api.createReferenceRange(formData);
      }
      setIsModalOpen(false);
      fetchRanges();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save reference range');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRanges = ranges.filter((r) => {
    const matchesSearch =
      r.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.unit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSex = sexFilter === 'ALL' || r.sex.toLowerCase() === sexFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;

    return matchesSearch && matchesSex && matchesCategory;
  });

  const categories = Array.from(new Set(ranges.map((r) => r.category || 'General')));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reference Range Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure laboratory reference intervals & critical notification thresholds by age, sex, and unit.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reference Range</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sex Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500">Sex:</span>
            {['ALL', 'Male', 'Female', 'Any'].map((s) => (
              <button
                key={s}
                onClick={() => setSexFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  sexFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name, analyte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reference Ranges Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sex</th>
                <th className="py-3 px-3">Age Range</th>
                <th className="py-3 px-3 text-right">Standard Range</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Critical Low</th>
                <th className="py-3 px-3 text-right">Critical High</th>
                <th className="py-3 px-4">Clinical Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading reference ranges...
                  </td>
                </tr>
              ) : filteredRanges.length > 0 ? (
                filteredRanges.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {r.test_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded">
                        {r.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.sex === 'Male'
                            ? 'bg-blue-50 text-blue-700'
                            : r.sex === 'Female'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.sex}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {r.min_age} – {r.max_age} yrs
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {r.lower_range !== null ? r.lower_range : '—'} – {r.upper_range !== null ? r.upper_range : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {r.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                      {r.critical_low !== null ? `< ${r.critical_low}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                      {r.critical_high !== null ? `> ${r.critical_high}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {r.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors cursor-pointer"
                        title="Edit Range"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => r.id && handleDelete(r.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete Range"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No reference ranges match your query.
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Reference Range' : 'Add New Reference Range'}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Standard Test Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.test_name}
                    onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                    placeholder="e.g. Glucose, Hemoglobin, Creatinine"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sex Filter</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Any">Any (All Sexes)</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. mg/dL, g/dL, mmol/L"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Age (Years)</label>
                  <input
                    type="number"
                    value={formData.min_age}
                    onChange={(e) => setFormData({ ...formData, min_age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Age (Years)</label>
                  <input
                    type="number"
                    value={formData.max_age}
                    onChange={(e) => setFormData({ ...formData, max_age: parseInt(e.target.value) || 120 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-700 mb-1">Standard Lower Range</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lower_range ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lower_range: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                    placeholder="e.g. 70"
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-lg font-mono font-bold text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-700 mb-1">Standard Upper Range</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.upper_range ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        upper_range: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                    placeholder="e.g. 99"
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-lg font-mono font-bold text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-rose-700 mb-1">Critical Low Threshold</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.critical_low ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        critical_low: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-lg font-mono font-bold text-rose-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-rose-700 mb-1">Critical High Threshold</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.critical_high ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        critical_high: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                    placeholder="e.g. 300"
                    className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-lg font-mono font-bold text-rose-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Biochemistry, Hematology"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes / Method</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Fasting plasma hexokinase"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
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
                  {isSaving ? 'Saving...' : editingId ? 'Update Range' : 'Create Range'}
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
