'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const CaptureSheet = dynamic(() => import('./CaptureSheet'), { ssr: false });

export default function FAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    router.refresh(); // refresca el server component — actualiza inbox count
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="captura rápida"
        style={{
          position: 'fixed', right: 24, bottom: 28, width: 58, height: 58,
          borderRadius: '50%', background: 'var(--bg)', border: '.5px solid var(--gold2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, cursor: 'pointer', color: 'var(--gold)',
          boxShadow: '0 4px 24px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: '.5px solid rgba(196,168,106,.15)' }} />
        <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="13" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </button>
      {open && <CaptureSheet onClose={handleClose} />}
    </>
  );
}
