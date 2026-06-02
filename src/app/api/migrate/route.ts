import { NextResponse } from 'next/server';
import { runAutoMigrations } from '@/lib/db/migrate';

// Llamar una vez tras un deploy si las migraciones no se aplicaron solas:
// GET /api/migrate
export async function GET() {
  try {
    await runAutoMigrations();
    return NextResponse.json({ ok: true, message: 'Migraciones aplicadas' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
