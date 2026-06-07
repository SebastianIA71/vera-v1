'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { APP_VERSION } from '@/lib/version';
import { useSearch } from '@/components/ui/SearchModal';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

export default function HomeHeader() {
  const router = useRouter();
  const { openSearch } = useSearch();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateStr(`${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const iconBtn = (onClick: () => void, label: string, icon: React.ReactNode) => (
    <button onClick={onClick} aria-label={label}
      style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}
    >{icon}</button>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 11, letterSpacing: '.3em', color: 'var(--gold2)' }}>
        <svg width={9} height={9} viewBox="0 0 24 24" fill="none"><path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="var(--gold2)" /></svg>
        VERA
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--text3)', fontWeight: 400 }}>{APP_VERSION}</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ThemeToggle size="sm" />
        {/* Búsqueda — icono gold, distinto de los demás */}
        <button onClick={openSearch} aria-label="Buscar"
          style={{ width: 36, height: 36, borderRadius: '50%', border: '.5px solid var(--gold2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold2)', cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        {/* Ajustes — icono neutro */}
        <button onClick={() => router.push('/settings')} aria-label="Ajustes"
          style={{ width: 36, height: 36, borderRadius: '50%', border: '.5px solid var(--bg4)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </button>
        {/* Ritual matutino — icono cálido */}
        <button onClick={() => router.push('/morning')} aria-label="Ritual"
          style={{ width: 36, height: 36, borderRadius: '50%', border: '.5px solid var(--bg4)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)', cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
      </div>
    </div>
  );
}
