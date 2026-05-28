import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Public endpoint — returns only the salt (not the hash)
// Needed by the client to reconstruct the hash before sending to /login
export async function GET() {
  const [authRow] = await db.select({ pinSalt: auth.pinSalt }).from(auth).where(eq(auth.id, 1)).limit(1);

  if (!authRow) {
    return NextResponse.json({ error: 'No configurado' }, { status: 404 });
  }

  return NextResponse.json({ pinSalt: authRow.pinSalt });
}
