import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Sparkles,
  Building2,
  LogOut,
  ChevronDown,
  UserCheck,
  Shield,
  Stethoscope,
  Microscope,
  Award,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react';
import { PageId } from './Sidebar';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { UserRole } from '../types';

interface NavbarProps {
  onNavigate: (page: PageId) => void;
  onLoadSampleData: () => void;
  isLoadingSample?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  onLoadSampleData,
  isLoadingSample = false,
}) => {
  const { user, logout, switchRole } = useAuth();
  const { t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-teal-600" />;
      case 'pathologist':
        return <Microscope className="w-3.5 h-3.5 text-blue-600" />;
      case 'technologist':
        return <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />;
      case 'compliance':
        return <Award className="w-3.5 h-3.5 text-amber-600" />;
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
      case 'patient':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-bold text-sm tracking-tight text-slate-900 line-clamp-1">
              {user?.facility || 'MetroHealth Advanced Pathology Laboratory'}
            </span>
            <span className="hidden xl:inline text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200">
              CAP / NABL Accredited
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <LanguageSelector />

        <button
          onClick={onLoadSampleData}
          disabled={isLoadingSample}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{isLoadingSample ? 'Processing...' : t('nav.try_sample')}</span>
        </button>

        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{t('action.upload_csv')}</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.initials || 'MD'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Dr. Sarah Jenkins'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                {getRoleIcon(user?.role)}
                <span>{user?.title || 'Chief Pathologist'}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="font-bold text-xs text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {getRoleIcon(user?.role)}
                  <span className="capitalize">{user?.role}</span> • Lic: {user?.licenseNumber}
                </div>
              </div>

              {/* Role Switcher */}
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-400 px-2 mb-1.5 tracking-wider">
                  Switch Active Role
                </div>
                <div className="space-y-1">
                  {(Object.keys(DEMO_USERS) as UserRole[]).map((r) => {
                    const u = DEMO_USERS[r];
                    const isCurrent = user?.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getRoleIcon(r)}
                          <span>{u.title.split('&')[0]}</span>
                        </div>
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logout */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Screen / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
