import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { getRpIdFromReq, getOriginFromReq } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const credentials = await db.select({
      credentialId: webauthnCredentials.credentialId,
    }).from(webauthnCredentials);

    if (credentials.length === 0) {
      return NextResponse.json({ error: 'Sin credenciales registradas' }, { status: 404 });
    }

    const rpID = getRpIdFromReq(req);
    console.log('[auth-options] rpID:', rpID, '| credentials:', credentials.length);

    const options = await generateAuthenticationOptions({
      rpID,
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
    res.cookies.set('webauthn_origin', getOriginFromReq(req), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('[auth-options] error:', err);
    return NextResponse.json({ error: `Auth options error: ${String(err)}` }, { status: 500 });
  }
}
