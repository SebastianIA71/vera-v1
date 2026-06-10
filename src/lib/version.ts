// Versión semántica — formato 2.x (x = sprint/fase, SHA = 3 chars)
// Incrementar x al arrancar cada nueva fase del plan de acción
const SEMVER = '2.7';

// SHA corto del commit — Vercel lo inyecta en build time automáticamente
// En local aparece como 'dev'
const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 2) ?? 'dev';

export const APP_VERSION = `v${SEMVER}.${sha}`;
