'use client';

import { useEffect, useState } from 'react';
import { QUOTES } from '@/lib/quotes';
import { getRandomPersona } from '@/lib/personas';
import { getGreeting, personaSearchUrl } from '@/lib/utils';
import type { Trip, WeightLog } from './types';

function transportIcon(t: string): string {
  const v = t.toLowerCase().trim();
  if (v.includes('avi') || v.includes('vuelo') || v.includes('fly') || v.includes('avion')) return '✈';
  if (v.includes('tren') || v.includes('train') || v.includes('ave') || v.includes('renfe')) return '🚄';
  if (v.includes('coche') || v.includes('car') || v.includes('auto')) return '🚗';
  if (v.includes('barco') || v.includes('ferry') || v.includes('boat')) return '⛵';
  if (v.includes('bus') || v.includes('coach')) return '🚌';
  return '🧳';
}
function transportIcons(t: string) { return t.split(',').filter(Boolean).map(v => transportIcon(v)).join(' '); }

function renderQuote(raw: string) {
  return raw.split(/\*([^*]+)\*/).map((part, i) =>
    i % 2 === 1 ? <em key={i} style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{part}</em> : part
  );
}

function tripDestAbbr(title: string): { dest: string; name: string } {
  const parts = title.split(/\s*[·/]\s*|\s+/);
  const dest = (parts[0] ?? title).slice(0, 3).toUpperCase();
  const name = parts.slice(1).join(' ').trim() || parts[0];
  return { dest, name };
}

export default function HomeGreeting({
  nextTrip, weightLogs, financeD,
}: {
  nextTrip: Trip | null;
  weightLogs: WeightLog[];
  financeD?: number | null;
}) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [persona] = useState(() => getRandomPersona());
  const [statusLine, setStatusLine] = useState('');

  useEffect(() => {
    const parts: string[] = [];
    if (weightLogs[0]) parts.push(`${weightLogs[0].value} KG`);
    if (financeD != null) parts.push(`${financeD.toFixed(2)}M`);
    if (nextTrip) {
      const icon = nextTrip.transport ? transportIcons(nextTrip.transport) : '🧳';
      const { dest, name } = tripDestAbbr(nextTrip.title);
      parts.push(`${icon} ${dest} · ${name} · ${nextTrip.daysTo}d`);
    }
    setStatusLine(parts.join(' · '));
  }, [weightLogs, nextTrip, financeD]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 400, fontSize: 30, lineHeight: 1.15, color: 'var(--text)', letterSpacing: '-.01em' }}>
        {'g. '}
        <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{getGreeting()}</em>
        {', '}
        <a href={personaSearchUrl(persona)} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text2)', fontWeight: 300, textDecoration: 'none', borderBottom: '.5px solid var(--border-subtle)' }}
        >{persona}</a>
        {'.'}
      </div>
      {statusLine && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 12 }}>
          {statusLine}
        </div>
      )}
      <div style={{ marginTop: 20, fontFamily: 'var(--font-syne)', fontWeight: 300, fontSize: 14, lineHeight: 1.6, color: 'var(--text2)', letterSpacing: '.01em', paddingLeft: 10, borderLeft: '1.5px solid var(--gold-ring)' }}>
        {renderQuote(quote)}
      </div>
    </div>
  );
}
