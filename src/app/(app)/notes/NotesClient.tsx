'use client';

import { useState } from 'react';
import DesktopShell from '@/components/layout/DesktopShell';
import MobilePageHeader from '@/components/layout/MobilePageHeader';
import NotesEditor from '@/components/notes/NotesEditor';

export default function NotesClient() {
  const [isMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 769);

  const inner = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isMobile && <MobilePageHeader title="Notas" />}

      <div style={{ padding: isMobile ? '16px 18px' : '20px 24px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: isMobile ? 22 : 28, color: 'var(--text)', lineHeight: 1.1 }}>
          Notas
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', color: 'var(--text3)', marginTop: 4 }}>
          SIN ESTRUCTURA · SE GUARDA SOLA
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 18px 90px' : '20px 24px' }}>
        <NotesEditor minHeight={isMobile ? 400 : 500} />
      </div>
    </div>
  );

  if (isMobile) return inner;
  return (
    <DesktopShell urgentCount={0} staleCount={0} inboxCount={0}>
      {inner}
    </DesktopShell>
  );
}
