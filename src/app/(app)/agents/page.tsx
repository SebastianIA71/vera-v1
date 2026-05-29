'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AgentId = 'voice' | 'prio' | 'alert' | 'search' | 'executor' | 'solution';
type AgentStatus = { status: 'running' | 'active' | 'idle' | 'error'; lastRun?: string };

const AGENTS: { id: AgentId; label: string; desc: string; color: string }[] = [
  { id: 'voice',    label: 'Voice',    desc: 'Captura por voz → inbox',           color: 'var(--gold2)' },
  { id: 'prio',     label: 'Prio',     desc: 'Recalcula prioridades',             color: 'var(--amber)' },
  { id: 'alert',    label: 'Alert',    desc: 'Alertas y push notifications',      color: 'var(--red)'   },
  { id: 'search',   label: 'Search',   desc: 'Brave Search + resumen Claude',     color: 'var(--blue)'  },
  { id: 'executor', label: 'Executor', desc: 'Redacta y envía emails',            color: 'var(--green)' },
  { id: 'solution', label: 'Solution', desc: 'DIY · mixta · profesional',         color: 'var(--purple)'},
];

function urlB64ToUint8Array(b64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

/* ── Search form ── */
function SearchForm({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ title: string; url: string; summary?: string }[]>([]);
  const [notice, setNotice] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setNotice('');
    const res = await fetch('/api/agents/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
    const data = await res.json();
    if (data.mode === 'no_search') setNotice(data.notice);
    else setResults(data.results ?? []);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
      <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
        placeholder="¿Qué buscamos?"
        style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 14, outline: 'none' }}
      />
      <button onClick={search} disabled={loading} style={{ padding: 12, borderRadius: 10, border: '.5px solid var(--blue)', background: 'transparent', color: 'var(--blue)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer' }}>
        {loading ? '···' : 'BUSCAR →'}
      </button>
      {notice && <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>{notice}</p>}
      {results.map((r, i) => (
        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '12px 14px', textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
          {r.summary && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: '#c8c6be', lineHeight: 1.4, marginBottom: 4 }}>{r.summary}</div>}
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--blue)', letterSpacing: '.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
        </a>
      ))}
    </div>
  );
}

/* ── Solution form ── */
function SolutionForm() {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{ type: string; label: string; steps: string[]; cost: string; time: string; difficulty: string; materials?: string }[]>([]);
  const [notice, setNotice] = useState('');

  const solve = async () => {
    if (!problem.trim()) return;
    setLoading(true); setNotice('');
    const res = await fetch('/api/agents/solution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem }) });
    const data = await res.json();
    if (data.mode === 'no_ai') setNotice(data.notice);
    else setOptions(data.options ?? []);
    setLoading(false);
  };

  const typeColor = (t: string) => t === 'diy' ? 'var(--green)' : t === 'mixed' ? 'var(--amber)' : 'var(--purple)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
      <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Describe el problema…"
        style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 14, resize: 'none', minHeight: 80, outline: 'none' }}
      />
      <button onClick={solve} disabled={loading || !problem.trim()} style={{ padding: 12, borderRadius: 10, border: '.5px solid var(--purple)', background: 'transparent', color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer' }}>
        {loading ? '···' : 'PROPONER SOLUCIONES →'}
      </button>
      {notice && <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>{notice}</p>}
      {options.map((opt, i) => (
        <div key={i} style={{ background: 'var(--bg2)', border: `.5px solid var(--bg4)`, borderLeft: `2px solid ${typeColor(opt.type)}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, color: typeColor(opt.type), marginBottom: 6 }}>{opt.label}</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)', marginBottom: 8 }}>{opt.cost} · {opt.time} · {opt.difficulty}</div>
          {opt.steps.map((s, j) => <div key={j} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: '#c8c6be', lineHeight: 1.5, paddingLeft: 12, borderLeft: `.5px solid var(--bg4)`, marginBottom: 4 }}>{s}</div>)}
          {opt.materials && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text2)', marginTop: 8 }}>{opt.materials}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Executor form ── */
function ExecutorForm() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ body: string; to: string; subject: string; tone: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const generate = async () => {
    setLoading(true); setNotice('');
    const res = await fetch('/api/agents/executor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, context, tone: 'natural' }) });
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
    if (data.ok) setSent(true);
    setSending(false);
  };

  if (sent) return <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 14, color: 'var(--green)' }}>✓ EMAIL ENVIADO</div>;

  if (draft) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', marginBottom: 8 }}>BORRADOR → {draft.to}</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text2)', marginBottom: 10 }}>ASUNTO: {draft.subject}</div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: '#c8c6be', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{draft.body}</div>
      </div>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--amber)' }}>{notice}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setDraft(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', cursor: 'pointer' }}>EDITAR</button>
        {!notice && <button onClick={send} disabled={sending} style={{ flex: 2, padding: 12, borderRadius: 10, border: '.5px solid var(--green)', background: 'transparent', color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', cursor: 'pointer' }}>{sending ? '···' : 'CONFIRMAR ENVÍO →'}</button>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0' }}>
      {[['Para (email)', to, setTo], ['Asunto', subject, setSubject]].map(([ph, val, set]) => (
        <input key={ph as string} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} placeholder={ph as string}
          style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 14, outline: 'none' }}
        />
      ))}
      <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="¿Qué quieres decir?"
        style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 14, resize: 'none', minHeight: 80, outline: 'none' }}
      />
      <button onClick={generate} disabled={loading || !to || !subject || !context} style={{ padding: 12, borderRadius: 10, border: '.5px solid var(--green)', background: 'transparent', color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer' }}>
        {loading ? '···' : 'GENERAR BORRADOR →'}
      </button>
    </div>
  );
}

/* ── Alert / Push section ── */
function AlertSection() {
  const [permStatus, setPermStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [subStatus, setSubStatus] = useState<'none' | 'subscribed' | 'subscribing'>('none');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) { setPermStatus('unsupported'); return; }
    setPermStatus(Notification.permission);
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => {
        if (sub) setSubStatus('subscribed');
      });
    }
  }, []);

  const requestPermission = async () => {
    const perm = await Notification.requestPermission();
    setPermStatus(perm);
    if (perm !== 'granted') return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { setSubStatus('subscribed'); return; } // sin VAPID, solo guardamos permiso

    setSubStatus('subscribing');
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(vapidKey) });
      }
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
      setSubStatus('subscribed');
    } catch {
      setSubStatus('none');
    }
  };

  const runAlerts = async () => {
    setRunning(true);
    await fetch('/api/agents/prio/run', { method: 'POST' });
    setRunning(false);
  };

  const testPush = async () => {
    setTestStatus('sending');
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    setTestStatus(data.ok ? 'sent' : 'error');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0' }}>
      {/* Permiso */}
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', marginBottom: 8 }}>NOTIFICACIONES PUSH</div>
        {permStatus === 'unsupported' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)' }}>No soportado en este dispositivo</div>}
        {permStatus === 'denied' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--red)' }}>Permiso denegado — actívalo en ajustes del navegador</div>}
        {permStatus === 'granted' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--green)' }}>✓ Permiso concedido{subStatus === 'subscribed' ? ' · suscrito' : ''}</div>}
        {permStatus === 'default' && (
          <button onPointerDown={e => { e.preventDefault(); requestPermission(); }} style={{ width: '100%', padding: '11px', borderRadius: 10, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer', touchAction: 'manipulation' }}>
            ACTIVAR NOTIFICACIONES →
          </button>
        )}
      </div>

      {/* Test push */}
      {permStatus === 'granted' && (
        <button onPointerDown={e => { e.preventDefault(); testPush(); }} disabled={testStatus === 'sending'} style={{ padding: 12, borderRadius: 10, border: `.5px solid ${testStatus === 'sent' ? 'var(--green)' : testStatus === 'error' ? 'var(--red)' : 'var(--red)'}`, background: 'transparent', color: testStatus === 'sent' ? 'var(--green)' : testStatus === 'error' ? 'var(--red)' : 'var(--red)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', cursor: 'pointer', touchAction: 'manipulation' }}>
          {testStatus === 'sending' ? '···' : testStatus === 'sent' ? '✓ ENVIADO' : testStatus === 'error' ? 'SIN SUSCRIPCIÓN (configura VAPID)' : 'ENVIAR TEST PUSH'}
        </button>
      )}

      {/* PrioAgent manual */}
      <button onPointerDown={e => { e.preventDefault(); runAlerts(); }} disabled={running} style={{ padding: 12, borderRadius: 10, border: '.5px solid var(--amber)', background: 'transparent', color: 'var(--amber)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', cursor: 'pointer', touchAction: 'manipulation' }}>
        {running ? '···' : 'RECALCULAR PRIORIDADES'}
      </button>
    </div>
  );
}

/* ── Main page ── */
export default function AgentsPage() {
  const router = useRouter();
  const [open, setOpen] = useState<AgentId | null>(null);
  const [statuses, setStatuses] = useState<Record<AgentId, AgentStatus>>({} as Record<AgentId, AgentStatus>);

  useEffect(() => {
    fetch('/api/agents/status').then(r => r.json()).then(setStatuses).catch(() => {});
  }, []);

  const statusColor = (s?: string) => s === 'running' ? 'var(--gold2)' : s === 'active' ? 'var(--green)' : s === 'error' ? 'var(--red)' : 'var(--text3)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 22px 12px', borderBottom: '.5px solid var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: 'var(--gold2)', marginBottom: 4 }}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" /></svg>
            VERA
          </div>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)' }}>
            Agentes <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>activos</em>
          </div>
        </div>
        <button onPointerDown={e => { e.preventDefault(); router.push('/'); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', touchAction: 'manipulation', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em' }}>
          ← HOME
        </button>
      </div>

      {/* Agent list */}
      <div style={{ padding: '12px 22px' }}>
        {AGENTS.map(agent => {
          const status = statuses[agent.id]?.status ?? 'idle';
          const isOpen = open === agent.id;
          return (
            <div key={agent.id} style={{ marginBottom: 10 }}>
              <button
                onPointerDown={e => { e.preventDefault(); setOpen(isOpen ? null : agent.id); }}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: isOpen ? '12px 12px 0 0' : 12,
                  background: 'var(--bg2)', border: `.5px solid ${isOpen ? agent.color : 'var(--bg4)'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(status), display: 'inline-block', flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, color: isOpen ? agent.color : 'var(--text)' }}>{agent.label}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--text3)', marginTop: 2 }}>{agent.desc}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' }}>{isOpen ? '↑' : '↓'}</span>
              </button>

              {isOpen && (
                <div style={{ background: 'var(--bg2)', border: `.5px solid ${agent.color}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0 16px 16px' }}>
                  {agent.id === 'alert'    && <AlertSection />}
                  {agent.id === 'search'   && <SearchForm onClose={() => setOpen(null)} />}
                  {agent.id === 'solution' && <SolutionForm />}
                  {agent.id === 'executor' && <ExecutorForm />}
                  {agent.id === 'prio'     && (
                    <div style={{ padding: '16px 0' }}>
                      <PrioRunner />
                    </div>
                  )}
                  {agent.id === 'voice'    && (
                    <p style={{ padding: '16px 0', fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                      Activo vía FAB micrófono en todas las pantallas. Transcribe y clasifica capturas de voz al inbox.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrioRunner() {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [updated, setUpdated] = useState<number | null>(null);

  const run = async () => {
    setState('running');
    const res = await fetch('/api/agents/prio/run', { method: 'POST' });
    const data = await res.json();
    setUpdated(data.updated ?? 0);
    setState('done');
  };

  return (
    <button onPointerDown={e => { e.preventDefault(); if (state === 'idle') run(); }} style={{ width: '100%', padding: 12, borderRadius: 10, border: '.5px solid var(--amber)', background: 'transparent', color: 'var(--amber)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', cursor: 'pointer', touchAction: 'manipulation' }}>
      {state === 'idle' ? 'EJECUTAR PRIO AGENT →' : state === 'running' ? '···' : `✓ ${updated} TAREAS ACTUALIZADAS`}
    </button>
  );
}
