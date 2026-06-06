'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EventMeta } from '@/lib/db/schema';

type TripData = {
  id?: number; title: string; type?: string | null;
  startDate?: Date | null; endDate?: Date | null;
  who?: string | null; transport?: string | null;
  accommodation?: string | null; status?: string | null;
  notes?: string | null; approx?: boolean | null;
  meta?: string | null;
};

type Props = {
  onClose: () => void;
  onSaved?: () => void;
  trip?: TripData;
};

const TRANSPORT_OPTIONS = [
  { id: 'avion', icon: '✈',  label: 'Avión' },
  { id: 'tren',  icon: '🚄', label: 'Tren' },
  { id: 'coche', icon: '🚗', label: 'Coche' },
  { id: 'barco', icon: '⛵', label: 'Barco' },
  { id: 'bus',   icon: '🚌', label: 'Bus' },
];

const WHO_OPTIONS = ['Solo', 'Pareja', 'Familia', 'Amigos', 'Trabajo'];

const STATUS_OPTIONS = [
  { id: 'planning', label: 'Planning' },
  { id: 'refining', label: 'Refinando' },
  { id: 'ready',    label: 'Listo' },
  { id: 'active',   label: 'En curso' },
];

const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
  fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none',
  boxSizing: 'border-box',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em',
  color: 'var(--text3)', marginBottom: 6, display: 'block',
};

export default function TripSheet({ onClose, onSaved, trip }: Props) {
  const router = useRouter();
  const isEditing = !!trip?.id;

  const parsedMeta: EventMeta = trip?.meta ? JSON.parse(trip.meta) : {};

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title,     setTitle]     = useState(trip?.title ?? '');
  const [startDate, setStartDate] = useState(
    trip?.startDate ? new Date(trip.startDate).toISOString().slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    trip?.endDate ? new Date(trip.endDate).toISOString().slice(0, 10) : ''
  );
  const [who,    setWho]    = useState(trip?.who ?? '');
  const [approx, setApprox] = useState(trip?.approx ?? false);

  const [transport,     setTransport]     = useState<string[]>(
    trip?.transport ? trip.transport.split(',').filter(Boolean) : []
  );
  const [accommodation, setAccommodation] = useState(trip?.accommodation ?? '');
  const [status,        setStatus]        = useState(trip?.status        ?? 'planning');
  const [budgetTotal,   setBudgetTotal]   = useState(String(parsedMeta.budget?.total ?? ''));
  const [currency,      setCurrency]      = useState(parsedMeta.budget?.currency ?? 'EUR');

  const [documents, setDocuments] = useState<{ name: string; notes: string }[]>(
    parsedMeta.documents?.map(d => ({ name: d.name, notes: d.notes ?? '' })) ?? []
  );
  const [schedule, setSchedule] = useState<{ day: string; description: string }[]>(
    parsedMeta.schedule ?? []
  );
  const [notes, setNotes] = useState(trip?.notes ?? '');

  const canNext0 = title.trim().length > 0 && startDate.length > 0;

  const buildMeta = (): EventMeta => ({
    budget: budgetTotal ? { total: Number(budgetTotal), currency, spent: parsedMeta.budget?.spent ?? 0 } : undefined,
    documents: documents.filter(d => d.name.trim()),
    schedule: schedule.filter(s => s.day && s.description.trim()),
    companions: parsedMeta.companions,
  });

  const save = async () => {
    if (!canNext0 || saving) return;
    setSaving(true);
    try {
      const url    = isEditing ? `/api/events/${trip!.id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         title.trim(),
          type:          'viaje',
          startDate:     startDate || null,
          endDate:       endDate   || null,
          who:           who.trim()           || null,
          transport:     transport.length > 0 ? transport.join(',') : null,
          accommodation: accommodation.trim() || null,
          status,
          notes:         notes.trim()         || null,
          approx,
          meta:          JSON.stringify(buildMeta()),
        }),
      });
      router.refresh();
      onSaved?.();
      onClose();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este viaje?')) return;
    setDeleting(true);
    await fetch(`/api/events/${trip!.id}`, { method: 'DELETE' });
    router.refresh();
    onClose();
  };

  const STEPS = ['BÁSICOS', 'LOGÍSTICA', 'DETALLES'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, backdropFilter: 'blur(2px)' }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)',
        borderRadius: '16px 16px 0 0', padding: '20px 22px 40px',
        zIndex: 201, maxHeight: '94dvh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />

        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', marginBottom: 20 }}>
          {isEditing ? 'Editar ' : 'Nuevo '}
          <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>viaje</em>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => { if (i < step || (i === 1 && canNext0) || i === 0) setStep(i); }}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 6,
                background: step === i ? 'var(--gold-subtle)' : 'transparent',
                border: `.5px solid ${step === i ? 'var(--gold2)' : 'var(--bg4)'}`,
                color: step === i ? 'var(--gold2)' : step > i ? 'var(--text2)' : 'var(--text3)',
                fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', cursor: 'pointer',
              }}
            >{s}</button>
          ))}
        </div>

        {/* ── PASO 0: Básicos ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={LABEL}>DESTINO / TÍTULO</label>
              <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Noruega, Tokyo, Road trip..." style={INPUT} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>FECHA INICIO</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} />
              </div>
              <div>
                <label style={LABEL}>FECHA FIN</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: -8 }}>
              <input type="checkbox" checked={approx} onChange={e => setApprox(e.target.checked)} />
              <span style={{ ...LABEL, marginBottom: 0 }}>FECHAS APROXIMADAS</span>
            </label>
            <div>
              <label style={LABEL}>CON QUIÉN</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {WHO_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setWho(who === opt.toLowerCase() ? '' : opt.toLowerCase())}
                    style={{
                      padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                      background: who === opt.toLowerCase() ? 'var(--gold-subtle)' : 'transparent',
                      border: `.5px solid ${who === opt.toLowerCase() ? 'var(--gold2)' : 'var(--bg4)'}`,
                      color: who === opt.toLowerCase() ? 'var(--gold2)' : 'var(--text3)',
                      fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em',
                    }}>{opt.toUpperCase()}</button>
                ))}
              </div>
              <input value={who} onChange={e => setWho(e.target.value)}
                placeholder="O escribe nombres..." style={INPUT} />
            </div>
            <button onClick={() => setStep(1)} disabled={!canNext0} style={{
              width: '100%', padding: '14px', borderRadius: 10, cursor: canNext0 ? 'pointer' : 'default',
              background: canNext0 ? 'var(--gold2)' : 'var(--bg3)', border: 'none',
              color: canNext0 ? 'var(--bg)' : 'var(--text3)',
              fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em',
            }}>SIGUIENTE →</button>
          </div>
        )}

        {/* ── PASO 1: Logística ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={LABEL}>TRANSPORTE</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TRANSPORT_OPTIONS.map(opt => {
                  const selected = transport.includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => setTransport(prev =>
                      prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                    )} style={{
                      flex: 1, minWidth: 48, padding: '10px 4px', borderRadius: 8, textAlign: 'center',
                      background: selected ? 'var(--gold-subtle)' : 'var(--bg3)',
                      border: `.5px solid ${selected ? 'var(--gold2)' : 'var(--bg4)'}`,
                      fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-dm-mono)',
                    }}>{opt.icon}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={LABEL}>ALOJAMIENTO</label>
              <input value={accommodation} onChange={e => setAccommodation(e.target.value)}
                placeholder="Hotel, Airbnb, casa de..." style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>PRESUPUESTO ESTIMADO</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={budgetTotal} onChange={e => setBudgetTotal(e.target.value)}
                  type="number" placeholder="0" style={{ ...INPUT, flex: 1 }} />
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  style={{ ...INPUT, width: 80, flex: 'none', cursor: 'pointer' }}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="NOK">NOK</option>
                </select>
              </div>
            </div>
            <div>
              <label style={LABEL}>ESTADO</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => setStatus(opt.id)} style={{
                    padding: '9px', borderRadius: 8, cursor: 'pointer',
                    background: status === opt.id ? 'var(--gold-subtle)' : 'var(--bg3)',
                    border: `.5px solid ${status === opt.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                    color: status === opt.id ? 'var(--gold2)' : 'var(--text2)',
                    fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em',
                  }}>{opt.label.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(0)} style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: '.5px solid var(--bg4)',
                color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em',
              }}>← ATRÁS</button>
              <button onClick={() => setStep(2)} style={{
                flex: 2, padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--gold2)', border: 'none',
                color: 'var(--bg)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em',
              }}>SIGUIENTE →</button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Detalles ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...LABEL, marginBottom: 0 }}>DOCUMENTOS</label>
                <button onClick={() => setDocuments(d => [...d, { name: '', notes: '' }])}
                  style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 6, padding: '3px 8px', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: 10 }}>
                  + AÑADIR
                </button>
              </div>
              {documents.length === 0 && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', padding: '8px 0' }}>
                  Vuelo, hotel, seguro, reservas...
                </div>
              )}
              {documents.map((doc, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={doc.name} onChange={e => setDocuments(d => d.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Nombre (ej: Vuelo IB3421)" style={{ ...INPUT, flex: 2 }} />
                  <input value={doc.notes} onChange={e => setDocuments(d => d.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))}
                    placeholder="Nota (sale 7:30)" style={{ ...INPUT, flex: 2 }} />
                  <button onClick={() => setDocuments(d => d.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 6, padding: '0 8px', color: 'var(--red)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...LABEL, marginBottom: 0 }}>ITINERARIO</label>
                <button onClick={() => setSchedule(s => [...s, { day: startDate, description: '' }])}
                  style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 6, padding: '3px 8px', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: 10 }}>
                  + DÍA
                </button>
              </div>
              {schedule.length === 0 && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', padding: '8px 0' }}>
                  Añade los días del viaje...
                </div>
              )}
              {schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'flex-start' }}>
                  <input type="date" value={s.day}
                    onChange={e => setSchedule(sc => sc.map((x, j) => j === i ? { ...x, day: e.target.value } : x))}
                    style={{ ...INPUT, width: 130, flex: 'none', colorScheme: 'dark', fontSize: 12 } as React.CSSProperties} />
                  <input value={s.description}
                    onChange={e => setSchedule(sc => sc.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    placeholder="Qué hay ese día..." style={{ ...INPUT, flex: 1 }} />
                  <button onClick={() => setSchedule(sc => sc.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 6, padding: '0 8px', color: 'var(--red)', cursor: 'pointer', fontSize: 14, flexShrink: 0, alignSelf: 'stretch' }}>×</button>
                </div>
              ))}
            </div>
            <div>
              <label style={LABEL}>NOTAS GENERALES</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Información adicional, recordatorios..." rows={3}
                style={{ ...INPUT, resize: 'none', lineHeight: 1.5 } as React.CSSProperties} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: '.5px solid var(--bg4)',
                color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em',
              }}>← ATRÁS</button>
              <button onClick={save} disabled={saving} style={{
                flex: 2, padding: '12px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--gold2)', border: 'none',
                color: 'var(--bg)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em',
              }}>{saving ? 'GUARDANDO...' : isEditing ? 'GUARDAR CAMBIOS' : 'CREAR VIAJE'}</button>
            </div>
            {isEditing && (
              <button onClick={handleDelete} disabled={deleting} style={{
                width: '100%', padding: '12px', borderRadius: 12, cursor: 'pointer',
                background: 'transparent', border: '.5px solid rgba(224,92,92,0.3)',
                color: 'var(--red)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em',
              }}>{deleting ? 'ELIMINANDO...' : 'ELIMINAR VIAJE'}</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
