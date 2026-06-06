'use client';

export default function SectionLabel({
  label, color, meta, link, onLinkClick,
}: {
  label: string; color?: string; meta?: string; link?: string; onLinkClick?: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 500, fontSize: 15, letterSpacing: '.22em', color: color ?? 'var(--gold2)', textTransform: 'uppercase' }}>
        {label}
      </span>
      {meta && <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text4)', letterSpacing: '.12em' }}>{meta}</span>}
      {link && (
        <button onClick={onLinkClick} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.1em' }}>
          {link}
        </button>
      )}
    </div>
  );
}
