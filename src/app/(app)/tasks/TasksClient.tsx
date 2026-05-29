'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';
import TaskDetailPanel, { TaskDetail } from '@/components/tasks/TaskDetailPanel';

type Task = TaskDetail & { inNow?: boolean | null };

const PROPERTIES = [
  { id: 'flat',     label: '🏙 Flat',     color: 'var(--blue)'   },
  { id: 'sarapita', label: '🌿 Sarapita', color: 'var(--purple)' },
  { id: 'willys',   label: "🎪 Willy's",  color: 'var(--green)'  },
];

type Filters = {
  propertyId: string | null;
  prioRange: '8-9' | '6-7' | '0-5' | null;
  status: string | null;
  context: 'now' | 'stale' | null;
};

function taskBorderColor(t: Task): string {
  const p = t.prioFinal ?? 0;
  if (p >= 8) return 'var(--red)';
  if (t.lastActionAt && Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14 && p >= 4) return 'var(--amber)';
  if (t.tags?.includes('creativo')) return 'var(--purple)';
  return 'transparent';
}

function matchFilters(t: Task, f: Filters): boolean {
  if (f.propertyId && t.propertyId !== f.propertyId) return false;
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
  initialTasks, urgentCount, staleCount, inboxCount,
}: {
  initialTasks: Task[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selected, setSelected] = useState<Task | null>(null);
  const [filters, setFilters] = useState<Filters>({ propertyId: null, prioRange: null, status: null, context: null });
  const [showNewTask, setShowNewTask] = useState(false);

  const hasFilters = Object.values(filters).some(Boolean);

  const filtered = useMemo(() => tasks.filter(t => matchFilters(t, filters)), [tasks, filters]);
  const nowTasks = filtered.filter(t => t.inNow && t.status !== 'done');
  const restTasks = filtered.filter(t => !t.inNow && t.status !== 'done');
  const doneTasks = filtered.filter(t => t.status === 'done');

  const clearFilters = () => setFilters({ propertyId: null, prioRange: null, status: null, context: null });

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

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount} pageActions={pageActions}
      rightSlot={selected && (
        <TaskDetailPanel
          task={selected}
          onClose={() => setSelected(null)}
          onMarkDone={markDone}
          onUpdate={handleUpdate}
        />
      )}
    >
      {/* Centro: lista */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '.5px solid var(--bg4)' }}>
        <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em' }}>
              Tareas <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>activas</em>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)' }}>
              {filtered.length} TAREAS · {nowTasks.length} NOW
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12, borderBottom: '.5px solid var(--bg4)', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', flexShrink: 0 }}>DÓNDE</span>
            {PROPERTIES.map(p => (
              <FilterChip key={p.id} label={p.label} color={p.color}
                active={filters.propertyId === p.id}
                onClick={() => setFilters(f => ({ ...f, propertyId: f.propertyId === p.id ? null : p.id }))}
              />
            ))}
            <FilterChip label="· General" active={filters.propertyId === ''} onClick={() => setFilters(f => ({ ...f, propertyId: f.propertyId === '' ? null : '' }))} />

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
            <FilterChip label="Sin mover" color="var(--purple)" active={filters.context === 'stale'} onClick={() => setFilters(f => ({ ...f, context: f.context === 'stale' ? null : 'stale' }))} />

            {hasFilters && (
              <button onClick={clearFilters} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', cursor: 'pointer', padding: '4px 5px', background: 'none', border: 'none' }}>
                LIMPIAR ×
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {nowTasks.length > 0 && (
            <>
              <div style={{ padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                <span>NOW · {nowTasks.length} TAREAS</span>
              </div>
              {nowTasks.map(t => <TaskRow key={t.id} task={t} selected={selected?.id === t.id} onSelect={setSelected} />)}
            </>
          )}
          {restTasks.length > 0 && (
            <>
              <div style={{ padding: '10px 20px 4px', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                RESTO · {restTasks.length} TAREAS
              </div>
              {restTasks.map(t => <TaskRow key={t.id} task={t} selected={selected?.id === t.id} onSelect={setSelected} />)}
            </>
          )}
          {doneTasks.length > 0 && filters.status === 'done' && (
            <>
              <div style={{ padding: '10px 20px 4px', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)' }}>
                HECHAS · {doneTasks.length}
              </div>
              {doneTasks.map(t => <TaskRow key={t.id} task={t} selected={selected?.id === t.id} onSelect={setSelected} />)}
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

function TaskRow({ task, selected, onSelect }: { task: Task; selected: boolean; onSelect: (t: Task) => void }) {
  const bc = selected ? 'var(--gold2)' : taskBorderColor(task);
  const stale = task.lastActionAt ? Math.floor((Date.now() - new Date(task.lastActionAt).getTime()) / 86400000) : 0;

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
        cursor: 'pointer', borderBottom: '.5px solid var(--bg2)',
        position: 'relative', transition: 'background .1s',
        background: selected ? 'var(--bg2)' : 'transparent',
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: bc, borderRadius: 0 }} />
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 13, color: 'var(--gold)', minWidth: 20, textAlign: 'right', flexShrink: 0 }}>
        {task.prioFinal ?? 0}
      </div>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text4)' }}>
          {task.propertyId && <span style={{ color: 'var(--gold2)' }}>{task.propertyId.toUpperCase()}</span>}
          {task.propertyId && <span style={{ color: 'var(--text3)' }}>·</span>}
          {stale >= 14 && <span style={{ color: 'var(--amber)' }}>{stale}D SIN MOVER</span>}
          {task.tags && <span>{task.tags.toUpperCase()}</span>}
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
