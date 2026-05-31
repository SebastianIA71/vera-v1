'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import DesktopShell from '@/components/layout/DesktopShell';

export default function SettingsPage() {
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

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

        {/* Seguridad */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--text3)', marginBottom: 14 }}>
            SEGURIDAD
          </div>

          <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
              Face ID / Touch ID
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em', marginBottom: 16, lineHeight: 1.5 }}>
              Registra tu dispositivo para entrar sin PIN. Solo funciona en el dispositivo donde lo configures.
            </div>

            <button
              onClick={registerFaceId}
              disabled={registering}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'transparent',
                border: `.5px solid ${status === 'ok' ? 'var(--green)' : 'var(--gold2)'}`,
                color: status === 'ok' ? 'var(--green)' : 'var(--gold)',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: 10,
                letterSpacing: '.18em',
                cursor: registering ? 'default' : 'pointer',
                opacity: registering ? 0.6 : 1,
              }}
            >
              {registering ? 'ESPERANDO FACE ID...' : status === 'ok' ? '✓ CONFIGURADO' : 'CONFIGURAR FACE ID'}
            </button>

            {message && (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: status === 'ok' ? 'var(--green)' : 'var(--red)', marginTop: 10, letterSpacing: '.12em' }}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}
