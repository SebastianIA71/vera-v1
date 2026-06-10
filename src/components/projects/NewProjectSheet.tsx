'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Project = { id: number; name: string; description: string | null; color: string | null; icon: string | null; status: string | null; dueDate: Date | null };

const PROJECT_COLORS = [
  { value: '#9b7fe8', label: 'Púrpura' },
  { value: '#c4a86a', label: 'Dorado' },
  { value: '#5ba8e8', label: 'Azul' },
  { value: '#4ecb8d', label: 'Verde' },
  { value: '#e8a020', label: 'Ámbar' },
  { value: '#e05c5c', label: 'Rojo' },
];

const PROJECT_ICONS = [
  '🚀','🏗️','💡','📐','🎯','🔧',
  '📦','🌐','💼','🎨','📊','🏠',
  '🌿','🎪','✈️','🎵','📝','🔬',
  '🌟','⚡','🏆','🎭','🧩','🔑',
  '🛠️','📱','🖥️','🌊','🔥','💎',
];

const INPUT: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 15, outline: 'none', boxSizing: 'border-box' };
const LABEL: React.CSSProperties = { fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text3)', marginBottom: 6, display: 'block' };

export default function NewProjectSheet({
  onClose,
  onSaved,
  editProject,
}: {
  onClose: () => void;
  onSaved?: (p: Project) => void;
  editProject?: Project;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:        editProject?.name        ?? '',
    description: editProject?.description ?? '',
    color:       editProject?.color       ?? '#9b7fe8',
    icon:        editProject?.icon        ?? '',
    status:      editProject?.status      ?? 'active',
    dueDate:     editProject?.dueDate
                   ? new Date(editProject.dueDate).toISOString().slice(0, 10)
                   : '',
  });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
  const isEdit = !!editProject;
  const canSave = form.name.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/projects/${editProject!.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const p = await res.json();
        onSaved?.(p);
        router.refresh();
        onClose();
      }
    } finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '.5px solid var(--bg4)', borderRadius: '16px 16px 0 0', padding: '20px 22px 40px', zIndex: 201, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--bg4)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', marginBottom: 24 }}>
          {isEdit ? 'Editar' : 'Nuevo'} <em style={{ fontStyle: 'italic', color: 'var(--purple)' }}>proyecto</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${form.color}22`, border: `.5px solid ${form.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {form.icon || <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 18, color: form.color, opacity: 0.5 }}>◆</span>}
            </div>
            <input autoFocus value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Nombre del proyecto..." style={{ ...INPUT, fontSize: 17, fontFamily: 'var(--font-syne)', fontWeight: 500 }} />
          </div>

          <div><label style={LABEL}>DESCRIPCIÓN (opcional)</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Objetivo, contexto..." rows={2} style={{ ...INPUT, resize: 'none', lineHeight: 1.5 }} /></div>

          <div>
            <label style={LABEL}>ICONO</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginBottom: 8, maxHeight: 76, overflowY: 'auto' }}>
              {PROJECT_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => set('icon', form.icon === ic ? '' : ic)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 6, fontSize: 16, cursor: 'pointer',
                    border: form.icon === ic ? `.5px solid ${form.color}` : '.5px solid transparent',
                    background: form.icon === ic ? `${form.color}20` : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .1s', padding: 0,
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
            <input
              value={form.icon}
              onChange={e => set('icon', e.target.value.slice(0, 5))}
              placeholder="O escribe cualquier emoji..."
              style={{ ...INPUT, fontSize: 13 }}
            />
          </div>

          <div><label style={LABEL}>FECHA LÍMITE (opcional)</label><input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={{ ...INPUT, colorScheme: 'dark' }} /></div>
          {isEdit && (
            <div>
              <label style={LABEL}>ESTADO</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['active','paused','done','archived'] as const).map(s => {
                  const labels: Record<string,string> = { active:'ACTIVO', paused:'PAUSADO', done:'FINALIZADO', archived:'ARCHIVADO' };
                  const colors: Record<string,string> = { active:'var(--green)', paused:'var(--amber)', done:'var(--blue)', archived:'var(--text3)' };
                  const sel = form.status === s;
                  return (
                    <button key={s} onClick={() => set('status', s)} style={{ padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.12em', border: `.5px solid ${sel ? colors[s] : 'var(--bg4)'}`, background: sel ? `${colors[s]}1a` : 'transparent', color: sel ? colors[s] : 'var(--text3)' }}>
                      {labels[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label style={LABEL}>COLOR</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button key={c.value} onClick={() => set('color', c.value)} style={{ width: 28, height: 28, borderRadius: '50%', background: c.value, border: form.color === c.value ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} title={c.label} />
              ))}
            </div>
          </div>
          <button onClick={save} disabled={!canSave || saving} style={{ width: '100%', padding: '14px', borderRadius: 10, background: canSave ? form.color : 'var(--bg3)', border: 'none', color: canSave ? '#fff' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.2em', cursor: canSave ? 'pointer' : 'default', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {form.icon && <span style={{ fontSize: 16 }}>{form.icon}</span>}
            {saving ? 'GUARDANDO...' : isEdit ? 'GUARDAR CAMBIOS' : 'CREAR PROYECTO'}
          </button>
          {isEdit && (
            <button onClick={async () => {
              if (!confirm('¿Archivar este proyecto?')) return;
              await fetch(`/api/projects/${editProject!.id}`, { method: 'DELETE' });
              router.refresh();
              onClose();
            }} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'transparent', border: '.5px solid var(--bg4)', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', cursor: 'pointer' }}>
              ARCHIVAR
            </button>
          )}
        </div>
      </div>
    </>
  );
}
