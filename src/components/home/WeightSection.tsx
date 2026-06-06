'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTodaySnm } from '@/lib/snm';
import SectionLabel from './SectionLabel';
import type { WeightLog } from './types';

const SNM_ICONS = ['💧', '🚶', '💪', '🧘', '🍴'];
const SNM_KEYS = ['snmAgua', 'snmCaminar', 'snmEntreno', 'snmEscucha', 'snmDisfruta'] as const;

function trendPath(logs: WeightLog[]): string {
  if (logs.length < 2) return '';
  const vals = [...logs].reverse().map(l => l.value);
  const min = Math.min(...vals) - 0.5; const max = Math.max(...vals) + 0.5;
  const w = 331; const h = 56;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`);
  return `M${pts.join(' L')}`;
}

export default function WeightSection({ weightLogs, todaySnm }: { weightLogs: WeightLog[]; todaySnm: string[] }) {
  const router = useRouter();
  const latest = weightLogs[0];
  const prev = weightLogs[1];
  const trend = latest && prev
    ? latest.value > prev.value ? 'SUBIENDO' : latest.value < prev.value ? 'BAJANDO' : 'ESTABLE'
    : 'ESTABLE';
  const trendColor = trend === 'SUBIENDO' ? 'var(--amber)' : 'var(--green)';
  const wPath = trendPath(weightLogs);
  const [snmActive, setSnmActive] = useState<string[]>(todaySnm);

  useEffect(() => {
    const refresh = () => { const l = getTodaySnm(); setSnmActive(l.length > 0 ? l : todaySnm); };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [todaySnm]);

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel label="Weight" meta="14 DÍAS" link="→" onLinkClick={() => router.push('/weight')} />
      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)', borderRadius: 14, padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 32, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.02em' }}>{latest.value}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text2)', marginTop: 4, letterSpacing: '.1em' }}>KG · HOY</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', padding: '4px 8px', borderRadius: 999, border: '.5px solid var(--bg4)', color: trendColor }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: trendColor, display: 'inline-block' }} />
            {trend}
          </div>
        </div>
        {wPath && (
          <svg width="100%" height={56} viewBox="0 0 331 56" preserveAspectRatio="none">
            <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ecb8d" stopOpacity=".18"/><stop offset="100%" stopColor="#4ecb8d" stopOpacity="0"/></linearGradient></defs>
            <path d={`${wPath} L331 56 L0 56 Z`} fill="url(#wg)" />
            <path d={wPath} stroke="var(--green)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          </svg>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '.5px solid var(--bg4)' }}>
          {SNM_KEYS.map((key, i) => (
            <div key={key} style={{
              flex: 1, background: snmActive.includes(key) ? 'rgba(78,203,141,.08)' : 'var(--bg3)',
              border: `.5px solid ${snmActive.includes(key) ? 'var(--green)' : 'var(--bg4)'}`,
              borderRadius: 10, padding: '10px 4px', textAlign: 'center',
              fontSize: 16, opacity: snmActive.includes(key) ? 1 : 0.25,
            }}>{SNM_ICONS[i]}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
