import React from 'react';
import clsx from 'clsx';

const ACCENT_COLORS = {
  blue:   'from-blue-500/10 to-blue-600/5 border-blue-800/30',
  emerald:'from-emerald-500/10 to-emerald-600/5 border-emerald-800/30',
  amber:  'from-amber-500/10 to-amber-600/5 border-amber-800/30',
  red:    'from-red-500/10 to-red-600/5 border-red-800/30',
  purple: 'from-purple-500/10 to-purple-600/5 border-purple-800/30',
  slate:  'from-slate-500/10 to-slate-600/5 border-slate-700/30',
};
const ICON_COLORS = {
  blue:   'bg-blue-900/50 text-blue-400',
  emerald:'bg-emerald-900/50 text-emerald-400',
  amber:  'bg-amber-900/50 text-amber-400',
  red:    'bg-red-900/50 text-red-400',
  purple: 'bg-purple-900/50 text-purple-400',
  slate:  'bg-slate-700/50 text-slate-400',
};

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend, suffix }) {
  return (
    <div className={clsx(
      'stat-card bg-gradient-to-br border rounded-xl',
      ACCENT_COLORS[color],
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-slate-100 mt-1.5 tabular-nums">
            {value ?? '—'}
            {suffix && <span className="text-base font-normal text-slate-400 ml-1">{suffix}</span>}
          </p>
          {trend && (
            <p className={clsx('text-xs mt-1.5 font-medium', trend > 0 ? 'text-red-400' : 'text-emerald-400')}>
              {trend > 0 ? `▲ ${trend}` : `▼ ${Math.abs(trend)}`} this week
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-3 rounded-xl shrink-0', ICON_COLORS[color])}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
