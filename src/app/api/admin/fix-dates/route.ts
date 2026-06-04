import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { lt, eq } from 'drizzle-orm';

// Temporal admin endpoint para arreglar fechas incorrectas (año 1993)
// URL: POST /api/admin/fix-dates?key=ADMIN_SECRET_KEY
export async function POST(req: NextRequest) {
  const adminKey = req.nextUrl.searchParams.get('key');
  const expectedKey = process.env.ADMIN_FIX_KEY || 'fix-vera-1993';

  if (adminKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Encontrar todas las tareas con año < 2000 (obviamente incorrectas)
  const now = new Date();
  const year2000 = new Date('2000-01-01').getTime();

  const badTasks = await db
    .select()
    .from(tasks)
    .where(lt(tasks.createdAt, new Date(year2000)));

  if (badTasks.length === 0) {
    return NextResponse.json({ fixed: 0, message: 'No incorrect dates found' });
  }

  // Reparar: asignar hoy como fecha de creación
  const fixed = await Promise.all(
    badTasks.map(task =>
      db
        .update(tasks)
        .set({ createdAt: now, updatedAt: now })
        .where(eq(tasks.id, task.id))
        .catch(() => null)
    )
  );

  return NextResponse.json({
    fixed: fixed.filter(Boolean).length,
    tasks: badTasks.map(t => ({ id: t.id, title: t.title, oldDate: t.createdAt })),
  });
}
