'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AgentPanel from '@/components/command/AgentPanel';
import dynamic from 'next/dynamic';
const CaptureSheet = dynamic(() => import('@/components/capture/CaptureSheet'), { ssr: false });

/* ─── Types ─────────────────────────────────────────── */
type AgentId = 'voice' | 'prio' | 'alert' | 'search' | 'executor' | 'solution';
type AgentStatus = { status: 'running' | 'active' | 'idle' | 'error'; lastRun?: string; message?: string };
type Task = {
  id: number; title: string; detail?: string | null; propertyId?: string | null;
  prio?: number | null; prioFinal?: number | null; status?: string | null;
  inNow?: boolean | null; type?: string | null; lastActionAt?: Date | null;
  tags?: string | null; dueDate?: Date | null;
};
type TabId = 'punchlist' | 'inbox' | 'alerts';
type RightPanelProps = { tasks: Task[]; inboxCount: number; nextTrip: { title: string; daysTo: number } | null; tab: TabId; setTab: (t: TabId) => void; onMarkDone: (id: number) => void; onInboxCountChange?: (n: number) => void };
type CompletingTask = Task & { completingAt: number };

/* ─── Constants ─────────────────────────────────────── */
const DAYS = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const pad = (n: number) => String(n).padStart(2, '0');

const AGENTS: { id: AgentId; label: string; icon: string; top: number; left: number; labelPos: 'above' | 'below' }[] = [
  { id: 'voice',    label: 'VOICE',    icon: 'mic',   top: 56,  left: 308, labelPos: 'above' },
  { id: 'prio',     label: 'PRIO',     icon: 'prio',  top: 101, left: 520, labelPos: 'above' },
  { id: 'alert',    label: 'ALERT',    icon: 'bell',  top: 471, left: 532, labelPos: 'below' },
  { id: 'solution', label: 'SOLUTION', icon: 'help',  top: 549, left: 308, labelPos: 'below' },
  { id: 'executor', label: 'EXECUTOR', icon: 'send',  top: 459, left: 81,  labelPos: 'below' },
  { id: 'search',   label: 'SEARCH',   icon: 'search',top: 134, left: 96,  labelPos: 'above' },
];

/* ─── SVG icons ─────────────────────────────────────── */
function AgentIcon({ icon }: { icon: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'mic':    return <svg viewBox="0 0 24 24" width={20} height={20} {...s}><rect x="9" y="3" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>;
    case 'prio':   return <svg viewBox="0 0 24 24" width={20} height={20} {...s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
    case 'bell':   return <svg viewBox="0 0 24 24" width={20} height={20} {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case 'help':   return <svg viewBox="0 0 24 24" width={20} height={20} {...s}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'send':   return <svg viewBox="0 0 24 24" width={20} height={20} {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case 'search': return <svg viewBox="0 0 24 24" width={20} height={20} {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    default:       return null;
  }
}

/* ─── Task border color ─────────────────────────────── */
function taskBorderColor(task: Task, now: Date): string {
  const prio = task.prioFinal ?? 0;
  if (prio >= 7) return 'var(--red)';
  if (task.lastActionAt) {
    const days = Math.floor((now.getTime() - new Date(task.lastActionAt).getTime()) / 86400000);
    if (days >= 14 && prio >= 4) return 'var(--amber)';
  }
  return 'transparent';
}

/* ─── Inbox Panel ───────────────────────────────────── */
type InboxItem = { id: number; content: string; source?: string | null; type?: string | null; suggestedPropertyId?: string | null; createdAt?: Date | null };

function InboxPanel({ inboxCount, onCountChange }: { inboxCount: number; onCountChange?: (n: number) => void }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/inbox')
      .then(r => r.json())
      .then(d => {
        setItems(d);
        setLoaded(true);
        onCountChange?.(d.length);
      })
      .catch(() => setLoaded(true));
  }, [onCountChange]);

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--gold2)', letterSpacing: '.1em' }}>···</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--gold)' }}>0</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text2)' }}>INBOX VACÍO</div>
      </div>
    );
  }

  const sourceColor = (src?: string | null) => src === 'voice' ? 'var(--purple)' : 'var(--blue)';
  const sourceLabel = (src?: string | null) => src === 'voice' ? 'VOZ' : src?.toUpperCase() ?? 'MANUAL';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)', marginBottom: 10 }}>
        <span>{inboxCount} PENDIENTES</span>
      </div>
      {items.map(item => (
        <div key={item.id} style={{
          background: 'var(--bg2)', border: '.5px solid var(--bg4)',
          borderLeft: `2px solid ${sourceColor(item.source)}`,
          borderRadius: 10, padding: '10px 12px', marginBottom: 8,
        }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.35, color: 'var(--text)', marginBottom: 5 }}>
            {item.content}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: sourceColor(item.source) }}>
              {sourceLabel(item.source)}
            </span>
            {item.suggestedPropertyId && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--gold2)' }}>
                · {item.suggestedPropertyId.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Right Panel ───────────────────────────────────── */
function RightPanel({ tasks, inboxCount, nextTrip, tab, setTab, onMarkDone, onInboxCountChange }: RightPanelProps) {
  const now = new Date();
  const [completing, setCompleting] = useState<Map<number, CompletingTask>>(new Map());

  const handleMarkDone = useCallback((task: Task) => {
    setCompleting(prev => new Map([...prev, [task.id, { ...task, completingAt: Date.now() }]]));
    onMarkDone(task.id);
    setTimeout(() => {
      setCompleting(prev => {
        const next = new Map(prev);
        next.delete(task.id);
        return next;
      });
    }, 1400);
  }, [onMarkDone]);

  // Active tasks (not yet clicked done, not already completing)
  const activeTasks = tasks
    .filter(t => t.status !== 'done' && t.status !== 'archived' && !completing.has(t.id))
    .slice(0, 6);

  // Merge: active + completing, sorted by prioFinal desc, cap at 6
  const completingList = [...completing.values()];
  const topTasks = [...activeTasks, ...completingList]
    .sort((a, b) => (b.prioFinal ?? 0) - (a.prioFinal ?? 0))
    .slice(0, 7);

  return (
    <div style={{ width: '320px', background: 'var(--bg)', borderLeft: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        {([['punchlist', 'PUNCH LIST'], ['inbox', 'INBOX'], ['alerts', 'ALERTAS']] as [TabId, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '12px 4px', textAlign: 'center',
              fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '.18em',
              color: tab === id ? 'var(--gold2)' : 'var(--text4)',
              background: 'transparent', border: 'none',
              borderBottom: `1.5px solid ${tab === id ? 'var(--gold2)' : 'transparent'}`,
              cursor: 'pointer', position: 'relative',
            }}
          >
            {label}
            {id === 'inbox' && inboxCount > 0 && (
              <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', padding: '1px 4px', borderRadius: '999px' }}>
                {inboxCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {tab === 'punchlist' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.24em', color: 'var(--text4)', marginBottom: '10px' }}>
              <span>HOY · {topTasks.length} TAREAS</span>
              <span style={{ cursor: 'pointer' }}>VER TODAS →</span>
            </div>
            {topTasks.map(task => {
              const isDone = completing.has(task.id);
              const bc = isDone ? 'var(--green)' : taskBorderColor(task, now);
              return (
                <div
                  key={task.id}
                  style={{
                    background: 'var(--bg2)', border: `.5px solid var(--bg4)`,
                    borderLeft: `2px solid ${bc}`,
                    borderRadius: '10px', padding: '12px 14px', marginBottom: '8px',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    opacity: isDone ? 0.45 : 1,
                    transition: 'opacity .3s ease, border-color .2s ease',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: '13px', fontWeight: 600, color: isDone ? 'var(--green)' : 'var(--gold)', minWidth: '18px' }}>
                    {task.prioFinal}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-dm-sans)', fontSize: '13px', lineHeight: 1.3,
                      color: isDone ? 'var(--text3)' : 'var(--text)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'color .2s, text-decoration .2s',
                    }}>
                      {task.title}
                    </div>
                    {task.propertyId && (
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.1em', color: isDone ? 'var(--text3)' : 'var(--gold2)', marginTop: '4px' }}>
                        {task.propertyId.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => !isDone && handleMarkDone(task)}
                    disabled={isDone}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                      border: isDone ? 'none' : '.5px solid var(--text3)',
                      background: 'transparent',
                      cursor: isDone ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--green)',
                    }}
                    title={isDone ? 'Hecha' : 'Marcar hecha'}
                  >
                    {isDone && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}

            {nextTrip && (
              <>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.24em', color: 'var(--text4)', marginTop: '18px', marginBottom: '10px' }}>PRÓXIMO VIAJE</div>
                <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '15px', color: 'var(--text)' }}>{nextTrip.title}</div>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '24px', color: 'var(--blue)', lineHeight: 1 }}>{nextTrip.daysTo}<span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--text2)', marginLeft: '2px' }}>D</span></div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'inbox' && (
          <InboxPanel inboxCount={inboxCount} onCountChange={onInboxCountChange} />
        )}

        {tab === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '.2em', color: 'var(--text3)' }}>SIN ALERTAS ACTIVAS</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Task Modal ─────────────────────────────────── */
function NewTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Task) => void }) {
  const [title, setTitle] = useState('');
  const [prio, setPrio] = useState(5);
  const [propertyId, setPropertyId] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, prio, propertyId: propertyId || null }),
    });
    if (res.ok) {
      const task = await res.json();
      onCreated(task);
    }
    setSaving(false);
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: '16px', padding: '28px', width: '380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', color: 'var(--text)' }}>
          Nueva <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>tarea.</em>
        </div>

        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Título de la tarea"
          style={{ background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: '10px', padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '14px', outline: 'none' }}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '.2em', color: 'var(--text2)', marginBottom: '6px' }}>PRIORIDAD</div>
            <select
              value={prio}
              onChange={e => setPrio(Number(e.target.value))}
              style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: '8px', padding: '8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }}
            >
              {[9,8,7,6,5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '.2em', color: 'var(--text2)', marginBottom: '6px' }}>PROPIEDAD</div>
            <select
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: '8px', padding: '8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }}
            >
              <option value="">— ninguna</option>
              <option value="flat">Flat · Palma</option>
              <option value="sarapita">Sarapita · Campos</option>
              <option value="willys">Willy&apos;s · Marratxí</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.15em', cursor: 'pointer' }}
          >
            CANCELAR
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            style={{ background: 'transparent', border: `.5px solid ${title.trim() ? 'var(--gold2)' : 'var(--bg4)'}`, borderRadius: '8px', padding: '10px 20px', color: title.trim() ? 'var(--gold)' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.15em', cursor: title.trim() ? 'pointer' : 'default' }}
          >
            {saving ? '···' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Client Component ─────────────────────────── */
export default function DashboardClient({
  initialTasks,
  urgentCount,
  staleCount,
  inboxCount: initialInboxCount,
  nextTrip,
}: {
  initialTasks: Task[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
  nextTrip: { title: string; daysTo: number } | null;
}) {
  const router = useRouter();
  const [time, setTime] = useState('');
  const navCollapsed = false; // siempre expandida en desktop
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [agentStatus, setAgentStatus] = useState<Record<AgentId, AgentStatus>>(
    Object.fromEntries(['voice','prio','alert','search','executor','solution'].map(id => [id, { status: 'idle' }])) as Record<AgentId, AgentStatus>
  );
  const [rightTab, setRightTab] = useState<TabId>('punchlist');
  const [showNewTask, setShowNewTask] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [inboxCount, setInboxCount] = useState(initialInboxCount);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Agent status polling
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/agents/status');
        if (res.ok) setAgentStatus(await res.json());
      } catch {}
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, []);

  const markDone = useCallback(async (id: number) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
  }, []);

  const handleTaskCreated = useCallback((task: Task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/lock');
  };

  const statusColor = (s: string) => s === 'running' ? 'var(--gold2)' : s === 'active' ? 'var(--green)' : s === 'error' ? 'var(--red)' : 'var(--text3)';
  const nodeBorderColor = (s: string) => s === 'running' ? 'var(--gold2)' : s === 'active' ? 'var(--green)' : 'var(--bg4)';
  const nodeIconColor = (s: string) => s === 'running' ? 'var(--gold2)' : s === 'active' ? 'var(--green)' : 'var(--text3)';

  const urgentNow = tasks.filter(t => (t.prioFinal ?? 0) >= 7 && t.status !== 'done' && t.status !== 'archived').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* TOP BAR */}
      <div style={{ height: '54px', background: 'var(--bg)', borderBottom: '.5px solid var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', letterSpacing: '.3em', color: 'var(--gold2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" />
            </svg>
            VERA
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.14em', color: 'var(--gold2)', fontWeight: 400 }}>v.15</span>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '14px', color: 'var(--text2)', letterSpacing: '.12em' }}>{time}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pill dot="red" label={`${urgentNow} URGENTES`} />
          <Pill dot="amber" label={`${staleCount} STALE`} />
          <Pill dot="green" label={`${inboxCount} INBOX`} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', border: '.5px solid var(--bg4)', borderRadius: '999px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '.14em', color: 'var(--green)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'blink 2s ease-in-out infinite' }} />
            SISTEMA ACTIVO
          </div>
          <button
            onClick={() => setShowCapture(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 16px', border: '.5px solid var(--gold2)', borderRadius: '999px', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '.18em', cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
            OYE VERA
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT NAV */}
        <nav style={{ width: '220px', background: 'var(--bg)', borderRight: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', padding: '14px 0', flexShrink: 0, overflow: 'hidden' }}>

          <NavItem icon="command" label="COMMAND" active />
          <NavItem icon="tasks"   label="TAREAS"      collapsed={navCollapsed} onClick={() => router.push('/tasks')} />
          <NavItem icon="inbox"   label="INBOX"       badge={initialInboxCount} collapsed={navCollapsed} onClick={() => router.push('/inbox')} />
          <NavItem icon="trips"   label="VIAJES"      collapsed={navCollapsed} onClick={() => router.push('/trips')} />
          <NavItem icon="props"   label="PROPIEDADES" collapsed={navCollapsed} onClick={() => router.push('/properties')} />
          <div style={{ height: '.5px', background: 'var(--bg4)', margin: '6px 14px' }} />
          <NavItem icon="finance" label="FINANZAS"    collapsed={navCollapsed} onClick={() => router.push('/finance')} />
          <NavItem icon="agents"  label="AGENTES"     collapsed={navCollapsed} onClick={() => router.push('/agents')} />
          <div style={{ marginTop: 'auto' }}>
            <div style={{ height: '.5px', background: 'var(--bg4)', margin: '6px 14px' }} />
            <NavItem icon="settings" label="AJUSTES" collapsed={navCollapsed} onClick={() => router.push('/settings')} />
            <NavItem icon="logout"   label="SALIR"   collapsed={navCollapsed} onClick={logout} />
          </div>
        </nav>

        {/* CENTER: ORBITAL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: '22px', color: 'var(--text)', letterSpacing: '-.01em' }}>
              Command <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Centre</em>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--text4)' }}>
              6 AGENTES · TURSO SYNC
            </div>
          </div>

          {/* Orbital map */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '616px', height: '616px', flexShrink: 0 }}>
              {/* Rings */}
              {[196, 363, 528, 616].map((size, i) => (
                <div key={size} style={{
                  position: 'absolute', borderRadius: '50%', top: '50%', left: '50%',
                  width: `${size}px`, height: `${size}px`,
                  transform: 'translate(-50%,-50%)',
                  border: i === 0 ? `.5px solid rgba(196,168,106,.22)` : i === 3 ? '.5px dashed var(--bg3)' : '.5px solid var(--bg4)',
                }} />
              ))}

              {/* Connection lines */}
              {AGENTS.map(agent => {
                const status = agentStatus[agent.id]?.status ?? 'idle';
                const isActive = status === 'running' || status === 'active';
                const angle = Math.atan2(agent.top - 308, agent.left - 308);
                const dist = Math.sqrt(Math.pow(agent.left - 308, 2) + Math.pow(agent.top - 308, 2));
                return (
                  <div key={`conn-${agent.id}`} style={{
                    position: 'absolute', top: '308px', left: '308px',
                    width: `${dist}px`, height: '.5px',
                    background: isActive ? 'rgba(196,168,106,.35)' : 'rgba(196,168,106,.12)',
                    transformOrigin: '0 0',
                    transform: `rotate(${angle}rad)`,
                    animation: isActive ? 'pulse-conn 2s ease-in-out infinite' : 'none',
                  }} />
                );
              })}

              {/* Core */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: '110px', height: '110px', borderRadius: '50%', background: 'var(--bg)',
                border: '.5px solid var(--gold2)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', zIndex: 5,
              }}>
                <div style={{ position: 'absolute', inset: '-11px', borderRadius: '50%', border: '.5px solid rgba(196,168,106,.18)' }} />
                <div style={{ position: 'absolute', inset: '-24px', borderRadius: '50%', border: '.5px solid rgba(196,168,106,.07)' }} />
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', letterSpacing: '.3em', color: 'var(--gold2)' }}>VERA</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '.2em', color: 'var(--green)', marginTop: '3px' }}>● ACTIVA</div>
              </div>

              {/* Agent nodes */}
              {AGENTS.map(agent => {
                const status = agentStatus[agent.id]?.status ?? 'idle';
                return (
                  <div key={agent.id} onClick={() => setActiveAgent(agent.id)} style={{ position: 'absolute', top: `${agent.top}px`, left: `${agent.left}px`, transform: 'translate(-50%,-50%)', zIndex: 4, cursor: 'pointer' }}>
                    <div style={{
                      width: '73px', height: '73px', borderRadius: '50%', background: 'var(--bg2)',
                      border: `.5px solid ${nodeBorderColor(status)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                      color: nodeIconColor(status),
                      animation: status === 'running' ? 'node-pulse 1.5s ease-in-out infinite' : 'none',
                      transition: 'border-color .2s',
                    }}>
                      <div style={{
                        position: 'absolute', top: '3px', right: '3px', width: '10px', height: '10px',
                        borderRadius: '50%', border: '.5px solid var(--bg)', background: statusColor(status),
                        animation: status === 'running' ? 'blink 1.5s ease-in-out infinite' : 'none',
                      }} />
                      <AgentIcon icon={agent.icon} />
                    </div>
                    <div style={{
                      position: 'absolute', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.14em',
                      color: 'var(--text2)', whiteSpace: 'nowrap', textAlign: 'center', width: '90px',
                      left: '50%', transform: 'translateX(-50%)',
                      ...(agent.labelPos === 'above' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
                    }}>
                      {agent.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nueva Tarea button */}
          <div style={{ padding: '12px 24px', flexShrink: 0 }}>
            <button
              onClick={() => setShowNewTask(true)}
              style={{
                background: 'transparent', border: '.5px solid var(--gold2)', borderRadius: '10px',
                padding: '12px 20px', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)',
                fontSize: '12px', letterSpacing: '.2em', cursor: 'pointer', width: '100%',
              }}
            >
              + NUEVA TAREA
            </button>
          </div>
        </div>

        {/* RIGHT PANEL — oculto en móvil */}
        {!isMobile && (activeAgent ? (
          <AgentPanel
            agentId={activeAgent}
            agentStatus={agentStatus[activeAgent] ?? { status: 'idle' }}
            onClose={() => setActiveAgent(null)}
          />
        ) : (
          <RightPanel
            tasks={tasks.filter(t => t.status !== 'done' && t.status !== 'archived')}
            inboxCount={inboxCount}
            nextTrip={nextTrip}
            tab={rightTab}
            setTab={setRightTab}
            onMarkDone={markDone}
            onInboxCountChange={setInboxCount}
          />
        ))}
      </div>

      {/* BOTTOM BAR — solo desktop */}
      {!isMobile && (
        <div style={{ height: '36px', background: 'var(--bg)', borderTop: '.5px solid var(--bg4)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', flexShrink: 0 }}>
          {AGENTS.filter(a => agentStatus[a.id]?.status !== 'idle').map(agent => {
            const status = agentStatus[agent.id]?.status ?? 'idle';
            return (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.12em', color: 'var(--text2)' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor(status), display: 'inline-block' }} />
                {agent.label}
              </div>
            );
          })}
          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '.14em', color: 'var(--text3)' }}>
            VERA · TURSO · VERCEL
          </div>
        </div>
      )}

      {/* NEW TASK MODAL */}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onCreated={handleTaskCreated} />}
      {showCapture && <CaptureSheet onClose={() => { setShowCapture(false); }} />}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes node-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(196,168,106,0)} 50%{box-shadow:0 0 0 8px rgba(196,168,106,.08)} }
        @keyframes pulse-conn { 0%,100%{opacity:.35} 50%{opacity:.8} }
      `}</style>
    </div>
  );
}

/* ─── NavItem helper ────────────────────────────────── */
function Pill({ dot, label }: { dot: string; label: string }) {
  const colors: Record<string, string> = { red: 'var(--red)', amber: 'var(--amber)', green: 'var(--green)' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 12px', border: '.5px solid var(--bg4)', borderRadius: '999px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '.14em', color: 'var(--text2)' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: colors[dot] ?? 'var(--text3)', display: 'inline-block' }} />
      {label}
    </div>
  );
}

function NavItem({ icon, label, active, badge, collapsed, onClick }: { icon: string; label: string; active?: boolean; badge?: number; collapsed?: boolean; onClick?: () => void }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    command: <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    tasks:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    inbox:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    trips:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L9 8.2 1.8 6.4C1 6 .5 7 1 7.5L5.5 12l-2 3.5c-.5 1 .5 2 1.5 1.5L8 15l4.5 4.5c.5.5 1.5 0 1.5-1l-1.8-7.2z"/></svg>,
    props:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    finance: <svg viewBox="0 0 24 24" width={18} height={18} {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    settings:<svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9z"/></svg>,
    logout:  <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    agents:  <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z"/></svg>,
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
        background: active ? 'var(--bg2)' : 'transparent', border: 'none', cursor: 'pointer',
        whiteSpace: 'nowrap', position: 'relative', margin: '1px 0', width: '100%',
        color: active ? 'var(--gold2)' : 'var(--text2)',
      }}
    >
      {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '2px', height: '16px', background: 'var(--gold2)', borderRadius: '1px' }} />}
      <span style={{ color: active ? 'var(--gold2)' : 'var(--text2)', flexShrink: 0 }}>{icons[icon]}</span>
      {!collapsed && (
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', letterSpacing: '.16em', color: active ? 'var(--gold2)' : 'var(--text2)', transition: 'opacity .15s' }}>
          {label}
        </span>
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', padding: '2px 6px', borderRadius: '999px' }}>
          {badge}
        </span>
      )}
    </button>
  );
}
