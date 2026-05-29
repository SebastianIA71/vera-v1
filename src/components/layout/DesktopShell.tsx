'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DesktopNav from './DesktopNav';

const DAYS = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const pad = (n: number) => String(n).padStart(2,'0');

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


  return (
    <div className="desktop-shell-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* TOP BAR — oculto en móvil */}
      <div className="desktop-topbar" style={{ height: 54, background: 'var(--bg)', borderBottom: '.5px solid var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 15, letterSpacing: '.3em', color: 'var(--gold2)' }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a"/></svg>
            VERA
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.14em', color: 'var(--gold2)', fontWeight: 400 }}>v.19</span>
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
      <div className="desktop-shell-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <DesktopNav inboxCount={inboxCount} />

        {/* CONTENIDO */}
        <div className="desktop-shell-content" style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
          {children}
        </div>

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
