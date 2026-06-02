import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { getRpIdFromReq, getOriginFromReq } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const credentials = await db.select({
    credentialId: webauthnCredentials.credentialId,
  }).from(webauthnCredentials);

  if (credentials.length === 0) {
    return NextResponse.json({ error: 'Sin credenciales registradas' }, { status: 404 });
  }

  const rpID = getRpIdFromReq(req);

  // No usamos allowCredentials para evitar problemas de ID matching con iCloud Keychain.
  // El browser presentará todos los passkeys disponibles para este rpID.
  // auth-verify busca el credential por ID después de que el browser lo devuelva.
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
  });

  const res = NextResponse.json(options);
  res.cookies.set('webauthn_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });
  // Guardar origin fijado en este momento para que auth-verify lo use consistentemente
  res.cookies.set('webauthn_origin', getOriginFromReq(req), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });
  return res;
}
