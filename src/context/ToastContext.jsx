import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: 'bg-success-50 border-success-500 text-success-600',
  error:   'bg-danger-50  border-danger-500  text-danger-600',
  warning: 'bg-warning-50 border-warning-500 text-warning-600',
  info:    'bg-primary-50 border-primary-500 text-primary-600',
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after duration
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience aliases used throughout the app
  const toastSuccess = useCallback((msg) => toast(msg, 'success'), [toast]);
  const toastError   = useCallback((msg) => toast(msg, 'error'),   [toast]);
  const toastWarning = useCallback((msg) => toast(msg, 'warning'), [toast]);
  const toastInfo    = useCallback((msg) => toast(msg, 'info'),    [toast]);

  const value = useMemo(() => ({
    toast, toastSuccess, toastError, toastWarning, toastInfo, dismiss,
  }), [toast, toastSuccess, toastError, toastWarning, toastInfo, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* ── Toast container — fixed bottom-right ──────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`
                flex items-start gap-3 p-4 rounded-xl border shadow-modal
                pointer-events-auto animate-slide-in-right
                ${STYLES[t.type]}
              `}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
