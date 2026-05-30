import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await verifySession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const existingCredentials = await db.select({
    credentialId: webauthnCredentials.credentialId,
  }).from(webauthnCredentials);

  const options = await generateRegistrationOptions({
    rpName: process.env.WEBAUTHN_RP_NAME ?? 'VERA',
    rpID: process.env.WEBAUTHN_RP_ID ?? 'localhost',
    userName: 'sebastian',
    userDisplayName: 'Sebastián',
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(c => ({
      id: c.credentialId,
      type: 'public-key' as const,
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required',
    },
  });

  const res = NextResponse.json(options);
  res.cookies.set('webauthn_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });
  return res;
}
