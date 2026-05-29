'use client';

import { useState } from 'react';
import DesktopShell from '@/components/layout/DesktopShell';

type Trip = { id: number; title: string; startDate?: Date | null; endDate?: Date | null; who?: string | null; status?: string | null; notes?: string | null; transport?: string | null; accommodation?: string | null };
type Task = { id: number; title: string; status?: string | null; prioFinal?: number | null; relatedTaskId?: number | null };

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase();
}

const STATUS_LABELS: Record<string, { label: string; color: string; border: string }> = {
  planning:  { label: 'PLANNING',   color: 'var(--text2)', border: 'var(--bg4)' },
  refining:  { label: 'REFINANDO',  color: 'var(--amber)', border: '#2a2010' },
  ready:     { label: 'LISTO',      color: 'var(--green)', border: '#1a3328' },
  active:    { label: 'EN CURSO',   color: 'var(--blue)',  border: '#1a2a3a' },
};

export default function TripsClient({ trips, allTasks, urgentCount, staleCount, inboxCount }: {
  trips: Trip[];
  allTasks: Task[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
}) {
  const [selected, setSelected] = useState<Trip | null>(trips[0] ?? null);

  const now = new Date();
  const nextTrip = trips.find(t => t.startDate && new Date(t.startDate) > now);

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
      {/* Lista */}
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', borderRight: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ padding: '14px 18px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em' }}>
            Viajes <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>2026</em>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)', marginTop: 4 }}>
            {trips.length} VIAJES PLANIFICADOS
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {trips.map(trip => {
            const days = daysUntil(trip.startDate);
            const isNext = trip.id === nextTrip?.id;
            const isSel = selected?.id === trip.id;
            const st = STATUS_LABELS[trip.status ?? 'planning'] ?? STATUS_LABELS.planning;

            return (
              <div key={trip.id} onClick={() => setSelected(trip)} style={{
                padding: '14px 18px', borderBottom: '.5px solid var(--bg2)',
                cursor: 'pointer', position: 'relative', transition: 'background .1s',
                background: isSel ? 'var(--bg2)' : 'transparent',
              }}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: isSel ? 'var(--gold2)' : isNext ? 'var(--blue)' : 'transparent' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 14, color: 'var(--text)', letterSpacing: '-.005em', lineHeight: 1.2 }}>{trip.title}</div>
                  {days !== null && (
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: days > 0 ? 'var(--blue)' : 'var(--green)', lineHeight: 1 }}>{Math.abs(days)}</div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.14em', color: 'var(--text2)' }}>{days > 0 ? 'DÍAS' : 'EN CURSO'}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text4)', flexWrap: 'wrap', marginBottom: 6 }}>
                  {trip.who && <span style={{ color: 'var(--text2)' }}>{trip.who.toUpperCase()}</span>}
                  <span>·</span>
                  <span>{fmtDate(trip.startDate)}–{fmtDate(trip.endDate)}</span>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {trip.transport && (
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', padding: '2px 6px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--green)' }}>✈ TRANSPORTE</span>
                  )}
                  {trip.accommodation && (
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', padding: '2px 6px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--green)' }}>🏨 ALOJAMIENTO</span>
                  )}
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', padding: '2px 6px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle */}
      {selected ? (
        <TripDetail trip={selected} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SELECCIONA UN VIAJE</div>
        </div>
      )}
    </DesktopShell>
  );
}

function TripDetail({ trip }: { trip: Trip }) {
  const days = daysUntil(trip.startDate);
  const st = STATUS_LABELS[trip.status ?? 'planning'] ?? STATUS_LABELS.planning;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>DETALLE</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '3px 9px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 8 }}>{trip.title}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {trip.who && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--gold2)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
              {trip.who.toUpperCase()}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--gold2)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
            {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}
          </span>
          {days !== null && days > 0 && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid #1a2a3a', color: 'var(--blue)' }}>
              {days} DÍAS
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
        {/* Logística */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 10 }}>LOGÍSTICA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { icon: '✈', label: 'TRANSPORTE', data: trip.transport },
            { icon: '🏨', label: 'ALOJAMIENTO', data: trip.accommodation },
            { icon: '📋', label: 'DOCUMENTACIÓN', data: null },
            { icon: '💰', label: 'PRESUPUESTO', data: null },
          ].map(item => (
            <div key={item.label} style={{
              background: item.data ? 'var(--bg2)' : 'transparent',
              border: `.5px solid ${item.data ? 'var(--bg4)' : 'var(--bg4)'}`,
              borderRadius: 10, padding: '11px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color: item.data ? 'var(--green)' : 'var(--amber)' }}>
                  {item.label}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: '#c8c6be', lineHeight: 1.4 }}>
                {item.data ?? <span style={{ color: 'var(--text3)' }}>Pendiente</span>}
              </div>
            </div>
          ))}
        </div>

        {trip.notes && (
          <>
            <div style={{ height: .5, background: 'var(--bg4)', margin: '14px 0' }} />
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 10 }}>NOTAS</div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: '#c8c6be' }}>{trip.notes}</div>
          </>
        )}
      </div>
    </div>
  );
}
