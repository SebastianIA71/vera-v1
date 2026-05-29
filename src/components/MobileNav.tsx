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

function InboxIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
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

function VitaIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/',        label: 'home',    icon: HomeIcon    },
  { href: '/tasks',   label: 'tareas',  icon: TasksIcon   },
  { href: '/inbox',   label: 'inbox',   icon: InboxIcon,  badge: true },
  { href: '/agents',  label: 'agentes', icon: AgentsIcon  },
  { href: '/vita',    label: 'vita',    icon: VitaIcon    },
]

export function MobileNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'rgba(7, 8, 10, 0.96)',
      borderTop: '0.5px solid var(--bg4)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 100,
      width: '100%',
    }}>
      {NAV_ITEMS.map((item) => {
        // Activo: coincidencia exacta para '/', startsWith para el resto
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            {/* Punto indicador activo — encima del icono */}
            {isActive && (
              <span style={{
                position: 'absolute',
                top: '8px',
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: 'var(--gold2)',
              }} />
            )}

            {/* Icono */}
            <item.icon
              size={20}
              color={isActive ? 'var(--gold2)' : 'var(--text3)'}
            />

            {/* Badge inbox */}
            {item.badge && inboxCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '10px',
                right: 'calc(50% - 14px)',
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                background: 'var(--red)',
                color: 'var(--text)',
                fontSize: '9px',
                fontFamily: 'var(--font-dm-mono)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {inboxCount > 9 ? '9+' : inboxCount}
              </span>
            )}

            {/* Label */}
            <span style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '8px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isActive ? 'var(--gold2)' : 'var(--text3)',
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
