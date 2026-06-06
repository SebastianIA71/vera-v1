'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function ShareReceiver() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'done' | 'error'>('processing');

  useEffect(() => {
    const title = params.get('title') ?? '';
    const text  = params.get('text')  ?? '';
    const url   = params.get('url')   ?? '';

    const content = [title, text, url].filter(Boolean).join('\n').trim();
    if (!content) { router.replace('/inbox'); return; }

    fetch('/api/inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.slice(0, 1000),
        source: 'share',
        sourceUrl: url || null,
        type: 'raw',
      }),
    })
      .then(r => { setStatus(r.ok ? 'done' : 'error'); })
      .catch(() => setStatus('error'))
      .finally(() => setTimeout(() => router.replace('/inbox'), 1400));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100dvh', gap: 12,
      background: 'var(--bg)',
    }}>
      {status === 'processing' && (
        <span style={{ color: 'var(--gold2)', fontFamily: 'DM Mono', fontSize: 24, letterSpacing: '.2em' }}>···</span>
      )}
      {status === 'done' && (
        <>
          <span style={{ color: 'var(--green)', fontSize: 48, lineHeight: 1 }}>✦</span>
          <span style={{ color: 'var(--text)', fontFamily: 'Syne', fontSize: 20, fontWeight: 600 }}>Capturado</span>
          <span style={{ color: 'var(--text2)', fontFamily: 'DM Mono', fontSize: 11, letterSpacing: '.15em' }}>→ inbox</span>
        </>
      )}
      {status === 'error' && (
        <>
          <span style={{ color: 'var(--red)', fontFamily: 'Syne', fontSize: 18 }}>Error al capturar</span>
          <span style={{ color: 'var(--text2)', fontFamily: 'DM Mono', fontSize: 11 }}>Reintenta desde el inbox</span>
        </>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--gold2)', fontFamily: 'DM Mono', letterSpacing: '.2em' }}>···</span>
      </div>
    }>
      <ShareReceiver />
    </Suspense>
  );
}
