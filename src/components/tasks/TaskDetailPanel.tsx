'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import EditTaskModal from './EditTaskModal';
import { useToast } from '@/components/ui/Toast';

export type TaskDetail = {
  id: number;
  title: string;
  detail?: string | null;
  notes?: string | null;
  propertyId?: string | null;
  projectId?: number | null;
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

type SolutionOption = { type: string; label: string; steps: string[]; materials?: string; cost: string; time: string; difficulty: string };
type SearchResult   = { title: string; url: string; description: string; summary?: string };

type Attachment = { id: number; filename: string; url: string; mimeType: string | null; sizeBytes: number | null };

function AttachmentsSection({ taskId }: { taskId: number }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const d = await fetch(`/api/tasks/${taskId}/attachments`).then(r => r.json()).catch(() => []);
    setItems(d);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: 'POST', body: fd });
    if (res.ok) { const a = await res.json(); setItems(prev => [a, ...prev]); }
    setUploading(false);
  };

  const del = async (id: number) => {
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(a => a.id !== id));
  };

  const isImg = (mime: string | null) => mime?.startsWith('image/');
  const fmtSize = (b: number | null) => b ? b > 1048576 ? `${(b/1048576).toFixed(1)}MB` : `${(b/1024).toFixed(0)}KB` : '';

  return (
    <div style={{ margin: '0 16px 8px', border: '.5px solid var(--bg4)', borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg2)', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', color: 'var(--text3)' }}>
          📎 ADJUNTOS{items.length > 0 ? ` (${items.length})` : ''}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ background: 'var(--bg3)', padding: '10px 14px', borderTop: '.5px solid var(--bg4)' }}>
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '.5px solid var(--text3)', background: 'transparent', color: uploading ? 'var(--text3)' : 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', cursor: 'pointer', marginBottom: items.length > 0 ? 10 : 0 }}>
            {uploading ? '···' : '+ SUBIR ARCHIVO'}
          </button>
          {!process.env.NEXT_PUBLIC_BLOB_ENABLED && items.length === 0 && !uploading && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.1em', marginTop: 4 }}>
              Requiere BLOB_READ_WRITE_TOKEN en Vercel
            </div>
          )}
          {items.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '.5px solid var(--bg4)' }}>
              {isImg(a.mimeType) ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  <img src={a.url} alt={a.filename} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                </a>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 5, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📄</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>{a.filename}</a>
                {a.sizeBytes && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)' }}>{fmtSize(a.sizeBytes)}</div>}
              </div>
              <button onClick={() => del(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '2px 4px' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPanel({ task, onClose, onMarkDone, onUpdate }: Props) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(task.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingVeraPlus, setLoadingVeraPlus] = useState(false);

  // — Soluciones inline —
  const [showSolution, setShowSolution]       = useState(false);
  const [solutionQuery, setSolutionQuery]     = useState(task.title);
  const [solutionResult, setSolutionResult]   = useState<SolutionOption[] | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);

  const runSolution = useCallback(async () => {
    if (!solutionQuery.trim() || loadingSolution) return;
    setLoadingSolution(true);
    setSolutionResult(null);
    try {
      const res = await fetch('/api/agents/solution', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: solutionQuery }),
      });
      const d = await res.json();
      if (d.options) setSolutionResult(d.options);
      else toast('No se pudo generar solución', 'error');
    } catch { toast('Error al conectar con el agente', 'error'); }
    setLoadingSolution(false);
  }, [solutionQuery, loadingSolution, toast]);

  const createTaskFromStep = useCallback(async (step: string) => {
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: step, prio: 5, propertyId: task.propertyId ?? null }),
    });
    toast('Tarea creada');
  }, [task.propertyId, toast]);

  // — Búsqueda inline —
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState(task.title);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const runSearch = useCallback(async () => {
    if (!searchQuery.trim() || loadingSearch) return;
    setLoadingSearch(true);
    setSearchResults(null);
    try {
      const res = await fetch('/api/agents/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const d = await res.json();
      if (d.results) setSearchResults(d.results);
      else if (d.notice) toast(d.notice, 'info');
      else toast('Error en la búsqueda', 'error');
    } catch { toast('Error al conectar con el agente', 'error'); }
    setLoadingSearch(false);
  }, [searchQuery, loadingSearch, toast]);

  const createTaskFromResult = useCallback(async (title: string, url: string) => {
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.slice(0, 120), prio: 5, propertyId: task.propertyId ?? null, detail: url }),
    });
    toast('Tarea creada');
  }, [task.propertyId, toast]);
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
    toast('Marcada como hecha ✓');
  };

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/tasks/${task.id}`;
    navigator.clipboard.writeText(url).then(() => toast('Enlace copiado', 'info'));
  }, [task.id, toast]);


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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={copyLink}
              title="Copiar enlace a esta tarea"
              style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', letterSpacing: '.1em' }}
            >
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              title="Editar datos de la tarea"
              style={{ fontFamily: 'var(--font-syne)', fontSize: 13, color: 'var(--gold2)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
            >
              ✎
            </button>
            <button
              onClick={async () => {
                setLoadingVeraPlus(true);
                try {
                  const res = await fetch(`/api/tasks/${task.id}/vera-plus`, { method: 'POST' });
                  if (res.ok) {
                    const updated = await res.json();
                    setNotes(updated.notes ?? '');
                    onUpdate?.(task.id, updated);
                  }
                } catch (err) {
                  console.error('Error calling VERA+:', err);
                }
                setLoadingVeraPlus(false);
              }}
              disabled={loadingVeraPlus}
              title="Llamar a VERA+ para sugerencias"
              style={{ fontFamily: 'var(--font-syne)', fontSize: 13, color: 'var(--gold2)', background: 'none', border: 'none', cursor: loadingVeraPlus ? 'default' : 'pointer', padding: '2px 6px', opacity: loadingVeraPlus ? 0.5 : 1 }}
            >
              ⚡
            </button>
            {task.inNow && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.14em', padding: '2px 7px', borderRadius: 999, border: '.5px solid var(--gold2)', color: 'var(--gold2)' }}>⚡ NOW</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={async () => {
              const next = Math.max(0, (task.prioFinal ?? task.prio ?? 0) - 1);
              await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prioManual: next, prioFinal: next }) });
              onUpdate?.(task.id, { prioManual: next, prioFinal: next });
            }} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg2)', border: '.5px solid var(--bg4)', cursor: 'pointer', color: 'var(--text)', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 24, color: task.prioFinal === 10 ? '#ff0040' : 'var(--gold)', lineHeight: 1, minWidth: 28, textAlign: 'center' }}>
              {task.prioFinal ?? task.prio ?? 0}
            </div>
            <button onClick={async () => {
              const next = Math.min(10, (task.prioFinal ?? task.prio ?? 0) + 1);
              await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prioManual: next, prioFinal: next }) });
              onUpdate?.(task.id, { prioManual: next, prioFinal: next });
            }} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg2)', border: '.5px solid var(--bg4)', cursor: 'pointer', color: 'var(--text)', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
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
            resize: 'vertical', minHeight: 450, outline: 'none',
            boxSizing: 'border-box',
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

        {/* Acciones de agente */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => { setShowSolution(s => !s); setShowSearch(false); }}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `.5px solid ${showSolution ? 'var(--purple)' : 'var(--bg4)'}`, background: showSolution ? 'var(--purple-subtle)' : 'transparent', color: showSolution ? 'var(--purple)' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', cursor: 'pointer' }}>
            💡 Soluciones
          </button>
          <button onClick={() => { setShowSearch(s => !s); setShowSolution(false); }}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `.5px solid ${showSearch ? 'var(--blue)' : 'var(--bg4)'}`, background: showSearch ? 'var(--blue-subtle)' : 'transparent', color: showSearch ? 'var(--blue)' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', cursor: 'pointer' }}>
            🔍 Buscar
          </button>
        </div>

        {/* Panel soluciones */}
        {showSolution && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={solutionQuery} onChange={e => setSolutionQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSolution()}
                style={{ flex: 1, background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 12, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = 'var(--purple)')}
                onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
              />
              <button onClick={runSolution} disabled={loadingSolution}
                style={{ padding: '8px 14px', borderRadius: 8, border: '.5px solid var(--purple)', background: 'transparent', color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, cursor: loadingSolution ? 'default' : 'pointer', opacity: loadingSolution ? 0.5 : 1 }}>
                {loadingSolution ? '···' : '→'}
              </button>
            </div>
            {solutionResult?.map((opt, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 12, color: 'var(--purple)' }}>{opt.label}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>{opt.cost} · {opt.time}</span>
                </div>
                {opt.steps.map((step, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)', flexShrink: 0, marginTop: 1 }}>{j + 1}.</span>
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>{step}</span>
                    <button onClick={() => createTaskFromStep(step)} title="Crear tarea"
                      style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, flexShrink: 0, letterSpacing: '.08em' }}>+</button>
                  </div>
                ))}
                {opt.materials && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)', letterSpacing: '.08em', marginTop: 6, lineHeight: 1.4 }}>📦 {opt.materials}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Panel búsqueda */}
        {showSearch && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch()}
                style={{ flex: 1, background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 12, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
              />
              <button onClick={runSearch} disabled={loadingSearch}
                style={{ padding: '8px 14px', borderRadius: 8, border: '.5px solid var(--blue)', background: 'transparent', color: 'var(--blue)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, cursor: loadingSearch ? 'default' : 'pointer', opacity: loadingSearch ? 0.5 : 1 }}>
                {loadingSearch ? '···' : '→'}
              </button>
            </div>
            {searchResults?.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 12, color: 'var(--blue)', textDecoration: 'none', flex: 1, lineHeight: 1.3 }}>
                    {r.title}
                  </a>
                  <button onClick={() => createTaskFromResult(r.title, r.url)} title="Crear tarea"
                    style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, flexShrink: 0, letterSpacing: '.08em' }}>+</button>
                </div>
                {(r.summary ?? r.description) && (
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{r.summary ?? r.description}</div>
                )}
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.url.replace(/^https?:\/\//, '').split('/')[0]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Adjuntos — dentro del scroll para que sea visible en desktop */}
        <div style={{ marginTop: 12 }}>
          <AttachmentsSection taskId={task.id} />
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

      {/* Edit Modal */}
      {showEditModal && (
        <EditTaskModal task={task} onClose={() => setShowEditModal(false)} onUpdated={(updated) => onUpdate?.(task.id, updated)} />
      )}
    </div>
  );
}
