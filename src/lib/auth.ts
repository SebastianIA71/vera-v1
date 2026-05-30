import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

// Dominio de producción fijo — app de un solo usuario
const PROD_RP_ID = 'vera-v1-bhxy.vercel.app';
const PROD_ORIGIN = 'https://vera-v1-bhxy.vercel.app';

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

export function getRpId(): string {
  return process.env.WEBAUTHN_RP_ID ?? PROD_RP_ID;
}

export function getExpectedOrigin(): string {
  const envRpId = process.env.WEBAUTHN_RP_ID;
  if (envRpId) return envRpId === 'localhost' ? 'http://localhost:3000' : `https://${envRpId}`;
  // Fallback hardcodeado — por si la env var no está configurada en Vercel
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : PROD_ORIGIN;
}
