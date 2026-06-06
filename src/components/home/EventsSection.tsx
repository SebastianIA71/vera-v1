'use client';

import { useRouter } from 'next/navigation';
import SectionLabel from './SectionLabel';
import type { EventItem } from './types';

export default function EventsSection({ nextEvent }: { nextEvent: EventItem | null }) {
  const router = useRouter();
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Upcoming Events" link="→" onLinkClick={() => router.push('/trips?type=social')} />
      {nextEvent ? (
        <div
          onClick={() => router.push(`/trips/${nextEvent.id}`)}
          style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>{nextEvent.title}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', letterSpacing: '.12em', marginTop: 4 }}>
              {new Date(nextEvent.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
            </div>
            {nextEvent.who && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em', marginTop: 2 }}>{nextEvent.who.toUpperCase()}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: nextEvent.daysTo <= 0 ? 13 : 22, color: 'var(--purple)', lineHeight: 1 }}>
              {nextEvent.daysTo <= 0 ? 'HOY' : nextEvent.daysTo}
            </div>
            {nextEvent.daysTo > 0 && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em' }}>DÍAS</div>}
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em', padding: '12px 2px' }}>
          Sin eventos próximos · toca + para añadir
        </div>
      )}
    </div>
  );
}
