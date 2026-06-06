'use client';

import { useRouter } from 'next/navigation';
import SectionLabel from './SectionLabel';

export default function InboxSection({ inboxCount }: { inboxCount: number }) {
  const router = useRouter();
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Inbox" link="→" onLinkClick={() => router.push('/inbox')} />
      <div
        onClick={() => router.push('/inbox')}
        style={{ border: '.5px dashed #2c2c2a', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
      >
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 28, color: 'var(--gold)', lineHeight: 1, minWidth: 32 }}>{inboxCount}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)' }}>capturas sin procesar</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 4 }}>INBOX</div>
        </div>
        <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 16 }}>→</span>
      </div>
    </div>
  );
}
