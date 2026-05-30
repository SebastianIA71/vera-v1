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

export function getExpectedOrigin(): string {
  const rpId = process.env.WEBAUTHN_RP_ID ?? 'localhost';
  if (rpId === 'localhost') return 'http://localhost:3000';
  return `https://${rpId}`;
}
