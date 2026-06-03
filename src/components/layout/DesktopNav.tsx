'use client';

import { useRouter, usePathname } from 'next/navigation';

function NavIcon({ icon }: { icon: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    command:  <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    tasks:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    inbox:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    trips:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
    props:    <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
    projects: <svg viewBox="0 0 24 24" width={18} height={18} {...s}><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="9" y="3" width="13" height="2.5" rx="1"/><rect x="2" y="10.5" width="6" height="6" rx="1"/><rect x="9" y="10.5" width="13" height="2.5" rx="1"/><rect x="2" y="18" width="6" height="3" rx="1"/><rect x="9" y="18" width="13" height="2.5" rx="1"/></svg>,
    finance:  <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M17 8.5C15.5 7 13.5 6 11.5 6C7.9 6 5 8.9 5 12.5S7.9 19 11.5 19c2 0 4-1 5.5-2.5"/><line x1="3" y1="11" x2="13" y2="11"/><line x1="3" y1="14" x2="13" y2="14"/></svg>,
    agents:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z"/></svg>,
    settings: <svg viewBox="0 0 24 24" width={18} height={18} {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9z"/></svg>,
    logout:   <svg viewBox="0 0 24 24" width={18} height={18} {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return <>{icons[icon] ?? null}</>;
}

function NavItem({ icon, label, active, badge, badgeColor = 'var(--red)', onClick }: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
  badgeColor?: string;
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
          marginLeft: 'auto', background: badgeColor, color: '#fff',
          fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
          padding: '2px 7px', borderRadius: '999px', fontWeight: 500,
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function DesktopNav({
  urgentCount = 0,
  inboxCount = 0,
  activeOverride,
  counts = {},
}: {
  urgentCount?: number;
  inboxCount?: number;
  activeOverride?: string;
  counts?: { tasks?: number; trips?: number; properties?: number; projects?: number; agents?: number };
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
      <NavItem icon="command"  label="COMMAND"    active={isActive('/dashboard')} badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/dashboard')} />
      <NavItem icon="tasks"    label="TAREAS"      active={isActive('/tasks')}      badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/tasks')} />
      <NavItem icon="inbox"    label="INBOX"       active={isActive('/inbox')}      badge={inboxCount}    badgeColor="var(--red)"   onClick={() => router.push('/inbox')} />
      <NavItem icon="trips"    label="EVENTOS"     active={isActive('/trips')}      badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/trips')} />
      <NavItem icon="props"    label="PROPIEDADES" active={isActive('/properties')} badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/properties')} />
      <NavItem icon="projects" label="PROYECTOS"   active={isActive('/projects')}   badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/projects')} />

      <div style={{ height: .5, background: 'var(--bg4)', margin: '6px 14px' }} />

      <NavItem icon="finance"  label="FINANZAS"    active={isActive('/finance')}    badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/finance')} />
      <NavItem icon="agents"   label="AGENTES"     active={isActive('/agents')}     badge={urgentCount}   badgeColor="var(--red)"   onClick={() => router.push('/agents')} />

      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: .5, background: 'var(--bg4)', margin: '6px 14px' }} />
        <NavItem icon="settings" label="AJUSTES"   active={isActive('/settings')}  onClick={() => router.push('/settings')} />
        <NavItem icon="logout"   label="SALIR"                                     onClick={logout} />
      </div>
    </nav>
  );
}
