// Cache name para Service Worker — cambia automáticamente con versión
// Formato: vera-v1-56 (donde 56 es la versión)
export const SW_CACHE_NAME = `vera-v${process.env.NEXT_PUBLIC_SEMVER?.replace(/\./g, '-') ?? 'dev'}`;
