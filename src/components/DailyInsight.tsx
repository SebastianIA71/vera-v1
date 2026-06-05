'use client';

import { useEffect, useState, useCallback } from 'react';

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
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12,
        color: 'var(--text)', marginBottom: 2, lineHeight: 1.2, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {idea.title}
      </div>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 10,
        color: 'var(--text2)', lineHeight: 1.3, overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {idea.description}
      </div>
      {idea.url && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7,
          color: 'var(--blue)', letterSpacing: '.06em', marginTop: 1,
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

  const load = useCallback((force = false) => {
    setLoading(true);
    fetch(`/api/daily-insight${force ? '?force=1' : ''}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 13,
          letterSpacing: '.22em', color: 'var(--gold2)', textTransform: 'uppercase' }}>
          Pick
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 7, color: 'var(--text3)', letterSpacing: '.1em' }}>
            {data?.mode === 'ai' && 'VERA'}
            {data?.mode === 'search' && 'WEB'}
          </span>
          <button
            onClick={() => !loading && load(true)}
            title="Regenerar"
            style={{
              background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
              color: loading ? 'var(--text4)' : 'var(--text3)',
              fontFamily: 'var(--font-dm-mono)', fontSize: 10, lineHeight: 1,
              padding: 0, display: 'flex', alignItems: 'center',
              transition: 'color .15s',
            }}
          >
            {loading ? '···' : '↻'}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '.5px solid var(--bg4)',
        borderRadius: 10, padding: '10px 10px 8px' }}>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4,
              marginBottom: 8, paddingBottom: 6, borderBottom: '.5px solid var(--bg4)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11,
                  color: 'var(--text)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {data.taskTitle}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9,
                color: 'var(--text3)', flexShrink: 0 }}>p{data.taskPrio}</span>
            </div>

            {(data.ideas ?? []).length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9,
                  color: 'var(--text3)', letterSpacing: '.1em' }}>
                  Sin perspectivas.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
