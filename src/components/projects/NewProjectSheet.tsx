'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROJECT_COLORS = [
  { value: '#c4a86a', label: 'Dorado' },
  { value: '#9b7fe8', label: 'Púrpura' },
  { value: '#5ba8e8', label: 'Azul' },
  { value: '#4ecb8d', label: 'Verde' },
  { value: '#e8a020', label: 'Ámbar' },
];

const INPUT: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none', boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)', marginBottom: 6, display: 'block' };

export default function NewProjectSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#9b7fe8', dueDate: '' });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
  const canSave = form.name.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await fetch('/api/projects', {
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', marginBottom: 24 }}>
          Nuevo <em style={{ fontStyle: 'italic', color: 'var(--purple)' }}>proyecto</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div><label style={LABEL}>NOMBRE</label><input autoFocus value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Nombre del proyecto..." style={INPUT} /></div>
          <div><label style={LABEL}>DESCRIPCIÓN (opcional)</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Objetivo, contexto..." rows={2} style={{ ...INPUT, resize: 'none', lineHeight: 1.5 }} /></div>
          <div><label style={LABEL}>FECHA LÍMITE (opcional)</label><input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' }} /></div>
          <div>
            <label style={LABEL}>COLOR</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PROJECT_COLORS.map(c => (
                <button key={c.value} onClick={() => set('color', c.value)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: form.color === c.value ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} title={c.label} />
              ))}
            </div>
          </div>
          <button onClick={save} disabled={!canSave || saving} style={{ width: '100%', padding: '14px', borderRadius: 10, background: canSave ? '#9b7fe8' : 'var(--bg3)', border: 'none', color: canSave ? '#fff' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em', cursor: canSave ? 'pointer' : 'default', marginTop: 4 }}>
            {saving ? 'GUARDANDO...' : 'CREAR PROYECTO'}
          </button>
        </div>
      </div>
    </>
  );
}
