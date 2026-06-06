'use client';

import { useState, useCallback } from 'react';
import DesktopShell from '@/components/layout/DesktopShell';
import MobilePageHeader from '@/components/layout/MobilePageHeader';
import { useToast } from '@/components/ui/Toast';

type Contact = {
  id: number; name: string; frequencyDays: number | null;
  lastContactAt: Date | null; notes: string | null; createdAt: Date | null;
};

function daysSince(d: Date | null): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function statusColor(days: number | null, freq: number): string {
  if (days === null) return 'var(--amber)';
  const ratio = days / freq;
  if (ratio >= 1)    return 'var(--red)';
  if (ratio >= 0.75) return 'var(--amber)';
  return 'var(--green)';
}

function statusLabel(days: number | null, freq: number): string {
  if (days === null) return 'Sin registrar';
  if (days === 0)    return 'Hoy';
  if (days >= freq)  return `${days}d · vencido`;
  return `hace ${days}d`;
}

function ContactCard({ c, onPing, onDelete, onEdit }: {
  c: Contact;
  onPing: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (c: Contact) => void;
}) {
  const freq  = c.frequencyDays ?? 30;
  const days  = daysSince(c.lastContactAt);
  const color = statusColor(days, freq);
  const pct   = days === null ? 100 : Math.min(100, Math.round((days / freq) * 100));

  return (
    <div style={{
      background: 'var(--bg2)', border: `.5px solid ${days !== null && days >= freq ? color + '66' : 'var(--bg4)'}`,
      borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Barra de progreso sutil */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--bg4)' }}>
        <div style={{ height: 2, width: `${pct}%`, background: color, transition: 'width .3s' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        {/* Avatar inicial */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: color + '22', border: `.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 16, color,
        }}>
          {c.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>
            {c.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color, letterSpacing: '.1em' }}>
              {statusLabel(days, freq)}
            </span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)' }}>
              · c/{freq}d
            </span>
          </div>
          {c.notes && (
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11, color: 'var(--text3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.notes}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onPing(c.id)}
            title="He hablado hoy con esta persona"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
              border: `.5px solid ${color}`, background: color + '11',
              color, fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.1em',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            ✓ HOY
          </button>
          <button onClick={() => onEdit(c)} style={{ width: 32, height: 32, borderRadius: 8, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>✎</button>
          <button onClick={() => onDelete(c.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 13 }}>×</button>
        </div>
      </div>
    </div>
  );
}

function AddEditForm({ initial, onSave, onCancel }: {
  initial?: Contact | null;
  onSave: (data: { name: string; frequencyDays: number; notes: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [freq, setFreq] = useState(String(initial?.frequencyDays ?? 30));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const INPUT: React.CSSProperties = {
    width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)',
    borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
    fontFamily: 'var(--font-dm-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };
  const LABEL: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text3)', display: 'block', marginBottom: 6,
  };

  return (
    <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 16, color: 'var(--text)' }}>
        {initial ? 'Editar' : 'Nuevo'} <em style={{ fontStyle: 'italic', color: 'var(--purple)' }}>contacto</em>
      </div>
      <div>
        <label style={LABEL}>NOMBRE</label>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} style={INPUT} placeholder="Nombre del contacto" />
      </div>
      <div>
        <label style={LABEL}>RECORDARME CADA (DÍAS)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setFreq(String(d))} style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              border: `.5px solid ${freq === String(d) ? 'var(--purple)' : 'var(--bg4)'}`,
              background: freq === String(d) ? 'var(--purple-subtle)' : 'transparent',
              color: freq === String(d) ? 'var(--purple)' : 'var(--text3)',
              fontFamily: 'var(--font-dm-mono)', fontSize: 11,
            }}>{d}d</button>
          ))}
          <input type="number" value={freq} onChange={e => setFreq(e.target.value)}
            style={{ ...INPUT, width: 80, padding: '6px 10px', boxSizing: 'border-box' }} min={1} />
        </div>
      </div>
      <div>
        <label style={LABEL}>NOTAS (opcional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} style={INPUT} placeholder="Contexto, recordatorio..." />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 10, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', cursor: 'pointer' }}>CANCELAR</button>
        <button onClick={() => name.trim() && onSave({ name: name.trim(), frequencyDays: parseInt(freq, 10) || 30, notes })}
          disabled={!name.trim()} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: name.trim() ? 'var(--purple)' : 'var(--bg3)', color: name.trim() ? '#fff' : 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', cursor: name.trim() ? 'pointer' : 'default' }}>
          GUARDAR
        </button>
      </div>
    </div>
  );
}

export default function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const { toast } = useToast();
  const [contacts, setContacts] = useState(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 769);

  const overdue = contacts.filter(c => {
    const days = daysSince(c.lastContactAt);
    return days === null || days >= (c.frequencyDays ?? 30);
  }).length;

  const ping = useCallback(async (id: number) => {
    const r = await fetch(`/api/contacts/${id}/ping`, { method: 'POST' });
    if (r.ok) {
      const updated = await r.json();
      setContacts(prev => prev.map(c => c.id === id ? { ...c, lastContactAt: updated.lastContactAt } : c));
      toast('Contacto actualizado ✓');
    }
  }, [toast]);

  const save = useCallback(async (data: { name: string; frequencyDays: number; notes: string }) => {
    if (editing) {
      const r = await fetch(`/api/contacts/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (r.ok) {
        const updated = await r.json();
        setContacts(prev => prev.map(c => c.id === editing.id ? { ...c, ...updated } : c));
        toast('Contacto actualizado');
      }
    } else {
      const r = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (r.ok) {
        const created = await r.json();
        setContacts(prev => [created, ...prev]);
        toast('Contacto añadido');
      }
    }
    setShowForm(false); setEditing(null);
  }, [editing, toast]);

  const remove = useCallback(async (id: number) => {
    if (!confirm('¿Eliminar contacto?')) return;
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    setContacts(prev => prev.filter(c => c.id !== id));
    toast('Contacto eliminado', 'info');
  }, [toast]);

  const sorted = [...contacts].sort((a, b) => {
    const ra = daysSince(a.lastContactAt) === null ? 999 : (daysSince(a.lastContactAt)! / (a.frequencyDays ?? 30));
    const rb = daysSince(b.lastContactAt) === null ? 999 : (daysSince(b.lastContactAt)! / (b.frequencyDays ?? 30));
    return rb - ra;
  });

  const inner = (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
      {isMobile && <MobilePageHeader title="Contactos" />}

      {/* Header */}
      <div style={{ padding: isMobile ? '16px 18px 12px' : '20px 24px 16px', borderBottom: '.5px solid var(--bg4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: isMobile ? 22 : 28, color: 'var(--text)', lineHeight: 1.1 }}>
              Contactos <em style={{ fontStyle: 'italic', color: 'var(--purple)' }}>sociales</em>
            </div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', color: 'var(--text3)', marginTop: 4 }}>
              {contacts.length} PERSONAS · {overdue} PENDIENTES
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            style={{ padding: '8px 16px', borderRadius: 10, border: '.5px solid var(--purple)', background: 'var(--purple-subtle)', color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', cursor: 'pointer' }}
          >
            + AÑADIR
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? '14px 16px' : '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Formulario */}
        {(showForm || editing) && (
          <AddEditForm
            initial={editing}
            onSave={save}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {/* Lista */}
        {sorted.length === 0 && !showForm && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: 36, color: 'var(--purple)' }}>✦</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.2em', color: 'var(--text3)' }}>SIN CONTACTOS</div>
            <button onClick={() => setShowForm(true)} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 10, border: '.5px solid var(--purple)', background: 'transparent', color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', cursor: 'pointer' }}>
              AÑADIR EL PRIMERO →
            </button>
          </div>
        )}
        {sorted.map(c => (
          <ContactCard
            key={c.id} c={c}
            onPing={ping}
            onDelete={remove}
            onEdit={c => { setEditing(c); setShowForm(false); }}
          />
        ))}
      </div>
    </div>
  );

  if (isMobile) return inner;
  return (
    <DesktopShell urgentCount={0} staleCount={0} inboxCount={0}>
      {inner}
    </DesktopShell>
  );
}
