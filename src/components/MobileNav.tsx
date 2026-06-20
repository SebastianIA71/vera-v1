'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

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
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
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

function MoreIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.5" fill={color} stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill={color} stroke="none" />
    </svg>
  )
}

/* ── Íconos del panel "Más" ── */

function PropertiesIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
      <path d="M15 3v4" />
      <path d="M3 14h18" strokeDasharray="2 2" strokeWidth="1" opacity=".5" />
    </svg>
  )
}

function ProjectsIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
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

function ContractsIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function VehiclesIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

function ContactsIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
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

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size: number; color: string }>; badge?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/',      label: 'home',   icon: HomeIcon  },
  { href: '/tasks', label: 'tareas', icon: TasksIcon },
  { href: '/inbox', label: 'inbox',  icon: InboxIcon, badge: true },
  { href: '/trips', label: 'viajes', icon: EventsIcon },
]

type MoreItem = { href: string; label: string; icon: React.ComponentType<{ size: number; color: string }> }

const MORE_ITEMS: MoreItem[] = [
  { href: '/properties', label: 'Propiedades', icon: PropertiesIcon },
  { href: '/projects',   label: 'Proyectos',   icon: ProjectsIcon },
  { href: '/finance',    label: 'Finanzas',    icon: FinanceIcon },
  { href: '/contracts',  label: 'Contratos',   icon: ContractsIcon },
  { href: '/vehicles',   label: 'Vehículos',   icon: VehiclesIcon },
  { href: '/contacts',   label: 'Contactos',   icon: ContactsIcon },
  { href: '/agents',     label: 'Agentes',     icon: AgentsIcon },
]

const MORE_PATHS = MORE_ITEMS.map(i => i.href)

export function MobileNav({ inboxCount = 0 }: { inboxCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_PATHS.some(p => pathname.startsWith(p))

  return (
    <>
      {/* ── Panel "Más" ── */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(7,8,10,0.85)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 64, left: 0, right: 0,
              background: 'var(--bg2)',
              borderTop: '.5px solid var(--bg4)',
              borderRadius: '20px 20px 0 0',
              padding: '18px 16px 20px',
            }}
          >
            {/* Handle */}
            <div style={{ width: 32, height: 3, background: 'var(--bg4)', borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.26em', color: 'var(--text3)', marginBottom: 14, textAlign: 'center' }}>
              SECCIONES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {MORE_ITEMS.map(item => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setMoreOpen(false); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 6, padding: '12px 4px',
                      borderRadius: 12,
                      background: isActive ? 'rgba(196,168,106,.08)' : 'var(--bg3)',
                      border: `.5px solid ${isActive ? 'var(--gold2)' : 'var(--bg4)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <item.icon size={20} color={isActive ? 'var(--gold2)' : 'var(--text2)'} />
                    <span style={{
                      fontFamily: 'var(--font-dm-mono)', fontSize: 9,
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      color: isActive ? 'var(--gold2)' : 'var(--text3)',
                      lineHeight: 1,
                    }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Barra de navegación ── */}
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
              href={item.href}
              onClick={() => setMoreOpen(false)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '4px', textDecoration: 'none', position: 'relative',
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', top: '8px',
                  width: '3px', height: '3px', borderRadius: '50%',
                  background: 'var(--gold2)',
                }} />
              )}

              <item.icon
                size={22}
                color={isActive ? 'var(--gold2)' : 'var(--text3)'}
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
                fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: isActive ? 'var(--gold2)' : 'var(--text3)',
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* ── Botón Más ── */}
        <button
          onClick={() => setMoreOpen(o => !o)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '4px', position: 'relative', cursor: 'pointer',
            background: 'none', border: 'none',
          }}
        >
          {(isMoreActive || moreOpen) && (
            <span style={{
              position: 'absolute', top: '8px',
              width: '3px', height: '3px', borderRadius: '50%',
              background: 'var(--gold2)',
            }} />
          )}
          <MoreIcon
            size={22}
            color={(isMoreActive || moreOpen) ? 'var(--gold2)' : 'var(--text3)'}
          />
          <span style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: (isMoreActive || moreOpen) ? 'var(--gold2)' : 'var(--text3)',
            lineHeight: 1,
          }}>
            más
          </span>
        </button>
      </nav>
    </>
  )
}
