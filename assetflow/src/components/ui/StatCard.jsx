import React from 'react';
import clsx from 'clsx';

const ACCENT_COLORS = {
  blue:   'from-primary-500/20 to-primary-600/5 border-glass-border',
  emerald:'from-emerald-500/10 to-emerald-600/5 border-emerald-800/30',
  amber:  'from-amber-500/10 to-amber-600/5 border-amber-800/30',
  red:    'from-red-500/10 to-red-600/5 border-red-800/30',
  purple: 'from-primary-400/20 to-primary-600/5 border-glass-border',
  slate:  'from-slate-500/10 to-slate-600/5 border-slate-700/30',
};
const ICON_COLORS = {
  blue:   'bg-glass-soft text-primary-700 shadow-glow',
  emerald:'bg-emerald-900/50 text-emerald-400',
  amber:  'bg-amber-900/50 text-amber-400',
  red:    'bg-red-900/50 text-red-400',
  purple: 'bg-glass-soft text-primary-700 shadow-glow',
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
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-surface-850 mt-1.5 tabular-nums">
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
