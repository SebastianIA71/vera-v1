'use client';

import { useState, useEffect } from 'react';

type Task = { id: number; title: string; propertyId?: string | null; prio?: number | null; prioFinal?: number | null; status?: string | null };
type Property = { id: string; name: string; color: string | null; icon: string | null };

const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
  fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em',
  color: 'var(--text3)', marginBottom: 6, display: 'block',
};

export default function NewTaskModal({
  onClose,
  onCreated,
  defaultPropertyId,
  defaultProjectId,
}: {
  onClose: () => void;
  onCreated: (t: Task) => void;
  defaultPropertyId?: string;
  defaultProjectId?: number;
}) {
  const [title, setTitle]           = useState('');
  const [prio, setPrio]             = useState(5);
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? '');
  const [projectId, setProjectId]   = useState<number | null>(defaultProjectId ?? null);
  const [tripTitle, setTripTitle]   = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [propList, setPropList]     = useState<Property[]>([]);
  const [projList, setProjList]     = useState<{id: number; name: string; color: string | null}[]>([]);
  const [tripList, setTripList]     = useState<{id: number; title: string}[]>([]);

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: Property[]) => setPropList(data))
      .catch(() => {});
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: {id: number; name: string; color: string | null; status: string | null}[]) =>
        setProjList(data.filter(p => p.status === 'active' || p.status === 'paused')))
      .catch(() => {});
    fetch('/api/events?type=viaje')
      .then(r => r.json())
      .then((data: {id: number; title: string}[]) => setTripList(data))
      .catch(() => {});
  }, []);

  const canSave = title.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, prio, propertyId: propertyId || null, projectId: projectId ?? null, tags: tripTitle ?? null }),
    });
    if (res.ok) { const task = await res.json(); onCreated(task); }
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 24 }}>
          Nueva <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>tarea</em>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={LABEL}>TÍTULO</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Qué hay que hacer..." style={INPUT} />
          </div>

          <div>
            <label style={LABEL}>PRIORIDAD</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[9,8,7,6,5,4,3,2,1].map(n => (
                <button key={n} onClick={() => setPrio(n)} style={{
                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                  border: `.5px solid ${prio === n ? (n >= 8 ? 'var(--red)' : n >= 6 ? 'var(--amber)' : 'var(--gold2)') : 'var(--bg4)'}`,
                  background: prio === n ? 'rgba(196,168,106,0.1)' : 'transparent',
                  color: prio === n ? 'var(--text)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 13,
                }}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={LABEL}>PROPIEDAD (opcional)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setPropertyId('')} style={{
                padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                border: `.5px solid ${propertyId === '' ? 'var(--gold2)' : 'var(--bg4)'}`,
                background: propertyId === '' ? 'rgba(196,168,106,0.12)' : 'transparent',
                color: propertyId === '' ? 'var(--gold2)' : 'var(--text3)',
                fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
              }}>NINGUNA</button>
              {propList.map(p => {
                const active = propertyId === p.id;
                const col = p.color ?? 'var(--gold2)';
                return (
                  <button key={p.id} onClick={() => setPropertyId(p.id)} style={{
                    padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `.5px solid ${active ? col : 'var(--bg4)'}`,
                    background: active ? `${col}1e` : 'transparent',
                    color: active ? col : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                  }}>{p.icon ? `${p.icon} ` : ''}{p.name.toUpperCase()}</button>
                );
              })}
            </div>
          </div>

          {projList.length > 0 && (
            <div>
              <label style={LABEL}>PROYECTO (opcional)</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setProjectId(null)} style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  border: `.5px solid ${projectId === null ? '#9b7fe8' : 'var(--bg4)'}`,
                  background: projectId === null ? '#9b7fe81e' : 'transparent',
                  color: projectId === null ? '#9b7fe8' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                }}>NINGUNO</button>
                {projList.map(p => {
                  const col = p.color ?? '#9b7fe8';
                  const sel = projectId === p.id;
                  return (
                    <button key={p.id} onClick={() => setProjectId(p.id)} style={{
                      padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                      border: `.5px solid ${sel ? col : 'var(--bg4)'}`,
                      background: sel ? `${col}1e` : 'transparent',
                      color: sel ? col : 'var(--text3)',
                      fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                    }}>{p.name.toUpperCase()}</button>
                  );
                })}
              </div>
            </div>
          )}

          {tripList.length > 0 && (
            <div>
              <label style={LABEL}>VIAJE (opcional)</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setTripTitle(null)} style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  border: `.5px solid ${tripTitle === null ? 'var(--blue)' : 'var(--bg4)'}`,
                  background: tripTitle === null ? 'rgba(91,168,232,0.12)' : 'transparent',
                  color: tripTitle === null ? 'var(--blue)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                }}>NINGUNO</button>
                {tripList.map(t => (
                  <button key={t.id} onClick={() => setTripTitle(tripTitle === t.title ? null : t.title)} style={{
                    padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `.5px solid ${tripTitle === t.title ? 'var(--blue)' : 'var(--bg4)'}`,
                    background: tripTitle === t.title ? 'rgba(91,168,232,0.12)' : 'transparent',
                    color: tripTitle === t.title ? 'var(--blue)' : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                  }}>{t.title.toUpperCase()}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={save} disabled={!canSave || saving} style={{
            width: '100%', padding: '14px', borderRadius: 10,
            background: canSave ? 'var(--gold2)' : 'var(--bg3)', border: 'none',
            color: canSave ? 'var(--bg)' : 'var(--text3)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em',
            cursor: canSave ? 'pointer' : 'default', transition: 'all .15s', marginTop: 4,
          }}>
            {saving ? 'GUARDANDO...' : 'CREAR TAREA'}
          </button>
        </div>
      </div>
    </>
  );
}
