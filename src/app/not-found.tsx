import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 64, color: 'var(--gold2)', lineHeight: 1 }}>✦</div>
      <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 20, color: 'var(--text)', letterSpacing: '-.01em' }}>
        404 · <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Esta página no existe</em>
      </div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '.18em' }}>
        LA RUTA SOLICITADA NO SE ENCONTRÓ
      </div>
      <Link href="/" style={{
        marginTop: 8, padding: '10px 24px', border: '.5px solid var(--gold2)',
        borderRadius: 999, fontFamily: 'var(--font-dm-mono)', fontSize: 11,
        letterSpacing: '.2em', color: 'var(--gold2)', textDecoration: 'none',
      }}>
        IR AL INICIO →
      </Link>
    </div>
  );
}
