import React from 'react';
import clsx from 'clsx';

/**
 * Card — surface container with optional hover lift and padding variants.
 *
 * variant: 'default' | 'flat' | 'glass'
 * padding: 'none' | 'sm' | 'md' | 'lg'
 * hover   — adds lift shadow on hover
 * onClick — makes the card clickable (adds cursor-pointer)
 */
export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover   = false,
  className = '',
  onClick,
  ...props
}) {
  const variants = {
    default: 'bg-white border border-slate-100 shadow-card',
    flat:    'bg-surface-100 border border-surface-200',
    glass:   'glass-card',
  };

  const paddings = {
    none: '',
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6 sm:p-8',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Thin divider inside a Card */
Card.Divider = function CardDivider({ className = '' }) {
  return <hr className={clsx('border-slate-100 my-4', className)} />;
};

/** Section header inside a Card */
Card.Header = function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
