import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  FileText,
  Sliders,
  GitFork,
  Settings,
  Activity,
  Sparkles,
  FlaskConical,
  LogOut,
  UserCheck,
  ShieldCheck,
  Salad,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export type PageId =
  | 'dashboard'
  | 'upload'
  | 'patients'
  | 'reports'
  | 'diet-plans'
  | 'reference-ranges'
  | 'analyzer-mapping'
  | 'settings'
  | 'report-details';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onLoadSampleData: () => void;
  isLoadingSample?: boolean;
  criticalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onLoadSampleData,
  isLoadingSample = false,
  criticalCount = 0,
}) => {
  const { user, logout, switchRole } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard' as PageId, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'upload' as PageId, label: t('nav.upload_csv'), icon: UploadCloud },
    { id: 'patients' as PageId, label: t('nav.patients'), icon: Users },
    {
      id: 'reports' as PageId,
      label: t('nav.reports'),
      icon: FileText,
      badge: criticalCount > 0 ? `${criticalCount} Crit` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
    },
    { id: 'diet-plans' as PageId, label: t('nav.diet_plans'), icon: Salad },
    { id: 'reference-ranges' as PageId, label: t('nav.reference_ranges'), icon: Sliders },
    { id: 'analyzer-mapping' as PageId, label: t('nav.analyzer_mapping'), icon: GitFork },
    { id: 'settings' as PageId, label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">LabReport</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-400/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">Pathology Engine</p>
          </div>
        </div>
      </div>

      {/* Demo Action Box */}
      <div className="p-3 mx-3 my-4 bg-gradient-to-b from-blue-950/70 to-slate-800/80 rounded-xl border border-blue-800/40 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300 font-semibold mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{t('nav.fast_track')}</span>
        </div>
        <button
          onClick={onLoadSampleData}
          disabled={isLoadingSample}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoadingSample ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-blue-200" />
          )}
          <span>{isLoadingSample ? '...' : t('nav.try_sample')}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (currentPage === 'report-details' && item.id === 'reports');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Switch to Patient Portal Preview */}
      <div className="px-3 mb-2">
        <button
          onClick={() => switchRole('patient')}
          className="w-full py-2 px-3 bg-teal-950/70 hover:bg-teal-900/80 border border-teal-700/50 text-teal-300 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Patient Portal View</span>
        </button>
      </div>

      {/* User Status Card */}
      {user && (
        <div className="p-3 mx-3 mb-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user.initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 capitalize truncate">{user.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Lock / Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">{t('nav.engine_active')}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">Python 3.10</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 leading-tight">
          Age/Sex Range Engine & Unit Normalizer
        </p>
      </div>
    </aside>
  );
};
