// Versión semántica — incrementar manualmente con cada release significativo
const SEMVER = '1.60';

// SHA corto del commit — Vercel lo inyecta en build time automáticamente
// En local aparece como 'dev'
const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 5) ?? 'dev';

export const APP_VERSION = `v.${SEMVER}.${sha}`;
