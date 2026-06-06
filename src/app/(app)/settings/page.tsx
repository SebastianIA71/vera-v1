'use client';

import { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import DesktopShell from '@/components/layout/DesktopShell';
import { useHomeSections, DEFAULT_SECTIONS, SECTION_LABELS, type SectionId } from '@/hooks/useHomeSections';
import { APP_VERSION } from '@/lib/version';

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
