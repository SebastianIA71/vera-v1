'use client';

import { useEffect, useState } from 'react';

type InsightData = {
  taskTitle: string;
  taskPrio: number;
  query: string;
  result: {
    mode: string;
    results?: { title: string; url: string; description: string; summary?: string }[];
    notice?: string;
  };
  date: string;
} | null;

export default function DailyInsight() {
  const [data, setData] = useState<InsightData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-insight')
      .then(r => r.json())
      .then(d => { setData(d.insight === null ? null : d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: '14px 0', fontFamily: 'var(--font-dm-mono)', fontSize: 9,
      letterSpacing: '.18em', color: 'var(--text3)' }}>
      BUSCANDO ALTERNATIVA···
    </div>
  );

  if (!data || !data.result || data.result.mode === 'no_search') return null;

  const results = data.result.results ?? [];
  if (results.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15,
          letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase' }}>
          Daily Find
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9,
          color: 'var(--text3)', letterSpacing: '.1em' }}>HOY</span>
      </div>

      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)',
        borderRadius: 14, padding: '14px 14px 10px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
          paddingBottom: 10, borderBottom: '.5px solid var(--bg4)' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8,
            letterSpacing: '.1em', color: 'var(--text3)', flexShrink: 0 }}>ALTERNATIVA A</span>
          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12,
            color: 'var(--text)', flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.taskTitle}
          </span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11,
            color: 'var(--text3)', flexShrink: 0 }}>{data.taskPrio}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.slice(0, 3).map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12,
                color: 'var(--text)', marginBottom: 2, lineHeight: 1.3 }}>
                {r.title}
              </div>
              {r.summary && (
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11,
                  color: 'var(--text3)', lineHeight: 1.4 }}>
                  {r.summary}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8,
                color: 'var(--blue)', letterSpacing: '.06em', marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.url.replace(/^https?:\/\//, '').split('/')[0]}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
