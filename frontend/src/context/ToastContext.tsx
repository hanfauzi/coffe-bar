import { createContext, useContext, useState, useRef } from 'react';
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
  const [visible, setVisible] = useState(false);
  const enterTimerRef = useRef<any>(null);
  const exitTimerRef = useRef<any>(null);
  const resetTimerRef = useRef<any>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    // Clear any existing timers
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    setToastState({ type, message });
    setVisible(false);

    // Slide in
    enterTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, 10);

    // Slide out
    exitTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 3600);

    // Unmount
    resetTimerRef.current = setTimeout(() => {
      setToastState(null);
    }, 4000);
  };

  const toastHelpers = {
    success: (message: string) => showToast('success', message),
    error: (message: string) => showToast('error', message),
  };

  return (
    <ToastContext.Provider value={{ toast: toastHelpers }}>
      {children}
      {toastState && (
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 rounded-lg border text-xs shadow-md transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            visible 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          } ${
            toastState.type === 'success' 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-error/10 border-error/30 text-error'
          }`}
        >
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
