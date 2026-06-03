'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopShell from '@/components/layout/DesktopShell';
import MobilePageHeader from '@/components/layout/MobilePageHeader';
import { fmtTime } from '@/lib/utils';

type InboxItem = {
  id: number;
  content: string;
  source?: string | null;
  type?: string | null;
  processed?: boolean | null;
  suggestedPropertyId?: string | null;
  createdAt?: Date | null;
};

type Tab = 'pending' | 'all' | 'done';

const SRC_COLOR: Record<string, string> = {
  voice: 'var(--gold2)',
  manual: 'var(--text2)',
  instagram: 'var(--blue)',
  whatsapp: 'var(--green)',
  email: 'var(--purple)',
};

const PROPS = [
  { id: 'flat',     label: 'Flat' },
  { id: 'sarapita', label: 'Sarapita' },
  { id: 'willys',   label: "Willy's" },
];

type Project = { id: number; name: string; color: string | null };
type Trip    = { id: number; title: string };

export default function InboxClient({ initialItems, urgentCount, staleCount, inboxCount, projects = [], trips = [] }: {
  initialItems: InboxItem[];
  urgentCount: number;
  staleCount: number;
  inboxCount: number;
  projects?: Project[];
  trips?: Trip[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>(initialItems);
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Edit state for selected item
  const [editTitle, setEditTitle] = useState('');
  const [editProp, setEditProp] = useState<string>('');
  const [editProject, setEditProject] = useState<string>('');
  const [editTrip, setEditTrip] = useState<string>('');
  const [editPrio, setEditPrio] = useState(5);
  const [saving, setSaving] = useState(false);

  const selectItem = (item: InboxItem) => {
    setSelected(item);
    setEditTitle(item.content);
    setEditProp(item.suggestedPropertyId ?? '');
    setEditProject('');
    setEditTrip('');
    setEditPrio(5);
  };

  const filtered = items.filter(i => {
    if (tab === 'pending') return !i.processed;
    if (tab === 'done') return i.processed;
    return true;
  });

  const pendingCount = items.filter(i => !i.processed).length;

  const saveAsTask = async () => {
    if (!selected || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inbox/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createTask: true,
          title: editTitle,
          propertyId: editProp || null,
          projectId: editProject ? Number(editProject) : null,
          tags: editTrip || null,
          prio: editPrio,
          type: 'task',
        }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === selected.id ? { ...i, processed: true } : i));
        setSelected(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (!selected) return;
    await fetch(`/api/inbox/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processed: true }),
    });
    setItems(prev => prev.map(i => i.id === selected.id ? { ...i, processed: true } : i));
    setSelected(null);
  };

  const srcColor = (src?: string | null) => SRC_COLOR[src ?? ''] ?? 'var(--text2)';

  return (
    <DesktopShell urgentCount={urgentCount} staleCount={staleCount} inboxCount={pendingCount}>
      {/* Lista */}
      <div style={{ width: isMobile ? '100%' : 340, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : '.5px solid var(--bg4)', flexShrink: 0 }}>
        {isMobile && <MobilePageHeader title="Inbox" />}
        <div style={{ padding: '14px 18px 0', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 18, color: 'var(--text)', letterSpacing: '-.01em', marginBottom: 12 }}>
              Inbox <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>capturas</em>
            </div>
          )}
          <div style={{ display: 'flex', width: '100%', borderBottom: '.5px solid var(--bg4)', marginTop: 0 }}>
            {([['pending','SIN PROCESAR',pendingCount],['all','TODAS',null],['done','PROCESADAS',null]] as const).map(([id, label, count]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '8px 4px', textAlign: 'center',
                fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em',
                color: tab === id ? 'var(--gold2)' : 'var(--text4)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: `1.5px solid ${tab === id ? 'var(--gold2)' : 'transparent'}`,
              }}>
                {label}
                {count !== null && count > 0 && (
                  <span style={{ display: 'inline-block', background: 'var(--red)', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 999, marginLeft: 5 }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--gold)' }}>✦</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>INBOX VACÍO</div>
            </div>
          ) : filtered.map(item => (
            <div key={item.id} onClick={() => selectItem(item)} style={{
              padding: '12px 18px', borderBottom: '.5px solid var(--bg2)',
              cursor: 'pointer', position: 'relative', transition: 'background .1s',
              background: selected?.id === item.id ? 'var(--bg2)' : 'transparent',
              opacity: item.processed ? 0.5 : 1,
            }}
              onMouseEnter={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
              onMouseLeave={e => { if (selected?.id !== item.id) (e.currentTarget as HTMLDivElement).style.background = item.processed ? 'transparent' : 'transparent'; }}
            >
              {selected?.id === item.id && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--gold2)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', color: srcColor(item.source) }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: srcColor(item.source), display: 'inline-block' }} />
                  {(item.source ?? 'manual').toUpperCase()}
                </div>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text4)' }}>
                  {fmtTime(item.createdAt)}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12, color: 'var(--text)', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.content}
              </div>
              {item.suggestedPropertyId && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em', padding: '2px 6px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--gold2)' }}>
                    {item.suggestedPropertyId.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panel detalle */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button onClick={() => setSelected(null)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← LISTA
              </button>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text4)' }}>
                {fmtTime(selected.createdAt)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.2em', color: srcColor(selected.source) }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: srcColor(selected.source), display: 'inline-block' }} />
                {(selected.source ?? 'manual').toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Contenido original */}
            <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--text4)', marginBottom: 8 }}>CAPTURA ORIGINAL</div>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 16, lineHeight: 1.5, color: 'var(--text)' }}>{selected.content}</div>
            </div>

            {/* Clasificación */}
            {!selected.processed && (
              <div style={{ background: 'transparent', border: '.5px solid #2d2640', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(155,127,232,.05),transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.24em', color: 'var(--purple)', marginBottom: 12 }}>CLASIFICAR COMO TAREA</div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 6 }}>TÍTULO</div>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: 13, outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--gold2)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--bg4)')}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 6 }}>PROPIEDAD</div>
                    <select value={editProp} onChange={e => setEditProp(e.target.value)} style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                      <option value="">— ninguna</option>
                      {PROPS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--text3)', marginBottom: 6 }}>PRIORIDAD</div>
                    <select value={editPrio} onChange={e => setEditPrio(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                      {[9,8,7,6,5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {(projects.length > 0 || trips.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {projects.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--purple)', marginBottom: 6 }}>PROYECTO</div>
                        <select value={editProject} onChange={e => setEditProject(e.target.value)} style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                          <option value="">— ninguno</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}
                    {trips.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.18em', color: 'var(--blue)', marginBottom: 6 }}>VIAJE ✈</div>
                        <select value={editTrip} onChange={e => setEditTrip(e.target.value)} style={{ width: '100%', background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 8, padding: '7px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                          <option value="">— ninguno</option>
                          {trips.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={discard}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--red)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', cursor: 'pointer' }}
                  >
                    DESCARTAR
                  </button>
                  <button
                    onClick={saveAsTask}
                    disabled={saving || !editTitle.trim()}
                    style={{ flex: 2, padding: '10px 12px', borderRadius: 10, border: '.5px solid var(--green)', background: 'transparent', color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', cursor: 'pointer', opacity: (!editTitle.trim() || saving) ? 0.5 : 1 }}
                  >
                    {saving ? '···' : 'GUARDAR COMO TAREA ✓'}
                  </button>
                </div>
              </div>
            )}

            {selected.processed && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--green)' }}>
                ✓ PROCESADA
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: 32, color: 'var(--gold)' }}>✦</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text3)' }}>SELECCIONA UNA CAPTURA</div>
        </div>
      )}
    </DesktopShell>
  );
}
