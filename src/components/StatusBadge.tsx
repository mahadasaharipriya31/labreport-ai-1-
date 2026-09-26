import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const cleanStatus = (status || 'UNKNOWN').toUpperCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let icon = <HelpCircle className="w-3.5 h-3.5 mr-1" />;

  if (cleanStatus.includes('CRITICAL')) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300 animate-pulse';
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />;
  } else if (cleanStatus === 'LOW') {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />;
  } else if (cleanStatus === 'HIGH') {
    bgClass = 'bg-orange-50 text-orange-700 border-orange-200';
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" />;
  } else if (cleanStatus === 'ABNORMAL') {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-300';
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />;
  } else if (cleanStatus === 'NORMAL') {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wide uppercase ${bgClass} ${sizeClasses[size]}`}
    >
      {showIcon && icon}
      <span>{cleanStatus}</span>
    </span>
  );
};
