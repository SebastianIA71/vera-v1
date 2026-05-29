'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  onClose: () => void;
  onCreated?: () => void;
  type?: string;
};

const EVENT_TYPES = [
  { id: 'social',  label: 'Social',   desc: 'Cena, comida, quedada...' },
  { id: 'cultura', label: 'Cultura',  desc: 'Teatro, museo, concierto...' },
  { id: 'deporte', label: 'Deporte',  desc: 'Partido, carrera...' },
  { id: 'trabajo', label: 'Trabajo',  desc: 'Reunión, evento profesional...' },
  { id: 'viaje',   label: 'Viaje',    desc: 'Trip largo' },
];

const INPUT: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg3)',
  border: '.5px solid var(--bg4)',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'var(--text)',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono)',
  fontSize: 10,
  letterSpacing: '.16em',
  color: 'var(--text3)',
  marginBottom: 6,
  display: 'block',
};

export default function NewEventSheet({ onClose, onCreated, type: defaultType = 'social' }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: defaultType,
    startDate: '',
    endDate: '',
    who: '',
    notes: '',
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const canSave = form.title.trim().length > 0 && form.startDate.length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:     form.title.trim(),
          type:      form.type,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
          endDate:   form.endDate   ? new Date(form.endDate).toISOString()   : null,
          who:       form.who.trim() || null,
          notes:     form.notes.trim() || null,
          status:    'planning',
        }),
      });
      if (!res.ok) throw new Error('Error guardando');
      router.refresh();
      onCreated?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--bg2)',
        borderTop: '.5px solid var(--bg4)',
        borderRadius: '16px 16px 0 0',
        padding: '20px 22px 40px',
        zIndex: 201,
        maxHeight: '90dvh',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 3, borderRadius: 2,
          background: 'var(--bg4)', margin: '0 auto 20px',
        }} />

        {/* Título */}
        <div style={{
          fontFamily: 'var(--font-syne)', fontWeight: 500,
          fontSize: 18, color: 'var(--text)',
          letterSpacing: '-.01em', marginBottom: 24,
        }}>
          Nuevo <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>evento</em>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Título del evento */}
          <div>
            <label style={LABEL}>TÍTULO</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Cena con amigos..."
              style={INPUT}
            />
          </div>

          {/* Tipo — chips */}
          <div>
            <label style={LABEL}>TIPO</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EVENT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => set('type', t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: `.5px solid ${form.type === t.id ? 'var(--gold2)' : 'var(--bg4)'}`,
                    background: form.type === t.id ? 'rgba(196,168,106,0.12)' : 'transparent',
                    color: form.type === t.id ? 'var(--gold2)' : 'var(--text3)',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: 10,
                    letterSpacing: '.12em',
                    cursor: 'pointer',
                  }}
                >
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL}>CUÁNDO</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties}
              />
            </div>
            <div>
              <label style={LABEL}>HASTA (opcional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                style={{ ...INPUT, colorScheme: 'dark' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Con quién */}
          <div>
            <label style={LABEL}>CON QUIÉN (opcional)</label>
            <input
              value={form.who}
              onChange={e => set('who', e.target.value)}
              placeholder="Marta, Jordi..."
              style={INPUT}
            />
          </div>

          {/* Notas */}
          <div>
            <label style={LABEL}>NOTAS (opcional)</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Restaurante, dirección..."
              rows={3}
              style={{ ...INPUT, resize: 'none', lineHeight: 1.5 } as React.CSSProperties}
            />
          </div>

          {/* Guardar */}
          <button
            onClick={save}
            disabled={!canSave || saving}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: canSave ? 'var(--gold2)' : 'var(--bg3)',
              border: 'none',
              color: canSave ? 'var(--bg)' : 'var(--text3)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: 12,
              letterSpacing: '.2em',
              cursor: canSave ? 'pointer' : 'default',
              transition: 'all .15s',
              marginTop: 4,
            }}
          >
            {saving ? 'GUARDANDO...' : 'CREAR EVENTO'}
          </button>

        </div>
      </div>
    </>
  );
}
