'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoice } from './useVoice';

type CaptureResult = {
  id: number;
  title: string;
  propertyId: string | null;
  prio: number | null;
  type?: string | null;
  chips: string[];
  classified: boolean;
  amivera?: boolean;
};

type Props = { onClose: () => void };

const CHIP_COLORS: Record<string, string> = {
  'WILLY\'S': 'var(--purple)',
  'FLAT': 'var(--purple)',
  'SARAPITA': 'var(--purple)',
  'PRIO': 'var(--amber)',
  'TAREA': 'var(--blue)',
  'NOTA': 'var(--blue)',
  'IDEA': 'var(--blue)',
};

function chipColor(chip: string) {
  const key = Object.keys(CHIP_COLORS).find(k => chip.toUpperCase().startsWith(k));
  return key ? CHIP_COLORS[key] : 'var(--text3)';
}

const MIC_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 52, height: 52 }}>
    <rect x="9" y="3" width="6" height="13" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

export default function CaptureSheet({ onClose }: Props) {
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [taskSaving, setTaskSaving] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);

  const handleTranscript = useCallback(async (text: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, []);

  const handleJarvisDetected = useCallback(() => {
    // Visual/audio feedback se gestiona via jarvisActive en useVoice
  }, []);

  const { state, interim, elapsedStr, start, stop, reset, jarvisActive } = useVoice(handleTranscript, handleJarvisDetected);

  // Pre-calentar speechSynthesis al montar
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
  }, []);

  // Respuesta hablada al recibir resultado
  useEffect(() => {
    if (!result || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const text = result.amivera ? 'Jarvis procesando' : result.title;

    const doSpeak = () => {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-ES'; u.rate = 0.92; u.volume = 0.85;
      const voices = synth.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) u.voice = esVoice;
      synth.speak(u);
    };

    if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', doSpeak, { once: true });
    } else {
      doSpeak();
    }
  }, [result]);

  // Auto-save countdown
  useEffect(() => {
    if (!result) return;
    if (result.amivera) {
      const t = setTimeout(() => { setSaved(true); setTimeout(onClose, 300); }, 2500);
      return () => clearTimeout(t);
    }
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          setSaved(true);
          setTimeout(onClose, 400);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [result, onClose]);

  const saveNow = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSaved(true);
    setTimeout(onClose, 300);
  };

  const createAsTask = async () => {
    if (!result || taskSaving) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setTaskSaving(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title,
          propertyId: result.propertyId ?? null,
          prio: result.prio ?? 5,
          type: result.type ?? 'task',
          tags: result.chips?.join(',') ?? null,
        }),
      });
      await fetch(`/api/inbox/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processed: true }),
      });
      setSaved(true);
      setTimeout(onClose, 300);
    } catch {
      setTaskSaving(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientY - touchStart;
    if (delta > 0) setTranslateY(delta);
  };
  const onTouchEnd = () => {
    if (translateY > 80) { reset(); onClose(); }
    else setTranslateY(0);
    setTouchStart(null);
  };

  const circumference = 2 * Math.PI * 20;
  const progress = result ? (countdown / 3) * circumference : 0;

  // Colores según modo Jarvis
  const accentColor = jarvisActive ? 'var(--gold)' : 'var(--gold2)';
  const micBorderColor = state === 'listening'
    ? (jarvisActive ? 'var(--gold)' : 'var(--red)')
    : accentColor;
  const micIconColor = state === 'listening'
    ? (jarvisActive ? 'var(--gold)' : 'var(--red)')
    : 'var(--gold)';
  const stateColor = state === 'listening'
    ? (jarvisActive ? 'var(--gold)' : 'var(--red)')
    : result ? 'var(--green)' : 'var(--text2)';
  const stateLabel = state === 'listening'
    ? (jarvisActive ? 'JARVIS ✦ ESCUCHANDO' : 'LISTENING')
    : result ? 'CAPTURED'
    : saving ? 'PROCESSING···' : 'CAPTURE';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--overlay)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={e => e.target === e.currentTarget && (reset(), onClose())}
    >
      <div
        style={{
          background: jarvisActive && state === 'listening'
            ? 'linear-gradient(180deg, rgba(196,168,106,.06) 0%, var(--bg) 40%)'
            : 'var(--bg)',
          borderRadius: '24px 24px 0 0',
          border: `.5px solid ${jarvisActive && state === 'listening' ? 'rgba(196,168,106,.3)' : 'var(--bg4)'}`,
          borderBottom: 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          transform: `translateY(${translateY}px)`,
          transition: touchStart ? 'none' : 'transform .3s ease',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: jarvisActive ? 'rgba(196,168,106,.4)' : 'var(--bg4)', borderRadius: 2, margin: '12px auto 0', transition: 'background .3s' }} />

        <div style={{ padding: '16px 22px 24px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginBottom: 0 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', letterSpacing: '.1em' }}>
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: accentColor, transition: 'color .3s' }}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill={accentColor}/></svg>
              {jarvisActive && state === 'listening' ? 'JARVIS' : 'VERA'}
            </span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.2em' }}>SWIPE ↓</span>
          </div>

          {/* State label */}
          <div style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em',
            marginTop: 20, marginBottom: 0, textAlign: 'center',
            color: stateColor,
            transition: 'color .3s',
          }}>
            {stateLabel}
          </div>

          {!result && state !== 'listening' && !saving && (
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, color: 'var(--text4)', textAlign: 'center', marginTop: 5 }}>
              {jarvisActive ? 'Di tu consulta...' : 'Say it. Type it.'}
            </div>
          )}

          {/* ── MIC (estados idle y listening) ── */}
          {!result && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 24, marginBottom: 8 }}>
              <button
                onClick={() => state === 'listening' ? stop() : start()}
                aria-label={state === 'listening' ? 'parar grabación' : 'iniciar grabación'}
                style={{
                  width: 168, height: 168, borderRadius: '50%',
                  background: jarvisActive && state === 'listening'
                    ? 'radial-gradient(circle, rgba(196,168,106,.1) 0%, transparent 70%)'
                    : 'transparent',
                  border: `.5px solid ${micBorderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', cursor: 'pointer',
                  color: micIconColor,
                  transition: 'border-color .3s, background .3s',
                }}
              >
                <div style={{
                  position: 'absolute', inset: -12, borderRadius: '50%',
                  border: `.5px solid ${
                    state === 'listening'
                      ? (jarvisActive ? 'rgba(196,168,106,.35)' : 'rgba(224,92,92,.30)')
                      : 'rgba(196,168,106,.22)'
                  }`,
                  animation: state === 'listening' ? 'pulse-ring 1.4s ease-in-out infinite' : 'none',
                  transition: 'border-color .3s',
                }} />
                <div style={{
                  position: 'absolute', inset: -26, borderRadius: '50%',
                  border: `.5px solid ${
                    state === 'listening'
                      ? (jarvisActive ? 'rgba(196,168,106,.18)' : 'rgba(224,92,92,.15)')
                      : 'rgba(196,168,106,.10)'
                  }`,
                  animation: state === 'listening' ? 'pulse-ring 1.4s ease-in-out infinite .3s' : 'none',
                  transition: 'border-color .3s',
                }} />
                {MIC_SVG}
              </button>

              {state === 'listening' ? (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: jarvisActive ? 'var(--gold)' : 'var(--red)', letterSpacing: '.18em', transition: 'color .3s' }}>
                  {elapsedStr}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.24em', color: 'var(--text2)' }}>
                  TAP TO SPEAK
                </div>
              )}
            </div>
          )}

          {/* Live transcript */}
          {state === 'listening' && interim && (
            <div style={{ borderTop: `.5px solid ${jarvisActive ? 'rgba(196,168,106,.2)' : 'var(--bg4)'}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: jarvisActive ? 'var(--gold2)' : 'var(--text4)', marginBottom: 8 }}>
                {jarvisActive ? 'JARVIS · LIVE' : 'LIVE TRANSCRIPT'}
              </div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, lineHeight: 1.4, color: 'var(--text)' }}>
                {interim}
                <span style={{ display: 'inline-block', width: 8, height: 17, background: jarvisActive ? 'var(--gold)' : 'var(--gold2)', verticalAlign: -3, marginLeft: 2, animation: 'blink 1s steps(2) infinite' }} />
              </div>
            </div>
          )}

          {state === 'listening' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button onClick={stop} style={{ background: 'transparent', border: `.5px solid ${jarvisActive ? 'rgba(196,168,106,.3)' : 'var(--bg4)'}`, borderRadius: 999, padding: '10px 28px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}>
                TAP TO STOP
              </button>
            </div>
          )}

          {/* ── CONFIRMACIÓN ── */}
          {result && (
            result.amivera ? (
              <div style={{ marginTop: 18, textAlign: 'center' }}>
                <div style={{
                  background: 'rgba(196,168,106,0.07)', border: '.5px solid var(--gold2)',
                  borderRadius: 16, padding: '24px 18px',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.26em', color: 'var(--gold2)', marginBottom: 12 }}>
                    JARVIS ✦ PROCESANDO
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
                    Jarvis está investigando.
                    <br />Recibirás una notificación + resultado en Inbox.
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--text3)', marginTop: 14 }}>
                  {saved ? 'LISTO ✓' : 'CERRANDO···'}
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 16, padding: '18px 16px', marginTop: 18 }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text4)', marginBottom: 10 }}>VERA UNDERSTOOD</div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, lineHeight: 1.45, color: 'var(--text)' }}>{result.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '.5px solid var(--bg4)' }}>
                    {result.chips.map((chip, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em',
                        padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)',
                        color: 'var(--gold2)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: chipColor(chip), display: 'inline-block' }} />
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 18 }}>
                  <div style={{ width: 48, height: 48, position: 'relative', margin: '0 auto' }}>
                    <svg width={48} height={48} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={24} cy={24} r={20} fill="none" stroke="var(--bg4)" strokeWidth={1.5} />
                      <circle cx={24} cy={24} r={20} fill="none" stroke="var(--gold2)" strokeWidth={1.5}
                        strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 15, color: 'var(--gold2)' }}>
                      {saved ? '✓' : countdown}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text4)', marginTop: 8 }}>SAVING TO INBOX</div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={saveNow}
                    style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: '.5px solid var(--gold2)', background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer' }}
                  >
                    INBOX →
                  </button>
                  <button
                    onClick={createAsTask}
                    disabled={taskSaving}
                    style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: '.5px solid var(--blue)', background: 'transparent', color: 'var(--blue)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', cursor: 'pointer', opacity: taskSaving ? 0.5 : 1 }}
                  >
                    {taskSaving ? '···' : 'TAREA →'}
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.6} }
        @keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
      `}</style>
    </div>
  );
}
