'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/* ── Context para abrir/cerrar desde cualquier parte ── */
interface SearchCtxType { openSearch: () => void }
const SearchCtx = createContext<SearchCtxType>({ openSearch: () => {} });
export function useSearch() { return useContext(SearchCtx); }

/* ── Tipos de resultado ── */
type TaskResult  = { id: number; title: string; propertyId: string | null; prioFinal: number | null; status: string | null };
type EventResult = { id: number; title: string; type: string | null; startDate: number | null };
type InboxResult = { id: number; content: string; source: string | null };
type Results = { tasks: TaskResult[]; events: EventResult[]; inbox: InboxResult[] };

/* ── Provider + Modal ── */
export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Results>({ tasks: [], events: [], inbox: [] });
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor]   = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = useCallback(() => { setOpen(true); setQuery(''); setResults({ tasks: [], events: [], inbox: [] }); setCursor(0); }, []);
  const close      = useCallback(() => setOpen(false), []);

  /* Cmd+K / Ctrl+K global */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch]);

  /* Focus input on open */
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  /* Búsqueda con debounce */
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.length < 2) { setResults({ tasks: [], events: [], inbox: [] }); return; }
    setLoading(true);
    debounce.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => { setResults(d); setCursor(0); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
  }, [query]);

  /* Flatten all results for keyboard nav */
  const flat: { type: 'task' | 'event' | 'inbox'; id: number; href: string; label: string }[] = [
    ...results.tasks.map(t  => ({ type: 'task'  as const, id: t.id,  href: `/tasks/${t.id}`,  label: t.title })),
    ...results.events.map(e => ({ type: 'event' as const, id: e.id,  href: `/trips/${e.id}`,  label: e.title })),
    ...results.inbox.map(i  => ({ type: 'inbox' as const, id: i.id,  href: `/inbox`,          label: i.content.slice(0, 60) })),
  ];
  const totalItems = flat.length;

  const navigate = useCallback((item: typeof flat[0]) => {
    router.push(item.href);
    close();
  }, [router, close]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, totalItems - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && flat[cursor]) navigate(flat[cursor]);
  };

  const PROP_COLORS: Record<string, string> = { flat: 'var(--blue)', sarapita: 'var(--purple)', willys: 'var(--green)' };
  const typeLabel = (t: string) => t === 'task' ? 'T' : t === 'event' ? 'E' : 'I';
  const typeColor = (t: string) => t === 'task' ? 'var(--gold2)' : t === 'event' ? 'var(--blue)' : 'var(--purple)';

  if (!open) return <SearchCtx.Provider value={{ openSearch }}>{children}</SearchCtx.Provider>;

  return (
    <SearchCtx.Provider value={{ openSearch }}>
      {children}
      {/* Backdrop */}
      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 8000, backdropFilter: 'blur(4px)' }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(560px, calc(100vw - 32px))',
        background: 'var(--bg2)',
        border: '.5px solid var(--bg4)',
        borderRadius: 16,
        overflow: 'hidden',
        zIndex: 8001,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '.5px solid var(--bg4)' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.8} strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar tareas, eventos, capturas..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: 15,
              color: 'var(--text)',
            }}
          />
          {loading && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text4)' }}>···</span>
          )}
          <span style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)',
            border: '.5px solid var(--bg4)', borderRadius: 4, padding: '2px 6px', letterSpacing: '.06em',
          }}>ESC</span>
        </div>

        {/* Results */}
        {totalItems === 0 && query.length >= 2 && !loading && (
          <div style={{ padding: '24px 18px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--text3)' }}>
            SIN RESULTADOS
          </div>
        )}

        {query.length < 2 && (
          <div style={{ padding: '16px 18px', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', color: 'var(--text4)' }}>
            ESCRIBE 2 O MÁS CARACTERES
          </div>
        )}

        {totalItems > 0 && (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {flat.map((item, idx) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(item)}
                onMouseEnter={() => setCursor(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  background: cursor === idx ? 'var(--bg3)' : 'transparent',
                  borderLeft: cursor === idx ? `2px solid var(--gold2)` : '2px solid transparent',
                  transition: 'background .1s',
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: `${typeColor(item.type)}22`,
                  border: `.5px solid ${typeColor(item.type)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: typeColor(item.type),
                  letterSpacing: 0,
                }}>
                  {typeLabel(item.type)}
                </span>
                <span style={{
                  fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: 'var(--text)',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
                {item.type === 'task' && (results.tasks.find(t => t.id === item.id)?.propertyId) && (
                  <span style={{
                    fontFamily: 'var(--font-dm-mono)', fontSize: 10, flexShrink: 0,
                    color: PROP_COLORS[results.tasks.find(t => t.id === item.id)!.propertyId!] ?? 'var(--text3)',
                  }}>
                    {results.tasks.find(t => t.id === item.id)!.propertyId!.toUpperCase()}
                  </span>
                )}
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 16, padding: '8px 18px', borderTop: '.5px solid var(--bg4)', alignItems: 'center' }}>
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['esc', 'cerrar']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)' }}>
              <kbd style={{ background: 'var(--bg3)', border: '.5px solid var(--bg4)', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </SearchCtx.Provider>
  );
}
