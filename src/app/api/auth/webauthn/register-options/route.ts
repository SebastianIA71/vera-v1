import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { verifySession, getRpIdFromReq, getOriginFromReq } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const rpID = getRpIdFromReq(req);

  const existingCredentials = await db.select({
    credentialId: webauthnCredentials.credentialId,
  }).from(webauthnCredentials);

  const options = await generateRegistrationOptions({
    rpName: process.env.WEBAUTHN_RP_NAME ?? 'VERA',
    rpID,
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
  // Guardar el origin esperado en cookie para usarlo en verify sin recalcular
  res.cookies.set('webauthn_origin', getOriginFromReq(req), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });
  return res;
}
