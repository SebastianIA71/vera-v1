'use client';

const APP_VERSION = 'v.29';

export default function MobilePageHeader({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 22px 12px', borderBottom: '.5px solid var(--bg4)', flexShrink: 0,
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: 13,
        letterSpacing: '.3em', color: 'var(--gold2)',
      }}>
        <svg width={9} height={9} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z" fill="#c4a86a"/>
        </svg>
        VERA
        <span style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: 11,
          letterSpacing: '.12em', color: 'var(--gold2)', fontWeight: 400,
        }}>
          {APP_VERSION}
        </span>
      </span>
      <span style={{
        fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15,
        color: 'var(--text)', letterSpacing: '-.01em',
      }}>
        {title}
      </span>
    </div>
  );
}
