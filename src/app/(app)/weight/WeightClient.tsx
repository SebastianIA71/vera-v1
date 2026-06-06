'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';

type WeightEntry = {
  id: number; date: string; value: number;
  snmAgua?: boolean | null; snmCaminar?: boolean | null;
  snmEntreno?: boolean | null; snmEscucha?: boolean | null; snmDisfruta?: boolean | null;
  notes?: string | null;
};

const SNM = [
  { key: 'snmAgua', icon: '💧' }, { key: 'snmCaminar', icon: '🚶' },
  { key: 'snmEntreno', icon: '💪' }, { key: 'snmEscucha', icon: '🧘' },
  { key: 'snmDisfruta', icon: '🍴' },
];

function fmt(d: string) {
  const [y, m, day] = d.split('-');
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return `${day} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function trendPath(logs: WeightEntry[], w: number, h: number): string {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return '';
  const vals = sorted.map(l => l.value);
  const min = Math.min(...vals) - 0.3;
  const max = Math.max(...vals) + 0.3;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  return `M${points.join(' L')}`;
}

function EntryForm({ onSaved }: { onSaved: (e: WeightEntry) => void }) {
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!val || isNaN(Number(val))) return;
    setSaving(true);
    const res = await fetch('/api/weight', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: Number(val) }),
    });
    if (res.ok) { const e = await res.json(); onSaved(e); setVal(''); }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 28 }}>
      <input
        type="number" step="0.1" value={val} onChange={e => setVal(e.target.value)}
        placeholder="Peso hoy (kg)"
        onKeyDown={e => e.key === 'Enter' && save()}
        style={{
          flex: 1, background: 'var(--bg3)', border: '.5px solid var(--bg4)',
          borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
          fontFamily: 'var(--font-dm-mono)', fontSize: 15, outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--gold2)')}
        onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
      />
      <button
        onClick={save} disabled={saving || !val}
        style={{
          padding: '11px 20px', borderRadius: 10, border: 'none',
          background: val ? 'var(--gold2)' : 'var(--bg3)',
          color: val ? 'var(--bg)' : 'var(--text3)',
          fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em',
          cursor: val && !saving ? 'pointer' : 'default',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? '···' : 'GUARDAR'}
      </button>
    </div>
  );
}

export default function WeightClient({ initialLogs }: { initialLogs: WeightEntry[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const chartLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const W = 400; const H = 80;
  const path = trendPath(chartLogs, W, H);
  const latest = sorted[0];
  const prev = sorted[1];
  const trend = latest && prev
    ? latest.value > prev.value ? { label: 'SUBIENDO', color: 'var(--amber)' }
    : latest.value < prev.value ? { label: 'BAJANDO', color: 'var(--green)' }
    : { label: 'ESTABLE', color: 'var(--text3)' }
    : null;

  const onSaved = (e: WeightEntry) => {
    setLogs(prev => {
      const without = prev.filter(l => l.date !== e.date);
      return [...without, e].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  const inner = (
    <div style={{ maxWidth: 560, padding: '24px 22px 80px' }}>
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
        Peso <em style={{ fontStyle: 'italic', color: 'var(--green)' }}>historial</em>
      </div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 24 }}>
        {logs.length} REGISTROS
      </div>

      {/* Registro de hoy */}
      <EntryForm onSaved={onSaved} />

      {/* Gráfica */}
      {path && (
        <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            {latest && (
              <div>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 36, color: 'var(--text)', lineHeight: 1 }}>{latest.value}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>KG · {fmt(latest.date)}</div>
              </div>
            )}
            {trend && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: trend.color, letterSpacing: '.12em' }}>
                {trend.label}
              </div>
            )}
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
            <path d={path} fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((entry, i) => {
          const prev2 = sorted[i + 1];
          const delta = prev2 ? entry.value - prev2.value : null;
          const dColor = delta === null ? 'var(--text3)' : delta > 0 ? 'var(--amber)' : delta < 0 ? 'var(--green)' : 'var(--text3)';
          return (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, background: i === 0 ? 'var(--bg2)' : 'transparent',
              border: i === 0 ? '.5px solid var(--bg4)' : '.5px solid transparent',
            }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.08em', minWidth: 80 }}>
                {fmt(entry.date)}
              </div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 18, color: i === 0 ? 'var(--text)' : 'var(--text2)', flex: 1 }}>
                {entry.value}
              </div>
              {delta !== null && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: dColor, letterSpacing: '.06em', minWidth: 40, textAlign: 'right' }}>
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 3 }}>
                {SNM.map(s => (
                  <span key={s.key} style={{ fontSize: 12, opacity: entry[s.key as keyof WeightEntry] ? 1 : 0.15 }}>{s.icon}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--text3)' }}>
          SIN REGISTROS · AÑADE EL PRIMERO ARRIBA
        </div>
      )}
    </div>
  );

  return (
    <DesktopShell urgentCount={0} staleCount={0} inboxCount={0}>
      <div style={{ flex: 1, overflowY: 'auto' }}>{inner}</div>
    </DesktopShell>
  );
}
