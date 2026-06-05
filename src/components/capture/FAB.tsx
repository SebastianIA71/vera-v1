'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const CaptureSheet = dynamic(() => import('./CaptureSheet'), { ssr: false });

export default function FAB() {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        aria-label="Captura de voz"
        style={{
          position: 'fixed', right: 22, bottom: 82,
          width: 62, height: 62, borderRadius: '50%',
          background: pressed ? 'var(--bg3)' : 'var(--bg2)',
          border: '.5px solid var(--bg4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, cursor: 'pointer',
          transform: pressed ? 'scale(0.94)' : 'scale(1)',
          transition: 'transform .12s ease, background .12s ease, box-shadow .12s ease',
          boxShadow: pressed
            ? '0 2px 8px rgba(196,168,106,0.15)'
            : '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(196,168,106,0.3)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: '1px solid rgba(196,168,106,0.2)',
          animation: 'fab-pulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          border: '.5px solid rgba(196,168,106,0.3)',
        }} />
        <svg viewBox="0 0 24 24" width={24} height={24} fill="none"
          stroke="var(--gold2)" strokeWidth={1.4}
          strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="13" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </button>

      <style>{`
        @keyframes fab-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.06); }
        }
      `}</style>

      {open && <CaptureSheet onClose={handleClose} />}
    </>
  );
}
