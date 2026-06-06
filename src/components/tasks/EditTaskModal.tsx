'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

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
  recurrence?: string | null;
  recurrenceInterval?: number | null;
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
  const { toast } = useToast();
  const [title, setTitle] = useState(task.title);
  const [titleError, setTitleError] = useState(false);
  const [detail, setDetail] = useState(task.detail ?? '');
  const [prio, setPrio] = useState(task.prioFinal ?? task.prio ?? 5);
  const [propertyId, setPropertyId] = useState(task.propertyId ?? '');
  const [projectId, setProjectId] = useState<number | null>(task.projectId ?? null);
  const [tags, setTags] = useState(task.tags ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
  const [recurrence, setRecurrence] = useState<string>(task.recurrence ?? '');
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>(String(task.recurrenceInterval ?? 7));
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

  const save = async () => {
    if (saving) return;
    if (!title.trim()) { setTitleError(true); return; }
    setTitleError(false);
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
        recurrence: recurrence || null,
        recurrenceInterval: recurrence === 'custom' ? Number(recurrenceInterval) : null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
      toast('Tarea actualizada');
    } else {
      toast('Error al guardar', 'error');
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
                    background: prio === n ? 'var(--gold-subtle)' : 'transparent',
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

          <div>
            <label style={LABEL}>RECURRENCIA</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { value: '', label: 'NINGUNA' },
                { value: 'daily', label: 'DIARIA' },
                { value: 'weekly', label: 'SEMANAL' },
                { value: 'monthly', label: 'MENSUAL' },
                { value: 'custom', label: 'CUSTOM' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRecurrence(opt.value)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `.5px solid ${recurrence === opt.value ? 'var(--cyan)' : 'var(--bg4)'}`,
                    background: recurrence === opt.value ? 'rgba(62,207,207,0.12)' : 'transparent',
                    color: recurrence === opt.value ? 'var(--cyan)' : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                  }}
                >{opt.label}</button>
              ))}
            </div>
            {recurrence === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em' }}>CADA</span>
                <input
                  type="number" min={1} max={365} value={recurrenceInterval}
                  onChange={e => setRecurrenceInterval(e.target.value)}
                  style={{ ...INPUT, width: 70, textAlign: 'center', padding: '8px' }}
                />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em' }}>DÍAS</span>
              </div>
            )}
            {recurrence && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '.1em', marginTop: 6, opacity: 0.7 }}>
                Al marcar como hecha, Vera creará automáticamente la siguiente
              </div>
            )}
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
            disabled={saving}
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
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'GUARDANDO···' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </>
  );
}
