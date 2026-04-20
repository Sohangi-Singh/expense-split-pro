import React, { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Input — controlled text input with label, icon, error state.
 *
 * All standard <input> props are forwarded via ref.
 * Extra props:
 *   label      — floating label above the field
 *   error      — error string shown below
 *   hint       — helper text (shown when no error)
 *   icon       — Lucide component shown on the left
 *   rightEl    — arbitrary element on the right (e.g. toggle button)
 *   fullWidth  — defaults true
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    rightEl,
    fullWidth = true,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('space-y-1.5', fullWidth && 'w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full py-2.5 rounded-xl border text-sm transition-all duration-150',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            Icon    ? 'pl-10' : 'pl-4',
            rightEl ? 'pr-10' : 'pr-4',
            error
              ? 'border-danger-400 bg-danger-50 text-danger-900'
              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger-600 flex items-center gap-1">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;


/**
 * Select — styled <select> wrapper matching Input visual style.
 */
export const Select = forwardRef(function Select(
  { label, error, hint, icon: Icon, fullWidth = true, className = '', id, children, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('space-y-1.5', fullWidth && 'w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full py-2.5 pr-4 rounded-xl border text-sm appearance-none transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'bg-white text-slate-900 cursor-pointer',
            Icon ? 'pl-10' : 'pl-4',
            error ? 'border-danger-400 bg-danger-50' : 'border-slate-200 hover:border-slate-300'
          )}
          {...props}
        >
          {children}
        </select>
        {/* Chevron */}
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});


/**
 * Textarea — same styles as Input but multi-line.
 */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, fullWidth = true, className = '', id, rows = 3, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('space-y-1.5', fullWidth && 'w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={clsx(
          'w-full px-4 py-2.5 rounded-xl border text-sm resize-none transition-all duration-150',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          error
            ? 'border-danger-400 bg-danger-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
});
