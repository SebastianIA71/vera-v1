'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', 'CLR'] as const;

// Derive a SHA-256 hash of the PIN to send to the server (PIN never travels in clear)
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Derive AES key from PIN using PBKDF2 and store in sessionStorage
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

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  useEffect(() => {
    fetch('/api/auth/salt').then(res => {
      if (res.ok) router.replace('/lock'); // PIN already configured
    }).catch(() => {});
  }, [router]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPin = step === 1 ? pin : confirmPin;
  const setCurrentPin = step === 1 ? setPin : setConfirmPin;

  const handleKey = useCallback(
    async (key: string) => {
      if (loading) return;
      if (key === 'CLR') {
        setCurrentPin(p => p.slice(0, -1));
        return;
      }
      if (key === 'empty') return;

      const next = currentPin + key;
      if (next.length > 6) return;
      setCurrentPin(next);

      if (next.length === 6) {
        if (step === 1) {
          setStep(2);
        } else {
          // Confirm step
          if (next !== pin) {
            // Mismatch — shake and reset
            setShaking(true);
            setTimeout(() => {
              setShaking(false);
              setConfirmPin('');
              setPin('');
              setStep(1);
            }, 400);
          } else {
            // Match — create PIN
            setStep(3);
            setLoading(true);
            try {
              const pinSalt = crypto.randomUUID();
              const pinHash = await hashPin(pin + pinSalt);
              await deriveAndStoreKey(pin);

              const res = await fetch('/api/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinHash, pinSalt }),
              });

              if (!res.ok) throw new Error('Setup failed');
            } catch {
              setStep(1);
              setPin('');
              setConfirmPin('');
            } finally {
              setLoading(false);
            }
          }
        }
      }
    },
    [currentPin, step, pin, loading, setCurrentPin]
  );

  const dots = currentPin.length;

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
          maxWidth: '340px',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 26px 28px',
        }}
      >
        {/* Progress segments */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {([1, 2, 3] as Step[]).map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '2px',
                borderRadius: '1px',
                background:
                  step > s
                    ? 'var(--gold2)'
                    : step === s
                    ? 'linear-gradient(90deg, var(--gold2), var(--gold))'
                    : 'var(--bg4)',
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '.3em',
              color: 'var(--gold2)',
            }}
          >
            VERA
          </span>
        </div>

        {step === 3 ? (
          /* Step 3 — Done */
          <>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <div style={{ width: '72px', height: '72px', position: 'relative', marginBottom: '4px' }}>
                <svg
                  style={{ transform: 'rotate(-90deg)' }}
                  width="72"
                  height="72"
                  viewBox="0 0 72 72"
                >
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg4)" strokeWidth="2" />
                  <circle
                    cx="36"
                    cy="36"
                    r="30"
                    fill="none"
                    stroke="var(--green)"
                    strokeWidth="2"
                    strokeDasharray="188.4"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--green)',
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 400,
                  fontSize: '20px',
                  color: 'var(--text)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                Vera está{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>lista.</em>
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '9px',
                  letterSpacing: '.2em',
                  color: 'var(--text2)',
                  textAlign: 'center',
                }}
              >
                PIN GUARDADO · ACCESO ASEGURADO
              </p>
            </div>

            <button
              onClick={() => router.replace('/morning')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: 'transparent',
                border: '.5px solid var(--gold2)',
                color: 'var(--gold)',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '.22em',
                cursor: 'pointer',
              }}
            >
              EMPEZAR →
            </button>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '8px',
                letterSpacing: '.18em',
                color: 'var(--text3)',
                textAlign: 'center',
                marginTop: '12px',
              }}
            >
              REDIRIGE AL RITUAL MATUTINO
            </p>
          </>
        ) : (
          /* Steps 1 & 2 — PIN entry */
          <>
            <h1
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 400,
                fontSize: '22px',
                lineHeight: 1.2,
                color: 'var(--text)',
                marginBottom: '5px',
              }}
            >
              {step === 1 ? (
                <>
                  Elige tu
                  <br />
                  <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>PIN.</em>
                </>
              ) : (
                <>
                  Confírmalo
                  <br />
                  <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>otra vez.</em>
                </>
              )}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '.2em',
                color: 'var(--text2)',
                marginBottom: '20px',
              }}
            >
              {step === 1 ? '6 DÍGITOS · SOLO TÚ LO SABRÁS' : 'REPITE EL MISMO PIN'}
            </p>

            {/* PIN dots */}
            <div
              className={shaking ? 'shake' : ''}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                margin: '16px 0 20px',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: '13px',
                    height: '13px',
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
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginTop: 'auto',
              }}
            >
              {KEYS.map((key, i) => (
                <button
                  key={i}
                  onClick={() => key !== 'empty' && handleKey(key)}
                  disabled={key === 'empty'}
                  style={{
                    aspectRatio: '1.6 / 1',
                    borderRadius: '12px',
                    background: key === 'empty' ? 'transparent' : key === 'CLR' ? 'transparent' : 'var(--bg2)',
                    border:
                      key === 'empty' || key === 'CLR' ? 'none' : '.5px solid var(--bg3)',
                    color: key === 'CLR' ? 'var(--text2)' : 'var(--text)',
                    fontFamily: key === 'CLR' ? 'var(--font-dm-mono)' : 'var(--font-syne)',
                    fontWeight: 500,
                    fontSize: key === 'CLR' ? '10px' : '20px',
                    letterSpacing: key === 'CLR' ? '.1em' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: key === 'empty' ? 'default' : 'pointer',
                    transition: 'background .1s',
                  }}
                >
                  {key === 'empty' ? null : key}
                </button>
              ))}
            </div>

            <p
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '8px',
                letterSpacing: '.18em',
                color: 'var(--text3)',
                textAlign: 'center',
                marginTop: '12px',
              }}
            >
              {step === 1 ? 'NO SE GUARDA EN NINGÚN SERVIDOR' : 'SI NO COINCIDE, VUELVES AL PASO 1'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
