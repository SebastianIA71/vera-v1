'use client';
import { useState, useEffect, useRef } from 'react';

const DURATIONS = [
  { label: '1h',  hours: 1 },
  { label: '2h',  hours: 2 },
  { label: '4h',  hours: 4 },
  { label: '8h',  hours: 8 },
];

function remaining(until: string): string {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
}

export default function FocusToggle() {
  const [active, setActive] = useState(false);
  const [until, setUntil] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [rem, setRem] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const load = () =>
    fetch('/api/focus').then(r => r.json()).then(d => {
      setActive(d.active); setUntil(d.until ?? null);
    }).catch(() => {});

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active || !until) return;
    setRem(remaining(until));
    const id = setInterval(() => {
      const r = remaining(until);
      if (!r) { setActive(false); setUntil(null); clearInterval(id); }
      else setRem(r);
    }, 30000);
    return () => clearInterval(id);
  }, [active, until]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activate = async (hours: number) => {
    const d = await fetch('/api/focus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours }) }).then(r => r.json());
    setActive(true); setUntil(d.until); setRem(remaining(d.until)); setOpen(false);
  };

  const deactivate = async () => {
    await fetch('/api/focus', { method: 'DELETE' });
    setActive(false); setUntil(null); setRem(''); setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={active ? `Focus hasta ${rem}` : 'Activar modo focus'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', border: `.5px solid ${active ? 'var(--purple)' : 'var(--bg4)'}`,
          borderRadius: 999, background: active ? 'var(--purple)18' : 'transparent',
          cursor: 'pointer', color: active ? 'var(--purple)' : 'var(--text3)',
          fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bg4)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; } }}
      >
        <span style={{ fontSize: 13, animation: active ? 'focusPulse 3s ease-in-out infinite' : 'none' }}>🌙</span>
        {active && rem && <span>{rem}</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 200,
          background: 'var(--bg2)', border: '.5px solid var(--bg4)',
          borderRadius: 12, padding: 12, minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', marginBottom: 8 }}>
            MODO FOCUS
          </div>
          {active ? (
            <>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--purple)', marginBottom: 10 }}>
                Activo · {rem} restantes
              </div>
              <button onClick={deactivate} style={{
                width: '100%', padding: '8px', borderRadius: 8, border: '.5px solid var(--red)',
                background: 'transparent', color: 'var(--red)', fontFamily: 'var(--font-dm-mono)',
                fontSize: 10, letterSpacing: '.14em', cursor: 'pointer',
              }}>DESACTIVAR</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DURATIONS.map(d => (
                <button key={d.hours} onClick={() => activate(d.hours)} style={{
                  padding: '8px 12px', borderRadius: 8, border: '.5px solid var(--bg4)',
                  background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)',
                  fontSize: 11, letterSpacing: '.12em', cursor: 'pointer', textAlign: 'left',
                  transition: 'background .1s, color .1s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--purple)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; }}
                >{d.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes focusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
