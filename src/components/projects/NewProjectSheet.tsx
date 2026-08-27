'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OBJECTIVE_TIERS, TIER_LABEL, type ObjectiveTier } from '@/lib/objectiveTiers';

type Project = {
  id: number; name: string; description: string | null; color: string | null; icon: string | null; status: string | null;
  dueDate: Date | string | null;
  iconUrl?: string | null;
  notionUrl?: string | null;
  isObjective?: boolean | null;
  objectiveTier?: string | null;
  objectiveStartedAt?: Date | string | null;
  objectiveOriginalStartAt?: Date | string | null;
  objectiveRenewals?: number | null;
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

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
    name:          editProject?.name          ?? '',
    description:   editProject?.description   ?? '',
    color:         editProject?.color         ?? '#9b7fe8',
    icon:          editProject?.icon          ?? '',
    status:        editProject?.status        ?? 'active',
    isObjective:   editProject?.isObjective   ?? false,
    objectiveTier: (editProject?.objectiveTier as ObjectiveTier | null) ?? 'semanal',
    notionUrl:     editProject?.notionUrl     ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
  const isEdit = !!editProject;
  const canSave = form.name.trim().length > 0;

  const [iconUrl, setIconUrl] = useState<string | null>(editProject?.iconUrl ?? null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconError, setIconError] = useState<string | null>(null);

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

  const uploadIcon = async (file: File) => {
    if (!editProject) return;
    setIconError(null);
    setUploadingIcon(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/projects/${editProject.id}/icon`, { method: 'POST', body: fd });
      const row = await res.json();
      if (res.ok) {
        setIconUrl(row.iconUrl);
        onSaved?.({ ...editProject, iconUrl: row.iconUrl });
        router.refresh();
      } else {
        setIconError(row.error ?? 'No se pudo subir la imagen');
      }
    } catch {
      setIconError('No se pudo subir la imagen');
    } finally {
      setUploadingIcon(false);
    }
  };

  const removeIcon = async () => {
    if (!editProject) return;
    setUploadingIcon(true);
    try {
      await fetch(`/api/projects/${editProject.id}/icon`, { method: 'DELETE' });
      setIconUrl(null);
      onSaved?.({ ...editProject, iconUrl: null });
      router.refresh();
    } finally {
      setUploadingIcon(false);
    }
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
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${form.color}22`, border: `.5px solid ${form.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
              {iconUrl
                ? <img src={iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (form.icon || <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 18, color: form.color, opacity: 0.5 }}>◆</span>)}
            </div>
            <input autoFocus value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Nombre del proyecto..." style={{ ...INPUT, fontSize: 17, fontFamily: 'var(--font-syne)', fontWeight: 500 }} />
          </div>

          <div><label style={LABEL}>DESCRIPCIÓN (opcional)</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Objetivo, contexto..." rows={2} style={{ ...INPUT, resize: 'none', lineHeight: 1.5 }} /></div>

          <div>
            <label style={LABEL}>ENLACE A NOTION (opcional)</label>
            <input
              type="url"
              value={form.notionUrl}
              onChange={e => set('notionUrl', e.target.value)}
              placeholder="https://notion.so/..."
              style={{ ...INPUT, fontSize: 13 }}
            />
            <div style={{ marginTop: 6, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.06em', color: 'var(--text3)' }}>
              CONTEXTO DEL PROYECTO PARA CLAUDE CODE, CHATGPT, ETC.
            </div>
          </div>

          <div>
            <label style={LABEL}>ICONO</label>

            {iconUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={iconUrl} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '.5px solid var(--bg4)', flexShrink: 0 }} />
                <button
                  type="button"
                  onClick={removeIcon}
                  disabled={uploadingIcon}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', padding: '7px 12px', borderRadius: 8, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text3)', cursor: uploadingIcon ? 'default' : 'pointer', opacity: uploadingIcon ? 0.5 : 1 }}
                >
                  {uploadingIcon ? '...' : 'QUITAR IMAGEN'}
                </button>
              </div>
            ) : (
              <>
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
                {isEdit ? (
                  <label style={{ display: 'inline-block', marginTop: 8, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: uploadingIcon ? 'var(--text3)' : 'var(--gold2)', cursor: uploadingIcon ? 'default' : 'pointer' }}>
                    {uploadingIcon ? 'SUBIENDO...' : 'O SUBE UNA IMAGEN (JPG · PNG · GIF · WEBP)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      disabled={uploadingIcon}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadIcon(f); e.target.value = ''; }}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div style={{ marginTop: 8, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.08em', color: 'var(--text3)' }}>
                    PODRÁS SUBIR UNA IMAGEN PERSONALIZADA DESPUÉS DE CREAR EL PROYECTO
                  </div>
                )}
                {iconError && (
                  <div style={{ marginTop: 6, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.06em', color: 'var(--red)' }}>{iconError}</div>
                )}
              </>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.isObjective ? 10 : 0 }}>
              <label style={{ ...LABEL, marginBottom: 0 }}>ES UN OBJETIVO</label>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isObjective: !p.isObjective }))}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative', padding: 0,
                  background: form.isObjective ? 'var(--gold2)' : 'var(--bg4)', transition: 'background .15s',
                }}
              >
                <span style={{ position: 'absolute', top: 2, left: form.isObjective ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
              </button>
            </div>
            {form.isObjective && (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {OBJECTIVE_TIERS.map(t => {
                    const sel = form.objectiveTier === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, objectiveTier: t }))}
                        style={{
                          padding: '6px 11px', borderRadius: 20, cursor: 'pointer',
                          fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em',
                          border: `.5px solid ${sel ? 'var(--gold2)' : 'var(--bg4)'}`,
                          background: sel ? 'rgba(196,168,106,.12)' : 'transparent',
                          color: sel ? 'var(--gold)' : 'var(--text3)',
                        }}
                      >
                        {TIER_LABEL[t]}
                      </button>
                    );
                  })}
                </div>
                {isEdit && editProject?.isObjective && editProject.objectiveTier === form.objectiveTier && (
                  <div style={{ marginTop: 10, padding: '9px 11px', background: 'var(--bg3)', borderRadius: 8, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.06em', color: 'var(--text3)', lineHeight: 1.8 }}>
                    INICIO PERIODO: {fmtDate(editProject.objectiveStartedAt)}<br />
                    FIN ESPERADO: {fmtDate(editProject.dueDate)}<br />
                    {(editProject.objectiveRenewals ?? 0) > 0 && <>PRORROGADO: {editProject.objectiveRenewals}×<br /></>}
                    OBJETIVO DESDE: {fmtDate(editProject.objectiveOriginalStartAt)}
                  </div>
                )}
                {isEdit && editProject?.isObjective && editProject.objectiveTier !== form.objectiveTier && (
                  <div style={{ marginTop: 10, fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.08em', color: 'var(--amber)', lineHeight: 1.6 }}>
                    CAMBIAR LA PERIODICIDAD REINICIA EL PERIODO ACTUAL
                  </div>
                )}
              </>
            )}
          </div>
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
