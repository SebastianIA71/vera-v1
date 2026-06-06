import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import ContactsClient from './ContactsClient';

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  return <ContactsClient initialContacts={rows} />;
}
