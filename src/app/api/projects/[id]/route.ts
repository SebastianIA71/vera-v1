import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TIER_DAYS, type ObjectiveTier } from '@/lib/objectives';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, description, color, icon, status, isObjective, objectiveTier } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [existing] = await db.select().from(projects).where(eq(projects.id, Number(id))).limit(1);
  if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const now = new Date();
  const wantsObjective = !!isObjective && !!objectiveTier && objectiveTier in TIER_DAYS;

  const patch: Partial<typeof projects.$inferInsert> = {
    name:        name.trim(),
    description: description ?? null,
    color:       color       ?? null,
    icon:        icon        ?? null,
    status:      status      ?? 'active',
    updatedAt:   now,
  };

  if (!wantsObjective) {
    // Deja de ser objetivo (o nunca lo fue) — proyecto sin fecha final.
    patch.isObjective = false;
    patch.objectiveTier = null;
    patch.objectiveStartedAt = null;
    patch.objectiveOriginalStartAt = null;
    patch.objectiveRenewals = 0;
    patch.dueDate = null;
  } else if (!existing.isObjective || existing.objectiveTier !== objectiveTier) {
    // Se marca como objetivo por primera vez, o cambia de periodicidad → arranca un periodo nuevo.
    const periodDays = TIER_DAYS[objectiveTier as ObjectiveTier];
    patch.isObjective = true;
    patch.objectiveTier = objectiveTier;
    patch.objectiveOriginalStartAt = existing.objectiveOriginalStartAt ?? now;
    patch.objectiveStartedAt = now;
    patch.dueDate = new Date(now.getTime() + periodDays * 86400000);
    patch.objectiveRenewals = 0;
  }
  // Si sigue siendo objetivo con la misma periodicidad, no se tocan las
  // fechas — las gestiona renewOverdueObjectives() al leer.

  const [row] = await db.update(projects).set(patch).where(eq(projects.id, Number(id))).returning();

  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(projects).set({ status: 'archived', updatedAt: new Date() }).where(eq(projects.id, Number(id)));
  return NextResponse.json({ ok: true });
}
