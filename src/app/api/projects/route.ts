import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { renewOverdueObjectives, TIER_DAYS, type ObjectiveTier } from '@/lib/objectives';

export async function GET() {
  await renewOverdueObjectives();
  const rows = await db.select().from(projects).orderBy(projects.createdAt);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name, description, color, icon, isObjective, objectiveTier, notionUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const now = new Date();
  const wantsObjective = !!isObjective && !!objectiveTier && objectiveTier in TIER_DAYS;
  const periodDays = wantsObjective ? TIER_DAYS[objectiveTier as ObjectiveTier] : null;

  const [row] = await db.insert(projects).values({
    name: name.trim(),
    description: description ?? null,
    color: color ?? null,
    icon: icon ?? null,
    notionUrl: notionUrl?.trim() || null,
    status: 'active',
    isObjective: wantsObjective,
    objectiveTier: wantsObjective ? objectiveTier : null,
    objectiveOriginalStartAt: wantsObjective ? now : null,
    objectiveStartedAt: wantsObjective ? now : null,
    dueDate: wantsObjective && periodDays ? new Date(now.getTime() + periodDays * 86400000) : null,
    objectiveRenewals: 0,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
