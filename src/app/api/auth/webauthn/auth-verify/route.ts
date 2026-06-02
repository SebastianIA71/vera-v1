import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { SignJWT } from 'jose';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRpIdFromReq, getOriginFromReq } from '@/lib/auth';

// base64url → Uint8Array
function safeToBuffer(base64url: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(base64url, 'base64url');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) as Uint8Array<ArrayBuffer>;
}

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');
const SESSION_DURATION = 60 * 60 * 24 * 30;

export async function POST(req: NextRequest) {
  const challenge = req.cookies.get('webauthn_challenge')?.value;
  if (!challenge) return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });

  // Usar el origin guardado en cookie (fijado en auth-options) para máxima consistencia.
  // Si no existe la cookie, derivar del request actual.
  const expectedOrigin = req.cookies.get('webauthn_origin')?.value || getOriginFromReq(req);
  const expectedRPID   = getRpIdFromReq(req);

  const body = await req.json();
  const credentialIdB64 = body.id;

  const [cred] = await db.select()
    .from(webauthnCredentials)
    .where(eq(webauthnCredentials.credentialId, credentialIdB64))
    .limit(1);

  if (!cred) return NextResponse.json({ error: 'Credencial no encontrada' }, { status: 404 });

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: cred.credentialId,
        publicKey: safeToBuffer(cred.publicKey),
        counter: cred.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verificación fallida' }, { status: 401 });
    }

    await db.update(webauthnCredentials)
      .set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() })
      .where(eq(webauthnCredentials.credentialId, credentialIdB64));

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
    res.cookies.delete('webauthn_challenge');
    res.cookies.delete('webauthn_origin');
    return res;
  } catch (err) {
    console.error('WebAuthn auth error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
