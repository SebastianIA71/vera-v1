import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financeRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function computeCalcs(r: {
  vb?: number|null; xc?: number|null; ps?: number|null; pm?: number|null;
  lf?: number|null; rs?: number|null; gh?: number|null; mh?: number|null;
  doo?: number|null; mo?: number|null; so?: number|null;
}) {
  const vb=r.vb??0, xc=r.xc??0, ps=r.ps??0, pm=r.pm??0;
  const lf=r.lf??0, rs=r.rs??0, gh=r.gh??0, mh=r.mh??0;
  const doo=r.doo??0, mo=r.mo??0, so=r.so??0;
  const calcA = vb + xc;
  const calcB = vb + xc + ps + pm;
  const calcC = lf + rs + gh + mh / 2;
  const calcD = (calcA + calcB + calcC) / 1000;
  const calcE = doo + mo + so;
  return { calcA, calcB, calcC, calcD, calcE };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const calcs = computeCalcs(body);

  const [row] = await db.update(financeRecords)
    .set({
      date: body.date,
      vb: body.vb, xc: body.xc, ps: body.ps, pm: body.pm,
      lf: body.lf, rs: body.rs, gh: body.gh, mh: body.mh,
      doo: body.doo, mo: body.mo, so: body.so,
      x1: body.x1, x2: body.x2, x3: body.x3,
      x4: body.x4, x5: body.x5, x6: body.x6,
      ...calcs,
      updatedAt: new Date(),
    })
    .where(eq(financeRecords.id, Number(id)))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(financeRecords).where(eq(financeRecords.id, Number(id)));
  return NextResponse.json({ ok: true });
}
