import React from 'react';
import clsx from 'clsx';

const variants = {
  primary:   'bg-primary-600 hover:bg-primary-500 text-white shadow-sm hover:shadow-glow',
  secondary: 'bg-surface-700 hover:bg-surface-600 text-slate-200 border border-surface-600',
  danger:    'bg-red-700 hover:bg-red-600 text-white',
  ghost:     'hover:bg-surface-700/60 text-slate-400 hover:text-slate-200',
  outline:   'border border-surface-600 hover:border-primary-500 text-slate-300 hover:text-primary-400',
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
        'transition-all duration-150 cursor-pointer',
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
