import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Salad,
  UploadCloud,
  Menu,
} from 'lucide-react';
import { PageId } from './Sidebar';
import { useLanguage } from '../context/LanguageContext';

interface MobileBottomNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenMenu: () => void;
  criticalCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  onNavigate,
  onOpenMenu,
  criticalCount = 0,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: t('nav.dashboard', 'Dashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'reports' as PageId,
      label: t('nav.reports', 'Reports'),
      icon: FileText,
      badge: criticalCount > 0 ? criticalCount : undefined,
    },
    {
      id: 'diet-plans' as PageId,
      label: t('nav.diet_plans', 'Diet Plans'),
      icon: Salad,
    },
    {
      id: 'upload' as PageId,
      label: t('nav.upload_csv', 'Upload'),
      icon: UploadCloud,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-teal-400 font-bold bg-white/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400 scale-105' : 'text-slate-400'}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 line-clamp-1 max-w-[64px] text-center">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More / Menu Drawer Button */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Menu</span>
        </button>
      </div>
    </nav>
  );
};
