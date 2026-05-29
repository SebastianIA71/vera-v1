'use client';

import { useState } from 'react';
import DesktopShell from '@/components/layout/DesktopShell';
import TaskDetailPanel, { TaskDetail } from '@/components/tasks/TaskDetailPanel';

type Task = TaskDetail & { inNow?: boolean | null };
type Event = { id: number; title: string; startDate?: Date | null; propertyId?: string | null; type?: string | null };

const PROPS = [
  { id: 'flat',     label: 'Flat',     loc: 'Palma',    icon: '🏙', color: '#5ba8e8' },
  { id: 'sarapita', label: 'Sarapita', loc: 'Campos',   icon: '🌿', color: '#9b7fe8' },
  { id: 'willys',   label: "Willy's",  loc: 'Marratxí', icon: '🎪', color: '#4ecb8d' },
];

function daysUntil(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function taskBorderColor(t: Task): string {
  const p = t.prioFinal ?? 0;
  if (p >= 8) return 'var(--red)';
  if (t.lastActionAt && Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14 && p >= 4) return 'var(--amber)';
  return 'transparent';
}

export default function PropertiesClient({
  allTasks, upcomingEvents, urgentCount, staleCount, inboxCount,
}: {
  allTasks: Task[];
  upcomingEvents: Event[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
}) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>(allTasks);

  const markDone = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}
      rightSlot={selected && (
        <TaskDetailPanel task={selected} onClose={() => setSelected(null)} onMarkDone={markDone}
          onUpdate={(id, data) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))}
        />
      )}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '.5px solid var(--bg4)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em' }}>
            Propiedades <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>&amp; inmuebles</em>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)' }}>
            3 PROPIEDADES · {tasks.filter(t => t.status !== 'done').length} TAREAS ACTIVAS
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden' }}>
          {PROPS.map((prop, i) => {
            const propTasks = tasks.filter(t => t.propertyId === prop.id && t.status !== 'done');
            const staleTasks = propTasks.filter(t => t.lastActionAt && Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) >= 14);
            const propEvents = upcomingEvents.filter(e => e.propertyId === prop.id);
            const nextEvent = propEvents[0] ?? null;
            const eventDays = daysUntil(nextEvent?.startDate);

            return (
              <div key={prop.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: i < 2 ? '.5px solid var(--bg4)' : 'none' }}>
                {/* Col header */}
                <div style={{ padding: '14px 16px 12px', flexShrink: 0, borderBottom: '.5px solid var(--bg4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 14, color: prop.color, letterSpacing: '.04em' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: prop.color, display: 'inline-block', flexShrink: 0 }} />
                      {prop.icon} {prop.label} · {prop.loc}
                    </div>
                    <button
                      style={{ width: 24, height: 24, borderRadius: 7, background: 'transparent', border: '.5px solid var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}
                      title={`Nueva tarea en ${prop.label}`}
                    >
                      <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em' }}>
                      <span style={{ color: prop.color, fontWeight: 500 }}>{propTasks.length}</span>{' '}
                      <span style={{ color: 'var(--text4)' }}>tareas</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em' }}>
                      <span style={{ color: staleTasks.length > 0 ? 'var(--amber)' : 'var(--text4)', fontWeight: 500 }}>{staleTasks.length}</span>{' '}
                      <span style={{ color: 'var(--text4)' }}>stale</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em' }}>
                      <span style={{ color: propEvents.length > 0 ? 'var(--blue)' : 'var(--text4)', fontWeight: 500 }}>{propEvents.length}</span>{' '}
                      <span style={{ color: 'var(--text4)' }}>eventos</span>
                    </div>
                  </div>
                  {nextEvent && eventDays !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, marginTop: 8, background: `rgba(${prop.color === '#5ba8e8' ? '91,168,232' : prop.color === '#9b7fe8' ? '155,127,232' : '78,203,141'},.06)`, border: `.5px solid rgba(${prop.color === '#5ba8e8' ? '91,168,232' : prop.color === '#9b7fe8' ? '155,127,232' : '78,203,141'},.22)` }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: prop.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.12em', color: 'var(--text2)', flex: 1 }}>{nextEvent.title}</span>
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', color: prop.color, fontWeight: 500 }}>~{eventDays}D</span>
                    </div>
                  )}
                </div>

                {/* Task list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {propTasks.map(t => {
                    const bc = taskBorderColor(t);
                    const stale = t.lastActionAt ? Math.floor((Date.now() - new Date(t.lastActionAt).getTime()) / 86400000) : 0;
                    return (
                      <div key={t.id} onClick={() => setSelected(t)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                        cursor: 'pointer', borderBottom: '.5px solid var(--bg2)',
                        position: 'relative', transition: 'background .1s',
                        background: selected?.id === t.id ? 'var(--bg2)' : 'transparent',
                      }}
                        onMouseEnter={e => { if (selected?.id !== t.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
                        onMouseLeave={e => { if (selected?.id !== t.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      >
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: selected?.id === t.id ? 'var(--gold2)' : bc }} />
                        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 12, color: 'var(--gold)', minWidth: 16, textAlign: 'right', flexShrink: 0 }}>{t.prioFinal ?? 0}</div>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.08em', color: stale >= 14 ? 'var(--amber)' : 'var(--text4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stale >= 14 ? `${stale}D SIN MOVER` : t.status?.toUpperCase()}
                          </div>
                        </div>
                        {t.inNow && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.1em', padding: '1px 5px', borderRadius: 999, border: '.5px solid var(--gold2)', color: 'var(--gold2)', flexShrink: 0 }}>⚡</span>}
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: '9px 16px', borderTop: '.5px solid var(--bg4)', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', cursor: 'pointer' }}>VER TODAS →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DesktopShell>
  );
}
