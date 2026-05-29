'use client';

import { useRouter, usePathname } from 'next/navigation';

function NavIcon({ icon }: { icon: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    command:  <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    tasks:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    inbox:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    trips:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L9 8.2 1.8 6.4C1 6 .5 7 1 7.5L5.5 12l-2 3.5c-.5 1 .5 2 1.5 1.5L8 15l4.5 4.5c.5.5 1.5 0 1.5-1l-1.8-7.2z"/></svg>,
    props:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    finance:  <svg viewBox="0 0 24 24" width={18} height={18} {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    agents:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z"/></svg>,
    settings: <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9z"/></svg>,
    logout:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return <>{icons[icon] ?? null}</>;
}

function NavItem({ icon, label, active, badge, onClick }: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px',
        background: active ? 'var(--bg2)' : 'transparent', border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap', position: 'relative', margin: '1px 0', width: '100%',
        color: active ? 'var(--gold2)' : 'var(--text2)',
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '2px', height: '16px', background: 'var(--gold2)', borderRadius: '1px',
        }} />
      )}
      <span style={{ color: active ? 'var(--gold2)' : 'var(--text2)', flexShrink: 0 }}>
        <NavIcon icon={icon} />
      </span>
      <span style={{
        fontFamily: 'var(--font-dm-mono)', fontSize: '12px',
        letterSpacing: '.16em', color: active ? 'var(--gold2)' : 'var(--text2)',
        transition: 'opacity .15s',
      }}>
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          marginLeft: 'auto', background: 'var(--red)', color: '#fff',
          fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
          padding: '2px 6px', borderRadius: '999px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function DesktopNav({
  inboxCount = 0,
  activeOverride,
}: {
  inboxCount?: number;
  activeOverride?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (activeOverride) return activeOverride === path;
    return pathname === path || pathname.startsWith(path + '/');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/lock');
  };

  return (
    <nav
      className="desktop-sidebar-nav"
      style={{
        width: '220px',
        background: 'var(--bg)',
        borderRight: '.5px solid var(--bg4)',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 0',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <NavItem icon="command"  label="COMMAND"    active={isActive('/dashboard')} onClick={() => router.push('/dashboard')} />
      <NavItem icon="tasks"    label="TAREAS"      active={isActive('/tasks')}     onClick={() => router.push('/tasks')} />
      <NavItem icon="inbox"    label="INBOX"       active={isActive('/inbox')}     badge={inboxCount} onClick={() => router.push('/inbox')} />
      <NavItem icon="trips"    label="VIAJES"      active={isActive('/trips')}     onClick={() => router.push('/trips')} />
      <NavItem icon="props"    label="PROPIEDADES" active={isActive('/properties')} onClick={() => router.push('/properties')} />

      <div style={{ height: .5, background: 'var(--bg4)', margin: '6px 14px' }} />

      <NavItem icon="finance"  label="FINANZAS"    active={isActive('/finance')}   onClick={() => router.push('/finance')} />
      <NavItem icon="agents"   label="AGENTES"     active={isActive('/agents')}    onClick={() => router.push('/agents')} />

      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: .5, background: 'var(--bg4)', margin: '6px 14px' }} />
        <NavItem icon="settings" label="AJUSTES"   active={isActive('/settings')}  onClick={() => router.push('/settings')} />
        <NavItem icon="logout"   label="SALIR"                                     onClick={logout} />
      </div>
    </nav>
  );
}
