'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROPERTY_COLORS = [
  { value: '#c4a86a', label: 'Dorado' },
  { value: '#5ba8e8', label: 'Azul' },
  { value: '#4ecb8d', label: 'Verde' },
  { value: '#9b7fe8', label: 'Púrpura' },
  { value: '#e05c5c', label: 'Rojo' },
];

const PROPERTY_ICONS = ['🏠', '🏡', '🏗️', '🏢', '🌿', '🏊', '🔑'];

const INPUT: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none', boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)', marginBottom: 6, display: 'block' };

export default function NewPropertySheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', color: '#4ecb8d', icon: '🏠' });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
  const canSave = form.name.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.refresh();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', marginBottom: 24 }}>
          Nueva <em style={{ fontStyle: 'italic', color: 'var(--green)' }}>propiedad</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div><label style={LABEL}>NOMBRE</label><input autoFocus value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Nombre de la propiedad..." style={INPUT} /></div>
          <div><label style={LABEL}>UBICACIÓN (opcional)</label><input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ciudad, dirección..." style={INPUT} /></div>
          <div>
            <label style={LABEL}>ICONO</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROPERTY_ICONS.map(ic => (
                <button key={ic} onClick={() => set('icon', ic)} style={{ width: 40, height: 40, borderRadius: 8, border: `.5px solid ${form.icon === ic ? 'var(--gold2)' : 'var(--bg4)'}`, background: 'transparent', fontSize: 18, cursor: 'pointer' }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={LABEL}>COLOR</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PROPERTY_COLORS.map(c => (
                <button key={c.value} onClick={() => set('color', c.value)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: form.color === c.value ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} title={c.label} />
              ))}
            </div>
          </div>
          <button onClick={save} disabled={!canSave || saving} style={{ width: '100%', padding: '14px', borderRadius: 10, background: canSave ? 'var(--green)' : 'var(--bg3)', border: 'none', color: canSave ? 'var(--bg)' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em', cursor: canSave ? 'pointer' : 'default', marginTop: 4 }}>
            {saving ? 'GUARDANDO...' : 'CREAR PROPIEDAD'}
          </button>
        </div>
      </div>
    </>
  );
}
