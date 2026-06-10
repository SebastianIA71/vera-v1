'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

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
  const { toast } = useToast();
  const [title, setTitle]           = useState('');
  const [titleError, setTitleError] = useState(false);
  const [prio, setPrio]             = useState(5);
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? '');
  const [projectId, setProjectId]   = useState<number | null>(defaultProjectId ?? null);
  const [tripTitle, setTripTitle]   = useState<string | null>(null);
  const [dueDate, setDueDate]       = useState('');
  const [snoozedUntil, setSnoozedUntil] = useState('');
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

  const save = async () => {
    if (saving) return;
    if (!title.trim()) { setTitleError(true); return; }
    setTitleError(false);
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        prio,
        propertyId: propertyId || null,
        projectId: projectId ?? null,
        tags: tripTitle ?? null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        snoozedUntil: snoozedUntil ? new Date(snoozedUntil).toISOString() : null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      onCreated(task);
      toast('Tarea creada');
    } else {
      toast('Error al crear la tarea', 'error');
    }
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 24 }}>
          Nueva <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>tarea</em>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ ...LABEL, color: titleError ? 'var(--red)' : undefined }}>TÍTULO</label>
            <input
              autoFocus
              value={title}
              onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Qué hay que hacer..."
              style={{ ...INPUT, borderColor: titleError ? 'var(--red)' : undefined }}
            />
            {titleError && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: '.1em', marginTop: 4 }}>
                El título es obligatorio
              </div>
            )}
          </div>

          <div>
            <label style={LABEL}>FECHA LÍMITE (opcional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...INPUT, colorScheme: 'dark' }} />
          </div>

          <div>
            <label style={{ ...LABEL, color: snoozedUntil ? 'var(--cyan)' : undefined }}>
              🌙 DORMIR HASTA (opcional)
            </label>
            <input
              type="date"
              value={snoozedUntil}
              onChange={e => setSnoozedUntil(e.target.value)}
              style={{ ...INPUT, colorScheme: 'dark', borderColor: snoozedUntil ? 'var(--cyan)' : undefined }}
            />
            {snoozedUntil && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '.12em', marginTop: 4, opacity: 0.8 }}>
                La tarea no aparecerá en la lista hasta esa fecha
              </div>
            )}
          </div>

          <div>
            <label style={LABEL}>PRIORIDAD</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[9,8,7,6,5,4,3,2,1].map(n => (
                <button key={n} onClick={() => setPrio(n)} style={{
                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                  border: `.5px solid ${prio === n ? (n >= 8 ? 'var(--red)' : n >= 6 ? 'var(--amber)' : 'var(--gold2)') : 'var(--bg4)'}`,
                  background: prio === n ? 'var(--gold-subtle)' : 'transparent',
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
                background: propertyId === '' ? 'var(--gold-subtle)' : 'transparent',
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
                  border: `.5px solid ${projectId === null ? 'var(--purple)' : 'var(--bg4)'}`,
                  background: projectId === null ? 'var(--purple-subtle)' : 'transparent',
                  color: projectId === null ? 'var(--purple)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                }}>NINGUNO</button>
                {projList.map(p => {
                  const col = p.color ?? 'var(--purple)';
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
                  background: tripTitle === null ? 'var(--blue-subtle)' : 'transparent',
                  color: tripTitle === null ? 'var(--blue)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                }}>NINGUNO</button>
                {tripList.map(t => (
                  <button key={t.id} onClick={() => setTripTitle(tripTitle === t.title ? null : t.title)} style={{
                    padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `.5px solid ${tripTitle === t.title ? 'var(--blue)' : 'var(--bg4)'}`,
                    background: tripTitle === t.title ? 'var(--blue-subtle)' : 'transparent',
                    color: tripTitle === t.title ? 'var(--blue)' : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                  }}>{t.title.toUpperCase()}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '14px', borderRadius: 10,
            background: 'var(--gold2)', border: 'none',
            color: 'var(--bg)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em',
            cursor: saving ? 'default' : 'pointer', transition: 'all .15s', marginTop: 4,
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'GUARDANDO···' : 'CREAR TAREA'}
          </button>
        </div>
      </div>
    </>
  );
}
