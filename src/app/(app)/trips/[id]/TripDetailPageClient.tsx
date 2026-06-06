'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

type PackingCategory = { name: string; items: string[] };

function PackingSection({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<PackingCategory[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');

  const generate = async () => {
    setLoading(true); setNotice('');
    const r = await fetch('/api/agents/packing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        who: trip.who,
        notes: trip.notes,
      }),
    });
    const d = await r.json();
    if (d.categories) setCategories(d.categories);
    else setNotice(d.notice ?? 'Error');
    setLoading(false);
  };

  const toggle = (key: string) => setChecked(c => ({ ...c, [key]: !c[key] }));
  const total = categories.reduce((s, c) => s + c.items.length, 0);
  const done  = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ margin: '0 16px 24px', border: '.5px solid var(--bg4)', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && categories.length === 0) generate(); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg2)', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎒</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', color: 'var(--text2)' }}>EQUIPAJE IA</span>
          {categories.length > 0 && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: done === total ? 'var(--green)' : 'var(--text3)', letterSpacing: '.1em' }}>
              {done}/{total}
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderTop: '.5px solid var(--bg4)' }}>
          {loading && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--gold2)', letterSpacing: '.14em', padding: '8px 0' }}>···</div>}
          {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--red)' }}>{notice}</div>}
          {categories.map(cat => (
            <div key={cat.name} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', marginBottom: 6 }}>{cat.name}</div>
              {cat.items.map(item => {
                const key = `${cat.name}:${item}`;
                return (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer', borderBottom: '.5px solid var(--bg4)' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `.5px solid ${checked[key] ? 'var(--green)' : 'var(--bg4)'}`,
                      background: checked[key] ? 'var(--green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: 'var(--bg)',
                    }} onClick={() => toggle(key)}>
                      {checked[key] ? '✓' : ''}
                    </span>
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: checked[key] ? 'var(--text3)' : 'var(--text)', textDecoration: checked[key] ? 'line-through' : 'none' }}>
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
          {categories.length > 0 && (
            <button onClick={generate} style={{ marginTop: 8, background: 'none', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 14px', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', cursor: 'pointer' }}>
              ↻ REGENERAR
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
      <PackingSection trip={trip} />
    </div>
  );
}
