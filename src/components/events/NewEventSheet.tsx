'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EventData = {
  id: number; title: string; type?: string | null;
  startDate?: Date | null; endDate?: Date | null;
  who?: string | null; transport?: string | null;
  accommodation?: string | null; status?: string | null;
  notes?: string | null; approx?: boolean | null;
};

type Props = {
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  type?: string;
  event?: EventData;
};

const EVENT_TYPES = [
  { id: 'social',  label: 'Social',   desc: 'Cena, comida, quedada...' },
  { id: 'cultura', label: 'Cultura',  desc: 'Teatro, museo, concierto...' },
  { id: 'deporte', label: 'Deporte',  desc: 'Partido, carrera...' },
  { id: 'trabajo', label: 'Trabajo',  desc: 'Reunión, evento profesional...' },
  { id: 'viaje',   label: 'Viaje',    desc: 'Trip largo' },
];

const TRANSPORT_OPTIONS = [
  { id: 'avion',  icon: '✈',  label: 'Avión'  },
  { id: 'tren',   icon: '🚄', label: 'Tren'   },
  { id: 'coche',  icon: '🚗', label: 'Coche'  },
  { id: 'barco',  icon: '⛵', label: 'Barco'  },
  { id: 'bus',    icon: '🚌', label: 'Bus'    },
  { id: 'moto',   icon: '🏍', label: 'Moto'   },
];

const STATUS_OPTIONS = [
  { id: 'planning', label: 'Planning'  },
  { id: 'refining', label: 'Refinando' },
  { id: 'ready',    label: 'Listo'     },
  { id: 'active',   label: 'En curso'  },
];

const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text)',
  fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em',
  color: 'var(--text3)', marginBottom: 6, display: 'block',
};

export default function NewEventSheet({ onClose, onCreated, onUpdated, type: defaultType = 'social', event }: Props) {
  const router = useRouter();
  const isEditing = !!event?.id;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title:         event?.title ?? '',
    type:          event?.type ?? defaultType,
    startDate:     event?.startDate ? new Date(event.startDate).toISOString().slice(0, 10) : '',
    endDate:       event?.endDate   ? new Date(event.endDate).toISOString().slice(0, 10)   : '',
    who:           event?.who           ?? '',
    transport:     event?.transport ? event.transport.split(',').filter(Boolean) : [] as string[],
    accommodation: event?.accommodation ?? '',
    status:        event?.status        ?? 'planning',
    notes:         event?.notes         ?? '',
    approx:        event?.approx        ?? false,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const toggleTransport = (id: string) =>
    setForm(prev => ({
      ...prev,
      transport: prev.transport.includes(id)
        ? prev.transport.filter(x => x !== id)
        : [...prev.transport, id],
    }));

  const canSave = form.title.trim().length > 0 && form.startDate.length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const url    = isEditing ? `/api/events/${event!.id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:         form.title.trim(),
          type:          form.type,
          startDate:     form.startDate || null,
          endDate:       form.endDate   || null,
          who:           form.who.trim()           || null,
          transport:     form.transport.join(',')     || null,
          accommodation: form.accommodation.trim() || null,
          status:        form.status,
          notes:         form.notes.trim()         || null,
          approx:        form.approx,
        }),
      });
      router.refresh();
      isEditing ? onUpdated?.() : onCreated?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(2px)' }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)',
        borderRadius: '16px 16px 0 0', padding: '20px 22px 40px',
        zIndex: 201, maxHeight: '92dvh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />

        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 24 }}>
          {isEditing ? 'Editar ' : 'Nuevo '}
          <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>evento</em>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Título */}
          <div>
            <label style={LABEL}>TÍTULO</label>
            <input autoFocus value={form.title} onChange={e => set('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Cena con amigos..." style={INPUT} />
          </div>

          {/* Tipo */}
          <div>
            <label style={LABEL}>TIPO</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EVENT_TYPES.map(t => (
                <button key={t.id} onClick={() => set('type', t.id)} style={{
                  padding: '6px 12px', borderRadius: 20,
                  border: `.5px solid ${form.type === t.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                  background: form.type === t.id ? 'rgba(196,168,106,0.12)' : 'transparent',
                  color: form.type === t.id ? 'var(--gold2)' : 'var(--text3)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', cursor: 'pointer',
                }}>
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>CUÁNDO</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} />
            </div>
            <div>
              <label style={LABEL}>HASTA (opcional)</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties} />
            </div>
          </div>

          {/* Con quién */}
          <div>
            <label style={LABEL}>CON QUIÉN (opcional)</label>
            <input value={form.who} onChange={e => set('who', e.target.value)}
              placeholder="Marta, Jordi..." style={INPUT} />
          </div>

          {/* Transporte — selección múltiple */}
          <div>
            <label style={LABEL}>TRANSPORTE <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(selección múltiple)</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TRANSPORT_OPTIONS.map(opt => {
                const active = form.transport.includes(opt.id);
                return (
                  <button key={opt.id} onClick={() => toggleTransport(opt.id)} style={{
                    padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                    background: active ? 'rgba(196,168,106,.12)' : 'var(--bg3)',
                    border: `.5px solid ${active ? 'var(--gold2)' : 'var(--bg4)'}`,
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 16 }}>{opt.icon}</span>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: active ? 'var(--gold2)' : 'var(--text3)' }}>{opt.label.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alojamiento */}
          <div>
            <label style={LABEL}>ALOJAMIENTO</label>
            <input value={form.accommodation} onChange={e => set('accommodation', e.target.value)}
              placeholder="Hotel, Airbnb, casa..." style={INPUT} />
          </div>

          {/* Estado */}
          <div>
            <label style={LABEL}>ESTADO</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => set('status', opt.id)} style={{
                  padding: '8px', borderRadius: 8,
                  background: form.status === opt.id ? 'rgba(196,168,106,.1)' : 'var(--bg3)',
                  border: `.5px solid ${form.status === opt.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                  color: form.status === opt.id ? 'var(--gold2)' : 'var(--text2)',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', cursor: 'pointer',
                }}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Approx */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.approx}
              onChange={e => setForm(f => ({ ...f, approx: e.target.checked }))} />
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text2)', letterSpacing: '.1em' }}>
              FECHAS APROXIMADAS
            </span>
          </label>

          {/* Notas */}
          <div>
            <label style={LABEL}>NOTAS (opcional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Restaurante, dirección..." rows={3}
              style={{ ...INPUT, resize: 'none', lineHeight: 1.5 } as React.CSSProperties} />
          </div>

          {/* Guardar */}
          <button onClick={save} disabled={!canSave || saving} style={{
            width: '100%', padding: '14px', borderRadius: 10,
            background: canSave ? 'var(--gold2)' : 'var(--bg3)',
            border: 'none', color: canSave ? 'var(--bg)' : 'var(--text3)',
            fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em',
            cursor: canSave ? 'pointer' : 'default', transition: 'all .15s', marginTop: 4,
          }}>
            {saving ? 'GUARDANDO...' : isEditing ? 'GUARDAR CAMBIOS' : 'CREAR EVENTO'}
          </button>

          {/* Eliminar (solo en edición) */}
          {isEditing && (
            <button
              onClick={async () => {
                if (!confirm('¿Eliminar este evento?')) return;
                await fetch(`/api/events/${event!.id}`, { method: 'DELETE' });
                router.refresh();
                onClose();
              }}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: 'transparent', border: '.5px solid rgba(224,92,92,0.3)',
                color: 'var(--red)', fontFamily: 'var(--font-dm-mono)',
                fontSize: 11, letterSpacing: '.14em', cursor: 'pointer',
              }}
            >
              ELIMINAR EVENTO
            </button>
          )}
        </div>
      </div>
    </>
  );
}
