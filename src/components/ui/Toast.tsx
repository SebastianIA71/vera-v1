'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; type: ToastType };

interface ToastCtxType { toast: (message: string, type?: ToastType) => void }
const ToastCtx = createContext<ToastCtxType>({ toast: () => {} });

let _id = 0;

const COLOR: Record<ToastType, string> = {
  success: 'var(--green)',
  error:   'var(--red)',
  info:    'var(--gold2)',
};
const ICON: Record<ToastType, string> = { success: '✓', error: '✗', info: '·' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 88,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: 6,
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: 'var(--bg3)',
              border: `.5px solid ${COLOR[t.type]}`,
              borderRadius: 99,
              padding: '9px 18px',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: 11,
              letterSpacing: '.14em',
              color: COLOR[t.type],
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              animation: 'toastIn .18s ease',
            }}
          >
            {ICON[t.type]} {t.message.toUpperCase()}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
