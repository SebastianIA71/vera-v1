import { google } from 'googleapis';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI
  ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/google/callback`;

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

export function getAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getAuthenticatedClient() {
  const client = getOAuthClient();
  const row = await db.select().from(memory).where(eq(memory.key, 'google_tokens')).limit(1);
  if (!row[0]?.value) throw new Error('Google Calendar no conectado');
  const tokens = JSON.parse(row[0].value);
  client.setCredentials(tokens);

  // Auto-refresh si el token expira pronto
  client.on('tokens', async (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    await db.insert(memory).values({ key: 'google_tokens', value: JSON.stringify(merged) })
      .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(merged), updatedAt: new Date() } });
  });

  return client;
}

export async function isConnected(): Promise<boolean> {
  const row = await db.select().from(memory).where(eq(memory.key, 'google_tokens')).limit(1);
  return !!(row[0]?.value);
}

// Convierte evento de Vera a evento de Google Calendar
function veraToGoogle(event: {
  title: string;
  startDate?: Date | null;
  endDate?: Date | null;
  notes?: string | null;
  who?: string | null;
}) {
  const start = event.startDate ?? new Date();
  const end = event.endDate ?? new Date(start.getTime() + 86400000);
  return {
    summary: event.title,
    description: [
      event.who ? `Con: ${event.who}` : null,
      event.notes ?? null,
      '— sincronizado desde Vera',
    ].filter(Boolean).join('\n'),
    start: { date: start.toISOString().slice(0, 10) },
    end:   { date: end.toISOString().slice(0, 10) },
  };
}

export async function pushEventToGoogle(event: {
  id: number;
  title: string;
  startDate?: Date | null;
  endDate?: Date | null;
  notes?: string | null;
  who?: string | null;
  googleEventId?: string | null;
}): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient();
    const cal = google.calendar({ version: 'v3', auth });
    const body = veraToGoogle(event);
    const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary';

    if (event.googleEventId) {
      await cal.events.update({ calendarId, eventId: event.googleEventId, requestBody: body });
      return event.googleEventId;
    } else {
      const res = await cal.events.insert({ calendarId, requestBody: body });
      return res.data.id ?? null;
    }
  } catch {
    return null;
  }
}

export async function deleteEventFromGoogle(googleEventId: string): Promise<void> {
  try {
    const auth = await getAuthenticatedClient();
    const cal = google.calendar({ version: 'v3', auth });
    await cal.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary', eventId: googleEventId });
  } catch {}
}

// Pull eventos de Google Calendar (últimos 90 días + próximos 90)
export async function pullFromGoogle(): Promise<{ id: string; title: string; start: string; end: string }[]> {
  const auth = await getAuthenticatedClient();
  const cal = google.calendar({ version: 'v3', auth });
  const timeMin = new Date(Date.now() - 7 * 86400000).toISOString();
  const timeMax = new Date(Date.now() + 90 * 86400000).toISOString();

  const res = await cal.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    timeMin, timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });

  return (res.data.items ?? [])
    .filter(e => e.id && e.summary)
    .map(e => ({
      id: e.id!,
      title: e.summary!,
      start: e.start?.date ?? e.start?.dateTime?.slice(0, 10) ?? '',
      end:   e.end?.date   ?? e.end?.dateTime?.slice(0, 10)   ?? '',
    }));
}
