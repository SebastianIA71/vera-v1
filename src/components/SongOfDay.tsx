'use client';

import { useEffect, useState, useCallback } from 'react';

type Song = { title: string; artist: string; reason: string; feedback?: 'ok' | 'ko' | null };
type State = 'loading' | 'ok' | 'error';

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export default function SongOfDay({ compact = false }: { compact?: boolean }) {
  const [song, setSong]     = useState<Song | null>(null);
  const [state, setState]   = useState<State>('loading');
  const [voting, setVoting] = useState(false);
  const [retries, setRetries] = useState(0);

  const load = useCallback(() => {
    setState('loading');
    fetch('/api/song-of-day')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setState('error'); return; }
        setSong(d);
        setState('ok');
      })
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
    } finally {
      setVoting(false);
    }
  }, [song, voting]);

  const spotifyUrl = song
    ? `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`
    : '#';

  const voted = song?.feedback;
  const borderColor = voted === 'ok' ? 'var(--green)' : voted === 'ko' ? 'var(--red)' : 'var(--bg4)';

  // — WRAPPER siempre visible —
  return (
    <div style={{ marginBottom: compact ? 12 : 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>♫</span>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: compact ? 11 : 13, letterSpacing: '.18em', color: 'var(--text3)', textTransform: 'uppercase' }}>
            Canción del día
          </span>
        </div>
        {voted && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: voted === 'ok' ? 'var(--green)' : 'var(--text3)' }}>
            {voted === 'ok' ? 'Te ha gustado ✓' : 'Anotado —'}
          </span>
        )}
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg2)', border: `.5px solid ${state === 'ok' ? borderColor : 'var(--bg4)'}`,
        borderRadius: compact ? 8 : 12,
        padding: compact ? '10px 12px' : '13px 14px',
        transition: 'border-color .2s',
        minHeight: compact ? 64 : 80,
      }}>
        {/* Loading */}
        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div className="skeleton" style={{ height: compact ? 12 : 14, width: '65%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
              <div className="skeleton" style={{ flex: 1, height: 30, borderRadius: 8 }} />
              <div className="skeleton" style={{ flex: 1, height: 30, borderRadius: 8 }} />
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text4)' }}>
              Sin sugerencia disponible
            </span>
            <button
              onClick={() => setRetries(r => r + 1)}
              style={{ background: 'none', border: '.5px solid var(--bg4)', borderRadius: 6, padding: '4px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--text3)', cursor: 'pointer' }}
            >
              ↻
            </button>
          </div>
        )}

        {/* Canción */}
        {state === 'ok' && song && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: compact ? 13 : 15, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.title}
                </div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: compact ? 11 : 12, color: 'var(--text2)', marginTop: 2 }}>
                  {song.artist}
                </div>
                {song.reason && (
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 10, color: 'var(--text4)', letterSpacing: '.08em', marginTop: 5, lineHeight: 1.4 }}>
                    {song.reason}
                  </div>
                )}
              </div>

              {/* Spotify */}
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: '#1DB954', color: '#000', textDecoration: 'none', transition: 'opacity .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                title={`Abrir "${song.title}" en Spotify`}
              >
                <SpotifyIcon />
              </a>
            </div>

            {/* Votar / Resultado */}
            {!voted ? (
              <div style={{ display: 'flex', gap: 7 }}>
                <button
                  onClick={() => vote('ok')} disabled={voting}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: voting ? 'default' : 'pointer', border: '.5px solid var(--green)', background: 'transparent', color: 'var(--green)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', transition: 'background .15s', opacity: voting ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!voting) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(78,203,141,.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  👍 OK
                </button>
                <button
                  onClick={() => vote('ko')} disabled={voting}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: voting ? 'default' : 'pointer', border: '.5px solid var(--bg4)', background: 'transparent', color: 'var(--text3)', fontFamily: 'var(--font-dm-mono)', fontSize: 11, letterSpacing: '.14em', transition: 'all .15s', opacity: voting ? 0.5 : 1 }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; if (!voting) { b.style.borderColor = 'var(--red)'; b.style.color = 'var(--red)'; } }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--bg4)'; b.style.color = 'var(--text3)'; }}
                >
                  👎 KO
                </button>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text4)', letterSpacing: '.12em', textAlign: 'center' }}>
                {voted === 'ok' ? '¡Perfecto! Más como esta mañana.' : 'Entendido, mañana algo diferente.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
