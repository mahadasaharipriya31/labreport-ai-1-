import React from 'react';
import {
  X,
  LayoutDashboard,
  UploadCloud,
  Users,
  FileText,
  Sliders,
  GitFork,
  Settings,
  Salad,
  Sparkles,
  LogOut,
  FlaskConical,
  Globe,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { PageId } from './Sidebar';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onLoadSampleData: () => void;
  isLoadingSample?: boolean;
  criticalCount?: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  onLoadSampleData,
  isLoadingSample = false,
  criticalCount = 0,
}) => {
  const { user, logout, switchRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const handleNav = (page: PageId) => {
    onNavigate(page);
    onClose();
  };

  const navItems = [
    { id: 'dashboard' as PageId, label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'upload' as PageId, label: t('nav.upload_csv', 'Upload CSV'), icon: UploadCloud },
    { id: 'patients' as PageId, label: t('nav.patients', 'Patients'), icon: Users },
    {
      id: 'reports' as PageId,
      label: t('nav.reports', 'Reports'),
      icon: FileText,
      badge: criticalCount > 0 ? `${criticalCount} Crit` : undefined,
    },
    { id: 'diet-plans' as PageId, label: t('nav.diet_plans', 'Diet Plans'), icon: Salad },
    { id: 'reference-ranges' as PageId, label: t('nav.reference_ranges', 'Reference Ranges'), icon: Sliders },
    { id: 'analyzer-mapping' as PageId, label: t('nav.analyzer_mapping', 'Analyzer Mapping'), icon: GitFork },
    { id: 'settings' as PageId, label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 text-slate-100 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-white tracking-tight">LabReport</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-400/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Mobile Clinical App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Mobile App Install Card */}
          <div className="p-3 bg-gradient-to-br from-blue-950/80 to-teal-950/80 border border-teal-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-1.5">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>Mobile App Available</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2.5 leading-snug">
              Install to your home screen for quick offline pathology access and push alerts.
            </p>
            <PWAInstallButton variant="sidebar" />
          </div>

          {/* Quick Demo Data */}
          <button
            onClick={() => {
              onLoadSampleData();
              onClose();
            }}
            disabled={isLoadingSample}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{isLoadingSample ? 'Processing...' : t('nav.try_sample', 'Try Sample Data')}</span>
          </button>

          {/* Navigation Items */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Language Selector for Mobile */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Language / భాష</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-[11px] transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-600/30 border border-blue-400 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-400/30">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate max-w-[130px]">{user?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
