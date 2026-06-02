/**
 * Auto-migrations — columnas añadidas post-setup inicial.
 * Cada ALTER TABLE está protegido con try/catch: si la columna
 * ya existe (la DB está al día) falla silenciosamente.
 * Para añadir futuras migraciones: añadir un bloque más abajo.
 */
import { createClient } from '@libsql/client';

export async function runAutoMigrations(): Promise<void> {
  const url   = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) return; // build-time / test — sin credenciales

  const client = createClient({ url, authToken: token });

  const migrations: { id: string; sql: string }[] = [
    {
      id:  'tasks.project_id',
      sql: 'ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id)',
    },
  ];

  for (const m of migrations) {
    try {
      await client.execute(m.sql);
      console.log(`[migrate] ✓ ${m.id}`);
    } catch {
      // Columna ya existe — OK
    }
  }

  await client.close();
}
