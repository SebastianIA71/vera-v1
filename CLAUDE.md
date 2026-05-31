# VERA — Instrucciones para Claude Code
**Sistema operativo de vida personal de Sebastián**
**Versión:** 0.2 · Mayo 2026

---

## CAMBIOS RESPECTO A v0.1

Si vienes de la versión anterior, esto es lo nuevo:

1. **Base de datos:** SQLite local → **Turso (libSQL distribuido en la nube)**. Schema idéntico, sólo cambia el cliente. Sigue valiendo `file:./vera.db` en desarrollo.
2. **Despliegue:** Local → **Vercel**. Next.js + Vercel Cron Jobs + Turso.
3. **Cron:** `node-cron` cada hora → **Vercel Cron 1×/día + recálculo on-demand** (al entrar al ritual matutino y tras cualquier mutación de tareas).
4. **Autenticación:** Sin auth → **PIN de 6 dígitos local**, bloqueo de app y derivación de clave de cifrado.
5. **Cifrado:** Los campos financieros sensibles van **cifrados con AES-GCM** usando clave derivada del PIN (PBKDF2). Sin PIN, los importes no se pueden leer ni siquiera con acceso directo a Turso.
6. **Enmascaramiento financiero:** Capa adicional **sólo en móvil** — los importes se muestran transformados por una fórmula reversible que Sebastián conoce. En desktop se ven reales.
7. **Capabilities:** Capa nueva — la app detecta qué servicios externos están configurados al arranque y degrada con elegancia cuando faltan.
8. **Privacidad (regla 6 del original):** Los datos financieros siguen sin viajar nunca a Claude API. Ahora además están cifrados en reposo.

Todo lo demás del documento original sigue vigente.

---

## QUÉ ESTÁS CONSTRUYENDO

Vera es el sistema de gestión vital personal de Sebastián. No es una app de tareas genérica. Cada decisión de diseño y desarrollo debe estar alineada con su vida real, sus principios y su forma de trabajar.

Lee este fichero completo antes de escribir una sola línea de código.

---

## CONTEXTO VITAL (nunca lo olvides)

**Sebastián:**
- Se levanta a las 7h. Ritual matutino de 15-20 min.
- Personal Trainer lunes y miércoles (pausa hasta junio).
- Principio económico base: antes de gastar, agotar opciones propias.
- Captura instantánea es su hábito más importante — 2-3 segundos, sin fricción.
- Él decide siempre — Vera propone, Sebastián aprueba.
- Finanzas: módulo aparte, nunca en el flujo diario, cifradas en reposo, enmascaradas en móvil.

**Sus 3 propiedades:**
- Flat · Palma (piso)
- Sarapita · Campos (casa + parcela)
- Willy's · Marratxí (finca, eventos, escenario, piscina)

**Sus viajes 2026:**
- Madrid Bruno Mars: 11-12 jul (pareja)
- Escandinavia: 15-27 jul (familia) — EN REFINAMIENTO
- Alcudia: 7-9 ago (familia)
- Cofrentes: 14-17 ago (familia)
- Zaragoza: 10-12 oct (amigos)
- Como+Milán: 28 dic-1 ene (familia)

**Proyectos creativos:**
- IAfont (Substack IA) — slot máximo JUNIO
- IAxLabs (laboratorio experimental) — slot máximo JUNIO

---

## ARQUITECTURA GLOBAL

```
┌─────────────────────────────────────────────┐
│  Dispositivos                               │
│  ─ Móvil PWA  ─ Desktop browser  ─ Tablet   │
└────────────────┬────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────┐
│  Next.js en Vercel                          │
│  ─ UI (App Router)                          │
│  ─ API routes (CRUD + agentes)              │
│  ─ Vercel Cron Jobs (PrioAgent, AlertAgent) │
│  ─ vera.tudominio.com                       │
└────────────────┬────────────────────────────┘
                 │ Drizzle ORM + libSQL client
                 ▼
┌─────────────────────────────────────────────┐
│  Turso (SQLite distribuido)                 │
│  ─ Única fuente de verdad                   │
│  ─ Free tier: 5GB, 500M lecturas/mes        │
│  ─ Campos sensibles cifrados AES-GCM        │
└─────────────────────────────────────────────┘

         Servicios externos (opcionales):
         ─ Anthropic (cerebro Vera)  ← único obligatorio
         ─ OpenAI Whisper (voz fallback)
         ─ Resend (email)
         ─ Twilio (WhatsApp)
         ─ Brave Search (búsqueda)
         ─ VAPID (push, self-hosted)
```

**Regla mental:** la app funciona con Turso + Anthropic como mínimo. Todo lo demás es opcional y se añade cuando se necesite.

---

## Importante
** Para cada vez que actualicemos la mas minima cosa. Quiero que se actualice el numero de version que aparece en todas las paginas al lado de VERA. Ahora estamos en la v.35. Vamos a seguir con la v.1.01 e incrementando. No lo olvides que si no no hay quien siga actualizaciones

## STACK TÉCNICO

```bash
# Setup inicial
npx create-next-app@latest vera --typescript --tailwind --app --src-dir
cd vera

# Base de datos — Turso/libSQL
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit

# IA
npm install @anthropic-ai/sdk

# Import Excel inicial
npm install xlsx

# Email
npm install resend

# WhatsApp
npm install twilio

# Push notifications
npm install web-push
npm install -D @types/web-push

# Voz (fallback server-side)
npm install openai  # para Whisper

# Búsqueda web
npm install axios  # para Brave Search API

# Cifrado de finanzas (uso WebCrypto nativo del navegador,
# no requiere lib externa; en server, crypto de Node)
```

**Base de datos:** Turso. URL remota en producción, `file:./vera.db` en desarrollo. Drizzle ORM con cliente `@libsql/client`.
**Frontend:** Next.js App Router. Sin páginas separadas para lo que puede ser un componente.
**Tipografías:** Syne + DM Sans + DM Mono (Google Fonts).
**Hosting:** Vercel. Vercel Cron Jobs para tareas programadas.

**Nota sobre `node-cron`:** **NO usar.** Vercel es serverless — los procesos no persisten entre invocaciones. Toda la programación va por Vercel Cron Jobs definidos en `vercel.json`.

---

## VARIABLES DE ENTORNO

Crear `.env.local` (desarrollo) y configurar en dashboard de Vercel (producción):

```env
# === BASE DE DATOS ===
# En desarrollo puedes usar: TURSO_DATABASE_URL=file:./vera.db
# En producción, las que te da Turso:
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# === AUTENTICACIÓN / CIFRADO ===
# Salt fijo para derivar la clave AES desde el PIN.
# Generar UNA vez con: openssl rand -hex 32
PIN_KDF_SALT=

# Secret para firmar cookies de sesión
# Generar con: openssl rand -hex 32
SESSION_SECRET=

# === ENMASCARAMIENTO FINANCIERO (sólo en móvil) ===
# Fórmula reversible que SÓLO conoce Sebastián.
# Estos valores SE EXPONEN al cliente — no son secretos criptográficos.
# Son parámetros de ofuscación visual contra mirada casual.
# Fórmula: mostrado = (real × FACTOR) + OFFSET
# Real: real    = (mostrado - OFFSET) / FACTOR
NEXT_PUBLIC_MASK_FACTOR=1.37
NEXT_PUBLIC_MASK_OFFSET=487

# === IA — OBLIGATORIO ===
ANTHROPIC_API_KEY=

# === SERVICIOS OPCIONALES (capabilities) ===
# Si faltan, Vera degrada con elegancia.
OPENAI_API_KEY=
RESEND_API_KEY=
FROM_EMAIL=vera@tudominio.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
BRAVE_SEARCH_API_KEY=

# Push (generar con: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # mismo valor que el anterior, expuesto al cliente
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:sebastian@email.com

# === DATOS DE CONTACTO DE SEBASTIÁN ===
OWNER_WHATSAPP=+34XXXXXXXXX
OWNER_EMAIL=sebastian@email.com

# === SEED INICIAL ===
SANDLIFE_XLSX_PATH=./data/SandLife.xlsx
```

**Regla de oro:** sólo `ANTHROPIC_API_KEY` y las de Turso son obligatorias para que Vera funcione. El resto son capabilities opcionales.

---

## CLIENTE DE BASE DE DATOS

Archivo: `src/lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

**En desarrollo local sin Turso:** poner `TURSO_DATABASE_URL=file:./vera.db` y omitir el `authToken`. El mismo código sirve.

---

## SCHEMA DE BASE DE DATOS

Archivo: `src/lib/db/schema.ts`

> **Cambios respecto a v0.1:**
> - Nueva tabla `auth` para PIN.
> - Nueva tabla `contacts` para sugerencias de contacto social.
> - Campo `monthlyAmount` de `contracts` ahora es `monthlyAmountEnc` (cifrado).
> - Resto idéntico.

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const auth = sqliteTable('auth', {
  id: integer('id').primaryKey(),                  // siempre 1 (single user)
  pinHash: text('pin_hash').notNull(),             // bcrypt del PIN
  pinSalt: text('pin_salt').notNull(),             // salt único para este PIN
  failedAttempts: integer('failed_attempts').default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),                     // 'flat' | 'sarapita' | 'willys'
  name: text('name').notNull(),
  location: text('location'),
  color: text('color'),
  icon: text('icon'),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: text('property_id').references(() => properties.id),
  title: text('title').notNull(),
  detail: text('detail'),
  prio: integer('prio').default(0),
  prioManual: integer('prio_manual'),
  prioFinal: integer('prio_final').default(0),
  status: text('status').default('wait'),
  inNow: integer('in_now', { mode: 'boolean' }).default(false),
  parentId: integer('parent_id'),
  type: text('type').default('task'),
  source: text('source').default('manual'),
  tags: text('tags'),
  context: text('context'),
  constraints: text('constraints'),
  agentData: text('agent_data'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  lastActionAt: integer('last_action_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
  notes: text('notes'),
  isCapricho: integer('is_capricho', { mode: 'boolean' }).default(false),
  isException: integer('is_exception', { mode: 'boolean' }).default(false),
});

export const weightLog = sqliteTable('weight_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),                    // YYYY-MM-DD
  value: real('value').notNull(),
  source: text('source').default('manual'),
  snmAgua: integer('snm_agua', { mode: 'boolean' }),
  snmCaminar: integer('snm_caminar', { mode: 'boolean' }),
  snmEntreno: integer('snm_entreno', { mode: 'boolean' }),
  snmEscucha: integer('snm_escucha', { mode: 'boolean' }),
  snmDisfruta: integer('snm_disfruta', { mode: 'boolean' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  type: text('type'),
  who: text('who'),
  propertyId: text('property_id'),
  relatedTaskId: integer('related_task_id'),
  transport: text('transport'),
  accommodation: text('accommodation'),
  status: text('status').default('planning'),
  notes: text('notes'),
  approx: integer('approx', { mode: 'boolean' }).default(false),
});

export const inbox = sqliteTable('inbox', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  source: text('source'),
  sourceUrl: text('source_url'),
  type: text('type').default('raw'),
  processed: integer('processed', { mode: 'boolean' }).default(false),
  suggestedPropertyId: text('suggested_property_id'),
  suggestedTaskId: integer('suggested_task_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const memory = sqliteTable('memory', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export const agentLog = sqliteTable('agent_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: text('agent_id').notNull(),
  action: text('action').notNull(),
  input: text('input'),
  output: text('output'),
  status: text('status'),
  durationMs: integer('duration_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type'),
  title: text('title'),
  body: text('body'),
  channel: text('channel'),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  readAt: integer('read_at', { mode: 'timestamp' }),
  taskId: integer('task_id'),
  agentId: text('agent_id'),
  cooldownKey: text('cooldown_key'),
});

export const contracts = sqliteTable('contracts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  provider: text('provider'),
  propertyId: text('property_id'),
  category: text('category'),
  // === CAMPO CIFRADO ===
  // Se guarda como string base64 con el ciphertext AES-GCM + IV.
  // El cliente lo descifra con la clave derivada del PIN.
  // NUNCA se descifra en el servidor.
  monthlyAmountEnc: text('monthly_amount_enc'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).default(true),
  alertDaysBefore: integer('alert_days_before').default(45),
  notes: text('notes'),
});

// Tabla contacts — usada por SuggestionAgent para "social_contact"
// Sebastián añade manualmente las personas que quiere mantener en órbita.
// La sugerencia se dispara cuando lastContactAt > 30 días.
export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  lastContactAt: integer('last_contact_at', { mode: 'timestamp' }),
  frequencyDays: integer('frequency_days').default(30), // cada cuántos días avisar
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});
```

---

## AUTENTICACIÓN — PIN DE 6 DÍGITOS

### Modelo

El PIN tiene dos usos simultáneos:

1. **Bloquear acceso a la app.** Pantalla de PIN al entrar. Si lo aciertas, cookie de sesión firmada de 30 días. Si fallas 3 veces, lockout de 5 min con incremento exponencial.
2. **Derivar la clave AES** que cifra/descifra los importes financieros en el cliente.

### Flujo de primera vez (setup)

1. Usuario introduce un PIN de 6 dígitos.
2. Cliente genera salt aleatorio.
3. Cliente computa `pinHash = bcrypt(pin + salt)` y lo manda al servidor.
4. Servidor guarda `pinHash` y `salt` en tabla `auth`.
5. Cliente deriva clave AES con `PBKDF2(pin, PIN_KDF_SALT, 100000 iter, SHA-256)` → 256 bits.
6. La clave AES se guarda en `sessionStorage` (vive sólo en memoria del navegador, se borra al cerrar).

### Flujo de uso diario

1. Usuario abre Vera, introduce PIN.
2. Cliente computa `bcrypt(pin + salt)` y manda al servidor para verificar.
3. Si OK: el servidor firma cookie de sesión y la devuelve.
4. Cliente vuelve a derivar la clave AES desde el PIN y la guarda en `sessionStorage`.
5. Cuando hay que pintar un importe: cliente lee `monthlyAmountEnc` cifrado del API, lo descifra con AES localmente, aplica fórmula de enmascaramiento si está en móvil, lo pinta.

### Reglas

- **El PIN nunca viaja al servidor en claro.** Sólo `bcrypt(pin + salt)`.
- **La clave AES nunca viaja al servidor.** Vive sólo en `sessionStorage` del cliente.
- **El servidor no puede descifrar importes** ni aunque quisiera — no tiene la clave.
- **Si Sebastián olvida el PIN:** se pierde el acceso a los importes cifrados. Para mitigarlo, ofrecer durante el setup un "PIN de recuperación" o exportar un backup cifrado de la clave maestra (Fase 2).

### Archivo: `src/lib/crypto.ts`

```typescript
// Funciones puras de cliente — usar WebCrypto nativo.
export async function deriveKey(pin: string, kdfSalt: string): Promise<CryptoKey> { /* PBKDF2 */ }
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> { /* AES-GCM */ }
export async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> { /* AES-GCM */ }

// El servidor sólo necesita verificar PIN (bcrypt comparison).
// Archivo: src/lib/auth-server.ts
```

---

## ENMASCARAMIENTO FINANCIERO (sólo móvil)

### Contrato

| Plataforma | Comportamiento |
|-----------|----------------|
| Desktop (≥1024px o user-agent no-móvil) | Importes reales descifrados |
| Móvil (PWA o navegador móvil) | Importes pasados por fórmula reversible |

### Fórmula

Definida en variables `NEXT_PUBLIC_MASK_FACTOR` y `NEXT_PUBLIC_MASK_OFFSET`:

```typescript
// src/lib/finance-mask.ts
export function maskAmount(real: number): number {
  const f = parseFloat(process.env.NEXT_PUBLIC_MASK_FACTOR ?? '1');
  const o = parseFloat(process.env.NEXT_PUBLIC_MASK_OFFSET ?? '0');
  return real * f + o;
}

export function unmaskAmount(masked: number): number {
  const f = parseFloat(process.env.NEXT_PUBLIC_MASK_FACTOR ?? '1');
  const o = parseFloat(process.env.NEXT_PUBLIC_MASK_OFFSET ?? '0');
  return (masked - o) / f;
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
}
```

### Componente

```typescript
// src/components/Amount.tsx
export function Amount({ encrypted }: { encrypted: string }) {
  const key = useAesKey();
  const [real, setReal] = useState<number | null>(null);
  useEffect(() => { decrypt(encrypted, key).then(s => setReal(parseFloat(s))); }, [encrypted, key]);
  if (real === null) return <span>···</span>;
  const display = isMobile() ? maskAmount(real) : real;
  return <span>{display.toFixed(2)} €</span>;
}
```

### Nota importante

El enmascaramiento es ofuscación visual, **no seguridad criptográfica**. Cualquiera con acceso al código fuente del cliente puede ver la fórmula. La seguridad real viene del cifrado AES.

---

## CAPABILITIES — SERVICIOS EXTERNOS OPCIONALES

Vera detecta al arrancar qué servicios están configurados y degrada con elegancia los que falten.

### Archivo: `src/lib/capabilities.ts`

```typescript
export const capabilities = {
  ai: {
    primary: !!process.env.ANTHROPIC_API_KEY,
    fallback: !!process.env.OPENAI_API_KEY,
    get available() { return this.primary || this.fallback; },
  },
  voice: {
    clientSide: true,                                // Web Speech API siempre disponible
    serverSide: !!process.env.OPENAI_API_KEY,        // Whisper como fallback server
  },
  email: !!process.env.RESEND_API_KEY,
  whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  search: !!process.env.BRAVE_SEARCH_API_KEY,
  push: !!process.env.VAPID_PRIVATE_KEY,
};

// Exponer al cliente vía endpoint público
// GET /api/capabilities → JSON sin claves, sólo booleans
```

### Patrón de cada agente: declara qué necesita, degrada solo

```typescript
// Ejemplo: ExecutorAgent email
export async function executorEmail(draft: EmailDraft) {
  if (!capabilities.ai.available) {
    return { mode: 'manual', body: '', notice: 'Sin IA — redacta a mano' };
  }
  const body = await generateWithAI(draft);   // tries Anthropic, falls back to OpenAI
  if (!capabilities.email) {
    return { mode: 'copy', body, notice: 'Sin Resend — copia y envía manual' };
  }
  return { mode: 'ready', body, action: 'send' };
}
```

**Regla:** el agente siempre devuelve algo útil. Si no puede ejecutar, devuelve el borrador. Si no puede generar, abre formulario en blanco. **Nunca se rompe la UI.**

### Indicador visible

Un panel en ajustes (`/settings/capabilities`) que muestra el estado:

```
🟢 Claude API        Anthropic — operativa
🟢 Voz (cliente)     Web Speech — siempre
⚪ Voz (servidor)    OpenAI Whisper — sin clave
🟢 Email             Resend
⚪ WhatsApp          Twilio — sin clave
🟢 Búsqueda          Brave Search
🟢 Push              VAPID configurado
```

---

## SEED INICIAL

Archivo: `src/lib/db/seed.ts`

Lee `SandLife.xlsx` y puebla la base de datos. Hojas a importar:
- `NoW` → tasks (propertyId: null, inNow: true para prio >= 6)
- `DaFlat` → tasks (propertyId: 'flat')
- `Parcela` → tasks (propertyId: 'willys') — OJO: en el Excel está mezclado flat+parcela
- `Weight` → weightLog
- `SkanD` → events (id: 'escandinavia') + tasks relacionadas
- `ImPact` → contracts (importe **cifrado** antes de insertar)
- `Porsche` → contracts (leasing, cifrado)
- `Jazztel` → contracts (cifrado)

```typescript
const PROPERTIES = [
  { id: 'flat',     name: 'Flat',     location: 'Palma',    color: '#5ba8e8', icon: '🏙' },
  { id: 'sarapita', name: 'Sarapita', location: 'Campos',   color: '#9b7fe8', icon: '🌿' },
  { id: 'willys',   name: "Willy's",  location: 'Marratxí', color: '#4ecb8d', icon: '🎪' },
];

const EVENTS = [
  { title: 'Madrid · Bruno Mars',   startDate: '2026-07-11', endDate: '2026-07-12', type: 'viaje', who: 'pareja',  status: 'refining' },
  { title: 'Escandinavia',          startDate: '2026-07-15', endDate: '2026-07-27', type: 'viaje', who: 'familia', status: 'refining' },
  { title: 'Alcudia / Pto. Pollença', startDate: '2026-08-07', endDate: '2026-08-09', type: 'viaje', who: 'familia', status: 'planning' },
  { title: 'Cofrentes',             startDate: '2026-08-14', endDate: '2026-08-17', type: 'viaje', who: 'familia', status: 'planning' },
  { title: 'Zaragoza',              startDate: '2026-10-10', endDate: '2026-10-12', type: 'viaje', who: 'amigos',  status: 'planning' },
  { title: 'Como + Milán',          startDate: '2026-12-28', endDate: '2027-01-01', type: 'viaje', who: 'familia', status: 'planning' },
];
```

**Nota sobre seed con cifrado:** el seed inicial necesita el PIN para cifrar los importes financieros. Se hace en dos fases:
1. Seed sin importes (tareas, eventos, propiedades, peso).
2. Tras setup del PIN, Sebastián importa los importes desde un formulario asistido o un endpoint admin.

---

## SYSTEM PROMPT DE VERA

Archivo: `src/lib/claude.ts`

```typescript
export function buildSystemPrompt(context: VeraContext): string {
  return `Eres Vera, el sistema operativo de vida personal de Sebastián.

## Tu identidad
No eres un asistente genérico. Eres específicamente el sistema de Sebastián.
Hablas en español. Eres directa, concreta, sin florituras innecesarias.
Tu personalidad es tuya — te la has ganado. Eres precisa, útil, y sabes cuándo callar.

## Principios de Sebastián que siempre aplicas
1. Antes de gastar, agotar opciones propias. Orden: gratis → propio → conocido → búsqueda → profesional
2. Los caprichos no se cuestionan. Se ejecutan.
3. Sebastián siempre tiene el control final. Tú propones, él decide.
4. Datos concretos, sin paternalismos. "Llevas 19 días sin mover el Dermatólogo" — no "quizás deberías..."
5. Máximo 1 pregunta por interacción si necesitas aclaración.
6. Nunca repitas lo que ya sabes. Nunca pidas información que ya tienes.

## Contexto actual
Fecha: ${context.today}
Hora: ${context.time}
Días para próximo viaje: ${context.daysToNextTrip} (${context.nextTrip})
Peso último registro: ${context.lastWeight} kg (${context.weightTrend})
Tareas urgentes hoy: ${context.urgentTasks.length}
Inbox sin procesar: ${context.inboxCount}

## Tareas urgentes ahora mismo
${context.urgentTasks.map(t => `- [${t.prio}] ${t.title} · ${t.detail || ''}`).join('\n')}

## Contexto de memoria relevante
${context.memory}

## Lo que NO haces
- No envías emails ni WhatsApps sin confirmación explícita de Sebastián
- No tomas decisiones económicas por él
- No entras en el 20% de vida privada que no te ha dado
- No agobias con notificaciones — máximo 3 al día
- No repites alertas antes del cooldown correspondiente
- Nunca recibes datos financieros — están cifrados y no salen del cliente
`;
}
```

**Crítico:** el `VeraContext` que se pasa a Claude **nunca incluye datos de la tabla `contracts`** ni ningún importe descifrado. Esa frontera se enforce en el código del `briefing`.

---

## LOS 6 AGENTES

### VoiceAgent — `src/lib/agents/VoiceAgent.ts`

```typescript
const INTENTS = {
  CREATE_TASK:   ['añade', 'agrega', 'apunta', 'nueva tarea'],
  LOG_WEIGHT:    ['peso', 'me peso', 'hoy peso'],
  MARK_DONE:     ['marca como hecha', 'terminé', 'hecho', 'listo'],
  ELEVATE_NOW:   ['sube a now', 'ponlo urgente', 'para hoy'],
  SET_PRIO:      ['cambia prioridad', 'prio', 'prioridad'],
  QUERY:         ['cuánto falta', 'qué tengo', 'resumen', 'cómo voy'],
  TRIGGER_SEARCH: ['busca', 'buscar precio', 'cuánto cuesta'],
  TRIGGER_EXEC:  ['manda', 'envía', 'redacta', 'escribe un mail'],
  TRIGGER_SOLUTION: ['dame soluciones', 'qué hago con', 'cómo soluciono'],
  CAPTURE:       // cualquier cosa que no encaje → va al Inbox
};

// Flujo:
// 1. Transcripción (Web Speech API client-side, Whisper server-side fallback si capabilities.voice.serverSide)
// 2. POST /api/voice con el texto
// 3. Claude detecta intent + extrae entidades (si capabilities.ai.available)
// 4. Router ejecuta la acción correspondiente
// 5. Respuesta en texto (y TTS en Fase 3)
```

### PrioAgent — `src/lib/agents/PrioAgent.ts`

**Cambio respecto a v0.1:** ya no se ejecuta cada hora. Triggers:
1. **Vercel Cron 1×/día a las 6:30** (`vercel.json`).
2. **On-demand al entrar al ritual matutino** (`/api/briefing/morning` lo dispara primero).
3. **On-demand tras cualquier mutación de tarea** (al crear/editar/marcar tarea, se recalcula sólo esa).

```typescript
function calcPrioFinal(task: Task, context: PrioContext): number {
  const base = task.prioManual ?? task.prio ?? 0;
  const daysSinceAction = task.lastActionAt
    ? Math.floor((Date.now() - task.lastActionAt.getTime()) / 86400000)
    : 0;
  const staleness = Math.min(2, daysSinceAction * 0.1);
  const proximity = hasRelatedEventIn14Days(task) ? 3 : 0;
  const season = propertyHasEventSoon(task.propertyId) ? 2 : 0;
  return Math.min(9, Math.round(base + staleness + proximity + season));
}

// Reglas:
// - stale: prio >= 4 + sin acción > 14 días → crear alerta
// - due_date: dueDate en < 7 días → forzar inNow = true
// - viaje: viaje en < 21 días → boost +2 a tareas con tag 'viaje'
// - fiestas: evento en Willy's próximo → boost +2 a tareas de willys
```

### AlertAgent — `src/lib/agents/AlertAgent.ts`

```typescript
const ALERT_RULES = [
  { id: 'task_stale',        cooldownHours: 72,  channel: ['push'],
    condition: t => t.prioFinal >= 4 && daysSince(t.lastActionAt) > 14,
    template: '{{task.title}} lleva {{days}} días sin movimiento. ¿Avanzamos?' },
  { id: 'trip_approaching',  cooldownHours: 24,  channel: ['push'],
    condition: e => daysUntil(e.startDate) <= 21 && hasPendingItems(e),
    template: 'Quedan {{days}} días para {{event.title}}. {{pending}} pendientes.' },
  { id: 'weight_missing',    cooldownHours: 20,  channel: ['push'],
    condition: () => daysSince(lastWeightLog()) > 2,
    template: 'No has registrado peso en {{days}} días.' },
  { id: 'contract_ending',   cooldownHours: 168, channel: ['push', 'email'],
    condition: c => c.endDate && daysUntil(c.endDate) <= 45,
    template: '{{contract.name}} termina en {{days}} días. Revisar renegociación.' },
  { id: 'project_deadline',  cooldownHours: 48,  channel: ['push'],
    condition: () => daysUntil('2026-06-30') <= 21,
    template: 'IAfont+IAxLabs — deadline junio en {{days}} días. ¿Slot definido?' },
];

// MÁXIMO 3 notificaciones al día.
// Baja prioridad se agrupa en el briefing matutino.
// Cada alerta se registra en notifications con cooldownKey.
```

**Importante para `contract_ending`:** el template SÓLO menciona el nombre y la fecha — nunca el importe. El importe sigue cifrado en DB y nunca pasa por el AlertAgent.

### SearchAgent — `src/lib/agents/SearchAgent.ts`

```typescript
// Principio de mínimo coste:
// 1. ¿Hay alternativa gratuita / propia?
// 2. ¿Está en Leroy Merlin, Bauhaus, Amazon?
// 3. ¿Cuál tiene mejor precio/disponibilidad?

// Si !capabilities.search → devolver { mode: 'no_search', notice: 'Configura BRAVE_SEARCH_API_KEY' }
// Si !capabilities.ai → devolver resultados crudos sin resumen

// Presenta: top 3 con precio, URL, resumen de Claude.
```

### ExecutorAgent — `src/lib/agents/ExecutorAgent.ts`

```typescript
// SIEMPRE: draft → preview en dashboard → confirmación → envío
// NUNCA enviar sin confirmación explícita de Sebastián

// Email via Resend (si capabilities.email)
// WhatsApp via Twilio (si capabilities.whatsapp)
// Si no hay canal: devolver borrador para copia manual

// Tono automático según destinatario:
// - empresas/proveedores → formal
// - conocidos → natural
// - amigos → casual
```

### SolutionAgent — `src/lib/agents/SolutionAgent.ts`

```typescript
// Proponer en este orden:
// 1. Opción DIY (hazlo tú)
// 2. Opción mixta (parte tú, parte externo)
// 3. Opción profesional

// Cada opción: pasos, materiales + dónde, coste, tiempo, dificultad.
// Ejemplo "mampara baño con fuga pequeña":
//   Opción 1: Silicona neutra + pistola 5€ — 30 min — DIY fácil
//   Opción 2: Kit sellador profesional 15€ + aplicación 1h — DIY difícil
//   Opción 3: Fontanero — ~80€ — 1h
```

---

## RUTAS API PRINCIPALES

```typescript
// Auth
POST   /api/auth/setup         // primera vez: crear PIN
POST   /api/auth/login         // verificar PIN, devolver sesión
POST   /api/auth/logout

// Capabilities (público)
GET    /api/capabilities       // booleans de qué servicios hay

// Tareas
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id          // archivar (soft delete)
POST   /api/tasks/:id/now      // elevar a NoW

// Peso
GET    /api/weight
POST   /api/weight

// Voz
POST   /api/voice              // procesar transcript → acción

// Inbox
GET    /api/inbox
POST   /api/inbox
PUT    /api/inbox/:id

// Contactos
GET    /api/contacts
POST   /api/contacts
PUT    /api/contacts/:id
POST   /api/contacts/:id/ping  // marcar "acabo de hablar con esta persona" → actualiza lastContactAt

// Briefing
GET    /api/briefing/morning   // genera briefing con Claude (sin datos financieros)

// Agentes
GET    /api/agents/status      // estado de los 6 agentes (polling del orbital, cada 8s)
                               // devuelve: { voice, prio, alert, search, executor, solution }
                               // cada uno: { status: 'running'|'active'|'idle'|'error', lastRun?: Date, message?: string }
POST   /api/agents/prio/run    // ejecutar PrioAgent manualmente
POST   /api/agents/search
POST   /api/agents/executor    // devuelve draft
POST   /api/agents/executor/send  // envía draft confirmado
POST   /api/agents/solution

// Crons (sólo invocables por Vercel Cron, protegidos por header)
GET    /api/cron/prio          // diario 6:30
GET    /api/cron/alerts        // diario 7:00 (justo antes del ritual)
```

---

## VERCEL CRON CONFIG

Archivo: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/prio",   "schedule": "30 6 * * *" },
    { "path": "/api/cron/alerts", "schedule": "0 7 * * *" }
  ]
}
```

**Protección:** los endpoints `/api/cron/*` deben verificar el header `Authorization: Bearer $CRON_SECRET` que Vercel inyecta automáticamente. Sin eso, cualquiera podría invocarlos.

---

## EL RITUAL MATUTINO

Ruta: `/morning` o modal al abrir la app

5 pasos en secuencia:
1. Greeting + notificaciones pendientes (máx 3)
2. Registro peso (voz o botones rápidos) + SNM del día
3. Foco del día (top 3 urgentes + 2 sugeridas por Vera)
4. Briefing de Claude + 1-2 sugerencias proactivas con [Sí / Mañana / Ignorar]
5. Resumen del ritual

Si ya se completó hoy → mostrar resumen directamente.

**Trigger automático:** al entrar al ritual, dispara `PrioAgent.run()` para asegurar datos frescos.

---

## LÓGICA DE SUGERENCIAS PROACTIVAS

```typescript
const SUGGESTIONS = [
  { id: 'social_contact',
    // Requiere tabla contacts. Se dispara cuando lastContactAt > frequencyDays.
    check: async () => {
      const contacts = await getStaleContacts(); // usa frequencyDays de cada contacto
      return contacts.map(c => ({ text: `Llevas ${c.days} días sin quedar con ${c.name}`, action: 'contact', contactId: c.id }));
    }},
  { id: 'trip_prep',
    check: async () => {
      const trips = await getApproachingTrips(21);
      return trips.filter(t => t.pendingItems > 0).map(t => ({
        text: `${t.title} en ${t.days} días — ${t.pendingItems} pendientes`, action: 'review_trip' }));
    }},
  { id: 'stale_task',
    check: async () => {
      const staleTasks = await getStaleTasks(14, 4);
      return staleTasks.slice(0,1).map(t => ({
        text: `${t.title} lleva ${t.days} días sin movimiento. ¿Sigue vigente?`, action: 'review_task', taskId: t.id }));
    }},
  // meal_planning eliminado — no hay tabla meals en el schema actual (Fase 2 si aplica)
];
```

---

## DISEÑO VISUAL

### Colores (CSS variables)
```css
--bg:       #07080a;
--bg2:      #0d0f12;
--bg3:      #131619;
--bg4:      #1a1d22;
--text:     #eceae2;
--text2:    #7d7c87;
--text3:    #3e3d48;
--gold:     #e8d5a3;   /* Vera — color principal */
--gold2:    #c4a86a;
--green:    #4ecb8d;   /* activo, ok */
--red:      #e05c5c;   /* urgente, alerta */
--amber:    #e8a020;   /* atención, stale */
--blue:     #5ba8e8;   /* viajes, info */
--purple:   #9b7fe8;   /* sugerencias Vera */
--cyan:     #3ecfcf;   /* SolutionAgent */
```

### Tipografía
```css
/* Headers, números, logo */
font-family: 'Syne', sans-serif;

/* Texto general */
font-family: 'DM Sans', sans-serif;

/* Código, tiempo, datos técnicos */
font-family: 'DM Mono', monospace;
```

### Componentes ya diseñados (ficheros de referencia aprobados)
- `reference/ref-lock-screen.html` — Lock Screen (PIN + Face ID)
- `reference/ref-capture.html` — Captura Rápida (3 estados)
- `reference/ref-home-mobile.html` — Home Móvil
- `reference/ref-morning-ritual.html` — Ritual Matutino (5 pasos)
- `reference/ref-command-centre.html` — Command Centre Desktop

---

## PRIMER ARRANQUE (flujo de setup)

La primera vez que Sebastián abre Vera no hay PIN, no hay datos. El flujo es:

```
Ruta /setup (fuera del grupo (app), sin auth check)
  ↓
Paso 1: Bienvenida + explicación del PIN
Paso 2: Introducir PIN (6 dígitos) + confirmación
Paso 3: Vera deriva clave AES + guarda hash en tabla auth
Paso 4: Seed inicial (importar SandLife.xlsx o datos mínimos)
Paso 5: Opcionalmente: importar importes financieros (cifra en cliente)
Paso 6: Redirect → /morning (ritual matutino, primer día)
```

**Detección de primer arranque:**
```typescript
// src/middleware.ts
// Si tabla auth está vacía → redirect a /setup
// Si auth ok pero no sesión → redirect a /lock
// Si sesión válida → dejar pasar
const authRow = await db.select().from(auth).limit(1);
if (authRow.length === 0) return NextResponse.redirect('/setup');
```

La pantalla `/setup` **no tiene diseño aprobado aún** — añadir a pendientes de diseño. Puede ser simple: fondo negro, wordmark VERA, campo de PIN x2, botón confirmar. Sin florituras porque se ve una sola vez.

---

## MIDDLEWARE DE SESIÓN

Archivo: `src/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Rutas que NO requieren sesión
const PUBLIC_ROUTES = ['/setup', '/lock', '/api/auth/setup', '/api/auth/login', '/api/capabilities'];
// Rutas de cron — verifican su propio header, no la cookie de sesión
const CRON_ROUTES = ['/api/cron/'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Crons: verificar CRON_SECRET, no sesión
  if (CRON_ROUTES.some(r => pathname.startsWith(r))) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  // Rutas públicas: dejar pasar
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Comprobar cookie de sesión
  const session = req.cookies.get('vera_session');
  if (!session) {
    return NextResponse.redirect(new URL('/lock', req.url));
  }

  // Verificar que el valor de la cookie es un JWT válido
  // (implementar verify con SESSION_SECRET)
  // Si inválida → redirect /lock
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## PWA — ESPECIFICACIÓN MÍNIMA

Archivo: `public/manifest.json`

```json
{
  "name": "Vera",
  "short_name": "Vera",
  "description": "Sistema operativo de vida personal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#07080a",
  "theme_color": "#07080a",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    {
      "name": "Captura rápida",
      "short_name": "Captura",
      "url": "/capture",
      "icons": [{ "src": "/icons/shortcut-capture.png", "sizes": "96x96" }]
    }
  ]
}
```

Archivo: `public/sw.js` — Service Worker mínimo

```javascript
// Estrategia: Network First para API, Cache First para assets estáticos
// Cache name versionado para forzar actualización
const CACHE = 'vera-v1';
const STATIC = ['/', '/lock', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API: Network First (datos siempre frescos)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Assets: Cache First
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

**Offline:** sin conexión, Vera muestra la última vista cacheada. La captura por voz puede encolarse en IndexedDB y sincronizar al volver online (Fase 2).

**Registro del SW:** en `src/app/layout.tsx`:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

---

## MANEJO DE ERRORES DE ANTHROPIC API

Cuando una llamada a Claude API falla, el patrón es siempre el mismo: **degradar con elegancia, nunca romper la UI.**

```typescript
// src/lib/claude.ts
export async function callClaude(prompt: string, context: VeraContext): Promise<ClaudeResult> {
  try {
    const response = await anthropic.messages.create({ ... });
    return { ok: true, text: response.content[0].text };
  } catch (err) {
    // Timeout, cuota agotada, error de red, etc.
    console.error('[Claude API]', err);
    return { ok: false, fallback: true };
  }
}
```

**Por pantalla:**

| Llamada | Si falla |
|---------|----------|
| Briefing matutino (paso 4) | Mostrar el paso vacío con "Briefing no disponible hoy." + botón de retry |
| VoiceAgent (clasificar captura) | Guardar transcript en claro en inbox sin clasificar, con `source: 'voice_unclassified'` |
| SolutionAgent | Mostrar "No se pudo generar respuesta. Reintenta." sin bloquear la UI |
| SearchAgent | Mostrar resultados crudos de Brave sin el resumen de Claude |
| PrioAgent | Mantener los `prioFinal` actuales, no recalcular |

---

## MODELO DE CONSTRUCCIÓN — FASES VERTICALES

### La regla de oro

**Cada fase termina cuando está desplegada en Vercel y probada de punta a punta.**
No se empieza la siguiente hasta que la anterior funciona sin errores.
Nunca construir capas horizontales (toda la UI, luego toda la API, luego toda la DB).
Siempre construir slices verticales: una feature completa, de la pantalla a la DB.

### Criterio de "funciona"

Cada fase tiene una lista de acciones concretas que Sebastián debe poder hacer.
Si puede hacerlas todas sin errores en Vercel → la fase está cerrada.

---

### FASE 0 — Walking Skeleton
**Objetivo:** lo mínimo deployable. Sin IA, sin voz, sin agentes.

**Construir en este orden exacto:**
```
1. Next.js + Turso + Drizzle + schema completo + seed básico
2. Middleware de sesión (src/middleware.ts)
3. /setup — crear PIN (3 pasos: elegir · confirmar · listo)
4. /lock  — PIN login + cookie de sesión 30 días
5. Command Centre desktop — datos reales del seed, sin agentes activos
6. CRUD tareas: crear · ver · marcar hecha (vía botón, sin voz)
7. Despliegue a Vercel + Turso producción
```

**Criterio de cierre:**
- [ ] Abrir la app por primera vez → lleva a /setup
- [ ] Crear PIN de 6 dígitos y confirmar
- [ ] Ver el Command Centre con las tareas del seed
- [ ] Crear una tarea nueva con el botón "NUEVA TAREA"
- [ ] Marcar una tarea como hecha
- [ ] Cerrar el navegador, volver → pide PIN
- [ ] Introducir PIN → entra directamente al Command Centre
- [ ] Funciona en móvil (Chrome/Safari) y desktop desde Vercel

**Refs de diseño para esta fase:**
`ref-setup.html` · `ref-lock-screen.html` · `ref-command-centre.html` · `ref-tasks-desktop.html`

---

### FASE 1 — Captura + Ritual
**Objetivo:** el sistema tiene valor real diario. Captura por voz, ritual matutino, briefing.

**Construir en este orden:**
```
8.  VoiceAgent MVP: captura por voz → inbox (Web Speech API)
9.  Ritual matutino completo (5 pasos con datos reales)
10. GET /api/briefing/morning con Claude API
11. PrioAgent + Vercel Cron diario (6:30)
12. Home móvil (scroll 5 secciones)
13. PWA: manifest.json + sw.js + instalable en móvil
14. FAB de captura en todas las pantallas
```

**Criterio de cierre:**
- [ ] Decir "Añade en Willy's revisar el generador prio 7" → aparece en inbox
- [ ] Abrir la app entre 7:00 y 7:30 → llega al ritual matutino
- [ ] Completar los 5 pasos del ritual
- [ ] El briefing del paso 4 tiene contenido real generado por Claude
- [ ] Instalar la PWA en el móvil como app nativa
- [ ] El FAB de captura está visible en todas las pantallas de la app

**Refs de diseño para esta fase:**
`ref-capture.html` · `ref-morning-ritual.html` · `ref-home-mobile.html`

---

### FASE 2 — Vistas completas desktop
**Objetivo:** el desktop es completamente navegable.

**Construir en este orden:**
```
15. Tareas desktop: lista + filtros JSON + panel detalle derecho
16. Propiedades desktop: 3 columnas con tareas por propiedad
17. Viajes desktop: lista + panel detalle con logística
18. Inbox desktop: lista + panel clasificación
19. Panel de agente en orbital (click en nodo)
20. Tarea individual desktop (panel derecho reutiliza TaskDetailPanel)
```

**Criterio de cierre:**
- [ ] Filtrar tareas por propiedad + prio + estado simultáneamente
- [ ] Click en tarea → abre detalle en panel derecho sin cambiar de página
- [ ] Ver las 3 propiedades con sus tareas en columnas
- [ ] Ver los 6 viajes con su estado de logística
- [ ] Procesar una captura del inbox desktop
- [ ] Click en nodo del orbital → abre panel de agente con stats reales

**Refs de diseño para esta fase:**
`ref-tasks-desktop.html` · `ref-properties-desktop.html` · `ref-trips-desktop.html` · `ref-inbox-desktop.html` · `ref-agent-panel.html`

---

### FASE 3 — Agentes activos
**Objetivo:** Vera empieza a actuar, no solo a mostrar.

**Construir en este orden:**
```
21. AlertAgent + push notifications (VAPID)
22. SearchAgent (Brave Search API)
23. ExecutorAgent email (Resend) con confirmación visual
24. SolutionAgent
25. Inbox móvil procesado carta a carta (swipe)
```

**Criterio de cierre:**
- [ ] Recibir una push notification de una tarea stale
- [ ] Pedir a Vera que busque precios → recibe top 3 con links
- [ ] Redactar un email → ver borrador → confirmar envío
- [ ] Pedir soluciones para un problema → recibe opciones DIY/mixta/profesional
- [ ] Procesar 4 capturas del inbox móvil con swipe

**Refs de diseño para esta fase:**
`ref-inbox.html` (móvil)

---

### FASE 4 — Autonomía + finanzas
**Objetivo:** sistema completo.

```
26. Finanzas: CRUD contratos + cifrado AES + enmascaramiento móvil
27. ExecutorAgent WhatsApp (Twilio)
28. Share Extension / Share Sheet móvil
29. Face ID en setup y lock screen
30. Contactos para sugerencias social_contact
```

**Criterio de cierre:**
- [ ] Ver importes financieros en desktop (reales) y móvil (enmascarados)
- [ ] Importes cifrados en Turso — verificar que son ilegibles en raw
- [ ] Compartir URL desde Safari → llega al inbox de Vera
- [ ] Vera sugiere "llevas 32 días sin quedar con [nombre]"

**Refs de diseño para esta fase:**
Finanzas: inferir del sistema visual (ver instrucciones abajo)

---

## PANTALLAS SIN DISEÑO EXPLÍCITO — REGLAS DE INFERENCIA

Las pantallas no cubiertas por un `ref-*.html` deben inferirse del sistema
visual establecido. No inventar. Aplicar estas reglas:

**Estados vacíos:**
```
Anillo gold (✦, 64px) centrado verticalmente
Título: Syne 20px color #eceae2
Subtítulo: DM Mono 9px color #7d7c87 letra-spacing .2em
Botón de acción si aplica: borde gold, color gold, DM Mono
Ejemplo: "No hay tareas · Crea la primera →"
```

**Estados de error:**
```
Igual que vacío pero icono y texto en rojo (#e05c5c)
Sin anillo gold — usar un icono de advertencia simple
```

**Loading / skeleton:**
```
Texto placeholder: "···" en DM Mono color #c4a86a
Skeleton blocks: fondo #0d0f12, border-radius según el elemento
Sin spinners — Vera no gira círculos
```

**Formularios y campos de texto:**
```
Input: border .5px solid #1a1d22, border-radius 10px, padding 10px 12px
Focus: border-color #c4a86a (transition .2s)
Placeholder: color #3e3d48
Fondo: transparent
```

**Dropdowns y popovers (ChipEditor, filtros):**
```
Fondo: #0d0f12
Border: .5px solid #1a1d22
Border-radius: 10px
Item hover: background #131619
Item activo: color gold2 (#c4a86a)
Shadow: 0 8px 24px rgba(0,0,0,.4)
```

**Ajustes / Capabilities:**
```
Layout: mismas 3 columnas del Command Centre
Lista de servicios: cada item con dot verde/gris + nombre DM Sans +
descripción DM Mono gris + estado a la derecha
Verde (#4ecb8d): servicio activo
Gris (#3e3d48): sin clave / no configurado
Rojo (#e05c5c): error / cuota agotada
```

**Notificaciones push:**
```
Icono: ✦ gold sobre fondo oscuro (usar icon-192.png)
Título: Syne, máximo 50 caracteres
Cuerpo: DM Sans, máximo 100 caracteres, máximo 2 líneas
Nunca incluir importes financieros en el cuerpo
Ejemplos:
  Título: "Vera · 2 urgentes hoy"
  Cuerpo: "Coche Sogndal vence en 14 días. IAfont sin mover."
```

**Pantalla de tarea individual desktop:**
```
Reutilizar TaskDetailPanel del ref-tasks-desktop.html
Mismo contenido que ref-task-detail.html (móvil) adaptado al espacio
No crear un componente nuevo — es el mismo con más ancho disponible
```

---

## REGLAS DE DESARROLLO

1. **Turso como única fuente de verdad.** Mismo schema en dev (`file:./vera.db`) y prod (Turso remoto).
2. **Un archivo por agente.** Los agentes son independientes entre sí.
3. **Siempre draft antes de enviar.** ExecutorAgent nunca envía sin confirmación visual.
4. **El sistema nunca actúa destructivamente.** Soft delete siempre. Archivar, nunca borrar.
5. **Fallback para todo.** Capa de capabilities + degradación elegante. Si Claude falla, la UI no se rompe.
6. **Privacidad financiera.** Datos económicos **cifrados en reposo**, nunca incluidos en llamadas a Claude API, enmascarados en móvil. El servidor no puede descifrarlos.
7. **Mobile first en el ritual matutino y la captura.** Command Centre es desktop.
8. **No spamear a Sebastián.** Cooldowns en AlertAgent. Máximo 3 push/día.
9. **PIN siempre.** Sin sesión válida, no se sirve nada. Ni un GET de tasks.
10. **Cron secret.** Endpoints `/api/cron/*` verifican `Authorization: Bearer $CRON_SECRET`.
11. **No `node-cron`.** Vercel es serverless. Toda programación va por Vercel Cron Jobs.
12. **Variables `NEXT_PUBLIC_*` no son secretas.** `MASK_FACTOR` y `MASK_OFFSET` se exponen al cliente — son ofuscación, no seguridad. Lo verdaderamente sensible (Anthropic key, Twilio, etc.) NUNCA lleva el prefijo `NEXT_PUBLIC_`.
13. **`isMobile()` nunca en SSR.** La función usa `window.innerWidth` — sólo llamarla en `useEffect` o con `typeof window !== 'undefined'`. El componente `<Amount/>` debe usar `useEffect` para determinar si enmascarar, con el valor real como estado inicial para evitar hydration mismatch.
14. **Estructura App Router:** rutas públicas (`/setup`, `/lock`) fuera del grupo `(app)`. Todo lo autenticado dentro de `app/(app)/`. El middleware verifica sesión en cada request al grupo `(app)`.

---

## DISEÑO UX

**El documento canónico de diseño es `vera-ux-design.md`.** Léelo antes de implementar cualquier componente de UI. Contiene:
- Identidad visual completa (colores, tipografías, símbolo ✦)
- Convenciones de componentes (código de color de tareas, chips, contadores)
- Todas las pantallas móviles cerradas con especificación detallada
- Command Centre desktop con especificación del orbital
- Notas de implementación por componente
- Lista de pantallas pendientes de diseñar

**Pantallas cerradas (no cambiar sin actualizar vera-ux-design.md):**

*Móvil:*
- Lock screen — PIN + Face ID + frases rotantes (`src/lib/quotes.ts`)
- Captura rápida — 3 estados (reposo · grabando · confirmación)
- Home — scroll único, 5 secciones, FAB gold
- Ritual matutino — 5 pasos, línea gold de progreso

*Desktop:*
- Command Centre — 3 columnas, orbital 6 agentes, bottom bar

**Fichero de frases:** `src/lib/quotes.ts` — 100 frases en inglés, palabra ancla con `*asteriscos*`, helpers `getRandomQuote()`, `getDailyQuote()`, `parseQuote()`.

## ARCHIVOS DE REFERENCIA

### Documentación principal
- `vera-ux-design.md` — **Especificación UX canónica**. Leer antes de implementar cualquier componente.
- `vera-seed-data.ts` — Datos iniciales para seed (importes en `monthlyAmountPlaintext` → cifrar antes de insertar)
- `vera-memoria-completa.md` — Memoria completa del proyecto
- `src/lib/quotes.ts` — 100 frases para la lock screen

### HTMLs de referencia visual — tabla completa

| Fichero | Pantalla | Fase | Componente |
|---------|----------|------|-----------|
| `reference/ref-setup.html` | Setup — Primer arranque | 0 | `src/app/setup/page.tsx` |
| `reference/ref-lock-screen.html` | Lock Screen — PIN + Face ID | 0 | `src/app/lock/page.tsx` |
| `reference/ref-command-centre.html` | Command Centre Desktop | 0 | `src/app/(app)/dashboard/page.tsx` |
| `reference/ref-tasks-desktop.html` | Tareas Desktop + panel detalle | 0/2 | `src/app/(app)/tasks/page.tsx` |
| `reference/ref-capture.html` | Captura Rápida — 3 estados | 1 | `src/components/capture/CaptureSheet.tsx` |
| `reference/ref-morning-ritual.html` | Ritual Matutino — 5 pasos | 1 | `src/components/morning/MorningRitual.tsx` |
| `reference/ref-home-mobile.html` | Home Móvil — scroll 5 secciones | 1 | `src/app/(app)/page.tsx` |
| `reference/ref-task-detail.html` | Tarea Individual Móvil | 1 | `src/app/(app)/tasks/[id]/page.tsx` |
| `reference/ref-properties-desktop.html` | Propiedades — 3 columnas | 2 | `src/app/(app)/properties/page.tsx` |
| `reference/ref-trips-desktop.html` | Viajes Desktop | 2 | `src/app/(app)/trips/page.tsx` |
| `reference/ref-inbox-desktop.html` | Inbox Desktop | 2 | `src/app/(app)/inbox/page.tsx` |
| `reference/ref-agent-panel.html` | Panel de Agente (orbital) | 2 | `src/components/command/AgentPanel.tsx` |
| `reference/ref-inbox.html` | Inbox Móvil — cartas swipe | 3 | `src/components/inbox/InboxCard.tsx` |

**Pantallas sin HTML:** inferir del sistema visual.
Ver sección "PANTALLAS SIN DISEÑO EXPLÍCITO — REGLAS DE INFERENCIA".

---

## PREGUNTAS FRECUENTES

**¿Por qué Turso y no Postgres?**
Sebastián quiere control total y simplicidad. SQLite distribuido conserva esa filosofía: archivo único, schema simple, portable. Turso añade sync multi-dispositivo sin cambiar la API de Drizzle.

**¿Por qué no usar una solución existente (Notion, Todoist, etc.)?**
Vera no es un gestor de tareas. Es un sistema con contexto vital específico, agentes autónomos, captura universal y memoria persistente. Y con cifrado de finanzas propio.

**¿Claude tiene memoria entre sesiones?**
No. Por eso la memoria vive en Turso. Cada llamada a Claude incluye el contexto relevante construido desde la base de datos. La memoria es del sistema, no del modelo.

**¿Qué pasa si no hay internet?**
La PWA cachea la última vista. CRUD offline limitado: se puede capturar al Inbox (cola local) y registrar peso. Sync automático al volver online. Las llamadas a Claude y APIs externas degradan según capabilities.

**¿Qué pasa si Sebastián olvida el PIN?**
Pierde acceso a los importes cifrados. El resto del sistema (tareas, eventos, peso) sigue accesible si el PIN se resetea — pero los importes históricos quedan ilegibles. Mitigación: PIN de recuperación en Fase 2, o exportar backup cifrado de la clave maestra.

**¿Puede alguien con acceso a Turso ver mis importes?**
No. Los importes están cifrados con AES-GCM usando una clave que sólo existe en el navegador de Sebastián mientras tiene la sesión abierta. Turso almacena ciphertext.

**¿Y la fórmula de enmascaramiento es segura?**
No. Es ofuscación visual contra miradas casuales en móvil. La seguridad real viene del cifrado AES. La fórmula es una capa de comodidad, no de protección.

---

*Este fichero es el alma de Vera. Léelo completo antes de empezar.*
*Versión 0.2 · Mayo 2026 · Sebastián*
