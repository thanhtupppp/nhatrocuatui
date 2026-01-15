import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Default durations by type
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 6000,
  warning: 4000,
  info: 2500
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    // Prevent duplicate toasts with same message
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev;
      
      const id = Date.now();
      const finalDuration = duration ?? DEFAULT_DURATIONS[type];
      return [...prev, { id, message, type, duration: finalDuration }];
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <CheckCircle size={18} />,
    error: <X size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />
  };

  const colors = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-rose-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-indigo-500 text-white'
  };

  return (
    <div 
      className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300 ${colors[toast.type]}`}
    >
      {icons[toast.type]}
      <span className="font-semibold text-sm">{toast.message}</span>
      <button 
        onClick={() => onRemove(toast.id)} 
        className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
