'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '@/lib/version';
import { useSearch } from '@/components/ui/SearchModal';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export default function HomeHeader() {
  const router = useRouter();
  const { openSearch } = useSearch();
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const d = DAY_NAMES[now.getDay()];
      const date = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setClockStr(`${d} ${date}/${month} · ${h}:${m}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const iconBtn = (onClick: () => void, label: string, icon: React.ReactNode) => (
    <button
      onClick={onClick}
      style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}
      aria-label={label}
    >{icon}</button>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: 'var(--gold2)' }}>
        <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="var(--gold2)" /></svg>
        VERA
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.12em', color: 'var(--gold2)', fontWeight: 400 }}>{APP_VERSION}</span>
        {clockStr && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--text3)', fontWeight: 400 }}>{clockStr}</span>}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ThemeToggle size="sm" />
        {iconBtn(openSearch, 'Buscar',
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        )}
        {iconBtn(() => router.push('/settings'), 'Ajustes',
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        )}
        {iconBtn(() => router.push('/morning'), 'Ritual',
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        )}
      </div>
    </div>
  );
}
