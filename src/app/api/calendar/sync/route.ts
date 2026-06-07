import { NextResponse } from 'next/server';
import { pullFromGoogle, pushEventToGoogle } from '@/lib/googleCalendar';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { gte, eq } from 'drizzle-orm';

export async function POST() {
  try {
    const now = new Date();
    const veraEvents = await db.select().from(events)
      .where(gte(events.startDate, now))
      .limit(20);

    let pushed = 0;
    for (const e of veraEvents) {
      const gId = await pushEventToGoogle({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        notes: e.notes,
        who: e.who,
        googleEventId: e.googleEventId ?? null,
      });
      if (gId) {
        // Guardar googleEventId si es nuevo
        if (!e.googleEventId) {
          await db.update(events)
            .set({ googleEventId: gId })
            .where(eq(events.id, e.id));
        }
        pushed++;
      }
    }

    const googleEvents = await pullFromGoogle();

    return NextResponse.json({ ok: true, pushed, pulled: googleEvents.length, googleEvents: googleEvents.slice(0, 5) });
  } catch (err) {
    console.error('[calendar sync]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const googleEvents = await pullFromGoogle();
    return NextResponse.json({ events: googleEvents });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
