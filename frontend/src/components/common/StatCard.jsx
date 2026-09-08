import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, color = 'sky', subtitle }) {
  const colorMap = {
    sky: 'bg-gradient-to-br from-sky-50 to-white text-sky-700 border-sky-200 icon-bg:bg-sky-100 icon-text:text-sky-600',
    emerald: 'bg-gradient-to-br from-emerald-50 to-white text-emerald-700 border-emerald-200 icon-bg:bg-emerald-100 icon-text:text-emerald-600',
    amber: 'bg-gradient-to-br from-amber-50 to-white text-amber-700 border-amber-200 icon-bg:bg-amber-100 icon-text:text-amber-600',
    purple: 'bg-gradient-to-br from-purple-50 to-white text-purple-700 border-purple-200 icon-bg:bg-purple-100 icon-text:text-purple-600',
    rose: 'bg-gradient-to-br from-rose-50 to-white text-rose-700 border-rose-200 icon-bg:bg-rose-100 icon-text:text-rose-600',
    cyan: 'bg-gradient-to-br from-cyan-50 to-white text-cyan-700 border-cyan-200 icon-bg:bg-cyan-100 icon-text:text-cyan-600',
  };

  const iconBgMap = {
    sky: 'bg-sky-100 text-sky-600 border-sky-200',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-100 text-amber-600 border-amber-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    rose: 'bg-rose-100 text-rose-600 border-rose-200',
    cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  };

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconBgMap[color] || iconBgMap.sky}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {trend && <span className="text-xs font-bold text-emerald-600">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-[11px] text-slate-500 font-semibold">{subtitle}</p>}
    </div>
  );
}
