import React from 'react';
import clsx from 'clsx';

const STATUS_STYLES = {
  // Asset status
  Available:         'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  Allocated:         'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  Reserved:          'bg-purple-900/40 text-purple-400 border border-purple-800/50',
  'Under Maintenance':'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  Lost:              'bg-red-900/40 text-red-400 border border-red-800/50',
  Retired:           'bg-slate-700/60 text-slate-400 border border-slate-600/50',
  Disposed:          'bg-slate-800/60 text-slate-500 border border-slate-700/50',
  // Allocation status
  active:            'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  returned:          'bg-slate-700/60 text-slate-400 border border-slate-600/50',
  overdue:           'bg-red-900/40 text-red-400 border border-red-800/50',
  // Priority
  Low:               'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  Medium:            'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  High:              'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  Critical:          'bg-red-900/40 text-red-400 border border-red-800/50',
  // Maintenance
  Pending:           'bg-slate-700/60 text-slate-300 border border-slate-600/50',
  Approved:          'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  Rejected:          'bg-red-900/40 text-red-400 border border-red-800/50',
  'Technician Assigned':'bg-purple-900/40 text-purple-400 border border-purple-800/50',
  'In Progress':     'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  Resolved:          'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  // Booking
  Upcoming:          'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  Ongoing:           'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  Completed:         'bg-slate-700/60 text-slate-400 border border-slate-600/50',
  Cancelled:         'bg-red-900/40 text-red-400 border border-red-800/50',
  // Audit
  Open:              'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  Closed:            'bg-slate-700/60 text-slate-400 border border-slate-600/50',
  Verified:          'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  Missing:           'bg-red-900/40 text-red-400 border border-red-800/50',
  Damaged:           'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  // Roles
  admin:             'bg-purple-900/40 text-purple-400 border border-purple-800/50',
  asset_manager:     'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  department_head:   'bg-amber-900/40 text-amber-400 border border-amber-800/50',
  employee:          'bg-slate-700/60 text-slate-300 border border-slate-600/50',
};

export default function Badge({ label, className }) {
  const style = STATUS_STYLES[label] ?? 'bg-slate-700/60 text-slate-300 border border-slate-600/50';
  return (
    <span className={clsx('badge', style, className)}>
      {label}
    </span>
  );
}
