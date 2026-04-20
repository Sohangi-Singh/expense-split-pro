import React from 'react';
import clsx from 'clsx';

// Deterministic color from a string (consistent per user name/email)
function colorFromString(str = '') {
  const COLORS = [
    'from-blue-400    to-blue-600',
    'from-violet-400  to-violet-600',
    'from-pink-400    to-pink-600',
    'from-amber-400   to-amber-600',
    'from-emerald-400 to-emerald-600',
    'from-cyan-400    to-cyan-600',
    'from-rose-400    to-rose-600',
    'from-indigo-400  to-indigo-600',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

/**
 * Avatar — circular avatar with initials fallback.
 *
 * name  — used for initials + deterministic color
 * src   — optional image URL
 * size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6  h-6  text-[10px]',
    sm: 'w-8  h-8  text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const gradient = colorFromString(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        `bg-gradient-to-br ${gradient}`,
        sizes[size],
        className
      )}
      title={name}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

/**
 * AvatarGroup — stack of overlapping avatars (+N overflow).
 */
export function AvatarGroup({ names = [], max = 4, size = 'sm' }) {
  const visible  = names.slice(0, max);
  const overflow = names.length - max;

  const overlapSizes = { xs: '-ml-2', sm: '-ml-2.5', md: '-ml-3', lg: '-ml-4', xl: '-ml-5' };
  const ringSizes    = { xs: 'ring-1', sm: 'ring-2', md: 'ring-2', lg: 'ring-2', xl: 'ring-2' };

  return (
    <div className="flex items-center">
      {visible.map((name, i) => (
        <Avatar
          key={name + i}
          name={name}
          size={size}
          className={clsx(
            `${ringSizes[size]} ring-white`,
            i !== 0 && overlapSizes[size]
          )}
        />
      ))}
      {overflow > 0 && (
        <div
          className={clsx(
            'rounded-full bg-slate-200 text-slate-600 font-semibold flex items-center justify-center',
            `${ringSizes[size]} ring-white`,
            overlapSizes[size],
            { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
