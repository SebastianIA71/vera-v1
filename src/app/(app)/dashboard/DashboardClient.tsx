'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AgentPanel from '@/components/command/AgentPanel';
import DesktopNav from '@/components/layout/DesktopNav';
import { QUOTES } from '@/lib/quotes';
import { getRandomPersona } from '@/lib/personas';
import dynamic from 'next/dynamic';
const CaptureSheet = dynamic(() => import('@/components/capture/CaptureSheet'), { ssr: false });
const NewEventSheet = dynamic(() => import('@/components/events/NewEventSheet'), { ssr: false });

/* ─── Types ─────────────────────────────────────────── */
type AgentId = 'voice' | 'prio' | 'alert' | 'search' | 'executor' | 'solution';
type AgentStatus = { status: 'running' | 'active' | 'idle' | 'error'; lastRun?: string; message?: string };
type Task = {
  id: number; title: string; detail?: string | null; propertyId?: string | null;
  prio?: number | null; prioFinal?: number | null; status?: string | null;
  inNow?: boolean | null; type?: string | null; lastActionAt?: Date | null;
  tags?: string | null; dueDate?: Date | null;
};
type CompletingTask = Task & { completingAt: number };

/* ─── Constants ─────────────────────────────────────── */
const DAYS = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const pad = (n: number) => String(n).padStart(2, '0');

const AGENTS: { id: AgentId; label: string; icon: string; top: number; left: number; labelPos: 'above' | 'below' }[] = [
  { id: 'voice',    label: 'VOICE',    icon: 'mic',    top: 55,  left: 280, labelPos: 'above' },
  { id: 'prio',     label: 'PRIO',     icon: 'prio',   top: 93,  left: 448, labelPos: 'above' },
  { id: 'alert',    label: 'ALERT',    icon: 'bell',   top: 410, left: 458, labelPos: 'below' },
  { id: 'solution', label: 'SOLUTION', icon: 'help',   top: 475, left: 280, labelPos: 'below' },
  { id: 'executor', label: 'EXECUTOR', icon: 'send',   top: 400, left: 102, labelPos: 'below' },
  { id: 'search',   label: 'SEARCH',   icon: 'search', top: 100, left: 112, labelPos: 'above' },
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

/* ─── Right Panel ───────────────────────────────────── */
function RightPanel({ tasks, inboxCount, nextTrip, nextEvent, allEvents, onMarkDone }: {
  tasks: Task[];
  inboxCount: number;
  nextTrip: { title: string; daysTo: number } | null;
  nextEvent: { title: string; daysTo: number; startDate: string } | null;
  allEvents: { startDate: Date | null; type: string }[];
  onMarkDone: (id: number) => void;
}) {
  const now = new Date();

  const eventDays = new Set(
    allEvents
      .filter(e => e.startDate && e.startDate.getMonth() === now.getMonth() && e.startDate.getFullYear() === now.getFullYear())
      .map(e => e.startDate!.getDate())
  );

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const startOffset = (firstDay + 6) % 7;

  const MONTH_NAMES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const DAY_NAMES = ['L','M','X','J','V','S','D'];

  const topTasks = tasks
    .filter(t => t.status !== 'done' && t.status !== 'archived')
    .sort((a, b) => (b.prioFinal ?? 0) - (a.prioFinal ?? 0))
    .slice(0, 5);

  return (
    <div style={{
      width: 300, flexShrink: 0,
      borderLeft: '.5px solid var(--bg4)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)' }}>
          PUNCH LIST · HOY
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text3)', marginTop: 2 }}>
          {topTasks.length} TAREAS · {inboxCount > 0 ? `${inboxCount} INBOX` : 'INBOX OK'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>

        {/* PUNCH LIST */}
        <div style={{ padding: '0 18px', marginBottom: 12 }}>
          {topTasks.map(task => {
            const prio = task.prioFinal ?? 0;
            const color = prio >= 9 ? 'var(--red)' : prio >= 7 ? 'var(--amber)' : 'var(--text3)';
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '.5px solid var(--bg2)' }}>
                <button
                  onClick={() => onMarkDone(task.id)}
                  style={{ width: 16, height: 16, borderRadius: '50%', border: `.5px solid ${color}`, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  {task.propertyId && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--gold2)', letterSpacing: '.1em', marginTop: 1 }}>
                      {task.propertyId.toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color, flexShrink: 0 }}>{prio}</span>
              </div>
            );
          })}
        </div>

        {/* PRÓXIMO EVENTO */}
        {nextEvent && (
          <div style={{ padding: '8px 18px 12px', borderTop: '.5px solid var(--bg2)' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--purple)', marginBottom: 6 }}>PRÓXIMO EVENTO</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)' }}>{nextEvent.title}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(nextEvent.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 18, color: 'var(--purple)', lineHeight: 1 }}>
                {nextEvent.daysTo}<span style={{ fontSize: 8, marginLeft: 2 }}>D</span>
              </div>
            </div>
          </div>
        )}

        {/* PRÓXIMO VIAJE */}
        {nextTrip && (
          <div style={{ padding: '8px 18px 12px', borderTop: '.5px solid var(--bg2)' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--blue)', marginBottom: 6 }}>PRÓXIMO VIAJE</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)' }}>{nextTrip.title}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 18, color: 'var(--blue)', lineHeight: 1 }}>
                {nextTrip.daysTo}<span style={{ fontSize: 8, marginLeft: 2 }}>D</span>
              </div>
            </div>
          </div>
        )}

        {/* MINI CALENDAR */}
        <div style={{ padding: '8px 18px 12px', borderTop: '.5px solid var(--bg2)' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--text3)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, color: 'var(--text3)', letterSpacing: '.06em', padding: '2px 0' }}>{d}</div>
            ))}
            {Array.from({ length: startOffset }, (_, i) => (
              <div key={`prev-${i}`} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', padding: '4px 2px', lineHeight: 1, opacity: 0.4 }}>
                {prevMonthDays - startOffset + i + 1}
              </div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate();
              const hasEvent = eventDays.has(day);
              return (
                <div key={day} style={{
                  fontFamily: 'var(--font-dm-mono)', fontSize: 9, padding: '4px 2px', lineHeight: 1,
                  borderRadius: 2, position: 'relative',
                  background: isToday ? 'rgba(196,168,106,0.12)' : 'transparent',
                  color: isToday ? 'var(--gold2)' : 'var(--text2)',
                  fontWeight: isToday ? 500 : 400,
                }}>
                  {day}
                  {hasEvent && !isToday && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--blue)', display: 'block' }} />}
                  {hasEvent && isToday && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--gold2)', display: 'block' }} />}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── New Task Modal ─────────────────────────────────── */
function NewTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Task) => void }) {
  const [title, setTitle]           = useState('');
  const [prio, setPrio]             = useState(5);
  const [propertyId, setPropertyId] = useState('');
  const [saving, setSaving]         = useState(false);

  const canSave = title.trim().length > 0;

  const INPUT: React.CSSProperties = {
    width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
    fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };
  const LABEL: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em',
    color: 'var(--text3)', marginBottom: 6, display: 'block',
  };

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, prio, propertyId: propertyId || null }),
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
              {[{id:'',label:'Ninguna'},{id:'flat',label:'Flat'},{id:'sarapita',label:'Sarapita'},{id:'willys',label:"Willy's"}].map(p => (
                <button key={p.id} onClick={() => setPropertyId(p.id)} style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                  border: `.5px solid ${propertyId === p.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                  background: propertyId === p.id ? 'rgba(196,168,106,0.12)' : 'transparent',
                  color: propertyId === p.id ? 'var(--gold2)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                }}>{p.label.toUpperCase()}</button>
              ))}
            </div>
          </div>

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

/* ─── Main Client Component ─────────────────────────── */
type Kpis = {
  tasksActive: number;
  tasksDone: number;
  inboxPending: number;
  tripsCount: number;
  eventsCount: number;
  propsCount: number;
  currentWeight: number | null;
};

const getKpiNodes = (kpis: Kpis) => [
  { id: 'tasks',  label: 'TAREAS',  value: kpis.tasksActive,                                         color: 'var(--gold2)'  },
  { id: 'inbox',  label: 'INBOX',   value: kpis.inboxPending,                                         color: 'var(--red)'    },
  { id: 'trips',  label: 'VIAJES',  value: kpis.tripsCount,                                           color: 'var(--blue)'   },
  { id: 'events', label: 'EVENTOS', value: kpis.eventsCount,                                          color: 'var(--purple)' },
  { id: 'props',  label: 'PROPS',   value: kpis.propsCount,                                           color: 'var(--green)'  },
  { id: 'weight', label: 'KG',      value: kpis.currentWeight !== null ? kpis.currentWeight : '—',    color: 'var(--amber)'  },
];

export default function DashboardClient({
  initialTasks,
  urgentCount,
  staleCount,
  inboxCount: initialInboxCount,
  nextTrip,
  nextEvent,
  allEvents,
  kpis,
}: {
  initialTasks: Task[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
  nextTrip: { title: string; daysTo: number } | null;
  nextEvent: { title: string; daysTo: number; startDate: string } | null;
  allEvents: { startDate: Date | null; type: string }[];
  kpis: Kpis;
}) {
  const router = useRouter();
  const [time, setTime] = useState('');
  const navCollapsed = false;
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [persona] = useState(() => getRandomPersona());
  const renderQuote = (raw: string) => raw.split(/\*([^*]+)\*/).map((part, i) =>
    i % 2 === 1 ? <em key={i} style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{part}</em> : part
  );
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [agentStatus, setAgentStatus] = useState<Record<AgentId, AgentStatus>>(
    Object.fromEntries(['voice','prio','alert','search','executor','solution'].map(id => [id, { status: 'idle' }])) as Record<AgentId, AgentStatus>
  );
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
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
  const nodeBorderColor = (s: string) => s === 'running' ? 'var(--gold2)' : s === 'active' ? 'var(--green)' : 'rgba(255,255,255,0.15)';
  const nodeIconColor = (s: string) => s === 'running' ? 'var(--gold2)' : s === 'active' ? 'var(--green)' : 'var(--text2)';

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
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.14em', color: 'var(--gold2)', fontWeight: 400 }}>v.30</span>
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
        <DesktopNav inboxCount={initialInboxCount} activeOverride="dashboard" counts={{ tasks: kpis.tasksActive, trips: kpis.tripsCount, properties: kpis.propsCount, agents: 6 }} />

        {/* CENTER: ORBITAL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: '22px', color: 'var(--text)', letterSpacing: '-.01em' }}>
                Command <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Centre</em>
              </div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 300, fontSize: '13px', color: 'var(--text3)', letterSpacing: '.01em', marginTop: 2 }}>
                good {(() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 19 ? 'afternoon' : 'evening'; })()},{' '}
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(persona.replace(/ /g, '_'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text2)', fontWeight: 300, textDecoration: 'none', borderBottom: '.5px solid rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'color .15s, border-color .15s' }}
                  onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = 'var(--text)'; (e.target as HTMLAnchorElement).style.borderBottomColor = 'var(--text2)'; }}
                  onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = 'var(--text2)'; (e.target as HTMLAnchorElement).style.borderBottomColor = 'rgba(255,255,255,0.15)'; }}
                >{persona}</a>.
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--text4)' }}>
              6 AGENTES · TURSO SYNC
            </div>
          </div>

          {/* Quote */}
          <div style={{ padding: '6px 0 16px 10', fontFamily: 'var(--font-syne)', fontWeight: 300, fontSize: 13, color: 'var(--text2)', letterSpacing: '.01em', lineHeight: 1.6, flexShrink: 0, borderLeft: '1.5px solid rgba(196,168,106,0.25)', marginLeft: 24 }}>
            {renderQuote(quote)}
          </div>

          {/* Orbital map */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 0 }}>
            {/* KPI columna izquierda */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, paddingRight: 24, flexShrink: 0 }}>
              {getKpiNodes(kpis).map(kpi => (
                <div key={kpi.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px',
                  background: 'var(--bg)',
                  border: `.5px solid ${kpi.color}33`,
                  borderLeft: `2px solid ${kpi.color}`,
                  borderRadius: '0 6px 6px 0',
                  minWidth: 72,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 16, fontWeight: 500, color: kpi.color, lineHeight: 1 }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.1em', color: 'var(--text3)', marginTop: 2 }}>
                      {kpi.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Orbital */}
            <div style={{ position: 'relative', width: '560px', height: '560px', flexShrink: 0 }}>
              {/* Rings */}
              {[140, 260, 380, 440].map((size, i) => (
                <div key={size} style={{
                  position: 'absolute', borderRadius: '50%', top: '50%', left: '50%',
                  width: `${size}px`, height: `${size}px`,
                  transform: 'translate(-50%,-50%)',
                  border: i === 0 ? `.5px solid rgba(196,168,106,.22)` : i === 3 ? '.5px dashed var(--bg3)' : '.5px solid var(--bg4)',
                }} />
              ))}

              {/* Connection lines — agentes */}
              {AGENTS.map(agent => {
                const status = agentStatus[agent.id]?.status ?? 'idle';
                const isActive = status === 'running' || status === 'active';
                const angle = Math.atan2(agent.top - 280, agent.left - 280);
                const dist = Math.sqrt(Math.pow(agent.left - 280, 2) + Math.pow(agent.top - 280, 2));
                return (
                  <div key={`conn-${agent.id}`} style={{
                    position: 'absolute', top: '280px', left: '280px',
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
            {/* fin orbital */}
          </div>

          {/* Botones de creación */}
          <div style={{ padding: '12px 24px 20px', flexShrink: 0, display: 'flex', flexDirection: 'row', gap: 8 }}>
            <button onClick={() => setShowNewTask(true)} style={{ flex: 1, background: 'transparent', border: '.5px solid var(--gold2)', borderRadius: '10px', padding: '12px 8px', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '.16em', cursor: 'pointer' }}>
              + TAREA
            </button>
            <button onClick={() => setShowNewEvent(true)} style={{ flex: 1, background: 'transparent', border: '.5px solid var(--purple)', borderRadius: '10px', padding: '12px 8px', color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '.16em', cursor: 'pointer' }}>
              + EVENTO
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
            nextEvent={nextEvent}
            allEvents={allEvents}
            onMarkDone={markDone}
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
      {showNewEvent && <NewEventSheet onClose={() => setShowNewEvent(false)} onCreated={() => setShowNewEvent(false)} />}

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


