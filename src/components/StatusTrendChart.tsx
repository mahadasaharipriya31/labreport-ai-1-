import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart2, Layers, Calendar, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { StatusTrendItem } from '../types';

interface StatusTrendChartProps {
  data?: StatusTrendItem[];
  onLoadSampleData?: () => void;
  isLoadingSample?: boolean;
}

export const StatusTrendChart: React.FC<StatusTrendChartProps> = ({
  data = [],
  onLoadSampleData,
  isLoadingSample = false,
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [rangeFilter, setRangeFilter] = useState<'30d' | '14d' | '7d'>('30d');

  // Filter based on selected duration
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const count = rangeFilter === '7d' ? 7 : rangeFilter === '14d' ? 14 : 30;
    return data.slice(-count);
  }, [data, rangeFilter]);

  // Calculate summary stats for the active range
  const summary = useMemo(() => {
    let normalSum = 0;
    let abnormalSum = 0;
    let criticalSum = 0;
    let totalSum = 0;

    filteredData.forEach((item) => {
      normalSum += item.normal || 0;
      abnormalSum += item.abnormal || 0;
      criticalSum += item.critical || 0;
      totalSum += item.total || 0;
    });

    const activeDaysWithData = filteredData.filter((d) => d.total > 0).length;

    return {
      normalSum,
      abnormalSum,
      criticalSum,
      totalSum,
      activeDaysWithData,
    };
  }, [filteredData]);

  const hasData = summary.totalSum > 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const itemData: StatusTrendItem | undefined = payload[0]?.payload;
      const normal = itemData?.normal ?? 0;
      const abnormal = itemData?.abnormal ?? 0;
      const critical = itemData?.critical ?? 0;
      const total = normal + abnormal + critical;

      return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3.5 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {itemData?.date || label}
            </span>
            <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
              {total} {total === 1 ? 'Report' : 'Reports'}
            </span>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Normal
              </span>
              <span className="font-bold font-mono">
                {normal} {total > 0 && `(${Math.round((normal / total) * 100)}%)`}
              </span>
            </div>

            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Abnormal
              </span>
              <span className="font-bold font-mono">
                {abnormal} {total > 0 && `(${Math.round((abnormal / total) * 100)}%)`}
              </span>
            </div>

            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Critical Alert
              </span>
              <span className="font-bold font-mono">
                {critical} {total > 0 && `(${Math.round((critical / total) * 100)}%)`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              30-Day Pathology Report Status Distribution
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily trend and volume breakdown of Normal, Abnormal, and Critical reports
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
            <button
              type="button"
              onClick={() => setRangeFilter('7d')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                rangeFilter === '7d'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setRangeFilter('14d')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                rangeFilter === '14d'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              14D
            </button>
            <button
              type="button"
              onClick={() => setRangeFilter('30d')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                rangeFilter === '30d'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              30D
            </button>
          </div>

          {/* Chart type toggle */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Stacked Area Trend"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Stacked Bar Distribution"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Reports</div>
            <div className="text-base font-black text-slate-900 font-mono">{summary.totalSum}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Normal Cases</div>
            <div className="text-base font-black text-emerald-700 font-mono">
              {summary.normalSum}{' '}
              {summary.totalSum > 0 && (
                <span className="text-xs font-semibold text-emerald-600">
                  ({Math.round((summary.normalSum / summary.totalSum) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Abnormal Alerts</div>
            <div className="text-base font-black text-amber-700 font-mono">
              {summary.abnormalSum}{' '}
              {summary.totalSum > 0 && (
                <span className="text-xs font-semibold text-amber-600">
                  ({Math.round((summary.abnormalSum / summary.totalSum) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/70">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Critical Flagged</div>
            <div className="text-base font-black text-rose-700 font-mono">
              {summary.criticalSum}{' '}
              {summary.totalSum > 0 && (
                <span className="text-xs font-semibold text-rose-600">
                  ({Math.round((summary.criticalSum / summary.totalSum) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorAbnormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="display_date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={rangeFilter === '30d' ? 4 : rangeFilter === '14d' ? 2 : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 12, fontSize: '11px', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="normal"
                  name="Normal"
                  stackId="1"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNormal)"
                />
                <Area
                  type="monotone"
                  dataKey="abnormal"
                  name="Abnormal"
                  stackId="1"
                  stroke="#d97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAbnormal)"
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  name="Critical"
                  stackId="1"
                  stroke="#be123c"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCritical)"
                />
              </AreaChart>
            ) : (
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="display_date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={rangeFilter === '30d' ? 4 : rangeFilter === '14d' ? 2 : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 12, fontSize: '11px', fontWeight: 600 }}
                />
                <Bar dataKey="normal" name="Normal" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="abnormal" name="Abnormal" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="critical" name="Critical" stackId="a" fill="#e11d48" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No report trend data for this period</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Upload a pathology analyser CSV or load the multi-patient demonstration dataset to populate this trend graph.
            </p>
            {onLoadSampleData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                disabled={isLoadingSample}
                className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isLoadingSample ? 'Processing...' : 'Load Sample Data'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
