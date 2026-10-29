import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error';

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className="glass-card pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-ink"
            role="status"
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${toast.tone === 'error' ? 'bg-[#d9775f]' : 'bg-gold'}`}
            />
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
