'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTodaySnm, toggleSnm, setSnmActiveForToday } from '@/lib/snm';

type Task = { id: number; title: string; detail?: string | null; propertyId?: string | null; prioFinal?: number | null; tags?: string | null };
type Event = { id: number; title: string; startDate?: Date | null };
type WeightLog = {
  id: number; date: string; value: number;
  snmAgua?: boolean | null; snmCaminar?: boolean | null;
  snmEntreno?: boolean | null; snmEscucha?: boolean | null; snmDisfruta?: boolean | null;
};

const SNM = [
  { key: 'snmAgua',     icon: '💧', label: 'Agua' },
  { key: 'snmCaminar',  icon: '🚶', label: 'Caminar' },
  { key: 'snmEntreno',  icon: '💪', label: 'Entreno' },
  { key: 'snmEscucha',  icon: '🧘', label: 'Escucha' },
  { key: 'snmDisfruta', icon: '🍴', label: 'Disfruta' },
];

const WEIGHT_DELTAS = [-0.5, -0.2, 0, +0.2, +0.5];

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function buildFocusReason(task: Task, all: Task[]): string {
  const prio = task.prioFinal ?? 0;
  const n = all.length;
  if (prio >= 9) return `Prioridad ${prio} — la más alta de ${n} activas. No puede esperar otro día.`;
  if (prio >= 8) return `Prioridad ${prio} entre ${n} urgentes. Es la que más impacto tiene si la mueves hoy.`;
  if (prio >= 7) return `Con ${n} urgentes encima, esta es la que desbloquea más cosas. Empieza aquí.`;
  return `La más relevante ahora mismo. ${n > 1 ? `El resto puede esperar.` : ''}`.trim();
}

function taskColor(prio: number): string {
  return prio >= 8 ? 'var(--red)' : prio >= 6 ? 'var(--amber)' : 'var(--purple)';
}

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

function FocusTaskCard({ task, isFocus }: { task: Task; isFocus: boolean }) {
  const prio = task.prioFinal ?? 0;
  const color = taskColor(prio);
  return (
    <div style={{
      background: isFocus ? 'var(--bg2)' : 'transparent',
      border: `.5px solid ${isFocus ? color : 'var(--bg4)'}`,
      borderLeft: isFocus ? `2px solid ${color}` : '.5px solid var(--bg4)',
      borderRadius: 11, padding: '10px 12px', marginBottom: 6,
      opacity: isFocus ? 1 : 0.45,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 12, color: isFocus ? color : 'var(--text3)', minWidth: 16 }}>
        {task.prioFinal}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isFocus && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.18em', color, marginBottom: 3 }}>FOCO</div>
        )}
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, lineHeight: 1.3, color: 'var(--text)' }}>{task.title}</div>
        {task.propertyId && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', color: 'var(--text2)', marginTop: 3 }}>
            {task.propertyId.toUpperCase()}
          </div>
        )}
      </div>
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

  const today = new Date().toISOString().slice(0, 10);
  const RITUAL_KEY = `vera_ritual_${today}`;

  /* Restaurar paso al abrir */
  useEffect(() => {
    const saved = localStorage.getItem(RITUAL_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (n >= 1 && n <= 5) setStep(n);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Persistir paso cuando cambia */
  useEffect(() => {
    localStorage.setItem(RITUAL_KEY, String(step));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Step 2 — weight
  const [weightVal, setWeightVal] = useState(lastWeightEntry?.value ?? null);
  const [snm, setSnm] = useState<Record<string, boolean>>({ snmAgua: false, snmCaminar: false, snmEntreno: false, snmEscucha: false, snmDisfruta: false });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const localActive = getTodaySnm();
    if (localActive.length > 0) {
      setSnm(prev => {
        const next = { ...prev };
        localActive.forEach(k => { if (k in next) next[k] = true; });
        return next;
      });
    } else if (lastWeightEntry?.date === today) {
      // Otro dispositivo registró SNM hoy — leer de DB y sincronizar localStorage
      const dbSnm = {
        snmAgua:     !!lastWeightEntry.snmAgua,
        snmCaminar:  !!lastWeightEntry.snmCaminar,
        snmEntreno:  !!lastWeightEntry.snmEntreno,
        snmEscucha:  !!lastWeightEntry.snmEscucha,
        snmDisfruta: !!lastWeightEntry.snmDisfruta,
      };
      setSnm(dbSnm);
      const activeKeys = Object.entries(dbSnm).filter(([, v]) => v).map(([k]) => k);
      setSnmActiveForToday(activeKeys);
    }
  }, [lastWeightEntry]);
  const [weightSaved, setWeightSaved] = useState(false);

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
    if (step === 2 && !weightSaved) {
      // Guarda SNM aunque el usuario salte; usa el último peso como fallback
      const saveVal = weightVal ?? lastWeightEntry?.value;
      if (saveVal !== null && saveVal !== undefined) {
        fetch('/api/weight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: saveVal, ...snm }),
        }).then(() => setWeightSaved(true)).catch(() => {});
      }
    }
    if (step === 3) {
      setBriefingLoading(true);
      fetch('/api/briefing/morning')
        .then(r => r.json())
        .then(d => { setBriefing(d.briefing ?? null); setBriefingLoading(false); })
        .catch(() => setBriefingLoading(false));
    }
    if (step === 5) {
      router.replace('/');
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

        {/* ── PASO 1: Saludo + urgentes ── */}
        {step === 1 && (
          <>
            <div style={metaStyle}>
              <span style={stepIdStyle}>RITUAL · 1 DE 5</span>
              <button style={skipStyle} onClick={next}>SALTAR →</button>
            </div>
            <h1 style={h1Style}>{getTimeGreeting()},<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Sebastián.</em></h1>
            <p style={subStyle}>{timeStr} · {urgentTasks.length} URGENTES</p>

            {urgentTasks.map((t, i) => (
              <FocusTaskCard key={t.id} task={t} isFocus={i < 3} />
            ))}

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
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

            {/* Ajuste fino ±0.1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setWeightVal(w => w !== null ? Math.round((w - 0.1) * 10) / 10 : (lastWeightEntry?.value ?? 75) - 0.1)}
                style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg2)', border: '.5px solid var(--bg4)', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 18, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--text3)', minWidth: 60, textAlign: 'center' }}>
                {weightVal !== null ? `${weightVal} KG` : '—'}
              </div>
              <button
                onClick={() => setWeightVal(w => w !== null ? Math.round((w + 0.1) * 10) / 10 : (lastWeightEntry?.value ?? 75) + 0.1)}
                style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg2)', border: '.5px solid var(--bg4)', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 18, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
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
        {step === 3 && (() => {
          const focusTask = urgentTasks[0] ?? null;
          const reason = focusTask ? buildFocusReason(focusTask, urgentTasks) : null;
          return (
            <>
              <div style={metaStyle}>
                <span style={stepIdStyle}>RITUAL · 3 DE 5</span>
                <button style={skipStyle} onClick={next}>SALTAR →</button>
              </div>
              <h1 style={h1Style}>Foco de<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>hoy.</em></h1>
              <p style={subStyle}>
                {focusTask ? `${urgentTasks.length} URGENTES · 1 DECIDIDA` : 'SIN TAREAS URGENTES'}
              </p>

              {focusTask ? (
                <>
                  <FocusTaskCard task={focusTask} isFocus={true} />
                  <div style={{
                    background: 'transparent', border: '.5px solid rgba(196,168,106,.18)',
                    borderLeft: '2px solid var(--gold2)', borderRadius: 9, padding: '10px 13px', marginTop: 8,
                  }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.2em', color: 'var(--gold2)', marginBottom: 5 }}>VERA DICE</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, lineHeight: 1.55, color: '#c8c6be' }}>{reason}</div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10 }}>
                  <div style={{ fontSize: 36, lineHeight: 1 }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 15, color: 'var(--text)', textAlign: 'center', lineHeight: 1.4 }}>
                    Feliz día, Sebastián.
                  </div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', color: 'var(--text3)', textAlign: 'center' }}>
                    NADA URGENTE · PIENSA EN ALGO NUEVO
                  </div>
                </div>
              )}
            </>
          );
        })()}

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
              IR AL HOME →
            </button>
          </>
        )}
      </div>

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
