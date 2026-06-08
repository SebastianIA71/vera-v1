import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { db } from '@/lib/db';
import { auth } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateRequest } from '@/lib/validation/validate';
import { authSetupSchema } from '@/lib/validation/schemas';

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(req: NextRequest) {
  // Validar request
  const body = await validateRequest(req, authSetupSchema);
  if (body instanceof NextResponse) return body;

  const { pinHash, pinSalt } = body;

  const existing = await db.select().from(auth).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'PIN ya configurado' }, { status: 409 });
  }

  // Store the bcrypt hash of (clientHash + serverSalt) for extra layer
  const serverSalt = await bcrypt.genSalt(10);
  const finalHash = await bcrypt.hash(pinHash, serverSalt);

  await db.insert(auth).values({
    id: 1,
    pinHash: finalHash,
    pinSalt,
    role: 'admin', // El primer usuario es admin por defecto
  });

  // Incluir rol en el JWT
  const token = await new SignJWT({ sub: '1', role: 'admin' })
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
  res.cookies.set('vera_setup', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 años — persiste para siempre
    path: '/',
  });

  return res;
}
