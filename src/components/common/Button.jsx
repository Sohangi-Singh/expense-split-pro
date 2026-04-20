import React from 'react';
import clsx from 'clsx';

/**
 * Button — unified button component with variants, sizes, loading state.
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
 * size:    'sm' | 'md' | 'lg'
 * loading — shows spinner and disables interaction
 * icon    — Lucide icon component rendered before label
 * iconPos — 'left' (default) | 'right'
 * fullWidth — stretches to container width
 */
export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon: Icon,
  iconPos   = 'left',
  fullWidth = false,
  className = '',
  ...props
}) {
  const base = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-150 select-none cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus:ring-primary-500 shadow-sm',
    ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus:ring-primary-500',
    danger:    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:ring-danger-500 shadow-sm',
    success:   'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500 shadow-sm',
    outline:   'bg-transparent text-primary-600 border border-primary-300 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
  };

  const sizes = {
    xs: 'px-2.5 py-1    text-xs',
    sm: 'px-3.5 py-1.5  text-sm',
    md: 'px-4.5 py-2.5  text-sm',
    lg: 'px-6   py-3    text-base',
  };

  const iconSizes = { xs: 13, sm: 14, md: 16, lg: 18 };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {/* Spinner replaces left icon when loading */}
      {loading ? (
        <span
          className="rounded-full border-2 border-current border-t-transparent animate-spin"
          style={{ width: iconSizes[size], height: iconSizes[size] }}
        />
      ) : (
        Icon && iconPos === 'left' && <Icon size={iconSizes[size]} className="shrink-0" />
      )}

      {children && <span>{children}</span>}

      {!loading && Icon && iconPos === 'right' && (
        <Icon size={iconSizes[size]} className="shrink-0" />
      )}
    </button>
  );
}
