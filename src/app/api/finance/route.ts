import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financeRecords } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

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

export async function GET() {
  const rows = await db
    .select()
    .from(financeRecords)
    .orderBy(desc(financeRecords.date));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const calcs = computeCalcs(body);

  const [row] = await db.insert(financeRecords).values({
    date: body.date,
    vb: body.vb ?? 0,  xc: body.xc ?? 0,  ps: body.ps ?? 0,  pm: body.pm ?? 0,
    lf: body.lf ?? 0,  rs: body.rs ?? 0,  gh: body.gh ?? 0,  mh: body.mh ?? 0,
    doo: body.doo ?? 0, mo: body.mo ?? 0,  so: body.so ?? 0,
    x1: body.x1 ?? 0,  x2: body.x2 ?? 0,  x3: body.x3 ?? 0,
    x4: body.x4 ?? 0,  x5: body.x5 ?? 0,  x6: body.x6 ?? 0,
    ...calcs,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
