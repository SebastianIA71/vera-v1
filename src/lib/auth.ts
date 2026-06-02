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

function hostFromReq(req: RequestLike): string {
  // `x-forwarded-host` lo añade Vercel cuando hay alias/edge; si no, `host` directo.
  const raw =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    '';
  // strip de puerto (RP ID no admite puerto)
  return raw.split(':')[0].toLowerCase();
}

function protoFromReq(req: RequestLike): string {
  return (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
}

export function getRpIdFromReq(req: RequestLike): string {
  // El env var sólo se usa si está configurado adrede para fijar un dominio canónico.
  // En su ausencia, derivamos del host real de la request — así el sistema funciona
  // en cualquier URL de Vercel (vera-v1.vercel.app, vera-v1-xxx.vercel.app, dominio
  // personalizado, localhost) sin tener que tocar código ni env vars.
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  return hostFromReq(req) || 'localhost';
}

export function getOriginFromReq(req: RequestLike): string {
  if (process.env.WEBAUTHN_EXPECTED_ORIGIN) return process.env.WEBAUTHN_EXPECTED_ORIGIN;
  const host = hostFromReq(req);
  if (!host) return 'http://localhost:3000';
  // localhost siempre http; resto https (Vercel siempre sirve sobre TLS)
  if (host === 'localhost' || host.startsWith('127.')) {
    const port = (req.headers.get('host') || '').split(':')[1];
    return `http://${host}${port ? ':' + port : ':3000'}`;
  }
  return `${protoFromReq(req)}://${host}`;
}

// Mantener estas funciones para compatibilidad con código existente fuera de WebAuthn
export function getRpId(): string {
  return process.env.WEBAUTHN_RP_ID ?? 'localhost';
}

export function getExpectedOrigin(): string {
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';
}
