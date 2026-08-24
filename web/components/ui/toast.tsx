'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Copy } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  code?: string;
}

interface ToastContextType {
  showToast: (message: string, code?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, code?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-2), { id, message, code }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none w-auto max-w-[90vw]"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-950/95 border border-neutral-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(52,211,153,0.18),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md text-xs font-mono text-white"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
                <CheckCircle2 size={13} className="text-emerald-400" />
              </span>

              <span className="font-medium text-neutral-200">{t.message}</span>

              {t.code && (
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-400 text-[11px] font-mono select-all">
                  {t.code}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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
