'use client';

import { useState } from 'react';

type AgentId = 'voice' | 'prio' | 'alert' | 'search' | 'executor' | 'solution';
type AgentStatus = { status: 'running' | 'active' | 'idle' | 'error'; lastRun?: string; message?: string };

const AGENT_META: Record<AgentId, { name: string; desc: string; runEndpoint?: string }> = {
  voice:    { name: 'VoiceAgent',    desc: 'Captura y clasifica transcripciones de voz' },
  prio:     { name: 'PrioAgent',     desc: 'Recalcula prioridades con staleness y proximidad', runEndpoint: '/api/agents/prio/run' },
  alert:    { name: 'AlertAgent',    desc: 'Genera alertas de tareas stale y viajes próximos' },
  search:   { name: 'SearchAgent',   desc: 'Búsqueda de precios con Brave Search + Claude' },
  executor: { name: 'ExecutorAgent', desc: 'Redacta y envía emails y WhatsApps con confirmación' },
  solution: { name: 'SolutionAgent', desc: 'Propone soluciones DIY / mixta / profesional' },
};

function AgentIcon({ id }: { id: AgentId }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'voice':    return <svg viewBox="0 0 24 24" width={18} height={18} {...s}><rect x="9" y="3" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>;
    case 'prio':     return <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
    case 'alert':    return <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case 'solution': return <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'executor': return <svg viewBox="0 0 24 24" width={18} height={18} {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case 'search':   return <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  }
}

export default function AgentPanel({
  agentId,
  agentStatus,
  onClose,
}: {
  agentId: AgentId;
  agentStatus: AgentStatus;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(agentStatus.status);
  const [running, setRunning] = useState(false);
  const meta = AGENT_META[agentId];

  const statusColor = status === 'running' ? 'var(--gold2)' : status === 'active' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--text4)';
  const statusLabel = status === 'running' ? 'EJECUTANDO' : status === 'active' ? 'ACTIVO' : status === 'error' ? 'ERROR' : 'IDLE';
  const borderColor = status === 'running' ? 'var(--gold2)' : status === 'active' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--bg4)';

  const runNow = async () => {
    if (!meta.runEndpoint || running) return;
    setRunning(true);
    setStatus('running');
    try {
      await fetch(meta.runEndpoint, { method: 'POST' });
      setStatus('active');
    } catch {
      setStatus('error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ width: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column', flexShrink: 0, borderLeft: '.5px solid var(--bg4)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← ORBITAL
          </button>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '3px 9px', borderRadius: 999, border: `.5px solid ${borderColor}`, color: statusColor, animation: status === 'running' ? 'blink 1.5s ease-in-out infinite' : 'none' }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg2)', border: `.5px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: statusColor, animation: status === 'running' ? 'node-pulse 1.5s ease-in-out infinite' : 'none' }}>
            <AgentIcon id={agentId} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)', letterSpacing: '-.01em' }}>{meta.name}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text2)', marginTop: 3 }}>{meta.desc}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {status === 'running' && (
          <div style={{ height: 2, background: 'var(--bg4)', borderRadius: 1, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--gold2),var(--gold))', borderRadius: 1, animation: 'prog 2s ease-in-out infinite' }} />
          </div>
        )}

        {/* Stats 2×2 */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 8 }}>ESTADO</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
          {[
            { v: status === 'running' ? '···' : status === 'active' ? '✓' : '—', k: 'ÚLTIMA EJE', color: status === 'active' ? 'var(--green)' : undefined },
            { v: agentStatus.lastRun ? new Date(agentStatus.lastRun).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—', k: 'HORA', color: undefined },
            { v: 'CRON 6:30', k: 'PRÓXIMA', color: 'var(--text2)' },
            { v: agentId === 'prio' ? 'DIARIO' : '—', k: 'FRECUENCIA', color: undefined },
          ].map(stat => (
            <div key={stat.k} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 9, padding: '9px 10px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 18, color: stat.color ?? 'var(--text)', lineHeight: 1 }}>{stat.v}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.16em', color: 'var(--text4)', marginTop: 3 }}>{stat.k}</div>
            </div>
          ))}
        </div>

        {agentStatus.message && (
          <>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 8 }}>ÚLTIMO RESULTADO</div>
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 9, padding: '9px 10px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: '#c8c6be', lineHeight: 1.5 }}>{agentStatus.message}</div>
            </div>
          </>
        )}

        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 8 }}>DESCRIPCIÓN</div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: '#c8c6be', lineHeight: 1.5 }}>{meta.desc}.</div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <button
          onClick={runNow}
          disabled={!meta.runEndpoint || running || status === 'running'}
          style={{
            width: '100%', padding: 11, borderRadius: 10, background: 'transparent',
            border: `.5px solid ${status === 'error' ? 'var(--red)' : running ? 'var(--bg4)' : 'var(--gold2)'}`,
            color: status === 'error' ? 'var(--red)' : running ? 'var(--text3)' : 'var(--gold)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em',
            cursor: (!meta.runEndpoint || running) ? 'not-allowed' : 'pointer',
            textAlign: 'center',
          }}
        >
          {!meta.runEndpoint ? 'ACTIVACIÓN AUTOMÁTICA' : running ? 'EJECUTANDO…' : status === 'error' ? 'REINTENTAR' : 'EJECUTAR AHORA'}
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes node-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(196,168,106,0)} 50%{box-shadow:0 0 0 6px rgba(196,168,106,.08)} }
        @keyframes prog { 0%{width:0;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0;margin-left:100%} }
      `}</style>
    </div>
  );
}
