import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { db } from '@/lib/db';
import { auth } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');
const SESSION_DURATION = 60 * 60 * 24 * 30;
const MAX_ATTEMPTS = 3;
const LOCKOUT_BASE_MS = 5 * 60 * 1000; // 5 min base

export async function POST(req: NextRequest) {
  const { pinHash } = await req.json();

  if (!pinHash) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const [authRow] = await db.select().from(auth).where(eq(auth.id, 1)).limit(1);
  if (!authRow) {
    return NextResponse.json({ error: 'Sistema no configurado' }, { status: 404 });
  }

  // Lockout check
  if (authRow.lockedUntil && authRow.lockedUntil > new Date()) {
    const retryAfter = Math.ceil((authRow.lockedUntil.getTime() - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Bloqueado', retryAfter },
      { status: 429 }
    );
  }

  const valid = await bcrypt.compare(pinHash, authRow.pinHash);

  if (!valid) {
    const attempts = (authRow.failedAttempts ?? 0) + 1;
    const lockedUntil =
      attempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_BASE_MS * Math.pow(2, attempts - MAX_ATTEMPTS))
        : null;

    await db
      .update(auth)
      .set({ failedAttempts: attempts, lockedUntil })
      .where(eq(auth.id, 1));

    return NextResponse.json(
      { error: 'PIN incorrecto', attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts) },
      { status: 401 }
    );
  }

  // Reset failed attempts
  await db.update(auth).set({ failedAttempts: 0, lockedUntil: null }).where(eq(auth.id, 1));

  const token = await new SignJWT({ sub: '1' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SESSION_SECRET);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('vera_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });

  return res;
}
