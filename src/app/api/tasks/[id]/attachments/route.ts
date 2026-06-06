import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attachments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(attachments)
    .where(eq(attachments.taskId, Number(id)))
    .orderBy(desc(attachments.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN no configurado' }, { status: 503 });
  }

  const { put } = await import('@vercel/blob');
  const blob = await put(`tasks/${taskId}/${file.name}`, file, {
    access: 'public',
    token,
  });

  const [row] = await db.insert(attachments).values({
    taskId,
    url: blob.url,
    filename: file.name,
    mimeType: file.type || null,
    sizeBytes: file.size || null,
    createdAt: new Date(),
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
