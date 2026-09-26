import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
  Sparkles,
  Globe,
  Check,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { api } from '../services/api';

interface SettingsPageProps {
  onLoadSampleData: () => void;
  isLoadingSample?: boolean;
  onRefreshStats: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onLoadSampleData,
  isLoadingSample = false,
  onRefreshStats,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({
    lab_name: 'MetroHealth Advanced Pathology Laboratory',
    lab_tagline: 'NABL & CAP Accredited Diagnostic Center',
    lab_address: '452 Medical Science Square, Health District, CA 94103',
    lab_phone: '+1 (800) 555-LABS / (415) 890-2300',
    lab_email: 'reports@metrohealthpathology.org',
    lab_director: 'Dr. Sarah Jenkins, MD, FACP (Chief Pathologist)',
    critical_notification_protocol:
      'Immediate clinician notification required within 15 minutes of verified critical result.',
    auto_convert_units: 'true',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await api.getSettings();
        if (res.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all patient and report records? (Reference ranges and mappings will remain intact)'
      )
    ) {
      try {
        await api.resetDatabase();
        onRefreshStats();
        alert('Database cleared successfully.');
      } catch (err: any) {
        alert(err.message || 'Failed to clear database');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratory Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure facility metadata, electronic signature profiles, and critical alert notification protocols.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Laboratory settings updated successfully.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Section 1: Facility Demographics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Facility Demographics & Header</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Laboratory Name</label>
              <input
                type="text"
                value={settings.lab_name}
                onChange={(e) => setSettings({ ...settings, lab_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Accreditation Tagline</label>
              <input
                type="text"
                value={settings.lab_tagline}
                onChange={(e) => setSettings({ ...settings, lab_tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Facility Address</label>
              <input
                type="text"
                value={settings.lab_address}
                onChange={(e) => setSettings({ ...settings, lab_address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.lab_phone}
                onChange={(e) => setSettings({ ...settings, lab_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
              <input
                type="text"
                value={settings.lab_email}
                onChange={(e) => setSettings({ ...settings, lab_email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Medical Sign-off & Critical Protocols */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Sign-off & Critical Alert Protocols</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chief Pathologist / Sign-off Director</label>
              <input
                type="text"
                value={settings.lab_director}
                onChange={(e) => setSettings({ ...settings, lab_director: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Critical Value Notification Standard</label>
              <textarea
                rows={2}
                value={settings.critical_notification_protocol}
                onChange={(e) =>
                  setSettings({ ...settings, critical_notification_protocol: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Language & Regional Localization */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Globe className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Language & Regional Localization / لغة الواجهة</h3>
        </div>

        <p className="text-xs text-slate-500">
          Select the active language for clinical staff, diagnostic reports, and medical dietary plans.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 shadow-2xs ring-1 ring-blue-500/40 text-blue-900'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{lang.nativeName}</div>
                    <div className="text-[10px] text-slate-500">{lang.label}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Demo Data Operations */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Hackathon Demo State Management</h3>
        </div>

        <p className="text-xs text-slate-500">
          Manage sample dataset and reset patient reports for clean demonstration presentations.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onLoadSampleData}
            disabled={isLoadingSample}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isLoadingSample ? 'Processing...' : 'Repopulate Sample Dataset'}</span>
          </button>

          <button
            onClick={handleResetDatabase}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear Patient & Report Records</span>
          </button>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
