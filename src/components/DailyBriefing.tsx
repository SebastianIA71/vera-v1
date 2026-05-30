'use client';

import { useEffect, useState } from 'react';

export default function DailyBriefing({ compact = false }: { compact?: boolean }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/briefing/morning')
      .then(r => r.json())
      .then(d => setBriefing(d.briefing ?? null))
      .catch(() => setBriefing(null))
      .finally(() => setLoading(false));
  }, []);

  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).toUpperCase();

  return (
    <div style={{ marginBottom: compact ? 16 : 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-syne)', fontWeight: 500,
          fontSize: compact ? 12 : 15,
          letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase',
        }}>
          Briefing
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.1em' }}>
          {dateLabel}
        </span>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '.5px solid var(--bg4)',
        borderLeft: '2px solid rgba(196,168,106,0.3)',
        borderRadius: compact ? 8 : 14,
        padding: compact ? '10px 12px' : '14px 16px',
      }}>
        {loading && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '.18em', color: 'var(--text3)' }}>
            GENERANDO···
          </div>
        )}

        {!loading && !briefing && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: '.1em' }}>
            Sin briefing disponible.
          </div>
        )}

        {!loading && briefing && (
          <div style={{
            fontFamily: 'var(--font-syne)', fontWeight: 400,
            fontSize: compact ? 11 : 13,
            lineHeight: 1.65, color: 'var(--text2)',
          }}>
            {briefing}
          </div>
        )}
      </div>
    </div>
  );
}
