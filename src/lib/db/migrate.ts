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
    {
      id:  'create.finance_records',
      sql: `CREATE TABLE IF NOT EXISTS finance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        vb REAL DEFAULT 0, xc REAL DEFAULT 0, ps REAL DEFAULT 0, pm REAL DEFAULT 0,
        lf REAL DEFAULT 0, rs REAL DEFAULT 0, gh REAL DEFAULT 0, mh REAL DEFAULT 0,
        doo REAL DEFAULT 0, mo REAL DEFAULT 0, so REAL DEFAULT 0,
        x1 REAL DEFAULT 0, x2 REAL DEFAULT 0, x3 REAL DEFAULT 0,
        x4 REAL DEFAULT 0, x5 REAL DEFAULT 0, x6 REAL DEFAULT 0,
        calc_a REAL, calc_b REAL, calc_c REAL, calc_d REAL, calc_e REAL,
        created_at INTEGER, updated_at INTEGER
      )`,
    },
    {
      id:  'create.expenses',
      sql: `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id TEXT REFERENCES properties(id),
        project_id INTEGER REFERENCES projects(id),
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'otro',
        date TEXT NOT NULL,
        created_at INTEGER
      )`,
    },
    {
      id:  'create.attachments',
      sql: `CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL REFERENCES tasks(id),
        url TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER,
        created_at INTEGER
      )`,
    },
    {
      id:  'events.google_event_id',
      sql: 'ALTER TABLE events ADD COLUMN google_event_id TEXT',
    },
    {
      id:  'tasks.recurrence',
      sql: 'ALTER TABLE tasks ADD COLUMN recurrence TEXT',
    },
    {
      id:  'tasks.recurrence_interval',
      sql: 'ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER',
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
