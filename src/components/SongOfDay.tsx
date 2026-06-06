'use client';

import { useEffect, useState, useCallback } from 'react';

type Song = { title: string; artist: string; reason: string; feedback?: 'ok' | 'ko' | null };
type State = 'loading' | 'ok' | 'error';

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export default function SongOfDay({ compact = false }: { compact?: boolean }) {
  const [song, setSong]       = useState<Song | null>(null);
  const [state, setState]     = useState<State>('loading');
  const [voting, setVoting]   = useState(false);
  const [retries, setRetries] = useState(0);

  const load = useCallback(() => {
    setState('loading');
    fetch('/api/song-of-day')
      .then(r => r.json())
      .then(d => { if (d.error) { setState('error'); } else { setSong(d); setState('ok'); } })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => { load(); }, [load, retries]);

  const vote = useCallback(async (feedback: 'ok' | 'ko') => {
    if (!song || voting || song.feedback) return;
    setVoting(true);
    try {
      await fetch('/api/song-of-day/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      setSong(s => s ? { ...s, feedback } : s);
    } finally { setVoting(false); }
  }, [song, voting]);

  const spotifyUrl = song
    ? `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`
    : '#';

  const voted = song?.feedback;

  const ROW: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: compact ? 10 : 14,
    minHeight: 28,
  };

  // Loading — una línea con skeleton
  if (state === 'loading') {
    return (
      <div style={ROW}>
        <span style={{ fontSize: 11, color: 'var(--text4)' }}>♫</span>
        <div className="skeleton" style={{ height: 11, width: 140, borderRadius: 4, flex: '0 0 auto' }} />
        <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 4, flex: '0 0 auto' }} />
      </div>
    );
  }

  // Error — una línea mínima
  if (state === 'error') {
    return (
      <div style={ROW}>
        <span style={{ fontSize: 11, color: 'var(--text4)' }}>♫</span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--text4)', flex: 1 }}>
          Sin canción hoy
        </span>
        <button onClick={() => setRetries(r => r + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', fontSize: 13, padding: '0 2px', lineHeight: 1 }}>↻</button>
      </div>
    );
  }

  // OK — una sola línea
  return (
    <div style={ROW}>
      {/* ♫ icono */}
      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>♫</span>

      {/* Título · Artista */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 5, overflow: 'hidden' }}>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: compact ? 12 : 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
          {song?.title}
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {song?.artist}
        </span>
      </div>

      {/* Spotify */}
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: '#1DB954', color: '#000', textDecoration: 'none', opacity: 0.9 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
        title={`${song?.title} en Spotify`}
      >
        <SpotifyIcon />
      </a>

      {/* Votos */}
      {!voted ? (
        <>
          <button onClick={() => vote('ok')} disabled={voting} title="Me gusta" style={{ background: 'none', border: 'none', cursor: voting ? 'default' : 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1, opacity: voting ? 0.4 : 0.7, transition: 'opacity .15s', flexShrink: 0 }}
            onMouseEnter={e => { if (!voting) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
          >👍</button>
          <button onClick={() => vote('ko')} disabled={voting} title="No me gusta" style={{ background: 'none', border: 'none', cursor: voting ? 'default' : 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1, opacity: voting ? 0.4 : 0.7, transition: 'opacity .15s', flexShrink: 0 }}
            onMouseEnter={e => { if (!voting) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
          >👎</button>
        </>
      ) : (
        <span style={{ fontSize: 13, flexShrink: 0 }}>{voted === 'ok' ? '👍' : '👎'}</span>
      )}
    </div>
  );
}
