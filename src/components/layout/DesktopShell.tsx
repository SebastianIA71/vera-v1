'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const DAYS = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const pad = (n: number) => String(n).padStart(2,'0');

const NAV = [
  { id: 'dashboard', path: '/dashboard', icon: 'command' },
  { id: 'tasks',     path: '/tasks',     icon: 'tasks'   },
  { id: 'inbox',     path: '/inbox',     icon: 'inbox',  badge: true },
  { id: 'trips',     path: '/trips',     icon: 'trips'   },
  { id: 'properties',path: '/properties',icon: 'props'   },
  { id: 'div' },
  { id: 'finance',   path: '/finance',   icon: 'finance' },
  { id: 'div2' },
  { id: 'settings',  path: '/settings',  icon: 'settings', bottom: true },
  { id: 'logout',    path: '/lock',      icon: 'logout',   bottom: true },
] as const;

type NavEntry = { id: string; path?: string; icon?: string; badge?: boolean; bottom?: boolean };

function NavIcon({ icon }: { icon: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'command':  return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
    case 'tasks':    return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case 'inbox':    return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'trips':    return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'props':    return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'finance':  return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'settings': return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9z"/></svg>;
    case 'logout':   return <svg viewBox="0 0 24 24" width={16} height={16} {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    default: return null;
  }
}

export default function DesktopShell({
  children,
  urgentCount = 0,
  staleCount = 0,
  inboxCount = 0,
  rightSlot,
  pageActions,
}: {
  children: React.ReactNode;
  urgentCount?: number;
  staleCount?: number;
  inboxCount?: number;
  rightSlot?: React.ReactNode;
  pageActions?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const navigate = async (path: string) => {
    if (path === '/lock') {
      await fetch('/api/auth/logout', { method: 'POST' });
    }
    router.push(path);
  };

  const topEntries = (NAV as readonly NavEntry[]).filter(n => n.id !== 'div' && n.id !== 'div2' && !n.bottom);
  const bottomEntries = (NAV as readonly NavEntry[]).filter(n => n.bottom);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* TOP BAR */}
      <div style={{ height: 54, background: 'var(--bg)', borderBottom: '.5px solid var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15, letterSpacing: '.3em', color: 'var(--gold2)' }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a"/></svg>
            VERA
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 14, color: 'var(--text2)', letterSpacing: '.12em' }}>{time}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Pill dot="red"   label={`${urgentCount} URGENTES`} />
          <Pill dot="amber" label={`${staleCount} STALE`} />
          <Pill dot="green" label={`${inboxCount} INBOX`} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pageActions}
          <button
            onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', border: '.5px solid var(--gold2)', borderRadius: 999, background: 'transparent', color: 'var(--gold)', fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.18em', cursor: 'pointer' }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
            OYE VERA
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* NAV COLAPSADA */}
        <nav style={{ width: 62, background: 'var(--bg)', borderRight: '.5px solid var(--bg4)', display: 'flex', flexDirection: 'column', padding: '12px 0', flexShrink: 0 }}>
          {(NAV as readonly NavEntry[]).filter(n => n.id !== 'div' && n.id !== 'div2' && !n.bottom).map(n => (
            <button
              key={n.id}
              onClick={() => n.path && navigate(n.path)}
              style={{
                width: 62, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative', background: 'none', border: 'none',
                color: pathname === n.path ? 'var(--gold2)' : 'var(--text3)',
              }}
            >
              {pathname === n.path && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 16, background: 'var(--gold2)', borderRadius: 1 }} />
              )}
              {n.icon && <NavIcon icon={n.icon} />}
              {n.badge && inboxCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 8, background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-dm-mono)', fontSize: 7, padding: '1px 4px', borderRadius: 999 }}>{inboxCount}</span>
              )}
            </button>
          ))}
          <div style={{ height: .5, background: 'var(--bg4)', margin: '6px 10px' }} />
          <button
            onClick={() => navigate('/finance')}
            style={{ width: 62, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text3)' }}
          >
            <NavIcon icon="finance" />
          </button>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ height: .5, background: 'var(--bg4)', margin: '6px 10px' }} />
            {bottomEntries.map(n => (
              <button
                key={n.id}
                onClick={() => n.path && navigate(n.path)}
                style={{ width: 62, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text3)' }}
              >
                {n.icon && <NavIcon icon={n.icon} />}
              </button>
            ))}
          </div>
        </nav>

        {/* CONTENIDO */}
        {children}

        {/* SLOT DERECHO OPCIONAL */}
        {rightSlot}
      </div>
    </div>
  );
}

function Pill({ dot, label }: { dot: string; label: string }) {
  const colors: Record<string, string> = { red: 'var(--red)', amber: 'var(--amber)', green: 'var(--green)' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', border: '.5px solid var(--bg4)', borderRadius: 999, fontFamily: 'var(--font-dm-mono)', fontSize: 12, letterSpacing: '.14em', color: 'var(--text2)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors[dot] ?? 'var(--text3)', display: 'inline-block' }} />
      {label}
    </div>
  );
}
