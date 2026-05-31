'use client';

import { useEffect, useState } from 'react';

type Idea = { title: string; url?: string; description: string };
type InsightData = {
  taskTitle: string | null;
  taskPrio: number;
  mode: 'search' | 'ai' | 'no_tasks';
  ideas: Idea[];
  date: string;
} | null;

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13,
        color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>
        {idea.title}
      </div>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11,
        color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
        {idea.description}
      </div>
      {idea.url && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8,
          color: 'var(--blue)', letterSpacing: '.06em', marginTop: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {idea.url.replace(/^https?:\/\//, '').split('/')[0]}
        </div>
      )}
    </div>
  );
}

export default function DailyInsight() {
  const [data, setData] = useState<InsightData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-insight')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15,
          letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase' }}>
          Daily Pick
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, color: 'var(--text3)', letterSpacing: '.1em' }}>
          {data?.date ?? ''}
          {data?.mode === 'ai' && ' · VERA'}
          {data?.mode === 'search' && ' · WEB'}
        </span>
      </div>

      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)',
        borderRadius: 14, padding: '14px 14px 12px' }}>

        {loading && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9,
            letterSpacing: '.18em', color: 'var(--text3)', padding: '8px 0' }}>
            BUSCANDO···
          </div>
        )}

        {!loading && (data?.mode === 'no_tasks' || !data) && (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10,
            color: 'var(--text3)', letterSpacing: '.1em', lineHeight: 1.5 }}>
            {data?.mode === 'no_tasks'
              ? 'No hay tareas pendientes en rango. Buen trabajo.'
              : 'No se ha podido generar el insight de hoy.'}
          </div>
        )}

        {!loading && data?.taskTitle && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 12, paddingBottom: 10, borderBottom: '.5px solid var(--bg4)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12,
                  color: 'var(--text)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {data.taskTitle}
                </span>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 8, letterSpacing: '.1em',
                  color: 'var(--text3)', marginTop: 2 }}>
                  PERSPECTIVAS PARA DECIDIR
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10,
                color: 'var(--text3)', flexShrink: 0 }}>p{data.taskPrio}</span>
            </div>

            {(data.ideas ?? []).length === 0 ? (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9,
                color: 'var(--text3)', letterSpacing: '.1em' }}>
                Sin resultados para esta búsqueda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(data.ideas ?? []).map((idea, i) => (
                  idea.url ? (
                    <a key={i} href={idea.url} target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration: 'none', display: 'block' }}>
                      <IdeaCard idea={idea} />
                    </a>
                  ) : (
                    <div key={i}><IdeaCard idea={idea} /></div>
                  )
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
