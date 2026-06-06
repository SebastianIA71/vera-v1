'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline  = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online',  onOnline);
    // Check initial state
    if (!navigator.onLine) setOffline(true);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online',  onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9998,
      background: 'var(--bg3)',
      borderBottom: '.5px solid var(--amber)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
      <span style={{
        fontFamily: 'var(--font-dm-mono)',
        fontSize: 11,
        letterSpacing: '.14em',
        color: 'var(--amber)',
      }}>
        SIN CONEXIÓN · LAS CAPTURAS SE GUARDARÁN AL VOLVER
      </span>
    </div>
  );
}
