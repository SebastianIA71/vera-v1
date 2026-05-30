import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';

export async function GET() {
  const credentials = await db.select({
    credentialId: webauthnCredentials.credentialId,
  }).from(webauthnCredentials);

  if (credentials.length === 0) {
    return NextResponse.json({ error: 'Sin credenciales registradas' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: process.env.WEBAUTHN_RP_ID ?? 'localhost',
    userVerification: 'required',
    allowCredentials: credentials.map(c => ({
      id: c.credentialId,
      type: 'public-key' as const,
    })),
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
