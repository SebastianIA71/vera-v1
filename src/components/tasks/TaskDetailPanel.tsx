'use client';

import { useState, useCallback, useRef } from 'react';

export type TaskDetail = {
  id: number;
  title: string;
  detail?: string | null;
  notes?: string | null;
  propertyId?: string | null;
  prio?: number | null;
  prioManual?: number | null;
  prioFinal?: number | null;
  status?: string | null;
  inNow?: boolean | null;
  tags?: string | null;
  dueDate?: Date | null;
  lastActionAt?: Date | null;
  createdAt?: Date | null;
};

type Props = {
  task: TaskDetail;
  onClose: () => void;
  onMarkDone: (id: number) => void;
  onUpdate?: (id: number, data: Partial<TaskDetail>) => void;
};

const PROP_COLORS: Record<string, string> = {
  flat: 'var(--blue)',
  sarapita: 'var(--purple)',
  willys: 'var(--green)',
};

function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function TaskDetailPanel({ task, onClose, onMarkDone, onUpdate }: Props) {
  const [notes, setNotes] = useState(task.notes ?? '');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDone = task.status === 'done' || task.status === 'archived';
  const stale = daysSince(task.lastActionAt);
  const due = daysUntil(task.dueDate);

  const saveNotes = useCallback((val: string) => {
    setNotes(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: val }),
      });
      onUpdate?.(task.id, { notes: val });
    }, 1000);
  }, [task.id, onUpdate]);

  const markDone = async () => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    onMarkDone(task.id);
  };

  const s8 = (col?: string) => ({
    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em',
    color: col ?? 'var(--text3)', marginBottom: 7,
  });

  return (
    <div style={{ width: 420, background: 'var(--bg)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', borderLeft: '.5px solid var(--bg4)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← LISTA
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {task.inNow && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.14em', padding: '2px 7px', borderRadius: 999, border: '.5px solid var(--gold2)', color: 'var(--gold2)' }}>⚡ NOW</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <button onClick={async () => {
              const next = Math.min(10, (task.prioFinal ?? task.prio ?? 0) + 1);
              await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prioManual: next, prioFinal: next }) });
              onUpdate?.(task.id, { prioManual: next, prioFinal: next });
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '0 4px', lineHeight: 1, fontSize: 10 }}>▲</button>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 24, color: 'var(--gold)', lineHeight: 1, minWidth: 28, textAlign: 'center' }}>
              {task.prioFinal ?? task.prio ?? 0}
            </div>
            <button onClick={async () => {
              const next = Math.max(0, (task.prioFinal ?? task.prio ?? 0) - 1);
              await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prioManual: next, prioFinal: next }) });
              onUpdate?.(task.id, { prioManual: next, prioFinal: next });
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '0 4px', lineHeight: 1, fontSize: 10 }}>▼</button>
          </div>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 15, lineHeight: 1.3, color: 'var(--text)', letterSpacing: '-.005em' }}>
            {task.title}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
          {task.propertyId && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', padding: '3px 7px', borderRadius: 999, border: '.5px solid var(--bg4)', color: PROP_COLORS[task.propertyId] ?? 'var(--gold2)', cursor: 'default' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: PROP_COLORS[task.propertyId] ?? 'var(--gold2)', display: 'inline-block' }} />
              {task.propertyId.toUpperCase()}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', padding: '3px 7px', borderRadius: 999, border: `.5px solid ${isDone ? '#1a3328' : 'var(--bg4)'}`, color: isDone ? 'var(--green)' : 'var(--gold2)', cursor: 'default' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: isDone ? 'var(--green)' : 'var(--text3)', display: 'inline-block' }} />
            {task.status?.toUpperCase() ?? 'WAIT'}
          </span>
          {due !== null && due <= 30 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', padding: '3px 7px', borderRadius: 999, border: '.5px solid #2a1414', color: 'var(--red)', cursor: 'default' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />
              VENCE {due}D
            </span>
          )}
        </div>
      </div>

      {/* Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 72px' }}>
        {task.detail && (
          <>
            <div style={s8()}>DETALLE</div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: '#c8c6be', marginBottom: 12 }}>
              {task.detail}
            </div>
            <div style={{ height: .5, background: 'var(--bg4)', margin: '12px 0' }} />
          </>
        )}

        <div style={s8()}>NOTAS</div>
        <textarea
          value={notes}
          onChange={e => saveNotes(e.target.value)}
          placeholder="Añade una nota…"
          style={{
            width: '100%', background: 'transparent', border: '.5px solid var(--bg4)',
            borderRadius: 9, padding: '9px 10px', color: 'var(--text)',
            fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.5,
            resize: 'none', minHeight: 56, outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--gold2)')}
          onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
        />

        <div style={{ height: .5, background: 'var(--bg4)', margin: '12px 0' }} />

        <div style={s8()}>INFO</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text4)', lineHeight: 2 }}>
          {stale !== null && <div>SIN MOVER: <span style={{ color: stale >= 14 ? 'var(--amber)' : 'var(--text2)' }}>{stale} DÍAS</span></div>}
          {task.createdAt && <div>CREADA: <span style={{ color: 'var(--text2)' }}>{new Date(task.createdAt).toLocaleDateString('es-ES')}</span></div>}
          {task.tags && <div>TAGS: <span style={{ color: 'var(--text2)' }}>{task.tags}</span></div>}
        </div>
      </div>

      {/* FAB */}
      {!isDone && (
        <button
          onClick={markDone}
          style={{
            position: 'absolute', bottom: 14, left: 14, right: 14, padding: 11,
            borderRadius: 12, background: 'transparent', border: '.5px solid var(--green)',
            color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 11,
            letterSpacing: '.2em', cursor: 'pointer', textAlign: 'center',
          }}
        >
          MARCAR COMO HECHA ✓
        </button>
      )}
    </div>
  );
}
