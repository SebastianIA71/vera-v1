'use client';

import { useState, useEffect } from 'react';

type Task = {
  id: number;
  title: string;
  detail?: string | null;
  propertyId?: string | null;
  projectId?: number | null;
  prio?: number | null;
  prioFinal?: number | null;
  status?: string | null;
  tags?: string | null;
  dueDate?: Date | null;
};

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

export default function EditTaskModal({
  task,
  onClose,
  onUpdated,
}: {
  task: Task;
  onClose: () => void;
  onUpdated: (t: Task) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [detail, setDetail] = useState(task.detail ?? '');
  const [prio, setPrio] = useState(task.prioFinal ?? task.prio ?? 5);
  const [propertyId, setPropertyId] = useState(task.propertyId ?? '');
  const [projectId, setProjectId] = useState<number | null>(task.projectId ?? null);
  const [tags, setTags] = useState(task.tags ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [propList, setPropList] = useState<Property[]>([]);
  const [projList, setProjList] = useState<{ id: number; name: string; color: string | null }[]>([]);

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: Property[]) => setPropList(data))
      .catch(() => {});
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: { id: number; name: string; color: string | null; status: string | null }[]) =>
        setProjList(data.filter(p => p.status === 'active' || p.status === 'paused'))
      )
      .catch(() => {});
  }, []);

  const canSave = title.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        detail: detail || null,
        prio,
        prioManual: prio,
        prioFinal: prio,
        propertyId: propertyId || null,
        projectId: projectId ?? null,
        tags: tags || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
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
          Editar <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>tarea</em>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={LABEL}>TÍTULO</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Qué hay que hacer..." style={INPUT} />
          </div>

          <div>
            <label style={LABEL}>DETALLE (opcional)</label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="Más información..." style={{ ...INPUT, minHeight: 80, resize: 'vertical' }} />
          </div>

          <div>
            <label style={LABEL}>PRIORIDAD</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                <button
                  key={n}
                  onClick={() => setPrio(n)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: `.5px solid ${prio === n ? (n >= 8 ? 'var(--red)' : n >= 6 ? 'var(--amber)' : 'var(--gold2)') : 'var(--bg4)'}`,
                    background: prio === n ? 'rgba(196,168,106,0.1)' : 'transparent',
                    color: prio === n ? 'var(--text)' : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: 13,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={LABEL}>PROPIEDAD (opcional)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setPropertyId('')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  border: `.5px solid ${propertyId === '' ? 'var(--gold2)' : 'var(--bg4)'}`,
                  background: propertyId === '' ? 'rgba(196,168,106,0.12)' : 'transparent',
                  color: propertyId === '' ? 'var(--gold2)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: 10,
                  letterSpacing: '.12em',
                }}
              >
                NINGUNA
              </button>
              {propList.map(p => {
                const active = propertyId === p.id;
                const col = p.color ?? 'var(--gold2)';
                return (
                  <button
                    key={p.id}
                    onClick={() => setPropertyId(p.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      border: `.5px solid ${active ? col : 'var(--bg4)'}`,
                      background: active ? `${col}1e` : 'transparent',
                      color: active ? col : 'var(--text3)',
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: 10,
                      letterSpacing: '.12em',
                    }}
                  >
                    {p.icon ? `${p.icon} ` : ''}
                    {p.name.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {projList.length > 0 && (
            <div>
              <label style={LABEL}>PROYECTO (opcional)</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setProjectId(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    border: `.5px solid ${projectId === null ? '#9b7fe8' : 'var(--bg4)'}`,
                    background: projectId === null ? '#9b7fe81e' : 'transparent',
                    color: projectId === null ? '#9b7fe8' : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: 10,
                    letterSpacing: '.12em',
                  }}
                >
                  NINGUNO
                </button>
                {projList.map(p => {
                  const col = p.color ?? '#9b7fe8';
                  const sel = projectId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProjectId(p.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        cursor: 'pointer',
                        border: `.5px solid ${sel ? col : 'var(--bg4)'}`,
                        background: sel ? `${col}1e` : 'transparent',
                        color: sel ? col : 'var(--text3)',
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: 10,
                        letterSpacing: '.12em',
                      }}
                    >
                      {p.name.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label style={LABEL}>TAGS (opcional)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Ej: viaje, proyecto..." style={INPUT} />
          </div>

          <div>
            <label style={LABEL}>FECHA LÍMITE (opcional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...INPUT, colorScheme: 'dark' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              background: 'transparent',
              border: '.5px solid var(--bg4)',
              color: 'var(--text2)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: 11,
              letterSpacing: '.2em',
              cursor: 'pointer',
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={save}
            disabled={!canSave || saving}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              background: 'var(--gold2)',
              border: 'none',
              color: 'var(--bg)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: 11,
              letterSpacing: '.2em',
              cursor: canSave && !saving ? 'pointer' : 'default',
              opacity: canSave && !saving ? 1 : 0.5,
            }}
          >
            {saving ? 'GUARDANDO...' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </>
  );
}
