'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { QUOTES } from '@/lib/quotes';
import { getRandomPersona } from '@/lib/personas';
import { getTodaySnm } from '@/lib/snm';
import { getGreeting, personaSearchUrl, taskBorderColor } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';

const CaptureSheet  = dynamic(() => import('@/components/capture/CaptureSheet'), { ssr: false });
const InboxMobile   = dynamic(() => import('@/components/inbox/InboxMobile'), { ssr: false });
const NewEventSheet = dynamic(() => import('@/components/events/NewEventSheet'), { ssr: false });
const NewTaskModal  = dynamic(() => import('@/components/tasks/NewTaskModal'), { ssr: false });
const DailyInsight   = dynamic(() => import('@/components/DailyInsight'), { ssr: false });
const DailyBriefing  = dynamic(() => import('@/components/DailyBriefing'), { ssr: false });
const FinanceSparklineHeader = dynamic(() => import('@/components/finance/FinanceSparklineHeader').then(m => ({ default: m.FinanceSparklineHeader })), { ssr: false });

type Task = { id: number; title: string; detail?: string | null; propertyId?: string | null; prioFinal?: number | null; lastActionAt?: Date | null; tags?: string | null };
type WeightLog = { id: number; date: string; value: number; snmAgua?: boolean | null; snmCaminar?: boolean | null; snmEntreno?: boolean | null; snmEscucha?: boolean | null; snmDisfruta?: boolean | null };
type InboxItem = { id: number; content: string; source?: string | null; suggestedPropertyId?: string | null; createdAt?: Date | null };

const SNM_ICONS = ['💧', '🚶', '💪', '🧘', '🍴'];
const SNM_KEYS = ['snmAgua', 'snmCaminar', 'snmEntreno', 'snmEscucha', 'snmDisfruta'] as const;

function transportIcon(t: string): string {
  const v = t.toLowerCase().trim();
  if (v.includes('avi') || v.includes('vuelo') || v.includes('fly') || v.includes('avion')) return '✈';
  if (v.includes('tren') || v.includes('train') || v.includes('ave') || v.includes('renfe')) return '🚄';
  if (v.includes('coche') || v.includes('car') || v.includes('auto')) return '🚗';
  if (v.includes('barco') || v.includes('ferry') || v.includes('boat')) return '⛵';
  if (v.includes('bus') || v.includes('coach')) return '🚌';
  if (v.includes('moto')) return '🏍';
  return '🧳';
}

function transportIcons(t: string): string {
  return t.split(',').filter(Boolean).map(v => transportIcon(v)).join(' ');
}

function SectionLabel({ label, color, meta, link, onLinkClick }: { label: string; color?: string; meta?: string; link?: string; onLinkClick?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, letterSpacing: '.22em', color: color ?? 'var(--gold2)', textTransform: 'uppercase' }}>{label}</span>
      {meta && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.12em' }}>{meta}</span>}
      {link && (
        <button onClick={onLinkClick} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.1em' }}>
          {link}
        </button>
      )}
    </div>
  );
}

function weightTrendPath(logs: WeightLog[]): string {
  if (logs.length < 2) return '';
  const vals = [...logs].reverse().map(l => l.value);
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const w = 331; const h = 56;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  return `M${points.join(' L')}`;
}

type PropTask = { prop: { id: string; name: string; color: string | null; icon: string | null }; task: { id: number; title: string; prioFinal: number | null } };
type ProjTask = { proj: { id: number; name: string; color: string | null }; task: { id: number; title: string; prioFinal: number | null } };

export default function MobileHome({
  urgentTasks,
  urgentTotal,
  nextTrip,
  nextEvent,
  weightLogs,
  inboxCount,
  inboxItems = [],
  topTaskByProperty = [],
  topTaskByProject = [],
  allEvents = [],
  todaySnm = [],
  financeRecords,
}: {
  urgentTasks: Task[];
  urgentTotal?: number;
  nextTrip: { title: string; daysTo: number; startDate: string; endDate?: string; who: string; transport?: string } | null;
  nextEvent: { title: string; daysTo: number; startDate: string; who: string } | null;
  weightLogs: WeightLog[];
  inboxCount: number;
  inboxItems?: InboxItem[];
  topTaskByProperty?: PropTask[];
  topTaskByProject?: ProjTask[];
  allEvents?: { startDate: string; type: string; title: string }[];
  todaySnm?: string[];
  financeRecords?: { calcD: number|null; calcB: number|null; calcA: number|null; calcE: number|null }[];
}) {
  const router = useRouter();
  const [showCapture, setShowCapture] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newTaskPropId, setNewTaskPropId] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState('');
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [persona] = useState(() => getRandomPersona());
  const [snmActive, setSnmActive] = useState<string[]>(todaySnm);
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    const refresh = () => {
      const local = getTodaySnm();
      setSnmActive(local.length > 0 ? local : todaySnm);
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [todaySnm]);

  useEffect(() => {
    const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const update = () => {
      const now = new Date();
      const day = DAY_NAMES[now.getDay()];
      const date = now.getDate().toString().padStart(2,'0');
      const month = (now.getMonth()+1).toString().padStart(2,'0');
      const h = now.getHours().toString().padStart(2,'0');
      const m = now.getMinutes().toString().padStart(2,'0');
      setClockStr(`${day} ${date}/${month} · ${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderQuote = (raw: string) => raw.split(/\*([^*]+)\*/).map((part, i) =>
    i % 2 === 1 ? <em key={i} style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{part}</em> : part
  );

  useEffect(() => {
    const parts: string[] = [];
    if (weightLogs[0]) parts.push(`${weightLogs[0].value} KG`);
    parts.push('10,2K');
    if (nextTrip) {
      const transportStr = nextTrip.transport ? `${transportIcons(nextTrip.transport)} ` : '';
      const duration = nextTrip.endDate && nextTrip.startDate
        ? Math.ceil((new Date(nextTrip.endDate).getTime() - new Date(nextTrip.startDate).getTime()) / 86400000)
        : null;
      const durationStr = duration ? ` · ${duration}D` : '';
      parts.push(`${transportStr}${nextTrip.title.toUpperCase()} · ${nextTrip.daysTo}D${durationStr}`);
    }
    setStatusLine(parts.join(' · '));
  }, [weightLogs, nextTrip]);

  const latestWeight = weightLogs[0];
  const prevWeight = weightLogs[1];
  const weightTrend = latestWeight && prevWeight
    ? latestWeight.value > prevWeight.value ? 'SUBIENDO' : latestWeight.value < prevWeight.value ? 'BAJANDO' : 'ESTABLE'
    : 'ESTABLE';
  const trendColor = weightTrend === 'SUBIENDO' ? 'var(--amber)' : 'var(--green)';

  const todaySNM = latestWeight
    ? SNM_KEYS.map(k => ({ icon: SNM_ICONS[SNM_KEYS.indexOf(k)], on: !!latestWeight[k] }))
    : SNM_KEYS.map((_, i) => ({ icon: SNM_ICONS[i], on: false }));

  const wPath = weightTrendPath(weightLogs);

  return (
    <div className="mobile-home-root" style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', position: 'relative' }}>

      {/* Scroll content */}
      <div style={{ padding: '16px 22px 140px', overflowY: 'auto' }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: 'var(--gold2)' }}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" /></svg>
            VERA
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--gold2)', fontWeight: 400 }}>{APP_VERSION}</span>
            {clockStr && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.08em', color: 'var(--text3)', fontWeight: 400 }}>{clockStr}</span>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => router.push('/settings')}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '.5px solid var(--bg4)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}
              aria-label="Ajustes"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/lock'); }}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '.5px solid var(--bg4)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}
              title="Cerrar sesión" aria-label="Cerrar sesión"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            <button onClick={() => router.push('/morning')} style={{ width: 32, height: 32, borderRadius: '50%', border: '.5px solid var(--bg4)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 30, lineHeight: 1.15, color: 'var(--text)', letterSpacing: '-.01em' }}>
            {'g. '}
            <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{getGreeting()}</em>
            {', '}
            <a
              href={personaSearchUrl(persona)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text2)', fontWeight: 300, textDecoration: 'none', borderBottom: '.5px solid rgba(255,255,255,0.12)' }}
            >{persona}</a>
            {'.'}
          </div>
          {statusLine && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 12 }}>
              {statusLine}
            </div>
          )}
        </div>

        {/* Quote */}
        <div style={{ marginBottom: 24, fontFamily: 'var(--font-syne)', fontWeight: 300, fontSize: 14, lineHeight: 1.6, color: 'var(--text2)', letterSpacing: '.01em', paddingLeft: 10, borderLeft: '1.5px solid rgba(196,168,106,0.25)' }}>
          {renderQuote(quote)}
        </div>

        {/* Now section */}
        {urgentTasks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Now" meta={`${urgentTotal ?? urgentTasks.length} URGENTES`} link="→" onLinkClick={() => router.push('/tasks')} />
            {urgentTasks.slice(0, 3).map(t => (
              <div key={t.id} style={{
                background: 'var(--bg2)', border: `.5px solid var(--bg4)`,
                borderLeft: `2px solid ${taskBorderColor(t.prioFinal ?? 0, t.lastActionAt)}`,
                borderRadius: 14, padding: '13px 13px 13px 14px', marginBottom: 7,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 13, color: 'var(--gold)', minWidth: 20, paddingTop: 1 }}>{t.prioFinal}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 15, lineHeight: 1.35, color: 'var(--text)' }}>{t.title}</div>
                  {t.propertyId && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--gold2)', marginTop: 5 }}>{t.propertyId.toUpperCase()}</div>
                  )}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0, marginTop: 2 }} />
              </div>
            ))}
          </div>
        )}

        {/* Inbox strip */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="Inbox" link="→" onLinkClick={() => router.push('/inbox')} />
          <div style={{ border: '.5px dashed #2c2c2a', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            onClick={() => router.push('/inbox')}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 28, color: 'var(--gold)', lineHeight: 1, minWidth: 32 }}>{inboxCount}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)' }}>capturas sin procesar</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 4 }}>INBOX</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 16 }}>→</span>
          </div>
        </div>

        {/* Weight section */}
        {latestWeight && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Weight" meta="14 DÍAS" />
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '16px 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 32, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.02em' }}>{latestWeight.value}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', marginTop: 4, letterSpacing: '.1em' }}>KG · HOY</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', padding: '4px 8px', borderRadius: 999, border: '.5px solid var(--bg4)', color: trendColor }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: trendColor, display: 'inline-block' }} />
                  {weightTrend}
                </div>
              </div>

              {/* Trend chart */}
              {wPath && (
                <svg width="100%" height={56} viewBox="0 0 331 56" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ecb8d" stopOpacity=".18" />
                      <stop offset="100%" stopColor="#4ecb8d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={wPath + ` L331 56 L0 56 Z`} fill="url(#wg)" />
                  <path d={wPath} stroke="var(--green)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                </svg>
              )}

              {/* SNM */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '.5px solid var(--bg4)' }}>
                {SNM_KEYS.map((key, i) => (
                  <div key={key} style={{
                    flex: 1, background: snmActive.includes(key) ? 'rgba(78,203,141,.08)' : 'var(--bg3)',
                    border: `.5px solid ${snmActive.includes(key) ? 'var(--green)' : 'var(--bg4)'}`,
                    borderRadius: 10, padding: '10px 4px', textAlign: 'center',
                    fontSize: 16, opacity: snmActive.includes(key) ? 1 : 0.25,
                  }}>
                    {SNM_ICONS[i]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming events (social) */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="Upcoming Events" link="→" onLinkClick={() => router.push('/trips?type=social')} />
        {nextEvent ? (
          <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>{nextEvent.title}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '.12em', marginTop: 4 }}>
                {new Date(nextEvent.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
              </div>
              {nextEvent.who && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.1em', marginTop: 2 }}>{nextEvent.who.toUpperCase()}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: nextEvent.daysTo <= 0 ? 13 : 22, color: 'var(--purple)', lineHeight: 1 }}>
                {nextEvent.daysTo <= 0 ? 'HOY' : nextEvent.daysTo}
              </div>
              {nextEvent.daysTo > 0 && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.1em' }}>DÍAS</div>}
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em', padding: '12px 2px' }}>
            Sin eventos próximos · toca + para añadir
          </div>
        )}
        </div>

        {/* Upcoming trips */}
        {nextTrip && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Upcoming trips" link="→" onLinkClick={() => router.push('/trips')} />
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)', letterSpacing: '-.01em' }}>{nextTrip.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    {nextTrip.transport && (
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 15, lineHeight: 1 }}>
                        {transportIcons(nextTrip.transport)}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '.12em' }}>
                      {new Date(nextTrip.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                    </span>
                    {nextTrip.endDate && (
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.08em' }}>
                        · {Math.ceil((new Date(nextTrip.endDate).getTime() - new Date(nextTrip.startDate).getTime()) / 86400000)}D
                      </span>
                    )}
                  </div>
                  {nextTrip.who && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.1em', marginTop: 2 }}>
                      {nextTrip.who.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 26, color: 'var(--blue)', lineHeight: 1, textAlign: 'right' }}>{nextTrip.daysTo}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color: 'var(--text2)', marginTop: 2, textAlign: 'right' }}>DÍAS</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {(() => {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const todayDay = now.getDay();
          const daysFromMonday = (todayDay + 6) % 7;
          const monday = new Date(now);
          monday.setDate(now.getDate() - daysFromMonday);
          const startDay = monday.getMonth() === month ? monday.getDate() : 1;
          const TOTAL_CELLS = 35;
          const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
          const DAY_NAMES = ['L','M','X','J','V','S','D'];

          const nextMonth = month === 11 ? 0 : month + 1;
          const nextYear  = month === 11 ? year + 1 : year;
          const eventDays = new Map<number, { type: string; title: string }[]>();
          const nextMonthEventDays = new Map<number, { type: string; title: string }[]>();
          allEvents.forEach(e => {
            const d = new Date(e.startDate);
            if (d.getMonth() === month && d.getFullYear() === year) {
              const day = d.getDate();
              if (!eventDays.has(day)) eventDays.set(day, []);
              eventDays.get(day)!.push({ type: e.type, title: e.title });
            }
            if (d.getMonth() === nextMonth && d.getFullYear() === nextYear) {
              const day = d.getDate();
              if (!nextMonthEventDays.has(day)) nextMonthEventDays.set(day, []);
              nextMonthEventDays.get(day)!.push({ type: e.type, title: e.title });
            }
          });

          const dotColor = (type: string) =>
            type === 'viaje' ? 'var(--blue)' : type === 'social' ? 'var(--purple)' : 'var(--green)';

          return (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase' }}>Calendar</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em' }}>{MONTHS[month]} {year}</span>
              </div>
              <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                  {DAY_NAMES.map(d => (
                    <div key={d} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.08em', textAlign: 'center', padding: '2px 0' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {Array.from({ length: TOTAL_CELLS }, (_, i) => {
                    const dayNum = startDay + i;
                    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                    const isNextMonth = dayNum > daysInMonth;
                    const displayDay = isNextMonth ? dayNum - daysInMonth : dayNum;
                    const isToday = isCurrentMonth && displayDay === now.getDate();
                    const evs = isCurrentMonth ? (eventDays.get(displayDay) ?? []) : (nextMonthEventDays.get(displayDay) ?? []);
                    return (
                      <div key={`cell-${i}`} style={{ position: 'relative', fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: isToday ? 'var(--gold2)' : isCurrentMonth ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '5px 2px 8px', lineHeight: 1, borderRadius: 4, background: isToday ? 'rgba(196,168,106,0.10)' : 'transparent', fontWeight: isToday ? 500 : 400 }}>
                        {displayDay}
                        {evs.length > 0 && (
                          <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                            {evs.slice(0, 3).map((ev, j) => (
                              <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor(ev.type), display: 'inline-block', boxShadow: `0 0 4px ${dotColor(ev.type)}` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '.5px solid var(--bg4)' }}>
                  {[{ color: 'var(--blue)', label: 'Viaje' }, { color: 'var(--purple)', label: 'Evento' }, { color: 'var(--green)', label: 'Otro' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.08em' }}>{l.label.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Real estate — top task por propiedad */}
        {topTaskByProperty.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Real Estate" link="→" onLinkClick={() => router.push('/properties')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topTaskByProperty.map(({ prop, task }) => (
                <div key={prop.id} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderLeft: `2px solid ${prop.color ?? 'var(--text3)'}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{prop.icon ?? '🏠'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: prop.color ?? 'var(--text3)', letterSpacing: '.12em', marginBottom: 2 }}>{prop.name.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>{task.prioFinal ?? 0}</span>
                  <button
                    onClick={() => setNewTaskPropId(prop.id)}
                    style={{ width: 26, height: 26, borderRadius: 8, background: 'transparent', border: `.5px solid ${prop.color ?? 'var(--bg4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: prop.color ?? 'var(--text3)', cursor: 'pointer', flexShrink: 0 }}
                    title={`Nueva tarea en ${prop.name}`}
                  >
                    <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects — top task por proyecto */}
        {topTaskByProject.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Projects" link="→" onLinkClick={() => router.push('/projects')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topTaskByProject.map(({ proj, task }) => (
                <div key={proj.id} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderLeft: `2px solid ${proj.color ?? 'var(--text3)'}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>◆</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: proj.color ?? 'var(--text3)', letterSpacing: '.12em', marginBottom: 2 }}>{proj.name.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>{task.prioFinal ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finance — D · B · E con sparklines reales */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="Finance" link="/finance" onLinkClick={() => router.push('/finance')} />
          <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 16px' }}>
            {financeRecords && financeRecords.length > 0
              ? <FinanceSparklineHeader records={financeRecords} />
              : (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                  SIN DATOS · CARGA EL EXCEL EN /FINANCE
                </div>
              )
            }
          </div>
        </div>

        <DailyBriefing />
        <DailyInsight />

      </div>

      {showCapture && <CaptureSheet onClose={() => setShowCapture(false)} />}
      {showInbox && <InboxMobile items={inboxItems} onClose={() => { setShowInbox(false); router.refresh(); }} />}
      {showNewEvent && <NewEventSheet onClose={() => setShowNewEvent(false)} onCreated={() => setShowNewEvent(false)} />}
      {newTaskPropId && <NewTaskModal defaultPropertyId={newTaskPropId} onClose={() => setNewTaskPropId(null)} onCreated={() => { setNewTaskPropId(null); router.refresh(); }} />}
    </div>
  );
}


