'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const CaptureSheet = dynamic(() => import('@/components/capture/CaptureSheet'), { ssr: false });

type Task = { id: number; title: string; detail?: string | null; propertyId?: string | null; prioFinal?: number | null; lastActionAt?: Date | null; tags?: string | null };
type WeightLog = { id: number; date: string; value: number; snmAgua?: boolean | null; snmCaminar?: boolean | null; snmEntreno?: boolean | null; snmEscucha?: boolean | null; snmDisfruta?: boolean | null };

const SNM_ICONS = ['💧', '🚶', '💪', '🧘', '🍴'];
const SNM_KEYS = ['snmAgua', 'snmCaminar', 'snmEntreno', 'snmEscucha', 'snmDisfruta'] as const;

function SectionLabel({ label, color, meta, link }: { label: string; color?: string; meta?: string; link?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 13, letterSpacing: '.22em', color: color ?? 'var(--gold2)', textTransform: 'uppercase' }}>{label}</span>
      {meta && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text4)', letterSpacing: '.12em' }}>{meta}</span>}
      {link && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text2)', cursor: 'pointer' }}>{link}</span>}
    </div>
  );
}

function weightTrendPath(logs: WeightLog[]): string {
  if (logs.length < 2) return '';
  const vals = [...logs].reverse().map(l => l.value);
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const w = 331; const h = 56;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  return `M${points.join(' L')}`;
}

export default function MobileHome({
  urgentTasks,
  nextTrip,
  weightLogs,
  inboxCount,
}: {
  urgentTasks: Task[];
  nextTrip: { title: string; daysTo: number; startDate: string } | null;
  weightLogs: WeightLog[];
  inboxCount: number;
}) {
  const router = useRouter();
  const [showCapture, setShowCapture] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [statusLine, setStatusLine] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    const greetings = [
      ['morning', 'good morning'],
      ['afternoon', 'good afternoon'],
      ['evening', 'good evening'],
    ];
    const g = h < 12 ? greetings[0] : h < 19 ? greetings[1] : greetings[2];
    setGreeting(g[1]);

    const parts: string[] = [];
    if (weightLogs[0]) parts.push(`${weightLogs[0].value} KG`);
    if (nextTrip) parts.push(`${nextTrip.title.toUpperCase()} · ${nextTrip.daysTo} D`);
    setStatusLine(parts.join(' · '));
  }, [weightLogs, nextTrip]);

  const latestWeight = weightLogs[0];
  const prevWeight = weightLogs[1];
  const weightTrend = latestWeight && prevWeight
    ? latestWeight.value > prevWeight.value ? 'SUBIENDO' : latestWeight.value < prevWeight.value ? 'BAJANDO' : 'ESTABLE'
    : 'ESTABLE';
  const trendColor = weightTrend === 'SUBIENDO' ? 'var(--amber)' : 'var(--green)';

  const todaySNM = latestWeight
    ? SNM_KEYS.map(k => ({ icon: SNM_ICONS[SNM_KEYS.indexOf(k)], on: !!latestWeight[k] }))
    : SNM_KEYS.map((_, i) => ({ icon: SNM_ICONS[i], on: false }));

  const taskBorderColor = (t: Task) => {
    const p = t.prioFinal ?? 0;
    if (p >= 8) return 'var(--red)';
    if (p >= 7) return 'var(--amber)';
    return 'var(--purple)';
  };

  const wPath = weightTrendPath(weightLogs);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', position: 'relative' }}>

      {/* Scroll content */}
      <div style={{ padding: '16px 22px 100px', overflowY: 'auto' }}>

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: 'var(--gold2)' }}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" /></svg>
            VERA
          </span>
          <button onClick={() => router.push('/dashboard')} style={{ width: 32, height: 32, borderRadius: '50%', border: '.5px solid var(--bg4)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 26, lineHeight: 1.15, color: 'var(--text)', letterSpacing: '-.01em' }}>
            {greeting.split(' ').slice(0, -1).join(' ')}, <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{greeting.split(' ').slice(-1)[0]}</em>.
          </div>
          {statusLine && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 12 }}>
              {statusLine}
            </div>
          )}
        </div>

        {/* Now section */}
        {urgentTasks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Now" meta={`${urgentTasks.length} ACTIVAS`} />
            {urgentTasks.map(t => (
              <div key={t.id} style={{
                background: 'var(--bg2)', border: `.5px solid var(--bg4)`,
                borderLeft: `2px solid ${taskBorderColor(t)}`,
                borderRadius: 14, padding: '13px 13px 13px 14px', marginBottom: 7,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 13, color: 'var(--gold)', minWidth: 20, paddingTop: 1 }}>{t.prioFinal}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, lineHeight: 1.35, color: 'var(--text)' }}>{t.title}</div>
                  {t.propertyId && (
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--gold2)', marginTop: 5 }}>{t.propertyId.toUpperCase()}</div>
                  )}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0, marginTop: 2 }} />
              </div>
            ))}
          </div>
        )}

        {/* Inbox strip */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="Inbox" link="ABRIR →" />
          <div style={{ border: '.5px dashed #2c2c2a', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            onClick={() => router.push('/dashboard')}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 28, color: 'var(--gold)', lineHeight: 1, minWidth: 32 }}>{inboxCount}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)' }}>capturas sin procesar</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 4 }}>INBOX</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 16 }}>→</span>
          </div>
        </div>

        {/* Weight section */}
        {latestWeight && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Peso" meta="14 DÍAS" />
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '16px 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 32, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.02em' }}>{latestWeight.value}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', marginTop: 4, letterSpacing: '.1em' }}>KG · HOY</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', padding: '4px 8px', borderRadius: 999, border: '.5px solid var(--bg4)', color: trendColor }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: trendColor, display: 'inline-block' }} />
                  {weightTrend}
                </div>
              </div>

              {/* Trend chart */}
              {wPath && (
                <svg width="100%" height={56} viewBox="0 0 331 56" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ecb8d" stopOpacity=".18" />
                      <stop offset="100%" stopColor="#4ecb8d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={wPath + ` L331 56 L0 56 Z`} fill="url(#wg)" />
                  <path d={wPath} stroke="var(--green)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                </svg>
              )}

              {/* SNM */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '.5px solid var(--bg4)' }}>
                {todaySNM.map((s, i) => (
                  <div key={i} style={{
                    flex: 1, background: s.on ? 'rgba(78,203,141,.08)' : 'var(--bg3)',
                    border: `.5px solid ${s.on ? 'var(--green)' : 'var(--bg4)'}`,
                    borderRadius: 10, padding: '10px 4px', textAlign: 'center',
                    fontSize: 16, opacity: s.on ? 1 : 0.25,
                  }}>
                    {s.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming trip */}
        {nextTrip && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel label="Upcoming" link="VER TODO →" />
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, color: 'var(--text)', letterSpacing: '-.01em' }}>{nextTrip.title}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text2)', letterSpacing: '.12em', marginTop: 5 }}>
                    {new Date(nextTrip.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 28, color: 'var(--blue)', lineHeight: 1, textAlign: 'right' }}>{nextTrip.daysTo}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color: 'var(--text2)', marginTop: 2, textAlign: 'right' }}>DÍAS</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCapture(true)}
        aria-label="captura rápida"
        style={{
          position: 'fixed', right: 22, bottom: 28, width: 62, height: 62,
          borderRadius: '50%', background: 'var(--bg)', border: '.5px solid var(--gold2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, cursor: 'pointer', color: 'var(--gold)',
          boxShadow: '0 4px 24px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: '.5px solid rgba(196,168,106,.15)' }} />
        <svg viewBox="0 0 24 24" width={23} height={23} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="13" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </button>

      {showCapture && <CaptureSheet onClose={() => setShowCapture(false)} />}
    </div>
  );
}
