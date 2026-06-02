/**
 * Next.js instrumentation — se ejecuta UNA VEZ al arrancar el servidor,
 * antes de servir cualquier request. Perfecto para migraciones de DB.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runAutoMigrations } = await import('./lib/db/migrate');
    await runAutoMigrations();
  }
}
