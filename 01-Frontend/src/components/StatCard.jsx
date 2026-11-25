import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  subtitle,
  colorScheme = 'blue', // 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo'
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
          {Icon && <Icon className="w-5 h-5" strokeWidth={1.75} />}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 flex items-center text-xs font-medium">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 mr-2 px-1.5 py-0.5 rounded-md ${
                trendType === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : trendType === 'down'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {trendType === 'up' && <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />}
              {trendType === 'down' && <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2} />}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-500 font-normal">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
