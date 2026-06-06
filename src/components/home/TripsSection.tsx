'use client';

import { useRouter } from 'next/navigation';
import SectionLabel from './SectionLabel';
import type { Trip } from './types';

function transportIcon(t: string) {
  const v = t.toLowerCase().trim();
  if (v.includes('avi') || v.includes('vuelo') || v.includes('fly')) return '✈';
  if (v.includes('tren') || v.includes('train') || v.includes('ave')) return '🚄';
  if (v.includes('coche') || v.includes('car')) return '🚗';
  if (v.includes('barco') || v.includes('ferry')) return '⛵';
  if (v.includes('bus')) return '🚌';
  return '🧳';
}
function transportIcons(t: string) { return t.split(',').filter(Boolean).map(v => transportIcon(v)).join(' '); }

export default function TripsSection({ nextTrip }: { nextTrip: Trip }) {
  const router = useRouter();
  const durDays = nextTrip.endDate && nextTrip.startDate
    ? Math.ceil((new Date(nextTrip.endDate).getTime() - new Date(nextTrip.startDate).getTime()) / 86400000)
    : null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Upcoming trips" link="→" onLinkClick={() => router.push('/trips')} />
      <div
        onClick={() => router.push(`/trips/${nextTrip.id}`)}
        style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {nextTrip.transport && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, lineHeight: 1, flexShrink: 0 }}>{transportIcons(nextTrip.transport)}</span>}
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)', letterSpacing: '-.01em' }}>{nextTrip.title}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', letterSpacing: '.12em' }}>
                {new Date(nextTrip.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
              </span>
              {durDays && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)' }}>· {durDays}D</span>}
            </div>
            {nextTrip.who && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em', marginTop: 2 }}>{nextTrip.who.toUpperCase()}</div>}
          </div>
          <div style={{ flexShrink: 0, marginLeft: 12, textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: nextTrip.daysTo <= 0 ? 13 : 26, color: 'var(--blue)', lineHeight: 1 }}>
              {nextTrip.daysTo <= 0 ? 'HOY' : nextTrip.daysTo}
            </div>
            {nextTrip.daysTo > 0 && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text2)', marginTop: 2 }}>DÍAS</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
