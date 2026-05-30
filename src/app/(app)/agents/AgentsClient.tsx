'use client';

import { useState, useEffect } from 'react';
import DesktopShell from '@/components/layout/DesktopShell';
import MobilePageHeader from '@/components/layout/MobilePageHeader';

type AgentId = 'prio' | 'alert' | 'search' | 'executor' | 'solution';

function urlB64ToUint8Array(b64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

const BTN: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  background: 'transparent', cursor: 'pointer',
  fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.16em',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' as unknown as string,
  textAlign: 'center',
};

const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
  borderRadius: 10, padding: '13px 14px', color: 'var(--text)',
  fontFamily: 'var(--font-dm-sans)', fontSize: 14, outline: 'none',
  marginBottom: 10,
};

export default function AgentsClient({
  urgentCount, staleCount, inboxCount,
}: {
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
}) {
  const [active, setActive] = useState<AgentId | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = (id: AgentId) => setActive(prev => prev === id ? null : id);

  const sections: { id: AgentId; label: string; color: string; desc: string }[] = [
    { id: 'alert',    label: 'Alert',    color: 'var(--red)',    desc: 'Push notifications · tareas stale' },
    { id: 'prio',     label: 'Prio',     color: 'var(--amber)',  desc: 'Recalcular prioridades' },
    { id: 'search',   label: 'Search',   color: 'var(--blue)',   desc: 'Brave Search + Claude' },
    { id: 'solution', label: 'Solution', color: 'var(--purple)', desc: 'DIY · mixta · profesional' },
    { id: 'executor', label: 'Executor', color: 'var(--green)',  desc: 'Borrador de email + envío' },
  ];

  const content = (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0' : '0 24px 80px', maxWidth: isMobile ? undefined : 800 }}>

      {isMobile && <MobilePageHeader title="Agentes" />}

      {/* Header desktop */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '.5px solid var(--bg4)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 26, color: 'var(--text)', lineHeight: 1.1 }}>
            Agentes <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Vera</em>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', color: 'var(--text3)', marginTop: 4 }}>v.35</div>
        </div>
      </div>

      {/* Agent list */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map(sec => (
          <div key={sec.id}>
            {/* Toggle button — grande para tacto fácil */}
            <button
              onClick={() => toggle(sec.id)}
              style={{
                ...BTN,
                border: `.5px solid ${active === sec.id ? sec.color : 'var(--bg4)'}`,
                color: active === sec.id ? sec.color : 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 12,
                background: active === sec.id ? `rgba(0,0,0,.15)` : 'var(--bg2)',
                borderRadius: active === sec.id ? '12px 12px 0 0' : 12,
                padding: '16px 18px',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color, display: 'inline-block', flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18 }}>{sec.label}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.12em', color: 'var(--text3)', marginTop: 3 }}>{sec.desc}</div>
              </div>
              <span style={{ color: 'var(--text3)', fontSize: 16 }}>{active === sec.id ? '▲' : '▼'}</span>
            </button>

            {/* Panel expandible */}
            {active === sec.id && (
              <div style={{ background: 'var(--bg2)', border: `.5px solid ${sec.color}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px' }}>
                {sec.id === 'alert'    && <AlertPanel />}
                {sec.id === 'prio'     && <PrioPanel />}
                {sec.id === 'search'   && <SearchPanel />}
                {sec.id === 'solution' && <SolutionPanel />}
                {sec.id === 'executor' && <ExecutorPanel />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) return content;

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={inboxCount}>
      {content}
    </DesktopShell>
  );
}

/* ── Alert ── */
function AlertPanel() {
  const [perm, setPerm] = useState<string>('cargando…');
  const [requesting, setRequesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('Notification' in window)) {
      setSupported(false);
      setPerm('no soportado');
    } else {
      setPerm(Notification.permission);
    }
  }, []);

  const requestPerm = async () => {
    if (!supported || requesting) return;
    setRequesting(true);
    setPerm('solicitando…');
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== 'granted') { setRequesting(false); return; }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey && 'serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlB64ToUint8Array(vapidKey),
            });
          }
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          });
          setTestMsg('✓ Suscrito a push');
        } catch (e) {
          setTestMsg('Error al suscribir: ' + String(e));
        }
      } else {
        setTestMsg(vapidKey ? 'Service Worker no disponible' : 'NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurada');
      }
    } catch (e) {
      setPerm('error');
      setTestMsg('Error: ' + String(e));
    }
    setRequesting(false);
  };

  const testPush = async () => {
    setTestMsg('Enviando…');
    const res = await fetch('/api/push/test', { method: 'POST' });
    const d = await res.json();
    setTestMsg(d.ok ? '✓ Push enviado — revisa notificaciones' : (d.notice ?? 'Error. ¿Hay suscripciones registradas?'));
  };

  const permColor = perm === 'granted' ? 'var(--green)' : perm === 'denied' ? 'var(--red)' : 'var(--text2)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)', marginBottom: 4 }}>ESTADO</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: permColor }}>{perm}</div>
        {testMsg && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{testMsg}</div>}
      </div>

      {perm !== 'granted' && supported && (
        <button
          onPointerDown={e => { e.preventDefault(); requestPerm(); }}
          disabled={requesting}
          style={{ ...BTN, border: '.5px solid var(--gold2)', color: requesting ? 'var(--text3)' : 'var(--gold)' }}
        >
          {requesting ? 'SOLICITANDO…' : 'ACTIVAR NOTIFICACIONES →'}
        </button>
      )}

      {perm === 'granted' && (
        <button
          onPointerDown={e => { e.preventDefault(); testPush(); }}
          style={{ ...BTN, border: '.5px solid var(--red)', color: 'var(--red)' }}
        >
          ENVIAR TEST PUSH
        </button>
      )}

      {perm === 'denied' && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
          Permiso denegado. Ve a Ajustes del navegador → Notificaciones y actívalo manualmente.
        </div>
      )}
    </div>
  );
}

/* ── Prio ── */
function PrioPanel() {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [n, setN] = useState(0);

  const run = async () => {
    setState('running');
    const res = await fetch('/api/agents/prio/run', { method: 'POST' });
    const d = await res.json();
    setN(d.updated ?? 0); setState('done');
  };

  return (
    <button onClick={() => state === 'idle' && run()} style={{ ...BTN, border: '.5px solid var(--amber)', color: 'var(--amber)' }}>
      {state === 'idle' ? 'RECALCULAR PRIORIDADES →' : state === 'running' ? '···' : `✓ ${n} tareas actualizadas`}
    </button>
  );
}

/* ── Search ── */
function SearchPanel() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ title: string; url: string; summary?: string }[]>([]);
  const [notice, setNotice] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setNotice(''); setResults([]);
    const res = await fetch('/api/agents/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
    const d = await res.json();
    if (d.mode === 'no_search' || d.mode === 'no_ai') setNotice(d.notice ?? 'Sin resultados');
    else setResults(d.results ?? []);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="¿Qué buscamos?" style={INPUT} />
      <button onClick={search} disabled={loading || !q.trim()} style={{ ...BTN, border: '.5px solid var(--blue)', color: 'var(--blue)' }}>
        {loading ? '···' : 'BUSCAR →'}
      </button>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)' }}>{notice}</div>}
      {results.map((r, i) => (
        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 10, padding: '12px 14px', textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
          {r.summary && <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: '#c8c6be', lineHeight: 1.4, marginBottom: 4 }}>{r.summary}</div>}
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
        </a>
      ))}
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
    const res = await fetch('/api/agents/solution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ problem }) });
    const d = await res.json();
    if (d.mode === 'no_ai') setNotice(d.notice);
    else setOptions(d.options ?? []);
    setLoading(false);
  };

  const tc = (t: string) => t === 'diy' ? 'var(--green)' : t === 'mixed' ? 'var(--amber)' : 'var(--purple)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Describe el problema…" style={{ ...INPUT, resize: 'none', minHeight: 80, marginBottom: 0 }} />
      <button onClick={solve} disabled={loading || !problem.trim()} style={{ ...BTN, border: '.5px solid var(--purple)', color: 'var(--purple)' }}>
        {loading ? '···' : 'PROPONER SOLUCIONES →'}
      </button>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)' }}>{notice}</div>}
      {options.map((opt, i) => (
        <div key={i} style={{ background: 'var(--bg3)', borderLeft: `3px solid ${tc(opt.type)}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 14, color: tc(opt.type), marginBottom: 4 }}>{opt.label}</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)', marginBottom: 8 }}>{opt.cost} · {opt.time} · {opt.difficulty}</div>
          {opt.steps.map((s, j) => <div key={j} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: '#c8c6be', lineHeight: 1.5, marginBottom: 3 }}>• {s}</div>)}
          {opt.materials && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text2)', marginTop: 6 }}>{opt.materials}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Executor ── */
function ExecutorPanel() {
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
    const res = await fetch('/api/agents/executor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, context, tone: 'natural' }) });
    const d = await res.json();
    if (d.draft) setDraft(d.draft);
    if (d.notice) setNotice(d.notice);
    setLoading(false);
  };

  const send = async () => {
    if (!draft) return;
    setSending(true);
    const res = await fetch('/api/agents/executor/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const d = await res.json();
    if (d.ok) setSent(true);
    setSending(false);
  };

  if (sent) return <div style={{ textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 14, color: 'var(--green)', padding: 16 }}>✓ EMAIL ENVIADO</div>;

  if (draft) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', marginBottom: 6 }}>PARA: {draft.to}</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text2)', marginBottom: 10 }}>ASUNTO: {draft.subject}</div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: '#c8c6be', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{draft.body}</div>
      </div>
      {notice && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--amber)' }}>{notice}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setDraft(null)} style={{ ...BTN, flex: 1, border: '.5px solid var(--bg4)', color: 'var(--text2)', padding: '12px 8px' }}>EDITAR</button>
        {!notice && <button onClick={send} disabled={sending} style={{ ...BTN, flex: 2, border: '.5px solid var(--green)', color: 'var(--green)', padding: '12px 8px' }}>{sending ? '···' : 'CONFIRMAR →'}</button>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Para (email)" style={INPUT} />
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto" style={INPUT} />
      <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="¿Qué quieres decir?" style={{ ...INPUT, resize: 'none', minHeight: 80 }} />
      <button onClick={generate} disabled={loading || !to || !subject || !context} style={{ ...BTN, border: '.5px solid var(--green)', color: 'var(--green)' }}>
        {loading ? '···' : 'GENERAR BORRADOR →'}
      </button>
    </div>
  );
}


