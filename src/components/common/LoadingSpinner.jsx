import React from 'react';
import clsx from 'clsx';

/**
 * LoadingSpinner
 * Props:
 *   fullScreen — centers spinner in the viewport (used during auth check)
 *   size       — 'sm' | 'md' | 'lg'
 *   label      — optional accessible text shown below spinner
 */
export default function LoadingSpinner({ fullScreen = false, size = 'md', label }) {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-9 h-9 border-[3px]',
    lg: 'w-14 h-14 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={clsx(
          'rounded-full border-primary-200 border-t-primary-600 animate-spin',
          sizeMap[size]
        )}
        role="status"
        aria-label={label || 'Loading…'}
      />
      {label && (
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-50 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
