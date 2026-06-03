'use client';

import { useEffect, useState } from 'react';

export default function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        // Escuchar cuando haya una instalación en espera
        const handleUpdateFound = () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay un nuevo SW instalado pero esperando
              setUpdateAvailable(true);
            }
          });
        };

        reg.addEventListener('updatefound', handleUpdateFound);

        // Buscar actualizaciones cada 1 minuto
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60000);
      } catch (err) {
        console.error('Update check failed:', err);
      }
    };

    checkUpdates();
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      onClick={() => window.location.reload()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'var(--gold2)',
        color: 'var(--bg)',
        padding: '12px 16px',
        fontFamily: 'var(--font-dm-mono)',
        fontSize: 12,
        letterSpacing: '.14em',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'background .2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold2)')}
    >
      ✦ NUEVA VERSIÓN DISPONIBLE — TOCA PARA ACTUALIZAR
    </div>
  );
}
