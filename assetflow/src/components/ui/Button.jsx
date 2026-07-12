import React from 'react';
import clsx from 'clsx';

const variants = {
  primary:   'bg-orange-glass bg-glass-orange hover:bg-primary-500/30 text-primary-900 border border-glass-border shadow-glow hover:shadow-orange-glow backdrop-blur-glass',
  secondary: 'bg-glass hover:bg-glass-soft text-primary-800 border border-glass-border shadow-glass backdrop-blur-glass',
  danger:    'bg-red-700/80 hover:bg-red-600 text-white border border-red-500/50 shadow-sm',
  ghost:     'hover:bg-glass-soft text-slate-500 hover:text-primary-800',
  outline:   'border border-glass-border hover:border-primary-500 text-primary-800 hover:text-primary-700 bg-white/30 backdrop-blur-glass',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size    = 'md',
  className,
  icon,
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-150 cursor-pointer hover:-translate-y-0.5',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
}
