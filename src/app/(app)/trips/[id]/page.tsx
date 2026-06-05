import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import TripDetailPageClient from './TripDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  if (isNaN(tripId)) notFound();

  const rows = await db.select().from(events).where(eq(events.id, tripId)).limit(1);
  const trip = rows[0];
  if (!trip) notFound();

  return <TripDetailPageClient trip={trip} />;
}
