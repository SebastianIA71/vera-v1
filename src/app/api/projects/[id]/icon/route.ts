import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado (usa JPG, PNG, GIF o WEBP)' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Máximo 5MB' }, { status: 400 });
  }

  const token = process.env.BLOB_PUBLIC_TOKEN_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Configura BLOB_PUBLIC_TOKEN en Vercel (Blob Store público)' }, { status: 503 });
  }

  const [existing] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  try {
    const { put, del } = await import('@vercel/blob');
    const blob = await put(`projects/${projectId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token,
    });

    if (existing.iconUrl) {
      await del(existing.iconUrl, { token }).catch(() => {});
    }

    const [row] = await db.update(projects)
      .set({ iconUrl: blob.url, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error('[project icon upload]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);

  const [existing] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const token = process.env.BLOB_PUBLIC_TOKEN_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (token && existing.iconUrl) {
    const { del } = await import('@vercel/blob');
    await del(existing.iconUrl, { token }).catch(() => {});
  }

  const [row] = await db.update(projects)
    .set({ iconUrl: null, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return NextResponse.json(row);
}
