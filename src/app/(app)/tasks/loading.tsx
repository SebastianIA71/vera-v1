export default function Loading() {
  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', height: '100vh' }}>
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 14, color: 'var(--gold2)', letterSpacing: '.2em' }}>···</span>
    </div>
  );
}
