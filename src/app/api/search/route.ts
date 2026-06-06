import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, events, inbox } from '@/lib/db/schema';
import { like, ne, or, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ tasks: [], events: [], inbox: [] });

  const pattern = `%${q}%`;

  const [taskRows, eventRows, inboxRows] = await Promise.all([
    db.select({ id: tasks.id, title: tasks.title, propertyId: tasks.propertyId, prioFinal: tasks.prioFinal, status: tasks.status })
      .from(tasks)
      .where(and(
        ne(tasks.status, 'archived'),
        or(like(tasks.title, pattern), like(tasks.detail, pattern), like(tasks.tags, pattern))
      ))
      .limit(8),

    db.select({ id: events.id, title: events.title, type: events.type, startDate: events.startDate })
      .from(events)
      .where(like(events.title, pattern))
      .limit(4),

    db.select({ id: inbox.id, content: inbox.content, source: inbox.source })
      .from(inbox)
      .where(and(
        like(inbox.content, pattern),
      ))
      .limit(4),
  ]);

  return NextResponse.json({ tasks: taskRows, events: eventRows, inbox: inboxRows });
}
