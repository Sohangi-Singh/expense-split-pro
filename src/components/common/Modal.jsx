import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Modal — accessible dialog rendered into document.body via portal.
 *
 * size: 'sm' | 'md' | 'lg' | 'xl'
 * Traps focus, closes on Escape key and backdrop click.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size      = 'md',
  className = '',
}) {
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Focus the panel when opened
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4
                 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full bg-white shadow-modal outline-none animate-slide-up',
          'rounded-t-3xl sm:rounded-2xl',
          'max-h-[92vh] flex flex-col',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            {title && (
              <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600
                       transition-colors -mr-1 -mt-1 shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Optional footer (e.g. action buttons) */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-surface-50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
