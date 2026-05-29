'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Item = {
  id: number;
  content: string;
  source?: string | null;
  suggestedPropertyId?: string | null;
  createdAt?: Date | null;
};

type Props = { items: Item[]; onClose: () => void };

const SRC_COLOR: Record<string, string> = {
  voice: 'var(--gold2)',
  manual: 'var(--text2)',
  instagram: 'var(--blue)',
  whatsapp: 'var(--green)',
};

const PROPS = [
  { id: 'flat',     label: 'Flat' },
  { id: 'sarapita', label: 'Sarapita' },
  { id: 'willys',   label: "Willy's" },
];

type Phase = 'entry' | 'cards' | 'empty';

export default function InboxMobile({ items: initialItems, onClose }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initialItems.length === 0 ? 'empty' : 'entry');
  const [items, setItems] = useState(initialItems.filter(i => true)); // mutable copy
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saved, setSaved] = useState(0);
  const [discarded, setDiscarded] = useState(0);

  // Swipe state
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartX = useRef(0);

  // Edit state per card
  const [editProp, setEditProp] = useState('');
  const [editPrio, setEditPrio] = useState(5);
  const [adjusting, setAdjusting] = useState(false);

  const current = items[currentIdx];
  const remaining = items.length - currentIdx;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    setDragX(e.touches[0].clientX - touchStartX.current);
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (dragX > 80) saveCard();
    else if (dragX < -80) discardCard();
    else setDragX(0);
  };

  const advance = () => {
    setDragX(0);
    setAdjusting(false);
    setEditProp('');
    setEditPrio(5);
    const next = currentIdx + 1;
    if (next >= items.length) {
      setPhase('empty');
    } else {
      setCurrentIdx(next);
    }
  };

  const saveCard = async () => {
    if (!current) return;
    await fetch(`/api/inbox/${current.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        createTask: true,
        title: current.content,
        propertyId: editProp || current.suggestedPropertyId || null,
        prio: editPrio,
        type: 'task',
      }),
    });
    setSaved(s => s + 1);
    advance();
  };

  const discardCard = async () => {
    if (!current) return;
    await fetch(`/api/inbox/${current.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processed: true }),
    });
    setDiscarded(d => d + 1);
    advance();
  };

  const handleClose = () => {
    router.refresh();
    onClose();
  };

  const srcColor = (src?: string | null) => SRC_COLOR[src ?? ''] ?? 'var(--text2)';
  const rotation = Math.min(Math.max(dragX * 0.08, -12), 12);
  const swipeOpacity = Math.max(0.3, 1 - Math.abs(dragX) / 300);
  const swipeColor = dragX > 40 ? `rgba(78,203,141,${Math.min(dragX / 120, 0.3)})` : dragX < -40 ? `rgba(224,92,92,${Math.min(-dragX / 120, 0.3)})` : 'transparent';

  const VERA_LOGO = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: 'var(--gold2)' }}>
      <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a" /></svg>
      VERA
    </span>
  );

  // === ESTADO 1: ENTRADA ===
  if (phase === 'entry') {
    const bySrc = items.reduce<Record<string, number>>((acc, i) => {
      const s = i.source ?? 'manual';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '42px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {VERA_LOGO}
          <button onClick={handleClose} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>CERRAR ×</button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 72, color: 'var(--gold)', lineHeight: 1, letterSpacing: '-.04em' }}>{items.length}</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.22em', color: 'var(--text2)' }}>CAPTURAS PENDIENTES</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(bySrc).map(([src, count]) => (
              <span key={src} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.14em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--text2)' }}>
                {count} {src.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => setPhase('cards')} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'transparent', border: '.5px solid var(--gold2)', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.22em', cursor: 'pointer' }}>
          PROCESAR →
        </button>
      </div>
    );
  }

  // === ESTADO 3: VACÍO ===
  if (phase === 'empty') {
    const now = new Date();
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '42px 22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {VERA_LOGO}
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)' }}>SWIPE ↓</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: '.5px solid var(--gold2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '.5px solid rgba(196,168,106,.18)' }} />
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="var(--gold)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 20, color: 'var(--text)', textAlign: 'center', lineHeight: 1.3 }}>
            Inbox<br /><em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>despejado.</em>
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text2)' }}>
            {now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()} · {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, color: 'var(--green)', lineHeight: 1 }}>{saved}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text4)', marginTop: 3 }}>GUARDADAS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, color: 'var(--red)', lineHeight: 1 }}>{discarded}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text4)', marginTop: 3 }}>DESCARTADAS</div>
            </div>
          </div>
        </div>

        <button onClick={handleClose} style={{ width: '100%', padding: 12, borderRadius: 12, border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', cursor: 'pointer' }}>
          IR AL DASHBOARD →
        </button>
      </div>
    );
  }

  // === ESTADO 2: CARTAS ===
  if (!current) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '42px 22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {VERA_LOGO}
        <button onClick={handleClose} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.2em', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>CERRAR ×</button>
      </div>

      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.2em', color: 'var(--text4)', textAlign: 'center', marginBottom: 10 }}>
        {currentIdx + 1} DE {items.length}
      </div>

      {/* Stack de cartas */}
      <div style={{ flex: 1, position: 'relative', marginBottom: 12 }}>
        {/* Carta 3 (fondo) */}
        {currentIdx + 2 < items.length && (
          <div style={{ position: 'absolute', inset: '14px 18px 0', background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 16, transform: 'translateY(12px) scale(.92)', zIndex: 1 }} />
        )}
        {/* Carta 2 */}
        {currentIdx + 1 < items.length && (
          <div style={{ position: 'absolute', inset: '8px 10px 0', background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 16, transform: 'translateY(6px) scale(.96)', zIndex: 2 }} />
        )}
        {/* Carta activa */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'absolute', inset: 0,
            background: swipeColor !== 'transparent' ? `linear-gradient(${dragX > 0 ? '135deg' : '225deg'}, ${swipeColor}, var(--bg2))` : 'var(--bg2)',
            border: `.5px solid ${dragX > 40 ? 'var(--green)' : dragX < -40 ? 'var(--red)' : 'var(--bg4)'}`,
            borderRadius: 16, zIndex: 3, padding: '18px 16px',
            display: 'flex', flexDirection: 'column',
            transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
            opacity: swipeOpacity,
            transition: dragging ? 'none' : 'transform .3s ease, opacity .3s ease',
            touchAction: 'pan-y',
            cursor: 'grab',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.18em', color: srcColor(current.source), marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: srcColor(current.source), display: 'inline-block' }} />
            {(current.source ?? 'manual').toUpperCase()}
            {current.createdAt && (
              <span style={{ color: 'var(--text4)', fontSize: 9 }}>
                · {new Date(current.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 15, lineHeight: 1.5, color: 'var(--text)', flex: 1 }}>
            {current.content}
          </div>

          {/* Clasificación Vera */}
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--purple)', marginTop: 14, marginBottom: 8 }}>✦ VERA CLASIFICA</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {current.suggestedPropertyId && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--gold2)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
                {current.suggestedPropertyId.toUpperCase()}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--gold2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8a020', display: 'inline-block' }} />
              PRIO {editPrio}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px solid var(--bg4)', color: 'var(--gold2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
              TAREA
            </span>
            <button onClick={() => setAdjusting(a => !a)} style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', padding: '4px 9px', borderRadius: 999, border: '.5px dashed var(--bg4)', color: 'var(--text2)', background: 'none', cursor: 'pointer' }}>
              {adjusting ? '← HECHO' : '+ AJUSTAR'}
            </button>
          </div>

          {/* Inline editor */}
          {adjusting && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <select value={editProp} onChange={e => setEditProp(e.target.value)} style={{ flex: 1, background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 7, padding: '6px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                <option value="">— ninguna</option>
                {PROPS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <select value={editPrio} onChange={e => setEditPrio(Number(e.target.value))} style={{ width: 70, background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 7, padding: '6px 8px', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)', fontSize: 11 }}>
                {[9,8,7,6,5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Hints de swipe */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.16em', padding: '0 4px', marginBottom: 8 }}>
        <span style={{ color: 'var(--red)', opacity: dragX < -20 ? 1 : 0.4 }}>← DESCARTAR</span>
        <span style={{ color: 'var(--green)', opacity: dragX > 20 ? 1 : 0.4 }}>GUARDAR →</span>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={discardCard} style={{ padding: '12px 16px', borderRadius: 12, background: 'transparent', border: '.5px solid var(--red)', color: 'var(--red)', fontFamily: 'var(--font-dm-mono)', fontSize: 14, cursor: 'pointer' }}>✕</button>
        <button onClick={saveCard} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'transparent', border: '.5px solid var(--green)', color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', cursor: 'pointer' }}>GUARDAR TAREA →</button>
      </div>
    </div>
  );
}
