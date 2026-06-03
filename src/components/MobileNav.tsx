'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function HomeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function TasksIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function EventsIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="16" r="1" fill={color} />
    </svg>
  )
}

function AgentsIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function FinanceIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size: number; color: string }>; badge?: boolean; disabled?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: '/',        label: 'home',    icon: HomeIcon    },
  { href: '/tasks',   label: 'tareas',  icon: TasksIcon   },
  { href: '/trips',   label: 'eventos', icon: EventsIcon  },
  { href: '/agents',  label: 'agentes', icon: AgentsIcon  },
  { href: '/finance', label: 'finanzas', icon: FinanceIcon },
]

export function MobileNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px',
      background: 'rgba(7, 8, 10, 0.96)', borderTop: '0.5px solid var(--bg4)',
      display: 'flex', alignItems: 'stretch', zIndex: 100, width: '100%',
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            onClick={(e) => { if (item.disabled) e.preventDefault(); }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px', textDecoration: 'none', position: 'relative',
              opacity: item.disabled ? 0.35 : 1,
            }}
          >
            {isActive && !item.disabled && (
              <span style={{
                position: 'absolute', top: '8px',
                width: '3px', height: '3px', borderRadius: '50%',
                background: 'var(--gold2)',
              }} />
            )}

            <item.icon
              size={22}
              color={isActive && !item.disabled ? 'var(--gold2)' : 'var(--text3)'}
            />

            {item.badge && inboxCount > 0 && (
              <span style={{
                position: 'absolute', top: '10px', right: 'calc(50% - 14px)',
                minWidth: '16px', height: '16px', borderRadius: '8px',
                background: 'var(--red)', color: 'var(--text)',
                fontSize: '9px', fontFamily: 'var(--font-dm-mono)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>
                {inboxCount > 9 ? '9+' : inboxCount}
              </span>
            )}

            <span style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isActive && !item.disabled ? 'var(--gold2)' : 'var(--text3)',
              lineHeight: 1,
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
