import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function todayKey() { return `song_${new Date().toISOString().slice(0, 10)}`; }

interface SongData { title: string; artist: string; reason: string; feedback?: 'ok' | 'ko' | null }
interface Preferences { liked: { title: string; artist: string }[]; disliked: { title: string; artist: string }[] }

export async function GET() {
  const key = todayKey();

  // Check cache
  const cached = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
  if (cached[0]?.value) {
    return NextResponse.json(JSON.parse(cached[0].value));
  }

  // Load preferences
  const prefRow = await db.select().from(memory).where(eq(memory.key, 'song_preferences')).limit(1);
  const prefs: Preferences = prefRow[0]?.value ? JSON.parse(prefRow[0].value) : { liked: [], disliked: [] };

  const likedStr  = prefs.liked.slice(-10).map(s => `"${s.title}" de ${s.artist}`).join(', ') || 'ninguna aún';
  const dislikStr = prefs.disliked.slice(-10).map(s => `"${s.title}" de ${s.artist}`).join(', ') || 'ninguna aún';
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Eres el DJ personal de Sebastián. Sugiere UNA canción para hoy.

Día: ${today}
Canciones que le han gustado: ${likedStr}
Canciones que no le han gustado: ${dislikStr}

Responde SOLO con JSON válido sin markdown:
{"title":"...","artist":"...","reason":"..."}

- reason: máximo 12 palabras, por qué hoy
- Varía géneros: rock, jazz, pop, electrónica, indie, clásica, folk, soul, etc.
- No repitas artistas de los últimos 7 que le gustaron si puedes evitarlo
- Sé específico: canción real que existe en Spotify`,
      }],
    });

    const text = (res.content[0] as { type: string; text: string }).text.trim();
    const song: SongData = JSON.parse(text);
    song.feedback = null;

    await db.insert(memory).values({ key, value: JSON.stringify(song) })
      .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(song) } });

    return NextResponse.json(song);
  } catch {
    return NextResponse.json({ error: 'no_song' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const { feedback } = await req.json() as { feedback: 'ok' | 'ko' };
  const key = todayKey();

  // Get today's song
  const row = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
  if (!row[0]?.value) return NextResponse.json({ error: 'no_song_today' }, { status: 404 });

  const song: SongData = JSON.parse(row[0].value);
  song.feedback = feedback;

  await db.update(memory).set({ value: JSON.stringify(song) }).where(eq(memory.key, key));

  // Update preferences
  const prefRow = await db.select().from(memory).where(eq(memory.key, 'song_preferences')).limit(1);
  const prefs: Preferences = prefRow[0]?.value ? JSON.parse(prefRow[0].value) : { liked: [], disliked: [] };

  const entry = { title: song.title, artist: song.artist };
  if (feedback === 'ok') {
    prefs.liked = [...prefs.liked.filter(s => s.title !== song.title), entry].slice(-30);
  } else {
    prefs.disliked = [...prefs.disliked.filter(s => s.title !== song.title), entry].slice(-30);
  }

  await db.insert(memory).values({ key: 'song_preferences', value: JSON.stringify(prefs) })
    .onConflictDoUpdate({ target: memory.key, set: { value: JSON.stringify(prefs) } });

  return NextResponse.json({ ok: true });
}
