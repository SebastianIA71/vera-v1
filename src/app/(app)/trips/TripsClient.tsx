'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';
import dynamic from 'next/dynamic';
const TripSheet       = dynamic(() => import('@/components/events/TripSheet'),      { ssr: false });
const TripDetailPanel = dynamic(() => import('@/components/events/TripDetail'),     { ssr: false });
const NewEventSheet   = dynamic(() => import('@/components/events/NewEventSheet'),  { ssr: false });

type Trip = {
  id: number; title: string; type?: string | null;
  startDate?: Date | null; endDate?: Date | null;
  who?: string | null; status?: string | null; notes?: string | null;
  transport?: string | null; accommodation?: string | null;
  approx?: boolean | null; meta?: string | null;
};
type Task = { id: number; title: string; status?: string | null; prioFinal?: number | null };

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function mapsUrl(title: string, accommodation?: string | null): string {
  const q = accommodation?.trim() || title.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function MapsBtn({ title, accommodation }: { title: string; accommodation?: string | null }) {
  return (
    <a
      href={mapsUrl(title, accommodation)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em',
        padding: '2px 7px', borderRadius: 999,
        border: '.5px solid #4285F433', color: '#4285F4',
        background: '#4285F408', textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width={8} height={8} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      MAPS
    </a>
  );
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
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('type') === 'social' ? 'event' : 'viaje';
  const [tab,          setTab]          = useState<'viaje' | 'event'>(initialTab);
  const [selected,     setSelected]     = useState<Trip | null>(null);
  const [isMobile,     setIsMobile]     = useState(false);
  const [showNewTrip,  setShowNewTrip]  = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [editingTrip,  setEditingTrip]  = useState<Trip | null>(null);
  const router = useRouter();

  const filteredTrips = trips.filter(t =>
    tab === 'viaje' ? (t.type === 'viaje' || t.type == null) : t.type !== 'viaje'
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const now = new Date();
  const nextTrip = filteredTrips.find(t => t.startDate && new Date(t.startDate) > now);

  // ── Móvil: detalle ──
  if (isMobile && selected) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '.5px solid var(--bg4)' }}>
          <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', padding: 0 }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {tab === 'viaje' ? 'VIAJES' : 'EVENTOS'}
          </button>
        </div>
        {selected.type === 'viaje' || !selected.type
          ? <TripDetailPanel trip={selected} />
          : <EventDetailSimple trip={selected} onEdit={() => setEditingTrip(selected)} />
        }
        {editingTrip && (
          editingTrip.type === 'viaje' || !editingTrip.type
            ? <TripSheet trip={editingTrip} onClose={() => setEditingTrip(null)} onSaved={() => { setEditingTrip(null); router.refresh(); }} />
            : <NewEventSheet event={editingTrip} onClose={() => setEditingTrip(null)} onUpdated={() => { setEditingTrip(null); router.refresh(); }} />
        )}
      </div>
    );
  }

  // ── Móvil: lista ──
  if (isMobile) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
        <div style={{ padding: '14px 18px 0', borderBottom: '.5px solid var(--bg4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)' }}>
              {tab === 'viaje' ? 'Viajes' : 'Eventos'} <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>2026</em>
            </div>
            <button onClick={() => tab === 'viaje' ? setShowNewTrip(true) : setShowNewEvent(true)}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg3)', border: '.5px solid var(--bg4)', color: 'var(--gold2)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+
            </button>
          </div>
          <div style={{ display: 'flex' }}>
            {(['viaje', 'event'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSelected(null); }}
                style={{ flex: 1, padding: '8px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--gold2)' : '2px solid transparent', color: tab === t ? 'var(--gold2)' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}>
                {t === 'viaje' ? 'VIAJES' : 'EVENTOS'}
              </button>
            ))}
          </div>
        </div>
        <div>
          {filteredTrips.map(trip => {
            const days = daysUntil(trip.startDate);
            const isNext = trip.id === nextTrip?.id;
            const st = STATUS_LABELS[trip.status ?? 'planning'] ?? STATUS_LABELS.planning;
            return (
              <div key={trip.id} onClick={() => setSelected(trip)} style={{ padding: '14px 18px', borderBottom: '.5px solid var(--bg2)', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: isNext ? 'var(--blue)' : 'transparent' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>{trip.title}</div>
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
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', padding: '2px 6px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
                  <MapsBtn title={trip.title} accommodation={trip.accommodation} />
                </div>
              </div>
            );
          })}
        </div>
        {showNewTrip  && <TripSheet onClose={() => setShowNewTrip(false)} onSaved={() => { setShowNewTrip(false); router.refresh(); }} />}
        {showNewEvent && <NewEventSheet onClose={() => setShowNewEvent(false)} onCreated={() => setShowNewEvent(false)} />}
      </div>
    );
  }

  // ── Desktop ──
  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
      {/* Lista */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', borderRight: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ padding: '14px 18px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em' }}>
              {tab === 'viaje' ? 'Viajes' : 'Eventos'} <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>2026</em>
            </div>
            <button onClick={() => tab === 'viaje' ? setShowNewTrip(true) : setShowNewEvent(true)}
              style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg3)', border: '.5px solid var(--bg4)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>+
            </button>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)', marginTop: 4 }}>
            {filteredTrips.length} {tab === 'viaje' ? 'VIAJES' : 'EVENTOS'}
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '.5px solid var(--bg4)' }}>
          {(['viaje', 'event'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelected(null); }} style={{
              flex: 1, padding: '10px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--gold2)' : '2px solid transparent',
              color: tab === t ? 'var(--gold2)' : 'var(--text3)',
              fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer',
            }}>
              {t === 'viaje' ? 'VIAJES' : 'EVENTOS'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredTrips.map(trip => {
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
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  {trip.transport && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, padding: '2px 6px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--green)' }}>✈ TRANSPORTE</span>}
                  {trip.accommodation && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, padding: '2px 6px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--green)' }}>🏨 ALOJAMIENTO</span>}
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, padding: '2px 6px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
                  <MapsBtn title={trip.title} accommodation={trip.accommodation} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle */}
      {selected ? (
        selected.type === 'viaje' || !selected.type
          ? <TripDetailPanel trip={selected} />
          : <EventDetailSimple trip={selected} onEdit={() => setEditingTrip(selected)} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>
            {tab === 'viaje' ? 'SELECCIONA UN VIAJE' : 'SELECCIONA UN EVENTO'}
          </div>
        </div>
      )}

      {showNewTrip  && <TripSheet onClose={() => setShowNewTrip(false)} onSaved={() => { setShowNewTrip(false); router.refresh(); }} />}
      {showNewEvent && <NewEventSheet onClose={() => setShowNewEvent(false)} onCreated={() => setShowNewEvent(false)} />}
      {editingTrip  && (
        editingTrip.type === 'viaje' || !editingTrip.type
          ? <TripSheet trip={editingTrip} onClose={() => setEditingTrip(null)} onSaved={() => { setEditingTrip(null); router.refresh(); }} />
          : <NewEventSheet event={editingTrip} onClose={() => setEditingTrip(null)} onUpdated={() => { setEditingTrip(null); router.refresh(); }} />
      )}
    </DesktopShell>
  );
}

// Detalle simple para eventos (no viajes)
function EventDetailSimple({ trip, onEdit }: { trip: Trip; onEdit?: () => void }) {
  const st = STATUS_LABELS[trip.status ?? 'planning'] ?? STATUS_LABELS.planning;
  return (
    <div style={{ flex: 1, maxWidth: 680, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>EVENTO</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 999, border: `.5px solid ${st.border}`, color: st.color }}>{st.label}</span>
            <MapsBtn title={trip.title} />
            {onEdit && <button onClick={onEdit} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', color: 'var(--text3)', background: 'none', border: '.5px solid var(--bg4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>EDITAR</button>}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>{trip.title}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {trip.who && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--purple)' }}>👥 {trip.who.toUpperCase()}</span>}
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--blue)' }}>
            📅 {fmtDate(trip.startDate)}{trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ''}
          </span>
        </div>
      </div>
      {trip.notes && (
        <div style={{ padding: '16px 20px', fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: 'var(--text2)' }}>{trip.notes}</div>
      )}
    </div>
  );
}
