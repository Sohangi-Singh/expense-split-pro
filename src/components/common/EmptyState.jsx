import React from 'react';
import clsx from 'clsx';

/**
 * EmptyState — friendly zero-data screen.
 *
 * icon    — Lucide component (large, decorative)
 * title   — bold heading
 * message — supporting copy
 * action  — optional CTA button/element
 * compact — smaller variant for inline use inside cards
 */
export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  compact  = false,
  className = '',
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div className={clsx(
          'rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}>
          <Icon size={compact ? 22 : 30} />
        </div>
      )}

      {title && (
        <h3 className={clsx(
          'font-semibold text-slate-700',
          compact ? 'text-sm' : 'text-base'
        )}>
          {title}
        </h3>
      )}

      {message && (
        <p className={clsx(
          'text-slate-400 mt-1 max-w-xs',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {message}
        </p>
      )}

      {action && (
        <div className="mt-5">{action}</div>
      )}
    </div>
  );
}
