'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const TripDetailPanel = dynamic(() => import('@/components/events/TripDetail'), { ssr: false });

type Trip = {
  id: number; title: string; type?: string | null;
  startDate?: Date | null; endDate?: Date | null;
  who?: string | null; status?: string | null; notes?: string | null;
  transport?: string | null; accommodation?: string | null;
  approx?: boolean | null; meta?: string | null;
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase();
}

const STATUS_LABELS: Record<string, { label: string; color: string; border: string }> = {
  planning: { label: 'PLANNING',  color: 'var(--text2)', border: 'var(--bg4)'  },
  refining: { label: 'REFINANDO', color: 'var(--amber)', border: '#2a2010'     },
  ready:    { label: 'LISTO',     color: 'var(--green)', border: '#1a3328'     },
  active:   { label: 'EN CURSO',  color: 'var(--blue)',  border: '#1a2a3a'     },
};

export default function TripDetailPageClient({ trip }: { trip: Trip }) {
  const router = useRouter();
  const isViaje = trip.type === 'viaje' || !trip.type;
  const st = STATUS_LABELS[trip.status ?? 'planning'] ?? STATUS_LABELS.planning;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '.5px solid var(--bg4)' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', padding: 0 }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          ATRÁS
        </button>
      </div>
      {isViaje ? (
        <TripDetailPanel trip={trip} />
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>EVENTO</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 22, color: 'var(--text)', marginBottom: 12 }}>{trip.title}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {trip.who && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--purple)' }}>👥 {trip.who.toUpperCase()}</span>}
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--blue)' }}>
              📅 {fmtDate(trip.startDate)}{trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ''}
            </span>
          </div>
          {trip.notes && (
            <div style={{ padding: '16px 0', fontFamily: 'var(--font-dm-sans)', fontSize: 13, lineHeight: 1.6, color: 'var(--text2)', borderTop: '.5px solid var(--bg4)' }}>{trip.notes}</div>
          )}
        </div>
      )}
    </div>
  );
}
