'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTodaySnm, toggleSnm } from '@/lib/snm';

type Task = { id: number; title: string; detail?: string | null; propertyId?: string | null; prioFinal?: number | null; tags?: string | null };
type Event = { id: number; title: string; startDate?: Date | null };
type WeightLog = { id: number; date: string; value: number };

const SNM = [
  { key: 'snmAgua',     icon: '💧', label: 'Agua' },
  { key: 'snmCaminar',  icon: '🚶', label: 'Caminar' },
  { key: 'snmEntreno',  icon: '💪', label: 'Entreno' },
  { key: 'snmEscucha',  icon: '🧘', label: 'Escucha' },
  { key: 'snmDisfruta', icon: '🍴', label: 'Disfruta' },
];

const WEIGHT_DELTAS = [-0.5, -0.2, 0, +0.2, +0.5];

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--bg4)', zIndex: 9 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, height: 2,
        width: `${(step / 5) * 100}%`,
        background: 'linear-gradient(90deg,var(--gold2),var(--gold))',
        transition: 'width .4s ease',
        zIndex: 10,
      }} />
    </div>
  );
}

export default function MorningRitual({
  urgentTasks,
  nextTrip,
  lastWeightEntry,
}: {
  urgentTasks: Task[];
  nextTrip: { title: string; daysTo: number } | null;
  lastWeightEntry: WeightLog | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 2 — weight
  const [weightVal, setWeightVal] = useState(lastWeightEntry?.value ?? null);
  const [snm, setSnm] = useState<Record<string, boolean>>({ snmAgua: false, snmCaminar: false, snmEntreno: false, snmEscucha: false, snmDisfruta: false });

  useEffect(() => {
    const active = getTodaySnm();
    if (active.length > 0) {
      setSnm(prev => {
        const next = { ...prev };
        active.forEach(k => { if (k in next) next[k] = true; });
        return next;
      });
    }
  }, []);
  const [weightSaved, setWeightSaved] = useState(false);

  // Step 3 — focus (tasks already passed as props)

  // Step 4 — briefing
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  // Step 5 — summary
  const [ritualStart] = useState(Date.now());
  const [ritualMins, setRitualMins] = useState(0);

  // Trigger PrioAgent recalculation on mount
  useEffect(() => {
    fetch('/api/agents/prio/run', { method: 'POST' }).catch(() => {});
  }, []);

  const next = useCallback(() => {
    if (step === 2 && weightVal !== null && !weightSaved) {
      fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: weightVal, ...snm }),
      }).then(() => setWeightSaved(true)).catch(() => {});
    }
    if (step === 3) {
      setBriefingLoading(true);
      fetch('/api/briefing/morning')
        .then(r => r.json())
        .then(d => { setBriefing(d.briefing ?? null); setBriefingLoading(false); })
        .catch(() => setBriefingLoading(false));
    }
    if (step === 5) {
      router.replace('/dashboard');
      return;
    }
    setStep(s => Math.min(s + 1, 5));
  }, [step, weightVal, snm, weightSaved, router]);

  useEffect(() => {
    if (step === 5) {
      setRitualMins(Math.max(1, Math.round((Date.now() - ritualStart) / 60000)));
    }
  }, [step, ritualStart]);

  const now = new Date();
  const DAYS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const timeStr = `${DAYS[now.getDay()].toUpperCase()} · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const h1Style: React.CSSProperties = { fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 20, lineHeight: 1.2, letterSpacing: '-.01em', color: 'var(--text)', marginBottom: 4 };
  const subStyle: React.CSSProperties = { fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', color: 'var(--text2)', marginBottom: 16 };
  const metaStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 };
  const stepIdStyle: React.CSSProperties = { fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.26em', color: 'var(--text4)' };
  const skipStyle: React.CSSProperties = { fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--text3)', cursor: 'pointer', background: 'none', border: 'none' };

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 80, background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative', maxWidth: 430, margin: '0 auto' }}>
      <ProgressBar step={step} />

      <div style={{ flex: 1, padding: '42px 18px 24px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* ── PASO 1: Saludo + notificaciones ── */}
        {step === 1 && (
          <>
            <div style={metaStyle}>
              <span style={stepIdStyle}>RITUAL · 1 DE 5</span>
              <button style={skipStyle} onClick={next}>SALTAR →</button>
            </div>
            <h1 style={h1Style}>Good morning,<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Sebastián.</em></h1>
            <p style={subStyle}>{timeStr} · {urgentTasks.length} URGENTES</p>

            {urgentTasks.slice(0, 3).map((t, i) => {
              const prio = t.prioFinal ?? 0;
              const color = prio >= 8 ? 'var(--red)' : prio >= 6 ? 'var(--amber)' : 'var(--purple)';
              return (
                <div key={t.id} style={{ background: 'var(--bg2)', border: `.5px solid var(--bg4)`, borderLeft: `2px solid ${color}`, borderRadius: 11, padding: '10px 12px', marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 3, display: 'inline-block' }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text)', lineHeight: 1.3 }}>{t.title}</div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.12em', color: 'var(--text2)', marginTop: 3 }}>
                      PRIO {t.prioFinal}{t.propertyId ? ` · ${t.propertyId.toUpperCase()}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 'auto', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--text3)', paddingTop: 16 }}>DESLIZA →</div>
          </>
        )}

        {/* ── PASO 2: Peso + SNM ── */}
        {step === 2 && (
          <>
            <div style={metaStyle}>
              <span style={stepIdStyle}>RITUAL · 2 DE 5</span>
              <button style={skipStyle} onClick={next}>SALTAR →</button>
            </div>
            <h1 style={h1Style}>¿Cuánto pesas<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>hoy?</em></h1>
            <p style={subStyle}>ÚLTIMO · {lastWeightEntry ? `${lastWeightEntry.value} KG · ${lastWeightEntry.date}` : 'sin registro'}</p>

            {/* Quick weight buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 12 }}>
              {WEIGHT_DELTAS.map(d => {
                const base = lastWeightEntry?.value ?? 75;
                const val = Math.round((base + d) * 10) / 10;
                const isActive = weightVal === val;
                return (
                  <button key={d} onClick={() => setWeightVal(val)} style={{
                    background: isActive ? 'rgba(196,168,106,.1)' : 'var(--bg2)',
                    border: `.5px solid ${isActive ? 'var(--gold2)' : 'var(--bg4)'}`,
                    borderRadius: 7, padding: '7px 2px', textAlign: 'center',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.04em',
                    color: isActive ? 'var(--gold)' : 'var(--text)', cursor: 'pointer',
                  }}>
                    {d === 0 ? val : (d > 0 ? `+${d}` : d)}
                  </button>
                );
              })}
            </div>

            {weightVal !== null && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 44, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.03em' }}>{weightVal}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text2)', letterSpacing: '.1em', marginLeft: 6 }}>KG</span>
                {lastWeightEntry && (
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: weightVal === lastWeightEntry.value ? 'var(--green)' : weightVal > lastWeightEntry.value ? 'var(--red)' : 'var(--green)', marginLeft: 10 }}>
                    {weightVal === lastWeightEntry.value ? '= AYER' : weightVal > lastWeightEntry.value ? `+${Math.round((weightVal - lastWeightEntry.value)*10)/10}` : `${Math.round((weightVal - lastWeightEntry.value)*10)/10}`}
                  </span>
                )}
              </div>
            )}

            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--text2)', margin: '12px 0 7px' }}>INTENCIONES DE HOY</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {SNM.map(s => (
                <button key={s.key} onClick={() => { toggleSnm(s.key); setSnm(prev => ({ ...prev, [s.key]: !prev[s.key] })); }} title={s.label} style={{
                  flex: 1, background: snm[s.key] ? 'rgba(78,203,141,.08)' : 'var(--bg2)',
                  border: `.5px solid ${snm[s.key] ? 'var(--green)' : 'var(--bg4)'}`,
                  borderRadius: 9, padding: '9px 3px', textAlign: 'center', fontSize: 14, cursor: 'pointer',
                }}>
                  {s.icon}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── PASO 3: Foco ── */}
        {step === 3 && (
          <>
            <div style={metaStyle}>
              <span style={stepIdStyle}>RITUAL · 3 DE 5</span>
              <button style={skipStyle} onClick={next}>SALTAR →</button>
            </div>
            <h1 style={h1Style}>Foco de<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>hoy.</em></h1>
            <p style={subStyle}>{Math.min(urgentTasks.length, 3)} URGENTES</p>

            {urgentTasks.slice(0, 5).map(t => {
              const isVera = (t.prioFinal ?? 0) < 7;
              return (
                <div key={t.id} style={{
                  background: isVera ? 'transparent' : 'var(--bg2)',
                  border: `.5px solid ${isVera ? '#2d2640' : 'var(--bg4)'}`,
                  borderRadius: 11, padding: '11px 12px', marginBottom: 6,
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 12, color: isVera ? 'var(--purple)' : 'var(--gold)', minWidth: 16 }}>
                    {isVera ? '✦' : t.prioFinal}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isVera && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color: 'var(--purple)', marginBottom: 3 }}>VERA SUGIERE</div>}
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, lineHeight: 1.3, color: 'var(--text)' }}>{t.title}</div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', color: 'var(--text2)', marginTop: 3 }}>
                      {t.propertyId?.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', border: '.5px solid var(--text3)', flexShrink: 0, marginTop: 1 }} />
                </div>
              );
            })}
          </>
        )}

        {/* ── PASO 4: Briefing ── */}
        {step === 4 && (
          <>
            <div style={metaStyle}>
              <span style={stepIdStyle}>RITUAL · 4 DE 5</span>
              <button style={skipStyle} onClick={next}>SALTAR →</button>
            </div>
            <h1 style={h1Style}>Vera<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>habla.</em></h1>

            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 11, padding: 13, marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.26em', color: 'var(--text4)', marginBottom: 8 }}>
                BRIEFING · {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
              </div>
              {briefingLoading ? (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--gold2)', letterSpacing: '.1em' }}>···</div>
              ) : briefing ? (
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 12, lineHeight: 1.6, color: '#c8c6be' }}>{briefing}</div>
              ) : (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: '.1em' }}>Briefing no disponible hoy.</div>
              )}
            </div>

            {nextTrip && (
              <div style={{ background: 'transparent', border: '.5px solid #2d2640', borderRadius: 11, padding: '11px 12px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.22em', color: 'var(--purple)', marginBottom: 5 }}>PRÓXIMO VIAJE</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, lineHeight: 1.35, color: 'var(--text)' }}>
                  {nextTrip.title} — <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{nextTrip.daysTo} días</em>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PASO 5: Resumen ── */}
        {step === 5 && (
          <>
            <div style={metaStyle}>
              <span style={stepIdStyle}>RITUAL · COMPLETADO</span>
              <span />
            </div>
            <div style={{ height: 8 }} />

            {/* Gold ring */}
            <div style={{ width: 68, height: 68, margin: '4px auto 14px', position: 'relative' }}>
              <svg width={68} height={68} viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={34} cy={34} r={28} fill="none" stroke="var(--bg4)" strokeWidth={2} />
                <circle cx={34} cy={34} r={28} fill="none" stroke="var(--gold2)" strokeWidth={2}
                  strokeDasharray={175.9} strokeDashoffset={0} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 17, color: 'var(--gold)', lineHeight: 1 }}>{ritualMins}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.18em', color: 'var(--text2)' }}>MIN</div>
              </div>
            </div>

            <h1 style={{ ...h1Style, textAlign: 'center', fontSize: 17, marginBottom: 10 }}>Ritual<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>completado.</em></h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 12 }}>
              {[
                { v: weightVal ? `${weightVal}` : '—', k: 'KG HOY' },
                { v: String(Math.min(urgentTasks.length, 3)), k: 'FOCO DÍA' },
                { v: String(Object.values(snm).filter(Boolean).length) + '/5', k: 'SNM ACTIVO', color: 'var(--green)' },
                { v: nextTrip ? String(nextTrip.daysTo) : '—', k: 'DÍAS PRÓX. VIAJE', color: 'var(--blue)' },
              ].map(stat => (
                <div key={stat.k} style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 9, padding: 9, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 17, color: stat.color ?? 'var(--text)', lineHeight: 1 }}>{stat.v}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 3 }}>{stat.k}</div>
                </div>
              ))}
            </div>

            {nextTrip && (
              <div style={{ background: 'transparent', border: '.5px solid #2d2640', borderRadius: 9, padding: 11, textAlign: 'center', marginBottom: 11 }}>
                <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 12, color: '#c8c6be', lineHeight: 1.45 }}>
                  {nextTrip.title} en <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{nextTrip.daysTo} días</em>.
                </p>
              </div>
            )}

            <button onClick={next} style={{ width: '100%', padding: 11, borderRadius: 11, background: 'transparent', border: '.5px solid var(--gold2)', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', cursor: 'pointer' }}>
              IR AL DASHBOARD →
            </button>
          </>
        )}
      </div>

      {/* Next button (pasos 1-4) */}
      {step < 5 && (
        <div style={{ padding: '0 18px 24px', flexShrink: 0 }}>
          <button onClick={next} style={{ width: '100%', padding: 12, borderRadius: 11, background: 'transparent', border: '.5px solid var(--gold2)', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', cursor: 'pointer' }}>
            SIGUIENTE →
          </button>
        </div>
      )}
    </div>
  );
}
