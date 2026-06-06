import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function todayKey() { return `song_${new Date().toISOString().slice(0, 10)}`; }

// Extrae JSON de respuestas que pueden venir envueltas en markdown
function extractJson(text: string): string {
  const clean = text.trim();
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const first = clean.indexOf('{');
  const last  = clean.lastIndexOf('}');
  if (first !== -1 && last !== -1) return clean.slice(first, last + 1);
  return clean;
}

async function upsertMemory(key: string, value: string) {
  const existing = await db.select({ key: memory.key }).from(memory).where(eq(memory.key, key)).limit(1);
  if (existing[0]) {
    await db.update(memory).set({ value }).where(eq(memory.key, key));
  } else {
    await db.insert(memory).values({ key, value });
  }
}

interface SongData { title: string; artist: string; reason: string; feedback?: 'ok' | 'ko' | null }
interface Preferences { liked: { title: string; artist: string }[]; disliked: { title: string; artist: string }[] }

export async function GET() {
  const key = todayKey();

  try {
    // Devolver caché si ya existe para hoy
    const cached = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
    if (cached[0]?.value) {
      return NextResponse.json(JSON.parse(cached[0].value));
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'no_key' }, { status: 503 });
    }

    // Cargar preferencias
    const prefRow = await db.select().from(memory).where(eq(memory.key, 'song_preferences')).limit(1);
    const prefs: Preferences = prefRow[0]?.value ? JSON.parse(prefRow[0].value) : { liked: [], disliked: [] };

    const likedStr  = prefs.liked.slice(-10).map(s => `"${s.title}" de ${s.artist}`).join(', ') || 'ninguna aún';
    const dislikStr = prefs.disliked.slice(-10).map(s => `"${s.title}" de ${s.artist}`).join(', ') || 'ninguna aún';
    const today     = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: `Eres el DJ personal de Sebastián. Sugiere UNA canción para hoy.

Día: ${today}
Canciones que le han gustado: ${likedStr}
Canciones que no le han gustado: ${dislikStr}

Responde ÚNICAMENTE con un objeto JSON, sin texto adicional ni markdown:
{"title":"...","artist":"...","reason":"..."}

- reason: máximo 12 palabras, por qué encaja hoy
- Varía géneros: rock, jazz, pop, electrónica, indie, clásica, folk, soul
- No repitas artistas de los últimos 7 gustados si puedes evitarlo
- La canción debe existir realmente en Spotify`,
      }],
    });

    const rawText = (res.content[0] as { type: string; text: string }).text;
    const jsonStr = extractJson(rawText);
    const song: SongData = JSON.parse(jsonStr);

    if (!song.title || !song.artist) throw new Error('invalid_song_data');
    song.feedback = null;

    await upsertMemory(key, JSON.stringify(song));
    return NextResponse.json(song);

  } catch (err) {
    console.error('[song-of-day GET]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'no_song' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { feedback } = await req.json() as { feedback: 'ok' | 'ko' };
    const key = todayKey();

    const row = await db.select().from(memory).where(eq(memory.key, key)).limit(1);
    if (!row[0]?.value) return NextResponse.json({ error: 'no_song_today' }, { status: 404 });

    const song: SongData = JSON.parse(row[0].value);
    song.feedback = feedback;
    await db.update(memory).set({ value: JSON.stringify(song) }).where(eq(memory.key, key));

    // Actualizar preferencias
    const prefRow = await db.select().from(memory).where(eq(memory.key, 'song_preferences')).limit(1);
    const prefs: Preferences = prefRow[0]?.value ? JSON.parse(prefRow[0].value) : { liked: [], disliked: [] };

    const entry = { title: song.title, artist: song.artist };
    if (feedback === 'ok') {
      prefs.liked = [...prefs.liked.filter(s => s.title !== song.title), entry].slice(-30);
    } else {
      prefs.disliked = [...prefs.disliked.filter(s => s.title !== song.title), entry].slice(-30);
    }
    await upsertMemory('song_preferences', JSON.stringify(prefs));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[song-of-day POST]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
