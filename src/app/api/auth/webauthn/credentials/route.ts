import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webauthnCredentials } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth';

// GET — listar credenciales registradas (sin clave pública)
export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const creds = await db.select({
    id:         webauthnCredentials.id,
    deviceName: webauthnCredentials.deviceName,
    createdAt:  webauthnCredentials.createdAt,
    lastUsedAt: webauthnCredentials.lastUsedAt,
  }).from(webauthnCredentials);

  return NextResponse.json(creds);
}

// DELETE — borrar TODAS las credenciales para re-registrar
export async function DELETE(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await db.delete(webauthnCredentials);
  return NextResponse.json({ ok: true });
}
