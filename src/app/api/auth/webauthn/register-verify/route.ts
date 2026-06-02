import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { verifySession, getRpIdFromReq, getOriginFromReq } from '@/lib/auth';

// isoBase64URL.fromBuffer equivalent — normaliza Uint8Array antes de codificar
function safeFromBuffer(buffer: Uint8Array): string {
  return Buffer.from(new Uint8Array(buffer)).toString('base64url');
}

export async function POST(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const challenge = req.cookies.get('webauthn_challenge')?.value;
  if (!challenge) return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });

  // Usar el origin guardado en cookie (fijado en register-options) para máxima consistencia.
  // Si no existe la cookie, derivar del request actual.
  const expectedOrigin = req.cookies.get('webauthn_origin')?.value || getOriginFromReq(req);
  const expectedRPID   = getRpIdFromReq(req);

  const body = await req.json();

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await db.insert(webauthnCredentials).values({
      credentialId: credential.id,
      publicKey:    safeFromBuffer(credential.publicKey),
      counter:      credential.counter,
      deviceName:   body.deviceName ?? 'iPhone',
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.delete('webauthn_challenge');
    res.cookies.delete('webauthn_origin');
    return res;
  } catch (err) {
    console.error('WebAuthn register error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
