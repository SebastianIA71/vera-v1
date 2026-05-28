import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

function createDb() {
  return drizzle(
    createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    { schema }
  );
}

type Db = ReturnType<typeof createDb>;
let _db: Db | undefined;

// Proxy defers createClient() to first request — never runs at build time
export const db: Db = new Proxy({} as Db, {
  get(_, key: string | symbol) {
    if (!_db) _db = createDb();
    return Reflect.get(_db, key);
  },
});
