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

export default function HomeGreeting({ nextTrip, weightLogs }: { nextTrip: Trip | null; weightLogs: WeightLog[] }) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [persona] = useState(() => getRandomPersona());
  const [statusLine, setStatusLine] = useState('');
  const [transportEmojis, setTransportEmojis] = useState('');

  useEffect(() => {
    const parts: string[] = [];
    if (weightLogs[0]) parts.push(`${weightLogs[0].value} KG`);
    parts.push('10,2K');
    if (nextTrip) {
      setTransportEmojis(nextTrip.transport ? transportIcons(nextTrip.transport) : '');
      const dur = nextTrip.endDate && nextTrip.startDate
        ? Math.ceil((new Date(nextTrip.endDate).getTime() - new Date(nextTrip.startDate).getTime()) / 86400000)
        : null;
      parts.push(`${nextTrip.title.toUpperCase()} · ${nextTrip.daysTo}D${dur ? ` · ${dur}D` : ''}`);
    } else {
      setTransportEmojis('');
    }
    setStatusLine(parts.join(' · '));
  }, [weightLogs, nextTrip]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--text2)', marginTop: 12 }}>
          {transportEmojis && <span style={{ fontSize: 14, lineHeight: 1 }}>{transportEmojis}</span>}
          <span>{statusLine}</span>
        </div>
      )}
      <div style={{ marginTop: 20, fontFamily: 'var(--font-syne)', fontWeight: 300, fontSize: 14, lineHeight: 1.6, color: 'var(--text2)', letterSpacing: '.01em', paddingLeft: 10, borderLeft: '1.5px solid var(--gold-ring)' }}>
        {renderQuote(quote)}
      </div>
    </div>
  );
}
