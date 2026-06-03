import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financeRecords } from '@/lib/db/schema';

const SEED = [
  { date:'2025-03-01', vb:5.1,   xc:10,   ps:97.5,  pm:24.5, lf:380, rs:917,  gh:599, mh:439, doo:4.5,  mo:2.5, so:0,   x1:258 },
  { date:'2025-04-06', vb:5.1,   xc:8.2,  ps:95.3,  pm:22.6, lf:395, rs:911,  gh:608, mh:459, doo:4.5,  mo:2.5, so:0.8, x1:257 },
  { date:'2025-05-06', vb:5.8,   xc:6,    ps:94.8,  pm:22.2, lf:457, rs:1005, gh:644, mh:610, doo:4.5,  mo:2.5, so:1.2, x1:256 },
  { date:'2025-06-06', vb:6.1,   xc:7.2,  ps:96,    pm:23,   lf:458, rs:1006, gh:645, mh:611, doo:4.5,  mo:2.5, so:1.8, x1:255 },
  { date:'2025-07-06', vb:8.4,   xc:6.5,  ps:98,    pm:23.8, lf:404, rs:911,  gh:614, mh:463, doo:4.5,  mo:5.1, so:4.2, x1:255 },
  { date:'2025-08-06', vb:11.8,  xc:5.5,  ps:99,    pm:24.1, lf:404, rs:911,  gh:622, mh:463, doo:4.5,  mo:2.5, so:5.8, x1:255 },
  { date:'2025-09-04', vb:14.8,  xc:5.5,  ps:99.8,  pm:24.1, lf:410, rs:929,  gh:646, mh:473, doo:5,    mo:2.5, so:2.2, x1:254 },
  { date:'2025-10-04', vb:15.2,  xc:5.1,  ps:101.9, pm:25,   lf:410, rs:929,  gh:647, mh:474, doo:3.5,  mo:2.5, so:1,   x1:253 },
  { date:'2025-11-05', vb:15.15, xc:4.9,  ps:103.5, pm:25.9, lf:425, rs:976,  gh:627, mh:485, doo:3.5,  mo:2.5, so:0,   x1:252 },
  { date:'2025-12-01', vb:13.1,  xc:7.2,  ps:103.7, pm:26.1, lf:428, rs:971,  gh:617, mh:490, doo:3.5,  mo:5.1, so:0.8, x1:252 },
  { date:'2026-01-01', vb:13,    xc:7,    ps:104.1, pm:25.7, lf:428, rs:971,  gh:618, mh:490, doo:4.5,  mo:2.5, so:0.6, x1:251 },
  { date:'2026-02-01', vb:11.4,  xc:7,    ps:105.6, pm:26.2, lf:477, rs:997,  gh:630, mh:512, doo:5.85, mo:2.5, so:0,   x1:250 },
  { date:'2026-03-01', vb:10.1,  xc:7,    ps:107.4, pm:26,   lf:502, rs:1012, gh:659, mh:524, doo:4.75, mo:2.5, so:0,   x1:249 },
  { date:'2026-04-01', vb:8.7,   xc:8,    ps:103.7, pm:24,   lf:502, rs:1010, gh:676, mh:540, doo:3.8,  mo:2.5, so:0,   x1:249 },
  { date:'2026-05-01', vb:8.2,   xc:7.5,  ps:108,   pm:26,   lf:535, rs:1030, gh:673, mh:534, doo:3.7,  mo:2.5, so:0,   x1:248 },
];

function calcs(r: typeof SEED[0]) {
  const calcA = r.vb + r.xc;
  const calcB = r.vb + r.xc + r.ps + r.pm;
  const calcC = r.lf + r.rs + r.gh + r.mh / 2;
  const calcD = (calcA + calcB + calcC) / 1000;
  const calcE = r.doo + r.mo + r.so;
  return { calcA, calcB, calcC, calcD, calcE };
}

export async function POST() {
  const existing = await db.select({ date: financeRecords.date }).from(financeRecords);
  const existingDates = new Set(existing.map(r => r.date));

  const toInsert = SEED
    .filter(r => !existingDates.has(r.date))
    .map(r => ({
      ...r,
      x2: 0, x3: 0, x4: 0, x5: 0, x6: 0,
      ...calcs(r),
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, message: 'Ya sembrado' });
  }

  await db.insert(financeRecords).values(toInsert);
  return NextResponse.json({ ok: true, inserted: toInsert.length });
}
