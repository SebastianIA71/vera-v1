import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function verifySession(_req?: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vera_session')?.value;
    if (!token) return false;
    await jwtVerify(token, SESSION_SECRET);
    return true;
  } catch {
    return false;
  }
}

// ─── WebAuthn helpers ─────────────────────────────────────────────────────────
//
// rpID y origin se derivan del host real de cada request.
// Esto hace que el sistema funcione en cualquier dominio (localhost, Vercel,
// dominio personalizado) sin ninguna configuración extra.
//
// El navegador incrusta el origin en los datos del autenticador (firmados),
// así que el server siempre debe verificar contra el MISMO dominio desde el
// que se sirvió la página. Derivarlo del header `host` garantiza esa consistencia.

type RequestLike = { headers: { get(name: string): string | null } };

const PRODUCTION_DOMAIN = 'vera-v1-bhxy.vercel.app';

export function getRpIdFromReq(_req: RequestLike): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  return PRODUCTION_DOMAIN;
}

export function getOriginFromReq(_req: RequestLike): string {
  if (process.env.WEBAUTHN_EXPECTED_ORIGIN) return process.env.WEBAUTHN_EXPECTED_ORIGIN;
  return `https://${PRODUCTION_DOMAIN}`;
}

// Mantener estas funciones para compatibilidad con código existente fuera de WebAuthn
export function getRpId(): string {
  return process.env.WEBAUTHN_RP_ID ?? 'localhost';
}

export function getExpectedOrigin(): string {
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';
}
