import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 border backdrop-blur-xl ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
              toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
              'bg-sky-500/10 border-sky-500/20 text-sky-500'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <XCircle size={20} />}
            {toast.type === 'warning' && <AlertTriangle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            
            <p className="text-sm font-bold tracking-tight">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
