import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attachments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(attachments).where(eq(attachments.id, Number(id))).limit(1);
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Borrar de Vercel Blob si está configurado
  const token = process.env.BLOB_PUBLIC_TOKEN_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { del } = await import('@vercel/blob');
    await del(row.url, { token }).catch(() => {});
  }

  await db.delete(attachments).where(eq(attachments.id, Number(id)));
  return NextResponse.json({ ok: true });
}
