import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { verifySession, getExpectedOrigin } from '@/lib/auth';

// isoBase64URL.fromBuffer equivalent — normaliza Uint8Array antes de codificar
// new Uint8Array(buffer) evita problemas de offset/byteOffset en vistas parciales
function safeFromBuffer(buffer: Uint8Array): string {
  return Buffer.from(new Uint8Array(buffer)).toString('base64url');
}

export async function POST(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const challenge = req.cookies.get('webauthn_challenge')?.value;
  if (!challenge) return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });

  const body = await req.json();

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: process.env.WEBAUTHN_RP_ID ?? 'localhost',
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await db.insert(webauthnCredentials).values({
      credentialId: credential.id,                    // ya es string base64url en v13
      publicKey:    safeFromBuffer(credential.publicKey), // Uint8Array → base64url seguro
      counter:      credential.counter,
      deviceName:   body.deviceName ?? 'iPhone',
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.delete('webauthn_challenge');
    return res;
  } catch (err) {
    console.error('WebAuthn register error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
