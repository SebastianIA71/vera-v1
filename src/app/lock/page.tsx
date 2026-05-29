'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDailyQuote, parseQuote } from '@/lib/quotes';

type LockState = 'faceid' | 'pin';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'FACE', '0', 'CLR'] as const;

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(pin + salt);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveAndStoreKey(pin: string): Promise<void> {
  const kdfSalt = process.env.NEXT_PUBLIC_PIN_KDF_SALT ?? '';
  const saltBuf = new TextEncoder().encode(kdfSalt);
  const pinBuf = new TextEncoder().encode(pin);
  const keyMaterial = await crypto.subtle.importKey('raw', pinBuf, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hex = Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  sessionStorage.setItem('vera_aes_key', hex);
}

export default function LockPage() {
  const router = useRouter();
  const [lockState, setLockState] = useState<LockState>('pin');
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(ok => setBiometricAvailable(ok))
        .catch(() => {});
    }
  }, []);
  const [time, setTime] = useState('');
  const [quote, setQuote] = useState<Array<{ text: string; anchor: boolean }>>([]);

  useEffect(() => {
    setQuote(parseQuote(getDailyQuote()));

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);

    // If no PIN configured yet, go to setup
    fetch('/api/auth/salt').then(res => {
      if (res.status === 404) router.replace('/setup');
    }).catch(() => {});

    return () => clearInterval(id);
  }, [router]);

  const submitPin = useCallback(async (fullPin: string) => {
    try {
      // We need the salt stored in DB — fetch it from a lightweight endpoint
      const saltRes = await fetch('/api/auth/salt');
      if (!saltRes.ok) throw new Error('no salt');
      const { pinSalt } = await saltRes.json();

      const pinHash = await hashPin(fullPin, pinSalt);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinHash }),
      });

      if (res.ok) {
        await deriveAndStoreKey(fullPin);
        router.replace('/dashboard');
      } else {
        const data = await res.json();
        setShaking(true);
        setError(data.attemptsLeft === 0 ? 'Bloqueado temporalmente' : 'PIN incorrecto');
        setTimeout(() => {
          setShaking(false);
          setError('');
          setPin('');
        }, 600);
      }
    } catch {
      setShaking(true);
      setTimeout(() => { setShaking(false); setPin(''); }, 600);
    }
  }, [router]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'CLR') { setPin(p => p.slice(0, -1)); return; }
      if (key === 'FACE') { setLockState('faceid'); return; }

      const next = pin + key;
      if (next.length > 6) return;
      setPin(next);

      if (next.length === 6) {
        submitPin(next);
      }
    },
    [pin, submitPin]
  );

  const dots = pin.length;

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '375px',
          minHeight: '700px',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 28px 32px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
          <span
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              color: 'var(--text2)',
              letterSpacing: '.1em',
            }}
          >
            {time}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-syne)',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '.3em',
              color: 'var(--gold2)',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" />
            </svg>
            VERA
          </span>
        </div>

        {/* Ring with sparkle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '52px', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              border: '.5px solid var(--gold2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: '.5px solid rgba(196,168,106,.18)',
              }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#e8d5a3" />
            </svg>
          </div>
        </div>

        {/* Quote */}
        <div style={{ marginBottom: '0' }}>
          <div style={{ width: '22px', height: '1px', background: 'var(--gold2)', margin: '0 auto 14px' }} />
          <p
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 400,
              fontSize: '22px',
              lineHeight: 1.3,
              color: 'var(--text)',
              letterSpacing: '-.005em',
              textAlign: 'center',
            }}
          >
            {quote.map((seg, i) =>
              seg.anchor ? (
                <em key={i} style={{ fontStyle: 'italic', color: 'var(--gold)' }}>
                  {seg.text}
                </em>
              ) : (
                seg.text
              )
            )}
          </p>
        </div>

        {lockState === 'faceid' ? (
          /* Face ID state */
          <>
            <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: '24px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  border: '.5px solid var(--gold2)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  color: 'var(--gold)',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                  <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                  <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                  <path d="M9 10v.5" />
                  <path d="M15 10v.5" />
                  <path d="M12 9v4l-1 1" />
                  <path d="M8.5 15c.5 1 1.8 1.5 3.5 1.5s3-.5 3.5-1.5" />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  letterSpacing: '.22em',
                  color: 'var(--text2)',
                }}
              >
                LOOK TO UNLOCK
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <button
                onClick={() => setLockState('pin')}
                style={{
                  background: 'transparent',
                  border: '.5px solid var(--bg4)',
                  borderRadius: '999px',
                  padding: '10px 24px',
                  color: 'var(--text2)',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  letterSpacing: '.18em',
                  cursor: 'pointer',
                }}
              >
                USE PIN INSTEAD
              </button>
            </div>
          </>
        ) : (
          /* PIN state */
          <>
            {error && (
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '9px',
                  letterSpacing: '.15em',
                  color: 'var(--red)',
                  textAlign: 'center',
                  marginTop: '12px',
                }}
              >
                {error}
              </p>
            )}

            {/* PIN dots */}
            <div
              className={shaking ? 'shake' : ''}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                margin: '16px 0 20px',
              }}
              role="status"
              aria-label={`${dots} de 6 dígitos introducidos`}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: `.5px solid ${i < dots ? 'var(--gold)' : 'var(--text3)'}`,
                    background: i < dots ? 'var(--gold)' : 'transparent',
                    display: 'inline-block',
                    transition: 'background .15s, border-color .15s',
                  }}
                />
              ))}
            </div>

            {/* PIN pad */}
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}
              role="group"
              aria-label="teclado PIN"
            >
              {KEYS.map((key, i) => (
                <button
                  key={i}
                  onPointerDown={(e) => { e.preventDefault(); handleKey(key); }}
                  aria-label={
                    key === 'CLR' ? 'borrar último dígito' : key === 'FACE' ? 'usar Face ID' : key
                  }
                  style={{
                    aspectRatio: '1.6 / 1',
                    borderRadius: '12px',
                    background: key === 'FACE' || key === 'CLR' ? 'transparent' : 'var(--bg2)',
                    border: key === 'FACE' || key === 'CLR' ? 'none' : '.5px solid var(--bg3)',
                    color: key === 'FACE' || key === 'CLR' ? 'var(--text2)' : 'var(--text)',
                    fontFamily: key === 'FACE' || key === 'CLR' ? 'var(--font-dm-mono)' : 'var(--font-syne)',
                    fontWeight: 500,
                    fontSize: key === 'FACE' || key === 'CLR' ? '10px' : '20px',
                    letterSpacing: key === 'FACE' || key === 'CLR' ? '.12em' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background .1s',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Face ID */}
        {biometricAvailable && (
          <button
            onClick={() => alert('Face ID próximamente')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 999, padding: '10px 24px', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '.18em', cursor: 'pointer', marginTop: 12 }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M12 2C9.5 2 7.5 3.5 7.5 5.5C7.5 7.5 9 8.5 9 10M12 2C14.5 2 16.5 3.5 16.5 5.5C16.5 7.5 15 8.5 15 10"/>
              <path d="M9 10C9 12 10 14 12 14C14 14 15 12 15 10"/>
              <path d="M6 8C5 9.5 4.5 11 4.5 12.5"/>
              <path d="M18 8C19 9.5 19.5 11 19.5 12.5"/>
              <path d="M7 16C8.5 18 10 19 12 19C14 19 15.5 18 17 16"/>
            </svg>
            FACE ID
          </button>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '8px',
            letterSpacing: '.3em',
            color: 'var(--text3)',
            marginTop: 'auto',
            paddingTop: '8px',
          }}
        >
          VERA · MEMORY POWERED BY CLAUDE
        </div>
      </div>
    </div>
  );
}
