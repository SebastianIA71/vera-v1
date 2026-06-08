'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DesktopShell from '@/components/layout/DesktopShell';
import MobilePageHeader from '@/components/layout/MobilePageHeader';
import { urlB64ToUint8Array } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';
import type { AgentStats } from '@/app/api/agents/status/route';

/* ─── Tipos y constantes ─────────────────────────────────── */
type AgentId = 'prio' | 'alert' | 'search' | 'executor' | 'solution' | 'voice' | 'jarvis' | 'contacts' | 'draft';

const AGENTS: { id: AgentId; label: string; color: string; icon: string; desc: string; cron?: string }[] = [
  { id: 'alert',    label: 'Alert',    color: 'var(--red)',    icon: '🔔', desc: 'Push · stale · contratos · viajes', cron: '7:00h diario' },
  { id: 'prio',     label: 'Prio',     color: 'var(--amber)',  icon: '⚡', desc: 'Recalcula prioridades',              cron: '6:30h diario' },
  { id: 'contacts', label: 'Contacts', color: 'var(--purple)', icon: '👥', desc: 'Seguimiento social' },
  { id: 'search',   label: 'Search',   color: 'var(--blue)',   icon: '🔍', desc: 'Brave Search + Claude' },
  { id: 'solution', label: 'Solution', color: 'var(--cyan)',   icon: '💡', desc: 'DIY · mixta · profesional' },
  { id: 'executor', label: 'Executor', color: 'var(--green)',  icon: '📧', desc: 'Email + WhatsApp draft + envío' },
  { id: 'voice',    label: 'Voice',    color: 'var(--gold2)',  icon: '🎤', desc: 'Captura de voz → inbox' },
  { id: 'jarvis',   label: 'Jarvis',   color: 'var(--gold)',   icon: '✦',  desc: 'Pipeline autónomo' },
  { id: 'draft',    label: 'IAfont',   color: 'var(--cyan)',   icon: '✍️',  desc: 'Borradores Substack · LinkedIn · X' },
];

const BTN: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 10,
  background: 'transparent', cursor: 'pointer',
  fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em',
  touchAction: 'manipulation', textAlign: 'center',
};
const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
  borderRadius: 10, padding: '12px 14px', color: 'var(--text)',
  fontFamily: 'var(--font-dm-sans)', fontSize: 14, outline: 'none', marginBottom: 10,
};

/* ─── Helpers ────────────────────────────────────────────── */
function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (m < 2)  return 'ahora';
  if (m < 60) return `hace ${m}m`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${d}d`;
}

/* Mini sparkline SVG (7 barras) */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const W = 56; const H = 20; const gap = 2;
  const barW = (W - gap * 6) / 7;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * H);
        const x = i * (barW + gap);
        return (
          <rect key={i} x={x} y={H - h} width={barW} height={h}
            fill={v > 0 ? color : 'var(--bg4)'} rx={1} opacity={i === 6 ? 1 : 0.55} />
        );
      })}
    </svg>
  );
}

/* Status dot con animación */
function StatusDot({ status, color }: { status: AgentStats['status']; color: string }) {
  const isActive = status === 'active' || status === 'running';
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
      {isActive && (
        <span style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          background: color, opacity: 0.25,
          animation: 'agentPulse 2s ease-in-out infinite',
        }} />
      )}
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? color : status === 'error' ? 'var(--red)' : 'var(--bg4)', display: 'block' }} />
    </span>
  );
}

/* ─── Card de agente ─────────────────────────────────────── */
function AgentCard({
  agent, stats, expanded, onToggle, isMobile,
}: {
  agent: typeof AGENTS[0];
  stats: AgentStats;
  expanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) {
  const isActive = stats.status === 'active' || stats.status === 'running';
  const borderColor = expanded ? agent.color : isActive ? agent.color + '66' : 'var(--bg4)';

  return (
    <div style={{ borderRadius: 14, border: `.5px solid ${borderColor}`, overflow: 'hidden', transition: 'border-color .2s' }}>
      {/* Header de la card — siempre visible */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: expanded ? 'var(--bg2)' : 'var(--bg2)', border: 'none',
          padding: isMobile ? '14px 16px' : '16px 20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        }}
      >
        {/* Status dot */}
        <StatusDot status={stats.status} color={agent.color} />

        {/* Icon + Name */}
        <span style={{ fontSize: isMobile ? 18 : 20, flexShrink: 0, lineHeight: 1 }}>{agent.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: isMobile ? 15 : 16, color: isActive ? agent.color : 'var(--text)' }}>
              {agent.label}
            </span>
            {agent.cron && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.12em' }}>
                {agent.cron}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginTop: 2 }}>
            {agent.desc}
          </div>
          {/* Last action text — visible sin expandir */}
          {stats.lastOutput && (
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text2)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stats.lastOutput}
            </div>
          )}
        </div>

        {/* Stats + sparkline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Today count */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 18, color: stats.todayCount > 0 ? agent.color : 'var(--text4)', lineHeight: 1 }}>
                {stats.todayCount}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text4)', letterSpacing: '.1em' }}>HOY</div>
            </div>
            {/* Week count */}
            {!isMobile && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 18, color: 'var(--text3)', lineHeight: 1 }}>
                  {stats.weekCount}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text4)', letterSpacing: '.1em' }}>7D</div>
              </div>
            )}
          </div>
          {/* Sparkline */}
          <Sparkline data={stats.weekActivity} color={agent.color} />
          {/* Last run */}
          {stats.lastRun && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.08em' }}>
              {relTime(stats.lastRun)}
            </div>
          )}
        </div>

        {/* Chevron */}
        <span style={{ color: 'var(--text3)', fontSize: 12, flexShrink: 0, marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Panel expandible */}
      {expanded && (
        <div style={{ background: 'var(--bg3)', borderTop: `.5px solid ${agent.color}33`, padding: 16 }}>
          {agent.id === 'alert'    && <AlertPanel />}
          {agent.id === 'prio'     && <PrioPanel />}
          {agent.id === 'contacts' && <ContactsPanel />}
          {agent.id === 'search'   && <SearchPanel />}
          {agent.id === 'solution' && <SolutionPanel />}
          {agent.id === 'executor' && <ExecutorPanel />}
          {agent.id === 'voice'    && <VoiceInfoPanel />}
          {agent.id === 'jarvis'   && <JarvisInfoPanel />}
          {agent.id === 'draft'    && <DraftPanel />}
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────── */
export default function AgentsClient({ urgentCount, staleCount, inboxCount }: {
  urgentCount: number; staleCount: number; inboxCount: number;
}) {
  const [expanded, setExpanded] = useState<AgentId | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [statsMap, setStatsMap] = useState<Record<string, AgentStats>>({});
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    fetch('/api/agents/status')
      .then(r => r.json())
      .then(d => { setStatsMap(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
    // Polling cada 30s
    const id = setInterval(loadStats, 30000);
    return () => clearInterval(id);
  }, [loadStats]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const totalToday = Object.values(statsMap).reduce((s, a) => s + (a.todayCount ?? 0), 0);
  const activeCount = Object.values(statsMap).filter(a => a.status === 'active' || a.status === 'running').length;

  const empty: AgentStats = { status: 'idle', todayCount: 0, weekCount: 0, weekActivity: [0,0,0,0,0,0,0] };

  const content = (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
      {isMobile && <MobilePageHeader title="Agentes" />}

      {/* ── Header con resumen global ── */}
      <div style={{ padding: isMobile ? '16px 18px 12px' : '20px 24px 16px', borderBottom: '.5px solid var(--bg4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: isMobile ? 22 : 28, color: 'var(--text)', lineHeight: 1.1 }}>
              Agentes <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Vera</em>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', color: 'var(--text3)', marginTop: 4 }}>
              {APP_VERSION} · {AGENTS.length} SISTEMAS
            </div>
          </div>
          <button onClick={loadStats} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, padding: '4px 8px' }}>↻</button>
        </div>

        {/* Métricas globales */}
        <div style={{ display: 'flex', gap: isMobile ? 12 : 20, marginTop: 14 }}>
          {[
            { label: 'HOY', value: loading ? '···' : String(totalToday), color: totalToday > 0 ? 'var(--green)' : 'var(--text3)' },
            { label: 'ACTIVOS', value: loading ? '···' : String(activeCount), color: activeCount > 0 ? 'var(--gold2)' : 'var(--text3)' },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '8px 14px', minWidth: 64 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 22, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.14em', marginTop: 3 }}>{m.label}</div>
            </div>
          ))}

          {/* Mini status pills de todos los agentes */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            {AGENTS.map(a => {
              const s = statsMap[a.id] ?? empty;
              const active = s.status === 'active' || s.status === 'running';
              return (
                <button key={a.id} onClick={() => setExpanded(e => e === a.id ? null : a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 999,
                    border: `.5px solid ${active ? a.color : 'var(--bg4)'}`,
                    background: active ? a.color + '18' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em',
                    color: active ? a.color : 'var(--text4)',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? a.color : 'var(--bg4)', display: 'inline-block', animation: active ? 'agentPulse 2s ease-in-out infinite' : 'none' }} />
                  {a.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lista de cards ── */}
      <div style={{ padding: isMobile ? '12px 14px' : '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            stats={statsMap[agent.id] ?? empty}
            expanded={expanded === agent.id}
            onToggle={() => setExpanded(e => e === agent.id ? null : agent.id)}
            isMobile={isMobile}
          />
        ))}
      </div>

      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 0.5;  transform: scale(1.3); }
        }
      `}</style>
    </div>
  );

  if (isMobile) return content;
  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
      {content}
    </DesktopShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   PANELES FUNCIONALES
═══════════════════════════════════════════════════════════ */

/* ── Alert ── */
function AlertPanel() {
  const [perm, setPerm] = useState('cargando…');
  const [requesting, setRequesting] = useState(false);
  const [msg, setMsg] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('Notification' in window)) { setSupported(false); setPerm('no soportado'); }
    else setPerm(Notification.permission);
  }, []);

  const requestPerm = async () => {
    if (!supported || requesting) return;
    setRequesting(true); setPerm('solicitando…');
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== 'granted') { setRequesting(false); return; }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(vapidKey) });
        await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
        setMsg('✓ Suscrito a push');
      } else setMsg(vapidKey ? 'Service Worker no disponible' : 'VAPID_PUBLIC_KEY no configurada');
    } catch (e) { setPerm('error'); setMsg(String(e)); }
    setRequesting(false);
  };

  const permColor = perm === 'granted' ? 'var(--green)' : perm === 'denied' ? 'var(--red)' : 'var(--text2)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', color: 'var(--text3)', marginBottom: 3 }}>NOTIFICACIONES</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: permColor }}>{perm}</div>
        {msg && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text2)', marginTop: 6, lineHeight: 1.5 }}>{msg}</div>}
      </div>
      {perm !== 'granted' && supported && (
        <button onPointerDown={e => { e.preventDefault(); requestPerm(); }} disabled={requesting}
          style={{ ...BTN, border: '.5px solid var(--gold2)', color: requesting ? 'var(--text3)' : 'var(--gold)' }}>
          {requesting ? 'SOLICITANDO…' : 'ACTIVAR NOTIFICACIONES →'}
        </button>
      )}
      {perm === 'granted' && (<>
        <button onPointerDown={async e => { e.preventDefault(); setMsg('Enviando…'); const r = await fetch('/api/push/test', { method: 'POST' }); const d = await r.json(); setMsg(d.ok ? '✓ Push enviado' : (d.notice ?? 'Error')); }}
          style={{ ...BTN, border: '.5px solid var(--red)', color: 'var(--red)' }}>ENVIAR TEST PUSH</button>
        <button onPointerDown={async e => { e.preventDefault(); setMsg('Ejecutando alertas…'); const r = await fetch('/api/admin/run-agent?agent=alerts', { method: 'POST' }); const d = await r.json().catch(() => ({})); setMsg(r.ok ? `✓ ${d.alerts ?? 0} alertas enviadas` : (d.error ?? 'Error')); }}
          style={{ ...BTN, border: '.5px solid var(--amber)', color: 'var(--amber)' }}>EJECUTAR ALERTAS AHORA</button>
      </>)}
      {perm === 'denied' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>Permiso denegado. Actívalo en Ajustes del navegador → Notificaciones.</div>}
    </div>
  );
}

/* ── Prio ── */
function PrioPanel() {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [n, setN] = useState(0);
  const run = async () => { setState('running'); const r = await fetch('/api/agents/prio/run', { method: 'POST' }); const d = await r.json(); setN(d.updated ?? 0); setState('done'); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
        Recalcula <code>prioFinal</code> de todas las tareas activas. Considera: base + antigüedad + proximidad de evento + viaje próximo + dueDate.
      </div>
      <button onClick={() => state === 'idle' && run()}
        style={{ ...BTN, border: '.5px solid var(--amber)', color: 'var(--amber)' }}>
        {state === 'idle' ? 'RECALCULAR AHORA →' : state === 'running' ? '···' : `✓ ${n} tareas actualizadas`}
      </button>
    </div>
  );
}

/* ── Search ── */
const BADGE_COLORS: Record<string, string> = { 'GOOGLE FLIGHTS': 'var(--blue)', SKYSCANNER: 'var(--blue)', BOOKING: '#4a90d9', RENFE: '#e05c5c', TRAINLINE: '#00a69c', WEB: 'var(--text3)' };
function SearchPanel() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ title: string; url: string; description?: string; summary?: string; badge?: string }[]>([]);
  const [notice, setNotice] = useState('');
  const [asyncMode, setAsyncMode] = useState(false);
  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setNotice(''); setResults([]); setAsyncMode(false);
    try {
      const r = await fetch('/api/agents/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
      const d = await r.json();
      if (d.mode === 'async') setAsyncMode(true);
      else if (d.mode === 'no_search' || d.mode === 'no_ai') setNotice(d.notice ?? 'Sin resultados');
      else setResults(d.results ?? []);
    } catch { setNotice('Error de conexión.'); }
    setLoading(false);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="¿Qué buscamos?" style={INPUT} />
      <button onClick={search} disabled={loading || !q.trim()} style={{ ...BTN, border: '.5px solid var(--blue)', color: 'var(--blue)' }}>{loading ? '···' : 'BUSCAR →'}</button>
      {asyncMode && <div style={{ background: 'var(--bg2)', border: '.5px solid var(--blue)44', borderRadius: 8, padding: '12px 14px', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--blue)' }}>BUSCANDO EN BACKGROUND — recibirás push cuando esté listo</div>}
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)' }}>{notice}</div>}
      {results.map((r, i) => {
        const bc = r.badge ? (BADGE_COLORS[r.badge] ?? 'var(--text3)') : undefined;
        return (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'var(--bg2)', border: `.5px solid ${bc ? bc + '44' : 'var(--bg4)'}`, borderRadius: 10, padding: '12px 14px', textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
            {(r.summary ?? r.description) && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.4, marginBottom: 4 }}>{r.summary ?? r.description}</div>}
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url.replace(/^https?:\/\//, '').split('/')[0]}</div>
          </a>
        );
      })}
    </div>
  );
}

/* ── Solution ── */
function SolutionPanel() {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{ type: string; label: string; steps: string[]; cost: string; time: string; difficulty: string; materials?: string }[]>([]);
  const [notice, setNotice] = useState('');
  const solve = async () => {
    if (!problem.trim()) return;
    setLoading(true); setNotice(''); setOptions([]);
    try {
      const r = await fetch('/api/agents/solution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem }) });
      const d = await r.json();
      if (d.mode === 'no_ai') setNotice(d.notice ?? 'Sin IA');
      else setOptions(d.options ?? []);
    } catch { setNotice('Error de conexión.'); }
    setLoading(false);
  };
  const tc = (t: string) => t === 'diy' ? 'var(--green)' : t === 'mixed' ? 'var(--amber)' : 'var(--purple)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Describe el problema…" style={{ ...INPUT, resize: 'none', minHeight: 80, marginBottom: 0 }} />
      <button onClick={solve} disabled={loading || !problem.trim()} style={{ ...BTN, border: '.5px solid var(--purple)', color: 'var(--purple)' }}>{loading ? '···' : 'PROPONER SOLUCIONES →'}</button>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)' }}>{notice}</div>}
      {options.map((opt, i) => (
        <div key={i} style={{ background: 'var(--bg2)', borderLeft: `3px solid ${tc(opt.type)}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-syne)', fontSize: 14, color: tc(opt.type) }}>{opt.label}</span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)' }}>{opt.cost} · {opt.time}</span>
          </div>
          {opt.steps.map((s, j) => <div key={j} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 2 }}>• {s}</div>)}
          {opt.materials && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>{opt.materials}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Executor ── */
function ExecutorPanel() {
  const [tab, setTab] = useState<'email' | 'whatsapp'>('email');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        {(['email', 'whatsapp'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 8, border: `.5px solid ${tab === t ? 'var(--green)' : 'var(--bg4)'}`,
            background: tab === t ? 'var(--green)18' : 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em',
            color: tab === t ? 'var(--green)' : 'var(--text3)',
          }}>
            {t === 'email' ? '📧 EMAIL' : '💬 WHATSAPP'}
          </button>
        ))}
      </div>
      {tab === 'email'    && <EmailSubPanel />}
      {tab === 'whatsapp' && <WhatsAppSubPanel />}
    </div>
  );
}

function EmailSubPanel() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ body: string; to: string; subject: string; tone: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const generate = async () => {
    setLoading(true); setNotice('');
    const r = await fetch('/api/agents/executor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, context, tone: 'natural' }) });
    const d = await r.json();
    if (d.draft) setDraft(d.draft);
    if (d.notice) setNotice(d.notice);
    setLoading(false);
  };
  const send = async () => {
    if (!draft) return; setSending(true);
    const r = await fetch('/api/agents/executor/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const d = await r.json(); if (d.ok) setSent(true); setSending(false);
  };
  if (sent) return <div style={{ textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 14, color: 'var(--green)', padding: 16 }}>✓ EMAIL ENVIADO</div>;
  if (draft) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>PARA: {draft.to}</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', marginBottom: 10 }}>ASUNTO: {draft.subject}</div>
        <textarea value={draft.body} onChange={e => setDraft(d => d ? { ...d, body: e.target.value } : d)}
          style={{ width: '100%', background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 13, lineHeight: 1.6, resize: 'vertical', minHeight: 160, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = 'var(--green)')} onBlur={e => (e.target.style.borderColor = 'var(--bg4)')} />
      </div>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--amber)' }}>{notice}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setDraft(null)} style={{ ...BTN, flex: 1, border: '.5px solid var(--bg4)', color: 'var(--text2)', padding: '12px 8px' }}>← VOLVER</button>
        {!notice && <button onClick={send} disabled={sending} style={{ ...BTN, flex: 2, border: '.5px solid var(--green)', color: 'var(--green)', padding: '12px 8px' }}>{sending ? '···' : 'CONFIRMAR →'}</button>}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Para (email)" style={INPUT} />
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto" style={INPUT} />
      <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="¿Qué quieres decir?" style={{ ...INPUT, resize: 'none', minHeight: 80 }} />
      <button onClick={generate} disabled={loading || !to || !subject || !context} style={{ ...BTN, border: '.5px solid var(--green)', color: 'var(--green)' }}>{loading ? '···' : 'GENERAR BORRADOR →'}</button>
    </div>
  );
}

function WhatsAppSubPanel() {
  const [to, setTo] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<'natural' | 'formal' | 'casual'>('natural');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ body: string; to: string } | null>(null);
  const [notice, setNotice] = useState('');

  const generate = async () => {
    setLoading(true); setNotice('');
    const r = await fetch('/api/agents/executor/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, context, tone }) });
    const d = await r.json();
    if (d.draft) setDraft(d.draft);
    if (d.notice) setNotice(d.notice);
    setLoading(false);
  };

  const openWhatsApp = () => {
    if (!draft) return;
    const num = draft.to.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${num}?text=${encodeURIComponent(draft.body)}`;
    window.open(url, '_blank');
  };

  if (draft) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text4)', marginBottom: 8 }}>PARA: {draft.to}</div>
        <textarea value={draft.body} onChange={e => setDraft(d => d ? { ...d, body: e.target.value } : d)}
          style={{ width: '100%', background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 13, lineHeight: 1.6, resize: 'vertical', minHeight: 100, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = 'var(--green)')} onBlur={e => (e.target.style.borderColor = 'var(--bg4)')} />
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: draft.body.length > 300 ? 'var(--red)' : 'var(--text4)', marginTop: 4, textAlign: 'right' }}>{draft.body.length}/300</div>
      </div>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--amber)' }}>{notice}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setDraft(null); setNotice(''); }} style={{ ...BTN, flex: 1, border: '.5px solid var(--bg4)', color: 'var(--text2)', padding: '12px 8px' }}>← VOLVER</button>
        <button onClick={openWhatsApp} style={{ ...BTN, flex: 2, border: '.5px solid var(--green)', color: 'var(--green)', padding: '12px 8px' }}>ABRIR EN WHATSAPP →</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="+34 XXX XXX XXX" style={INPUT} />
      <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="¿Qué quieres decir?" style={{ ...INPUT, resize: 'none', minHeight: 80 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['natural', 'formal', 'casual'] as const).map(t => (
          <button key={t} onClick={() => setTone(t)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 8,
            border: `.5px solid ${tone === t ? 'var(--green)' : 'var(--bg4)'}`,
            background: tone === t ? 'var(--green)18' : 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em',
            color: tone === t ? 'var(--green)' : 'var(--text3)',
          }}>{t.toUpperCase()}</button>
        ))}
      </div>
      <button onClick={generate} disabled={loading || !to || !context} style={{ ...BTN, border: '.5px solid var(--green)', color: 'var(--green)' }}>{loading ? '···' : 'GENERAR MENSAJE →'}</button>
    </div>
  );
}

/* ── Voice info ── */
function VoiceInfoPanel() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
      <div style={{ marginBottom: 6 }}>Captura voz → Claude clasifica → guarda en <strong>Inbox</strong>.</div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text4)' }}>Activo en todas las pantallas via FAB gold ↘</div>
    </div>
  );
}

/* ── Contacts ── */
function ContactsPanel() {
  const [contacts, setContacts] = useState<{ id: number; name: string; frequencyDays: number | null; lastContactAt: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const router = typeof window !== 'undefined' ? { push: (p: string) => { window.location.href = p; } } : null;

  useEffect(() => {
    fetch('/api/contacts').then(r => r.json()).then(d => { setContacts(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const ping = async (id: number, name: string) => {
    await fetch(`/api/contacts/${id}/ping`, { method: 'POST' });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, lastContactAt: new Date().toISOString() } : c));
    setMsg(`✓ Registrado contacto con ${name}`);
    setTimeout(() => setMsg(''), 3000);
  };

  const now = Date.now();
  const sorted = [...contacts].sort((a, b) => {
    const da = a.lastContactAt ? Math.floor((now - new Date(a.lastContactAt).getTime()) / 86400000) / (a.frequencyDays ?? 30) : 999;
    const db2 = b.lastContactAt ? Math.floor((now - new Date(b.lastContactAt).getTime()) / 86400000) / (b.frequencyDays ?? 30) : 999;
    return db2 - da;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {msg && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--green)', letterSpacing: '.12em' }}>{msg}</div>}
      {loading ? (
        <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
      ) : sorted.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text4)', letterSpacing: '.14em', textAlign: 'center', padding: '12px 0' }}>
          SIN CONTACTOS — <button onClick={() => window.location.href = '/contacts'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', textDecoration: 'underline' }}>AÑADIR →</button>
        </div>
      ) : (
        sorted.slice(0, 5).map(c => {
          const days = c.lastContactAt ? Math.floor((now - new Date(c.lastContactAt).getTime()) / 86400000) : null;
          const freq = c.frequencyDays ?? 30;
          const overdue = days === null || days >= freq;
          const color = overdue ? 'var(--red)' : days >= freq * 0.75 ? 'var(--amber)' : 'var(--green)';
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', borderRadius: 10, padding: '10px 12px', border: `.5px solid ${overdue ? color + '55' : 'var(--bg4)'}` }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: color + '22', border: `.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 13, color, flexShrink: 0 }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color, letterSpacing: '.08em' }}>
                  {days === null ? 'sin registrar' : days === 0 ? 'hoy' : `hace ${days}d`} · c/{freq}d
                </div>
              </div>
              <button onClick={() => ping(c.id, c.name)} style={{ padding: '5px 10px', borderRadius: 7, border: `.5px solid ${color}`, background: 'transparent', color, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', cursor: 'pointer' }}>
                ✓ HOY
              </button>
            </div>
          );
        })
      )}
      <button onClick={() => window.location.href = '/contacts'} style={{ ...BTN, border: '.5px solid var(--purple)', color: 'var(--purple)', marginTop: 4 }}>
        VER TODOS →
      </button>
    </div>
  );
}

/* ── Jarvis info ── */
function JarvisInfoPanel() {
  return (
    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
      <div style={{ marginBottom: 6 }}>Di <strong style={{ color: 'var(--cyan)' }}>"Jarvis, [consulta]"</strong> en la captura de voz para activar el pipeline autónomo.</div>
      <div style={{ marginBottom: 6 }}>Claude Sonnet investiga con autonomía total, crea una tarea y envía push + guarda en Inbox.</div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text4)' }}>Ejemplo: "Jarvis, busca el precio de un compresor de aire para Willy's"</div>
    </div>
  );
}

/* ── IAfont Draft ── */
type PostDraft = { title: string; hook: string; sections: { heading: string; content: string }[]; cta: string; format: string };

function DraftPanel() {
  const [idea, setIdea] = useState('');
  const [format, setFormat] = useState<'substack' | 'linkedin' | 'thread'>('substack');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true); setNotice(''); setDraft(null);
    const r = await fetch('/api/agents/draft-post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea, format }) });
    const d = await r.json();
    if (d.draft) setDraft(d.draft);
    else setNotice(d.notice ?? 'Error generando borrador');
    setLoading(false);
  };

  const fullText = draft ? [
    draft.title,
    '',
    draft.hook,
    '',
    ...draft.sections.flatMap(s => [s.heading ? `## ${s.heading}` : '', s.content, '']),
    draft.cta,
  ].join('\n') : '';

  const copy = () => {
    navigator.clipboard.writeText(fullText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (draft) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--cyan)', textTransform: 'uppercase' }}>{draft.format}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={copy} style={{ ...BTN, padding: '5px 12px', border: `.5px solid ${copied ? 'var(--green)' : 'var(--cyan)'}`, color: copied ? 'var(--green)' : 'var(--cyan)', width: 'auto' }}>
            {copied ? '✓ COPIADO' : 'COPIAR'}
          </button>
          <button onClick={() => setDraft(null)} style={{ ...BTN, padding: '5px 12px', border: '.5px solid var(--bg4)', color: 'var(--text3)', width: 'auto' }}>← NUEVA</button>
        </div>
      </div>
      {/* Título */}
      <div style={{ background: 'var(--bg2)', borderLeft: '3px solid var(--cyan)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{draft.title}</div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>{draft.hook}</div>
      </div>
      {/* Secciones */}
      {draft.sections.map((s, i) => (
        <div key={i} style={{ background: 'var(--bg2)', borderRadius: 10, padding: '12px 14px' }}>
          {s.heading && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '.14em', marginBottom: 6 }}>{s.heading.toUpperCase()}</div>}
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{s.content}</div>
        </div>
      ))}
      {/* CTA */}
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--cyan)44', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--cyan)', lineHeight: 1.5 }}>
        {draft.cta}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
        {(['substack', 'linkedin', 'thread'] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} style={{
            flex: 1, padding: '6px 4px', borderRadius: 8,
            border: `.5px solid ${format === f ? 'var(--cyan)' : 'var(--bg4)'}`,
            background: format === f ? 'rgba(62,207,207,0.12)' : 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em',
            color: format === f ? 'var(--cyan)' : 'var(--text3)',
          }}>{f.toUpperCase()}</button>
        ))}
      </div>
      <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Idea o tema del post..." style={{ ...INPUT, resize: 'none', minHeight: 80 }} />
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--red)' }}>{notice}</div>}
      <button onClick={generate} disabled={loading || !idea.trim()} style={{ ...BTN, border: '.5px solid var(--cyan)', color: 'var(--cyan)' }}>
        {loading ? '···' : 'GENERAR BORRADOR →'}
      </button>
    </div>
  );
}
