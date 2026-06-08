import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export interface SessionData {
  sub: string;     // User ID (siempre '1' actualmente)
  role?: string;   // 'user' | 'admin'
}

/**
 * Verifica la sesión JWT desde la cookie en route handlers.
 * Retorna datos de la sesión o null si inválida/ausente.
 *
 * NOTA: El middleware.ts ya verifica sesión globalmente, así que
 * esta función es para verificaciones adicionales dentro de endpoints
 * o para compatibilidad con código existente.
 */
export async function verifySession(req?: Request): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vera_session')?.value;
    if (!token) return null;
    const verified = await jwtVerify(token, SESSION_SECRET);
    return verified.payload as SessionData;
  } catch {
    return null;
  }
}

/**
 * Para compatibilidad con código existente que espera boolean.
 * DEPRECADO — usar verifySession() que retorna SessionData | null.
 */
export async function verifySessionBool(_req?: Request): Promise<boolean> {
  return (await verifySession()) !== null;
}

/**
 * Extrae el token JWT desde el header Cookie.
 * Usado por middleware para verificar sesión sin acceso a cookies() API.
 */
export function extractSessionTokenFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/vera_session=([^;]+)/);
  return match ? match[1] : null;
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
