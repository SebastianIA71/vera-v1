'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobilePageHeader from '@/components/layout/MobilePageHeader';
import DesktopShell from '@/components/layout/DesktopShell';
import TaskDetailPanel, { TaskDetail } from '@/components/tasks/TaskDetailPanel';
import { taskBorderColor, fmtTime } from '@/lib/utils';

type Task     = TaskDetail & { inNow?: boolean | null };
type Property = { id: string; name: string; color: string | null; icon: string | null };
type Project  = { id: number; name: string; color: string | null };
type Trip     = { id: number; title: string };


type Filters = {
  propertyId: string | null;
  projectId:  number | null;
  tripTag:    string | null;
  prioRange: '8-9' | '6-7' | '0-5' | null;
  status: string | null;
  context: 'now' | 'stale' | null;
  search: string;
};


function matchFilters(t: Task, f: Filters): boolean {
  if (f.propertyId !== null && f.propertyId !== undefined && t.propertyId !== f.propertyId) return false;
  if (f.projectId  !== null && f.projectId  !== undefined && t.projectId  !== f.projectId)  return false;
  if (f.tripTag !== null && f.tripTag !== undefined) {
    const taskTags = (t.tags ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (!taskTags.includes(f.tripTag)) return false;
  }
  if (f.prioRange) {
    const p = t.prioFinal ?? 0;
    if (f.prioRange === '8-9' && p < 8) return false;
    if (f.prioRange === '6-7' && (p < 6 || p > 7)) return false;
    if (f.prioRange === '0-5' && p > 5) return false;
  }
  if (f.status && t.status !== f.status) return false;
  if (f.context === 'now' && !t.inNow) return false;
  if (f.context === 'stale') {
    if (!t.lastActionAt) return false;
    const days = Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000);
    if (days < 14 || (t.prioFinal ?? 0) < 4) return false;
  }
  if (f.search.trim()) {
    const q = f.search.toLowerCase();
    const inTitle = t.title?.toLowerCase().includes(q);
    const inTags = t.tags?.toLowerCase().includes(q);
    const inDetail = t.detail?.toLowerCase().includes(q);
    if (!inTitle && !inTags && !inDetail) return false;
  }
  return true;
}

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const activeStyle = active ? {
    borderColor: color ?? 'var(--gold2)',
    color: color ?? 'var(--gold)',
    background: `rgba(${color ? '196,168,106' : '196,168,106'},.06)`,
  } : {};
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em',
      padding: '4px 10px', borderRadius: 999, border: '.5px solid var(--bg4)',
      color: 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap',
      background: 'transparent', transition: 'all .1s', ...activeStyle,
    }}>
      {label}
    </button>
  );
}

export default function TasksClient({
  initialTasks, urgentCount, waitingCount, inboxCount, properties = [], projects = [], trips = [],
}: {
  initialTasks: Task[];
  urgentCount: number;
  waitingCount: number;
  inboxCount: number;
  properties?: Property[];
  projects?: Project[];
  trips?: Trip[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selected, setSelected] = useState<Task | null>(null);
  const [filters, setFilters] = useState<Filters>({ propertyId: null, projectId: null, tripTag: null, prioRange: null, status: null, context: null, search: '' });
  const [showNewTask, setShowNewTask] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const hasFilters = Object.values(filters).some(v => v !== null && v !== '');

  const filtered = useMemo(() => tasks.filter(t => matchFilters(t, filters)), [tasks, filters]);
  const nowTasks = filtered.filter(t => t.inNow && t.status !== 'done');
  const restTasks = filtered.filter(t => !t.inNow && t.status !== 'done');
  const doneTasks = filtered.filter(t => t.status === 'done');

  const clearFilters = () => setFilters({ propertyId: null, projectId: null, tripTag: null, prioRange: null, status: null, context: null, search: '' });

  const markDone = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
    if (selected?.id === id) setSelected(null);
  };

  const handleUpdate = (id: number, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const pageActions = (
    <button
      onClick={() => setShowNewTask(true)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '.5px solid var(--bg4)', borderRadius: 999, background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer' }}
    >
      <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      NUEVA TAREA
    </button>
  );

  if (isMobile && selected) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '.5px solid var(--bg4)' }}>
          <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', padding: 0 }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            TAREAS
          </button>
        </div>
        <TaskDetailPanel key={selected.id} task={selected} onClose={() => setSelected(null)} onMarkDone={markDone} onUpdate={handleUpdate} />
      </div>
    );
  }

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={0} inboxCount={inboxCount} pageActions={pageActions}
      rightSlot={selected && (
        <TaskDetailPanel
          key={selected.id}
          task={selected}
          onClose={() => setSelected(null)}
          onMarkDone={markDone}
          onUpdate={handleUpdate}
        />
      )}
    >
      {/* Centro: lista */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '.5px solid var(--bg4)' }}>
        {isMobile && <MobilePageHeader title="Tareas" />}
        <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em' }}>
              Tareas <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>activas</em>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)' }}>
              {filtered.filter(t => t.status !== 'done' && t.status !== 'archived').length} ACTIVAS
            </div>
          </div>

          {/* Filtros */}
          <div style={{ paddingBottom: 12, borderBottom: '.5px solid var(--bg4)' }}>
          <input
            type="text"
            placeholder="Buscar tarea, etiqueta..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{
              background: 'var(--bg3)', border: '.5px solid var(--bg4)',
              borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
              fontFamily: 'var(--font-dm-sans)', fontSize: 13, outline: 'none',
              width: '100%', marginBottom: 8,
            }}
          />
          <div className="mobile-filter-toggle" onClick={() => setShowFilters(p => !p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showFilters ? 10 : 0 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: hasFilters ? 'var(--gold2)' : 'var(--text3)' }}>{hasFilters ? 'FILTROS ACTIVOS' : 'FILTRAR'}</span>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>{showFilters ? '↑' : '↓'}</span>
          </div>
          <div className={showFilters ? 'filters-visible' : 'filters-mobile-hidden'} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>DÓNDE</span>
            {properties.map(p => (
              <FilterChip key={p.id} label={`${p.icon ? p.icon + ' ' : ''}${p.name}`} color={p.color ?? undefined}
                active={filters.propertyId === p.id}
                onClick={() => setFilters(f => ({ ...f, propertyId: f.propertyId === p.id ? null : p.id }))}
              />
            ))}
            <FilterChip label="· General" active={filters.propertyId === ''} onClick={() => setFilters(f => ({ ...f, propertyId: f.propertyId === '' ? null : '' }))} />

            {projects.length > 0 && (
              <>
                <div style={{ width: .5, height: 16, background: 'var(--bg4)', margin: '0 3px', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>PROYECTO</span>
                {projects.map(p => (
                  <FilterChip key={p.id} label={p.name} color={p.color ?? '#9b7fe8'}
                    active={filters.projectId === p.id}
                    onClick={() => setFilters(f => ({ ...f, projectId: f.projectId === p.id ? null : p.id }))}
                  />
                ))}
              </>
            )}

            {trips.length > 0 && (
              <>
                <div style={{ width: .5, height: 16, background: 'var(--bg4)', margin: '0 3px', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>VIAJE</span>
                {trips.map(t => (
                  <FilterChip key={t.id} label={t.title} color="var(--blue)"
                    active={filters.tripTag === t.title}
                    onClick={() => setFilters(f => ({ ...f, tripTag: f.tripTag === t.title ? null : t.title }))}
                  />
                ))}
              </>
            )}

            <div style={{ width: .5, height: 16, background: 'var(--bg4)', margin: '0 3px', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>PRIO</span>
            {(['8-9','6-7','0-5'] as const).map(r => (
              <FilterChip key={r} label={r} color={r === '8-9' ? 'var(--red)' : undefined}
                active={filters.prioRange === r}
                onClick={() => setFilters(f => ({ ...f, prioRange: f.prioRange === r ? null : r }))}
              />
            ))}

            <div style={{ width: .5, height: 16, background: 'var(--bg4)', margin: '0 3px', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>ESTADO</span>
            {[['wait','Espera'],['active','Activa'],['done','Hecha']].map(([v,l]) => (
              <FilterChip key={v} label={l} color={v === 'active' ? 'var(--green)' : undefined}
                active={filters.status === v}
                onClick={() => setFilters(f => ({ ...f, status: f.status === v ? null : v }))}
              />
            ))}

            <div style={{ width: .5, height: 16, background: 'var(--bg4)', margin: '0 3px', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>CONTEXTO</span>
            <FilterChip label="NoW" active={filters.context === 'now'} onClick={() => setFilters(f => ({ ...f, context: f.context === 'now' ? null : 'now' }))} />

            {hasFilters && (
              <button onClick={clearFilters} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', cursor: 'pointer', padding: '4px 5px', background: 'none', border: 'none' }}>
                LIMPIAR ×
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {nowTasks.length > 0 && (
            <>
              <div style={{ padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                <span>NOW · {nowTasks.length} TAREAS</span>
              </div>
              {nowTasks.map(t => <TaskRow key={t.id} task={t} selected={selected?.id === t.id} onSelect={setSelected} onPrioChange={(id, v) => setTasks(prev => prev.map(x => x.id === id ? { ...x, prioFinal: v } : x))} projects={projects} trips={trips} />)}
            </>
          )}
          {restTasks.length > 0 && (
            <>
              <div style={{ padding: '10px 20px 4px', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                RESTO · {restTasks.length} TAREAS
              </div>
              {restTasks.map(t => <TaskRow key={t.id} task={t} selected={selected?.id === t.id} onSelect={setSelected} onPrioChange={(id, v) => setTasks(prev => prev.map(x => x.id === id ? { ...x, prioFinal: v } : x))} projects={projects} trips={trips} />)}
            </>
          )}
          {doneTasks.length > 0 && filters.status === 'done' && (
            <>
              <div style={{ padding: '10px 20px 4px', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                HECHAS · {doneTasks.length}
              </div>
              {doneTasks.map(t => <TaskRow key={t.id} task={t} selected={selected?.id === t.id} onSelect={setSelected} onPrioChange={(id, v) => setTasks(prev => prev.map(x => x.id === id ? { ...x, prioFinal: v } : x))} projects={projects} trips={trips} />)}
            </>
          )}
          {filtered.filter(t => t.status !== 'done').length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--gold)' }}>✦</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SIN TAREAS CON ESTOS FILTROS</div>
            </div>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

function TaskRow({ task, selected, onSelect, onPrioChange, projects, trips }: { task: Task; selected: boolean; onSelect: (t: Task) => void; onPrioChange: (id: number, v: number) => void; projects: { id: number; name: string; color: string | null }[]; trips: { id: number; title: string }[] }) {
  const bc = selected ? 'var(--gold2)' : taskBorderColor(task.prioFinal ?? 0, task.lastActionAt);
  const stale = task.lastActionAt ? Math.floor((Date.now() - new Date(task.lastActionAt).getTime()) / 86400000) : 0;
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const taskTagList = (task.tags ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const matchedTrip = trips.find(tr => taskTagList.includes(tr.title));

  const changePrio = async (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const next = Math.min(10, Math.max(0, (task.prioFinal ?? 0) + delta));
    await fetch(`/api/tasks/${task.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prioManual: next, prioFinal: next }) });
    onPrioChange(task.id, next);
  };

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
        cursor: 'pointer', borderBottom: '.5px solid var(--bg2)',
        position: 'relative', transition: 'background .1s',
        background: task.prioFinal === 10 ? 'rgba(255,0,64,0.12)' : selected ? 'var(--bg2)' : 'transparent',
        border: task.prioFinal === 10 ? '.5px solid rgba(255,0,64,0.4)' : 'none',
        borderRadius: task.prioFinal === 10 ? 6 : 0,
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: bc, borderRadius: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0, flexShrink: 0, background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 6, overflow: 'hidden' }}>
        <button onClick={e => changePrio(e, -1)} style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 14, lineHeight: 1, WebkitTapHighlightColor: 'transparent' }}>−</button>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: task.prioFinal === 10 ? '#ffffff' : 'var(--gold2)', lineHeight: 1, minWidth: 18, textAlign: 'center' }}>{task.prioFinal ?? 0}</span>
        <button onClick={e => changePrio(e, +1)} style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 14, lineHeight: 1, WebkitTapHighlightColor: 'transparent' }}>+</button>
      </div>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3, fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--text4)', alignItems: 'center' }}>
          {task.propertyId && <span style={{ color: 'var(--gold2)' }}>{task.propertyId.toUpperCase()}</span>}
          {project && <><span style={{ color: 'var(--text3)' }}>·</span><span style={{ color: 'var(--purple)' }}>{project.name.toUpperCase()}</span></>}
          {matchedTrip && <><span style={{ color: 'var(--text3)' }}>·</span><span style={{ color: 'var(--blue)' }}>✈ {matchedTrip.title.toUpperCase()}</span></>}
          {task.dueDate && <><span style={{ color: 'var(--text3)' }}>·</span><span style={{ color: 'var(--blue)' }}>{new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span></>}
          {stale >= 14 && <><span style={{ color: 'var(--text3)' }}>·</span><span style={{ color: 'var(--amber)' }}>{stale}D SIN MOVER</span></>}
        </div>
      </div>
      {task.inNow && (
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.14em', padding: '2px 6px', borderRadius: 999, border: '.5px solid var(--gold2)', color: 'var(--gold2)', flexShrink: 0 }}>
          ⚡ NOW
        </span>
      )}
    </div>
  );
}
