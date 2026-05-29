'use client';

import { useState } from 'react';

type AgentId = 'voice' | 'prio' | 'alert' | 'search' | 'executor' | 'solution';
type AgentStatus = { status: 'running' | 'active' | 'idle' | 'error'; lastRun?: string; message?: string };

const AGENT_META: Record<AgentId, { name: string; desc: string; runEndpoint?: string; interactive?: boolean }> = {
  voice:    { name: 'VoiceAgent',    desc: 'Captura y clasifica transcripciones de voz' },
  prio:     { name: 'PrioAgent',     desc: 'Recalcula prioridades con staleness y proximidad', runEndpoint: '/api/agents/prio/run' },
  alert:    { name: 'AlertAgent',    desc: 'Genera alertas de tareas stale y viajes próximos', runEndpoint: '/api/push/test' },
  search:   { name: 'SearchAgent',   desc: 'Búsqueda con Brave Search + resumen Claude', interactive: true },
  executor: { name: 'ExecutorAgent', desc: 'Redacta y envía emails con confirmación', interactive: true },
  solution: { name: 'SolutionAgent', desc: 'Propone soluciones DIY · mixta · profesional', interactive: true },
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

/* ── Search ── */
function SearchForm() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ mode: string; results?: { title: string; url: string; description: string; summary?: string }[]; notice?: string } | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch('/api/agents/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
        placeholder="¿Qué buscamos?" style={{ background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 13, outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = 'var(--gold2)')} onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
      />
      <button onClick={search} disabled={loading} style={{ padding: '9px', borderRadius: 8, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}>
        {loading ? '···' : 'BUSCAR →'}
      </button>

      {result?.mode === 'no_search' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>{result.notice}</div>}

      {result?.results?.map((r, i) => (
        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '10px 12px', textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', marginBottom: 3 }}>{r.title}</div>
          {r.summary && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: '#c8c6be', lineHeight: 1.4, marginBottom: 4 }}>{r.summary}</div>}
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--blue)', letterSpacing: '.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
        </a>
      ))}
    </div>
  );
}

/* ── Executor ── */
function ExecutorForm() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('natural');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ body: string; to: string; subject: string; tone: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const generate = async () => {
    setLoading(true); setNotice('');
    const res = await fetch('/api/agents/executor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, context, tone }) });
    const data = await res.json();
    if (data.draft) setDraft(data.draft);
    if (data.notice) setNotice(data.notice);
    setLoading(false);
  };

  const send = async () => {
    if (!draft) return;
    setSending(true);
    const res = await fetch('/api/agents/executor/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const data = await res.json();
    setSent(data.ok);
    setSending(false);
  };

  const inp = (val: string, set: (v: string) => void, placeholder: string) => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 12, outline: 'none', marginBottom: 8 }}
      onFocus={e => (e.target.style.borderColor = 'var(--gold2)')} onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
    />
  );

  if (sent) return <div style={{ textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 12, color: 'var(--green)', padding: 16 }}>✓ EMAIL ENVIADO</div>;

  if (draft) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--text3)' }}>BORRADOR PARA {draft.to}</div>
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', marginBottom: 6 }}>ASUNTO: {draft.subject}</div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.6, color: '#c8c6be', whiteSpace: 'pre-wrap' }}>{draft.body}</div>
      </div>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--amber)', padding: '6px 0' }}>{notice}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setDraft(null)} style={{ flex: 1, padding: 9, borderRadius: 8, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', cursor: 'pointer' }}>EDITAR</button>
        {!notice && (
          <button onClick={send} disabled={sending} style={{ flex: 2, padding: 9, borderRadius: 8, border: '.5px solid var(--green)', background: 'transparent', color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', cursor: 'pointer' }}>
            {sending ? '···' : 'CONFIRMAR ENVÍO →'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {inp(to, setTo, 'Destinatario (email)')}
      {inp(subject, setSubject, 'Asunto')}
      <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Contexto (qué quieres decir)"
        style={{ width: '100%', background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 12, resize: 'none', minHeight: 60, outline: 'none', marginBottom: 8 }}
        onFocus={e => (e.target.style.borderColor = 'var(--gold2)')} onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
      />
      <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, marginBottom: 10 }}>
        <option value="formal">Formal</option>
        <option value="natural">Natural</option>
        <option value="casual">Casual</option>
      </select>
      <button onClick={generate} disabled={loading || !to || !subject || !context} style={{ width: '100%', padding: 10, borderRadius: 8, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}>
        {loading ? '···' : 'GENERAR BORRADOR →'}
      </button>
    </div>
  );
}

/* ── Solution ── */
function SolutionForm() {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ mode: string; options?: { type: string; label: string; steps: string[]; materials?: string; cost: string; time: string; difficulty: string }[]; notice?: string } | null>(null);

  const solve = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    const res = await fetch('/api/agents/solution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem }) });
    setResult(await res.json());
    setLoading(false);
  };

  const diffColor = (d: string) => d === 'fácil' ? 'var(--green)' : d === 'difícil' ? 'var(--red)' : 'var(--amber)';
  const typeColor = (t: string) => t === 'diy' ? 'var(--green)' : t === 'mixed' ? 'var(--amber)' : 'var(--purple)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Describe el problema…"
        style={{ width: '100%', background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 12, resize: 'none', minHeight: 60, outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = 'var(--gold2)')} onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
      />
      <button onClick={solve} disabled={loading || !problem.trim()} style={{ padding: 9, borderRadius: 8, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}>
        {loading ? '···' : 'PROPONER SOLUCIONES →'}
      </button>

      {result?.mode === 'no_ai' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>{result.notice}</div>}

      {result?.options?.map((opt, i) => (
        <div key={i} style={{ background: 'var(--bg2)', border: `.5px solid ${typeColor(opt.type)}40`, borderLeft: `2px solid ${typeColor(opt.type)}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, color: typeColor(opt.type) }}>{opt.label}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: diffColor(opt.difficulty), letterSpacing: '.1em' }}>{opt.difficulty.toUpperCase()}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.1em', marginBottom: 6 }}>
            {opt.cost} · {opt.time}
          </div>
          <ul style={{ paddingLeft: 14 }}>
            {opt.steps.map((s, j) => (
              <li key={j} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: '#c8c6be', lineHeight: 1.5, marginBottom: 2 }}>{s}</li>
            ))}
          </ul>
          {opt.materials && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text2)', marginTop: 6, letterSpacing: '.08em' }}>{opt.materials}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Main ── */
export default function AgentPanel({ agentId, agentStatus, onClose }: {
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
    <div style={{ width: 320, background: 'var(--bg)', display: 'flex', flexDirection: 'column', flexShrink: 0, borderLeft: '.5px solid var(--bg4)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>← ORBITAL</button>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '3px 9px', borderRadius: 999, border: `.5px solid ${borderColor}`, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg2)', border: `.5px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: statusColor }}>
            <AgentIcon id={agentId} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)' }}>{meta.name}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--text2)', marginTop: 3 }}>{meta.desc}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {status === 'running' && (
          <div style={{ height: 2, background: 'var(--bg4)', borderRadius: 1, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--gold2),var(--gold))', animation: 'prog 2s ease-in-out infinite' }} />
          </div>
        )}

        {/* Interactive forms */}
        {agentId === 'search'   && <SearchForm />}
        {agentId === 'executor' && <ExecutorForm />}
        {agentId === 'solution' && <SolutionForm />}

        {/* Static info for non-interactive agents */}
        {!meta.interactive && (
          <>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text3)', marginBottom: 8 }}>INFO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
              {[
                { v: agentId === 'prio' ? 'CRON 6:30' : 'CRON 7:00', k: 'PROGRAMADO' },
                { v: agentStatus.lastRun ? new Date(agentStatus.lastRun).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—', k: 'ÚLTIMA EJE.' },
              ].map(s => (
                <div key={s.k} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 9, padding: '9px 10px' }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, color: 'var(--text)', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.16em', color: 'var(--text4)', marginTop: 3 }}>{s.k}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer — solo para agentes no interactivos con endpoint */}
      {!meta.interactive && (meta.runEndpoint) && (
        <div style={{ padding: '12px 16px', borderTop: '.5px solid var(--bg4)', flexShrink: 0 }}>
          <button onClick={runNow} disabled={running} style={{
            width: '100%', padding: 11, borderRadius: 10, background: 'transparent',
            border: `.5px solid ${status === 'error' ? 'var(--red)' : 'var(--gold2)'}`,
            color: status === 'error' ? 'var(--red)' : 'var(--gold)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', cursor: 'pointer', textAlign: 'center',
          }}>
            {running ? 'EJECUTANDO…' : agentId === 'alert' ? 'ENVIAR TEST PUSH' : 'EJECUTAR AHORA'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes prog { 0%{width:0;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0;margin-left:100%} }
      `}</style>
    </div>
  );
}
