'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import DesktopShell from '@/components/layout/DesktopShell';
import { useHomeSections, DEFAULT_SECTIONS, SECTION_LABELS, type SectionId } from '@/hooks/useHomeSections';
import { APP_VERSION } from '@/lib/version';
import { Suspense } from 'react';

function BookmarkletSection() {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const bookmarklet = origin
    ? `javascript:(function(){var u=encodeURIComponent(location.href);var t=encodeURIComponent(document.title);location.href='${origin}/share?url='+u+'%26title='+t;})();`
    : '';

  const copy = () => {
    navigator.clipboard.writeText(bookmarklet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const STEP: React.CSSProperties = {
    display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10,
  };
  const NUM: React.CSSProperties = {
    width: 20, height: 20, borderRadius: '50%', background: 'var(--bg4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)',
  };
  const STEP_TEXT: React.CSSProperties = {
    fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5,
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
        CAPTURA IOS · BOOKMARKLET
      </div>
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          Enviar a Vera desde Safari
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 16, lineHeight: 1.5 }}>
          Un marcador que captura la URL y título de cualquier página web al inbox de Vera. Alternativa al Share Sheet en iOS.
        </div>

        {/* Código del bookmarklet */}
        <div style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, wordBreak: 'break-all', fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--gold2)', lineHeight: 1.6 }}>
          {bookmarklet || '···'}
        </div>
        <button onClick={copy} style={{
          width: '100%', padding: '10px', borderRadius: 8,
          background: 'transparent', border: `.5px solid ${copied ? 'var(--green)' : 'var(--gold2)'}`,
          color: copied ? 'var(--green)' : 'var(--gold)',
          fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer', marginBottom: 18,
        }}>
          {copied ? '✓ COPIADO' : 'COPIAR BOOKMARKLET →'}
        </button>

        {/* Instrucciones de instalación */}
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', color: 'var(--text3)', marginBottom: 10 }}>
          CÓMO INSTALARLO EN SAFARI IOS
        </div>
        <div style={STEP}>
          <div style={NUM}>1</div>
          <div style={STEP_TEXT}>En Safari, abre cualquier página web (ej. google.com)</div>
        </div>
        <div style={STEP}>
          <div style={NUM}>2</div>
          <div style={STEP_TEXT}>Pulsa Compartir ↑ → <strong style={{ color: 'var(--text)' }}>Añadir a favoritos</strong> → guarda el marcador</div>
        </div>
        <div style={STEP}>
          <div style={NUM}>3</div>
          <div style={STEP_TEXT}>Pulsa el icono de libro (☰) en Safari → Favoritos → mantén pulsado el marcador recién creado → <strong style={{ color: 'var(--text)' }}>Editar</strong></div>
        </div>
        <div style={STEP}>
          <div style={NUM}>4</div>
          <div style={STEP_TEXT}>Cambia el <strong style={{ color: 'var(--text)' }}>nombre</strong> a <em>"Enviar a Vera"</em> y borra la <strong style={{ color: 'var(--text)' }}>URL</strong> → pega el código copiado → Guardar</div>
        </div>
        <div style={{ ...STEP, marginBottom: 0 }}>
          <div style={NUM}>5</div>
          <div style={STEP_TEXT}>Desde cualquier página web, abre Favoritos → <strong style={{ color: 'var(--gold2)' }}>Enviar a Vera</strong> → capturado ✓</div>
        </div>
      </div>
    </div>
  );
}

type Credential = {
  id: number;
  deviceName: string | null;
  createdAt: Date | null;
  lastUsedAt: Date | null;
};

export default function SettingsPage() {
  const [registering, setRegistering]   = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [status, setStatus]             = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage]           = useState('');
  const [credentials, setCredentials]   = useState<Credential[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(true);

  const loadCredentials = async () => {
    try {
      const res = await fetch('/api/auth/webauthn/credentials');
      if (res.ok) setCredentials(await res.json());
    } catch {
      // silencioso
    } finally {
      setLoadingCreds(false);
    }
  };

  useEffect(() => { loadCredentials(); }, []);

  const registerFaceId = async () => {
    setRegistering(true);
    setStatus('idle');
    setMessage('');
    try {
      const optRes = await fetch('/api/auth/webauthn/register-options');
      if (!optRes.ok) {
        const body = await optRes.json().catch(() => ({}));
        throw new Error(`OPTIONS ${optRes.status}: ${body.error ?? optRes.statusText}`);
      }
      const options = await optRes.json();

      const credential = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credential, deviceName: 'iPhone' }),
      });

      if (verifyRes.ok) {
        setStatus('ok');
        setMessage('Face ID configurado correctamente');
        await loadCredentials();
      } else {
        const body = await verifyRes.json().catch(() => ({}));
        throw new Error(`VERIFY ${verifyRes.status}: ${body.error ?? verifyRes.statusText}`);
      }
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg);
    } finally {
      setRegistering(false);
    }
  };

  const deleteCredentials = async () => {
    if (!confirm('¿Borrar todas las credenciales de Face ID? Tendrás que volver a configurarlo.')) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/webauthn/credentials', { method: 'DELETE' });
      if (res.ok) {
        setCredentials([]);
        setStatus('idle');
        setMessage('Credenciales borradas. Pulsa "Configurar Face ID" para registrar de nuevo.');
      }
    } catch {
      setMessage('Error al borrar credenciales');
    } finally {
      setDeleting(false);
    }
  };

  const hasCredentials = credentials.length > 0;
  const { isVisible, toggle, ready } = useHomeSections();

  return (
    <DesktopShell urgentCount={0} staleCount={0} inboxCount={0}>
      <div style={{ padding: '28px 32px', maxWidth: 520 }}>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>
          Ajustes
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 32 }}>
          VERA · CONFIGURACIÓN
        </div>

        {/* Captura por email */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
            CAPTURA POR EMAIL
          </div>
          <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
              Enviar email → crear tarea
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 16, lineHeight: 1.5 }}>
              Envía un email desde tu cuenta a esta dirección. VERA lo procesa y crea la tarea automáticamente.
            </div>
            {process.env.NEXT_PUBLIC_INBOUND_EMAIL ? (
              <div style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-dm-mono)', fontSize: 12, color: 'var(--gold2)', letterSpacing: '.06em', userSelect: 'all' }}>
                {process.env.NEXT_PUBLIC_INBOUND_EMAIL}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em' }}>
                Configura NEXT_PUBLIC_INBOUND_EMAIL en Vercel.
              </div>
            )}
          </div>
        </div>

        {/* Home — secciones */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
            HOME · SECCIONES VISIBLES
          </div>
          <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, overflow: 'hidden' }}>
            {ready && DEFAULT_SECTIONS.map((id, i) => (
              <div
                key={id}
                onClick={() => toggle(id as SectionId)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 18px', cursor: 'pointer',
                  borderBottom: i < DEFAULT_SECTIONS.length - 1 ? '.5px solid var(--bg4)' : 'none',
                  background: 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: isVisible(id as SectionId) ? 'var(--text)' : 'var(--text3)' }}>
                  {SECTION_LABELS[id as SectionId]}
                </span>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `.5px solid ${isVisible(id as SectionId) ? 'var(--gold2)' : 'var(--bg4)'}`,
                  background: isVisible(id as SectionId) ? 'var(--gold-subtle)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gold2)', fontSize: 13, transition: 'all .15s',
                }}>
                  {isVisible(id as SectionId) ? '✓' : ''}
                </span>
              </div>
            ))}
            {!ready && (
              <div style={{ padding: '16px 18px' }}>
                <div className="skeleton" style={{ height: 11, width: '60%' }} />
              </div>
            )}
          </div>
        </div>

        {/* Captura iOS — Bookmarklet */}
        <BookmarkletSection />

        {/* Seguridad */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
            SEGURIDAD · FACE ID
          </div>

          <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
              Face ID / Touch ID
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 16, lineHeight: 1.5 }}>
              Registra tu dispositivo para entrar sin PIN. Solo funciona en el dispositivo y dominio donde lo configures.
            </div>

            {/* Estado actual */}
            {loadingCreds ? (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', marginBottom: 14, letterSpacing: '.1em' }}>
                ···
              </div>
            ) : hasCredentials ? (
              <div style={{ marginBottom: 14 }}>
                {credentials.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 6, border: '.5px solid var(--green)44' }}>
                    <span style={{ fontSize: 16 }}>📱</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)' }}>{c.deviceName ?? 'Dispositivo'}</div>
                      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.1em', marginTop: 2 }}>
                        {c.lastUsedAt ? `Último uso: ${new Date(c.lastUsedAt).toLocaleDateString('es-ES')}` : `Registrado: ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : '—'}`}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--green)', letterSpacing: '.1em' }}>ACTIVO</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--amber)', letterSpacing: '.1em', marginBottom: 14 }}>
                SIN CREDENCIALES — Pulsa el botón para configurar
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={registerFaceId}
                disabled={registering}
                style={{
                  padding: '10px 18px', borderRadius: 8,
                  background: 'transparent',
                  border: `.5px solid ${status === 'ok' ? 'var(--green)' : 'var(--gold2)'}`,
                  color: status === 'ok' ? 'var(--green)' : 'var(--gold)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em',
                  cursor: registering ? 'default' : 'pointer',
                  opacity: registering ? 0.6 : 1,
                }}
              >
                {registering ? 'ESPERANDO FACE ID...' : hasCredentials ? 'AÑADIR DISPOSITIVO' : 'CONFIGURAR FACE ID'}
              </button>

              {hasCredentials && (
                <button
                  onClick={deleteCredentials}
                  disabled={deleting}
                  style={{
                    padding: '10px 18px', borderRadius: 8,
                    background: 'transparent',
                    border: '.5px solid var(--red)',
                    color: 'var(--red)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em',
                    cursor: deleting ? 'default' : 'pointer',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'BORRANDO...' : 'BORRAR Y RECONFIGURAR'}
                </button>
              )}
            </div>

            {message && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: status === 'ok' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--text2)', marginTop: 12, letterSpacing: '.12em', lineHeight: 1.5 }}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Google Calendar */}
        <Suspense fallback={null}><GoogleCalendarSection /></Suspense>

        {/* Widget iOS */}
        <WidgetSection />

        {/* Versión de la app */}
        <div style={{ paddingTop: 16, borderTop: '.5px solid var(--bg4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 14, color: 'var(--text)', letterSpacing: '.08em' }}>
                VERA <span style={{ color: 'var(--gold2)' }}>{APP_VERSION}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.12em', marginTop: 4 }}>
                Next.js + Turso + Anthropic
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--green)', letterSpacing: '.12em' }}>TURSO</span>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

/* ── Google Calendar ── */
function GoogleCalendarSection() {
  const params = useSearchParams();
  const gcalParam = params.get('gcal');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ pushed?: number; pulled?: number; error?: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const configured = !!(typeof window !== 'undefined'); // siempre true client-side; real check en load

  const load = useCallback(async () => {
    const r = await fetch('/api/calendar/status').then(r => r.json()).catch(() => ({ connected: false }));
    setConnected(r.connected);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true); setSyncResult(null);
    const r = await fetch('/api/calendar/sync', { method: 'POST' }).then(r => r.json()).catch(() => ({ error: 'Error de conexión' }));
    setSyncResult(r.ok ? { pushed: r.pushed, pulled: r.pulled } : { error: r.error });
    setSyncing(false);
  };

  const disconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/calendar/disconnect', { method: 'POST' }).catch(() => {});
    setConnected(false); setDisconnecting(false);
  };

  const BTN: React.CSSProperties = { padding: '10px 18px', borderRadius: 8, background: 'transparent', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
        GOOGLE CALENDAR
      </div>
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          Sincronización bidireccional
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 16, lineHeight: 1.5 }}>
          Sincroniza eventos y viajes de Vera con tu Google Calendar.
        </div>

        {gcalParam === 'ok'    && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--green)', marginBottom: 12, letterSpacing: '.1em' }}>✓ Google Calendar conectado</div>}
        {gcalParam === 'error' && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--red)',   marginBottom: 12, letterSpacing: '.1em' }}>Error al conectar. Reintenta.</div>}

        {connected === null && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 12 }}>···</div>}

        {connected === false && (
          <a href="/api/auth/google" style={{ display: 'inline-block' }}>
            <button style={{ ...BTN, border: '.5px solid var(--blue)', color: 'var(--blue)' }}>CONECTAR CON GOOGLE →</button>
          </a>
        )}

        {connected === true && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--green)', letterSpacing: '.12em' }}>CONECTADO</span>
            </div>
            {syncResult && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: syncResult.error ? 'var(--red)' : 'var(--green)', letterSpacing: '.1em' }}>
                {syncResult.error ? `Error: ${syncResult.error}` : `✓ ${syncResult.pushed} enviados · ${syncResult.pulled} recibidos`}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={sync} disabled={syncing} style={{ ...BTN, border: '.5px solid var(--green)', color: 'var(--green)', flex: 2 }}>
                {syncing ? 'SINCRONIZANDO ···' : 'SINCRONIZAR AHORA'}
              </button>
              <button onClick={disconnect} disabled={disconnecting} style={{ ...BTN, border: '.5px solid var(--red)', color: 'var(--red)', flex: 1 }}>
                {disconnecting ? '···' : 'DESCONECTAR'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Widget iOS ── */
function WidgetSection() {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState<'script' | 'url' | null>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const widgetUrl = origin ? `${origin}/api/widget/summary?token=TU_WIDGET_SECRET` : '';

  const scriptableCode = origin ? `// Vera Widget — pega en Scriptable
const SECRET = "TU_WIDGET_SECRET"; // mismo valor que WIDGET_SECRET en Vercel
const BASE = "${origin}";
const url = \`\${BASE}/api/widget/summary?token=\${SECRET}\`;

let data;
try {
  const req = new Request(url);
  data = await req.loadJSON();
} catch(e) {
  data = { today: "Sin conexión", urgentTasks: [], inboxCount: 0 };
}

const w = new ListWidget();
w.backgroundColor = new Color("#07080a");
w.setPadding(14, 16, 14, 16);

// Header
const hStack = w.addStack();
const title = hStack.addText("✦ VERA");
title.textColor = new Color("#c4a86a");
title.font = Font.boldSystemFont(13);
hStack.addSpacer();
const dateText = hStack.addText(data.today ?? "");
dateText.textColor = new Color("#7d7c87");
dateText.font = Font.systemFont(11);

w.addSpacer(8);

// Tareas urgentes
if (data.urgentTasks?.length > 0) {
  const label = w.addText("URGENTES");
  label.textColor = new Color("#3e3d48");
  label.font = Font.systemFont(9);
  w.addSpacer(4);
  for (const t of data.urgentTasks.slice(0, 3)) {
    const row = w.addStack();
    const dot = row.addText("●");
    dot.textColor = new Color("#e8d5a3");
    dot.font = Font.systemFont(9);
    row.addSpacer(4);
    const task = row.addText(t.title);
    task.textColor = new Color("#eceae2");
    task.font = Font.systemFont(12);
    task.lineLimit = 1;
    w.addSpacer(2);
  }
} else {
  const ok = w.addText("Sin urgentes hoy ✓");
  ok.textColor = new Color("#4ecb8d");
  ok.font = Font.systemFont(12);
}

w.addSpacer(8);

// Footer: viaje + inbox + peso
const footer = w.addStack();
if (data.nextTrip) {
  const trip = footer.addText(\`✈ \${data.nextTrip.days}d\`);
  trip.textColor = new Color("#5ba8e8");
  trip.font = Font.systemFont(11);
  footer.addSpacer(10);
}
if (data.inboxCount > 0) {
  const inbox = footer.addText(\`📥 \${data.inboxCount}\`);
  inbox.textColor = new Color("#e8a020");
  inbox.font = Font.systemFont(11);
  footer.addSpacer(10);
}
if (data.weight) {
  const w2 = footer.addText(\`⚖ \${data.weight.value}kg \${data.weight.trend}\`);
  w2.textColor = new Color("#7d7c87");
  w2.font = Font.systemFont(11);
}

Script.setWidget(w);
Script.complete();` : '';

  const copy = (type: 'script' | 'url', text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(type); setTimeout(() => setCopied(null), 2000); });
  };

  const STEP: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 };
  const NUM: React.CSSProperties = { width: 20, height: 20, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)' };
  const TEXT: React.CSSProperties = { fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
        WIDGET IOS · SCRIPTABLE
      </div>
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
          Widget en pantalla de inicio
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 16, lineHeight: 1.5 }}>
          Muestra tareas urgentes, próximo viaje, peso e inbox sin abrir la app. Requiere Scriptable (gratis en App Store).
        </div>

        <div style={STEP}><div style={NUM}>1</div><div style={TEXT}>Añade <strong style={{ color: 'var(--text)' }}>WIDGET_SECRET</strong> en Vercel → Environment Variables (cualquier texto aleatorio)</div></div>
        <div style={STEP}><div style={NUM}>2</div><div style={TEXT}>Instala <strong style={{ color: 'var(--text)' }}>Scriptable</strong> desde App Store</div></div>
        <div style={STEP}><div style={NUM}>3</div><div style={TEXT}>Copia el script, ábrelo en Scriptable → <em>+</em> → pega y guarda como "Vera"</div></div>
        <div style={STEP}><div style={NUM}>4</div><div style={TEXT}>Añade widget Scriptable en pantalla de inicio → selecciona script "Vera"</div></div>

        <button onClick={() => copy('script', scriptableCode)} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'transparent', border: `.5px solid ${copied === 'script' ? 'var(--green)' : 'var(--gold2)'}`, color: copied === 'script' ? 'var(--green)' : 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer', marginBottom: 8 }}>
          {copied === 'script' ? '✓ SCRIPT COPIADO' : 'COPIAR SCRIPT →'}
        </button>

        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.1em', lineHeight: 1.6 }}>
          Importante: sustituye <strong>TU_WIDGET_SECRET</strong> en el script por el valor que pusiste en Vercel.
        </div>
      </div>
    </div>
  );
}
