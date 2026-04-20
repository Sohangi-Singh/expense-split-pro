import React from 'react';
import clsx from 'clsx';

/**
 * Badge — small pill label for status, category, or counts.
 *
 * variant: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple'
 * size:    'sm' | 'md'
 * dot     — shows colored dot before text
 */
export default function Badge({
  children,
  variant  = 'default',
  size     = 'md',
  dot      = false,
  className = '',
}) {
  const variants = {
    default: 'bg-slate-100   text-slate-600',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-50  text-success-600',
    danger:  'bg-danger-50   text-danger-600',
    warning: 'bg-warning-50  text-warning-600',
    info:    'bg-primary-50  text-primary-600',
    purple:  'bg-accent-100  text-accent-600',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    danger:  'bg-danger-500',
    warning: 'bg-warning-500',
    info:    'bg-primary-500',
    purple:  'bg-accent-500',
  };

  const sizes = {
    sm: 'px-2   py-0.5 text-xs',
    md: 'px-2.5 py-1   text-xs',
  };

  return (
    <span className={clsx('badge font-medium', variants[variant], sizes[size], className)}>
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
