'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { EventMeta } from '@/lib/db/schema';

const TripSheet = dynamic(() => import('./TripSheet'), { ssr: false });

type Trip = {
  id: number; title: string; type?: string | null;
  startDate?: Date | null; endDate?: Date | null;
  who?: string | null; status?: string | null; notes?: string | null;
  transport?: string | null; accommodation?: string | null;
  approx?: boolean | null; meta?: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string; border: string }> = {
  planning: { label: 'PLANNING',  color: 'var(--text2)', border: 'var(--bg4)'  },
  refining: { label: 'REFINANDO', color: 'var(--amber)', border: '#2a2010'     },
  ready:    { label: 'LISTO',     color: 'var(--green)', border: '#1a3328'     },
  active:   { label: 'EN CURSO',  color: 'var(--blue)',  border: '#1a2a3a'     },
};

const TRANSPORT_ICONS: Record<string, string> = {
  avion: '✈', tren: '🚄', coche: '🚗', barco: '⛵', bus: '🚌',
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase();
}

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function TripDetailPanel({ trip }: { trip: Trip }) {
  const [editing, setEditing]        = useState(false);
  const [summary, setSummary]        = useState<string | null>(null);
  const [loadingSummary, setLoading] = useState(false);
  const router = useRouter();

  const meta: EventMeta = trip.meta ? JSON.parse(trip.meta) : {};
  const st   = STATUS_LABELS[trip.status ?? 'planning'] ?? STATUS_LABELS.planning;
  const days = daysUntil(trip.startDate);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${trip.id}/summary`);
      const data = await res.json();
      setSummary(data.summary);
    } finally { setLoading(false); }
  };

  return (
    <>
      <div style={{ flex: 1, maxWidth: 680, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>VIAJE</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '3px 9px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.accommodation?.trim() || trip.title)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', padding: '3px 9px', borderRadius: 999, border: '.5px solid #4285F433', color: '#4285F4', textDecoration: 'none', background: '#4285F408' }}
              >
                <svg viewBox="0 0 24 24" width={10} height={10} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                MAPS
              </a>
              <button onClick={() => setEditing(true)} style={{
                fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em',
                color: 'var(--text3)', background: 'none', border: '.5px solid var(--bg4)',
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              }}>EDITAR</button>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 22, color: 'var(--text)', marginBottom: 10 }}>
            {trip.title}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {trip.who && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--purple)' }}>
                👥 {trip.who.toUpperCase()}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--blue)' }}>
              📅 {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}{trip.approx ? ' ~' : ''}
            </span>
            {days !== null && days > 0 && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid #1a2a3a', color: 'var(--blue)' }}>
                {days} DÍAS
              </span>
            )}
            {days !== null && days <= 0 && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid #1a3328', color: 'var(--green)' }}>
                EN CURSO
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          <Section title="LOGÍSTICA">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: trip.transport ? (trip.transport.split(',').filter(Boolean).map(t => TRANSPORT_ICONS[t] ?? '🧳').join(' ') || '✈') : '✈', label: 'TRANSPORTE', data: trip.transport ? trip.transport.split(',').filter(Boolean).map(t => TRANSPORT_ICONS[t] ?? t).join('  ') : null, ok: !!trip.transport },
                { icon: '🏨', label: 'ALOJAMIENTO', data: trip.accommodation ?? null, ok: !!trip.accommodation },
                { icon: '💰', label: 'PRESUPUESTO', data: meta.budget ? `${meta.budget.total} ${meta.budget.currency}` : null, ok: !!meta.budget },
                { icon: '📋', label: 'DOCUMENTOS', data: meta.documents?.length ? `${meta.documents.length} docs` : null, ok: !!(meta.documents?.length) },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--bg2)', border: '.5px solid var(--bg4)',
                  borderLeft: item.ok ? '2px solid var(--green)' : '2px solid var(--bg4)',
                  borderRadius: '0 10px 10px 0', padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{item.icon}</span>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.14em', color: item.ok ? 'var(--green)' : 'var(--amber)' }}>{item.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: item.ok ? 'var(--text)' : 'var(--text3)', lineHeight: 1.3 }}>
                    {item.data ?? 'Pendiente'}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {meta.documents && meta.documents.length > 0 && (
            <Section title="DOCUMENTOS">
              {meta.documents.map((doc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '.5px solid var(--bg4)' }}>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)' }}>{doc.name}</span>
                  {doc.notes && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.06em' }}>{doc.notes}</span>}
                </div>
              ))}
            </Section>
          )}

          {meta.schedule && meta.schedule.length > 0 && (
            <Section title="ITINERARIO">
              {meta.schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--blue)', letterSpacing: '.06em', flexShrink: 0, paddingTop: 2 }}>
                    {new Date(s.day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{s.description}</div>
                </div>
              ))}
            </Section>
          )}

          {trip.notes && (
            <Section title="NOTAS">
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: 'var(--text2)' }}>{trip.notes}</div>
            </Section>
          )}

          {/* Resumen compartible */}
          <div style={{ marginTop: 8, padding: '14px 16px', background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 10 }}>COMPARTIR</div>
            {summary ? (
              <>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: 'var(--text)', marginBottom: 12 }}>{summary}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(summary); }}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '.5px solid var(--bg4)', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em' }}>
                    COPIAR
                  </button>
                  <button onClick={() => setSummary(null)}
                    style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '.5px solid var(--bg4)', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 10 }}>
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <button onClick={generateSummary} disabled={loadingSummary} style={{
                width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '.5px solid rgba(196,168,106,0.3)',
                color: 'var(--gold2)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em',
              }}>
                {loadingSummary ? 'GENERANDO···' : '✦ GENERAR RESUMEN PARA COMPARTIR'}
              </button>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <TripSheet
          trip={trip}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); router.refresh(); }}
        />
      )}
    </>
  );
}
