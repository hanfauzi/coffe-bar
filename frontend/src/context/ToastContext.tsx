import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toastState, setToastState] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastState({ type, message });
    // Reset toast state after 4 seconds
    const timer = setTimeout(() => setToastState(null), 4000);
    return () => clearTimeout(timer);
  };

  const toastHelpers = {
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
  };

  return (
    <ToastContext.Provider value={{ toast: toastHelpers }}>
      {children}
      {toastState && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 rounded-lg border text-xs shadow-sm transition-all ${
          toastState.type === 'success' 
            ? 'bg-success/10 border-success/30 text-success' 
            : 'bg-error/10 border-error/30 text-error'
        }`}>
          {toastState.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
          <span>{toastState.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
