# VERA — Sistema Operativo de Vida Personal
**Versión actual:** v1.01+  
**Propietario:** Sebastián Font  
**Estado:** Funcional · En producción (Vercel) · Seguridad P0 completa

---

## QUÉ ES VERA

Vera es un sistema operativo de vida personal, no una app de tareas genérica. Es un segundo cerebro activo que:
- Captura cualquier cosa de cualquier canal en 2-3 segundos
- Recuerda todo sin que se lo repitas
- Conecta puntos que no tienes tiempo de conectar
- Actúa cuando puede, pregunta cuando debe, respeta cuando toca
- Conoce los principios de Sebastián y los aplica sin explicarlos cada vez

**El nombre:** Vera. En latín, *verdad*. Se habla con ella por voz: "Oye Vera…"

---

## QUIÉN ES SEBASTIÁN

- Se levanta a las 7h. Ritual matutino de 15-20 min.
- Personal Trainer lunes y miércoles (en pausa hasta junio)
- Principio económico base: antes de gastar, agotar opciones propias
- Captura instantánea como hábito más importante — 2-3 segundos, sin fricción
- Él decide siempre — Vera propone, Sebastián aprueba

**Sus 3 propiedades:**
- **Flat** · Palma (piso)
- **Sarapita** · Campos (casa + parcela)
- **Willy's** · Marratxí (finca, eventos, escenario, piscina)

**Viajes 2026:**
| Viaje | Fechas | Quién |
|-------|--------|-------|
| Madrid · Bruno Mars | 11-12 jul | pareja |
| Escandinavia | 15-27 jul | familia |
| Alcudia / Pto. Pollença | 7-9 ago | familia |
| Cofrentes | 14-17 ago | familia |
| Zaragoza | 10-12 oct | amigos |
| Como + Milán | 28 dic - 1 ene | familia |

**Proyectos creativos:**
- **IAfont** (Substack IA) — slot máximo JUNIO
- **IAxLabs** (laboratorio experimental) — slot máximo JUNIO

---

## STACK TÉCNICO

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js App Router | 16.2.6 |
| Base de datos | Turso (libSQL) + Drizzle ORM | libSQL 0.17.3, Drizzle 0.45.2 |
| Auth | JWT (jose) + bcrypt + WebAuthn + OAuth Google | jose 6.2.3, bcryptjs 3.0.3 |
| IA | Anthropic Claude API | @anthropic-ai/sdk 0.100.1 |
| Frontend | React 19 + Tailwind | React 19.2.4 |
| Criptografía | AES-GCM (WebCrypto nativo + tokenCrypto.ts) | sin deps externos |
| Notificaciones | Web Push (VAPID) | web-push 3.6.7 |
| Email | Resend | 6.12.4 |
| Hosting | Vercel | — |
| Cron | Vercel Cron Jobs | — |
| Validación | Zod | ^4.4.3 |

**Regla mental:** la app funciona con Turso + Anthropic como mínimo. Todo lo demás es opcional y degrada con elegancia.

---

## ARQUITECTURA

```
┌─────────────────────────────────────────────┐
│  Dispositivos                               │
│  ─ Móvil PWA  ─ Desktop browser  ─ Tablet   │
└────────────────┬────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────┐
│  Next.js 16 en Vercel                       │
│                                             │
│  src/proxy.ts (Middleware centralizado)     │
│  ├─ Rutas públicas (17): /setup, /lock, etc.│
│  ├─ Rutas protegidas (64+): requieren JWT   │
│  ├─ Rutas cron: requieren CRON_SECRET       │
│  └─ Rutas admin: requieren role='admin'     │
│                                             │
│  API Routes (64 endpoints)                  │
│  ├─ /api/auth/* (PIN + WebAuthn + OAuth)    │
│  ├─ /api/tasks/*                            │
│  ├─ /api/agents/* (ejecutores de agentes)   │
│  ├─ /api/finance/* (datos cifrados)         │
│  ├─ /api/calendar/* (Google Calendar sync) │
│  └─ ...30+ más                              │
│                                             │
│  Agentes (8)                                │
│  ├─ AlertAgent, PrioAgent                   │
│  ├─ ContactAgent, DraftAgent, PackingAgent  │
│  ├─ SearchAgent, ExecutorAgent              │
│  └─ SolutionAgent                           │
│                                             │
│  Crons (Vercel, 2 diarios)                  │
│  ├─ 6:30 AM → PrioAgent                     │
│  └─ 7:00 AM → AlertAgent                    │
└────────────────┬────────────────────────────┘
                 │ Drizzle ORM + libSQL client
                 ▼
┌─────────────────────────────────────────────┐
│  Turso (SQLite distribuido)                 │
│  ─ 17 tablas                                │
│  ─ Campos financieros cifrados AES-GCM      │
│  ─ Google tokens cifrados AES-256-GCM       │
└─────────────────────────────────────────────┘

  Servicios externos (opcionales salvo Anthropic):
  ─ Anthropic (IA) ← obligatorio
  ─ Google OAuth + Google Calendar
  ─ Brave Search (búsqueda)
  ─ Resend (email)
  ─ Twilio (WhatsApp)
  ─ VAPID (push notifications)
```

---

## BASE DE DATOS — 17 TABLAS

### Tablas core
| Tabla | Propósito |
|-------|----------|
| `auth` | PIN hash + WebAuthn + rol (user/admin) |
| `properties` | Las 3 propiedades (flat, sarapita, willys) |
| `tasks` | Tareas con prioridad dinámica + recurrencia |
| `weightLog` | Registro diario de peso + 5 pilares SNM |
| `events` | Viajes y eventos (con sync Google Calendar) |
| `inbox` | Capturas sin procesar |
| `memory` | Key-value store de contexto para agentes |
| `agentLog` | Historial de ejecuciones de agentes |
| `notifications` | Notificaciones enviadas + cooldowns |
| `contracts` | Contratos con importes cifrados AES-GCM |
| `contacts` | Personas en órbita (para sugerencias social) |

### Tablas adicionales implementadas
| Tabla | Propósito |
|-------|----------|
| `projects` | Proyectos creativos (IAfont, IAxLabs) |
| `webauthnCredentials` | Credenciales Face ID / biometría |
| `pushSubscriptions` | Suscripciones VAPID |
| `financeRecords` | Sistema de finanzas con campos cifrados |
| `expenses` | Gastos por propiedad/proyecto |
| `attachments` | Adjuntos en tareas |

---

## AUTENTICACIÓN — 3 MÉTODOS

```
MÉTODO 1: PIN (6 dígitos)
  PIN nunca viaja al servidor en claro → bcrypt(pin + salt)
  Cookie JWT firmada, 30 días
  PIN deriva clave AES (PBKDF2) → vive en sessionStorage
  Lockout exponencial tras 3 fallos

MÉTODO 2: WebAuthn (Face ID, fingerprint)
  Credenciales en tabla webauthnCredentials
  JWT al verificar

MÉTODO 3: Google OAuth
  Redirect Google → callback → JWT
  Tokens cifrados AES-256-GCM en tabla memory
```

---

## AGENTES — 8 IMPLEMENTADOS

| Agente | Trigger | Propósito |
|--------|---------|----------|
| **PrioAgent** | Cron 6:30 + on-demand | Recalcula prioridades (base + staleness + proximity + season) |
| **AlertAgent** | Cron 7:00 + on-demand | Push notifications con cooldowns; máx 3/día |
| **ContactAgent** | Diario | Sugiere contactar personas en órbita |
| **DraftAgent** | On-demand | Redacta posts (Substack, LinkedIn, Twitter) |
| **ExecutorAgent** | On-demand | Email/WhatsApp: siempre draft → confirmación → envío |
| **PackingAgent** | On-demand | Listas de embalaje para viajes |
| **SearchAgent** | On-demand | Brave Search + resumen Claude; top 3 con links |
| **SolutionAgent** | On-demand | Propuestas DIY → mixta → profesional |

VoiceAgent vive en `/api/voice/route.ts` (no como archivo separado). Incluye fast-path VERA+ (trigger "jarvis:").

---

## SEGURIDAD — ESTADO ACTUAL

Fase P0 completada (8 junio 2026). 5/5 vulnerabilidades críticas cerradas:

| Vulnerabilidad | Solución | Estado |
|----------------|---------|--------|
| 50+ endpoints sin auth | `src/proxy.ts` centralizado | ✅ |
| NEXT_PUBLIC_CRON_SECRET expuesto | `/api/admin/run-agent` + proxy | ✅ |
| Admin endpoints sin roles | Sistema user/admin en JWT | ✅ |
| Google OAuth tokens en plaintext | AES-256-GCM (`tokenCrypto.ts`) | ✅ |
| Validación de inputs débil | Zod schemas centralizados | ✅ |

**Flujo de seguridad de cada request:**
```
Request → proxy.ts
  ¿Pública? → ALLOW
  ¿Cron?    → verifica CRON_SECRET
  ¿Sesión?  → no: 401 (API) / /lock (páginas)
  ¿Admin?   → verifica role='admin' o 403
  → endpoint handler
```

**Cifrado en reposo:**
- Importes de contratos: AES-GCM con clave derivada del PIN (solo descifra el cliente)
- Google OAuth tokens: AES-256-GCM con PBKDF2 de SESSION_SECRET
- El servidor no puede descifrar importes financieros

---

## DISEÑO VISUAL

```css
--bg: #07080a  --bg2: #0d0f12  --bg3: #131619  --bg4: #1a1d22
--text: #eceae2  --text2: #7d7c87  --text3: #3e3d48
--gold: #e8d5a3   /* color principal VERA */
--gold2: #c4a86a  /* bordes activos, logo */
--green: #4ecb8d  /* activo, ok */
--red: #e05c5c    /* urgente, alerta */
--amber: #e8a020  /* atención, stale */
--blue: #5ba8e8   /* viajes, info */
--purple: #9b7fe8 /* sugerencias VERA */
```

Tipografías: **Syne** (headers) · **DM Sans** (texto) · **DM Mono** (datos, código)  
Símbolo: ✦ — identidad visual de Vera

---

## PANTALLAS IMPLEMENTADAS

**Móvil (PWA):**
- Lock Screen — PIN 6 dígitos + Face ID + frases rotantes
- Captura Rápida — 3 estados (reposo · grabando · confirmación)
- Home — scroll 5 secciones + FAB gold
- Ritual Matutino — 5 pasos con línea gold de progreso

**Desktop:**
- Command Centre — 3 columnas, orbital 6 agentes, bottom bar

**Rutas adicionales:** tasks, contacts, contracts, finance, inbox, trips, projects, properties, vehicles, weight, settings, morning, share

---

## VARIABLES DE ENTORNO REQUERIDAS

```env
# Obligatorias
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
ANTHROPIC_API_KEY=
SESSION_SECRET=           # JWT + derivación de clave cifrado
CRON_SECRET=              # Vercel Cron Jobs
PIN_KDF_SALT=             # Derivación clave AES de PIN

# Opcionales (capabilities)
OPENAI_API_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
BRAVE_SEARCH_API_KEY=
VAPID_PUBLIC_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Enmascaramiento financiero en móvil (ofuscación visual)
NEXT_PUBLIC_MASK_FACTOR=1.37
NEXT_PUBLIC_MASK_OFFSET=487
```

---

## ESTRUCTURA DE DIRECTORIOS

```
vera-v1/
├── src/
│   ├── app/
│   │   ├── (app)/              # Rutas autenticadas
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── contacts/
│   │   │   ├── contracts/
│   │   │   ├── finance/
│   │   │   ├── inbox/
│   │   │   ├── morning/
│   │   │   ├── projects/
│   │   │   ├── properties/
│   │   │   ├── trips/
│   │   │   ├── vehicles/
│   │   │   ├── weight/
│   │   │   └── settings/
│   │   ├── api/                # 64 endpoints
│   │   │   ├── auth/           # PIN + WebAuthn + Google OAuth
│   │   │   ├── admin/          # Endpoints protegidos role=admin
│   │   │   ├── agents/         # Ejecutores de agentes
│   │   │   ├── cron/           # Vercel Cron Jobs
│   │   │   └── [recursos]/     # tasks, contacts, etc.
│   │   ├── setup/              # First-run setup
│   │   └── lock/               # Login
│   ├── lib/
│   │   ├── agents/             # 8 archivos de agentes
│   │   ├── db/
│   │   │   ├── schema.ts       # 17 tablas
│   │   │   └── index.ts        # Cliente Drizzle
│   │   ├── validation/
│   │   │   ├── schemas.ts      # Zod schemas
│   │   │   └── validate.ts     # Helpers
│   │   ├── auth.ts             # JWT + SessionData
│   │   ├── crypto.ts           # AES-GCM + PBKDF2 (finanzas, cliente)
│   │   ├── tokenCrypto.ts      # AES-256-GCM para Google tokens
│   │   ├── capabilities.ts     # Detección de servicios externos
│   │   ├── googleCalendar.ts   # Google Calendar sync
│   │   ├── amivera.ts          # VERA+ pipeline (fast path)
│   │   ├── finance-mask.ts     # Enmascaramiento móvil
│   │   ├── claude.ts           # System prompt builder
│   │   ├── quotes.ts           # 100 frases lock screen
│   │   └── version.ts
│   ├── components/             # React components
│   └── proxy.ts                # Middleware de autenticación
├── public/
│   ├── sw.js                   # Service Worker PWA
│   └── manifest.json           # PWA manifest
├── reference/                  # HTMLs de referencia visual por pantalla
├── how_we_got_here/            # Historial de documentos anteriores
├── vercel.json                 # Cron Jobs config
├── CLAUDE.md                   # Instrucciones para Claude Code
└── VERA.md                     # Este archivo
```

---

## VERCEL CRON JOBS

```json
{ "path": "/api/cron/prio",   "schedule": "30 6 * * *" }
{ "path": "/api/cron/alerts", "schedule": "0 7 * * *"  }
```

Ambos verifican `Authorization: Bearer $CRON_SECRET`.

---

## COMANDOS DE DESARROLLO

```bash
npm run dev          # Servidor local
npm run build        # Build de producción
npm run db:push      # Sincronizar schema con Turso
npm run db:studio    # Explorar DB en UI visual
```

---

## FASES DE DESARROLLO

| Fase | Estado | Contenido |
|------|--------|----------|
| **Fase 0** — Walking Skeleton | ✅ | Next.js + Turso + Auth PIN + CRUD tareas + deploy |
| **Fase P0** — Seguridad | ✅ | 5 vulnerabilidades cerradas (middleware, cifrado, validación) |
| **Fase 1** — Captura + Ritual | ✅ | VoiceAgent, ritual matutino, briefing, PWA |
| **Fase 2** — Vistas desktop | ✅ | Tareas, propiedades, viajes, inbox, agentes orbital |
| **Fase 3** — Agentes activos | ✅ | Alertas push, búsqueda, email, soluciones |
| **Fase 4** — Autonomía | En progreso | Finanzas cifradas, WebAuthn, Google OAuth/Calendar |

---

*Actualizar este archivo en cada sesión de desarrollo relevante.*  
*Versión del documento: junio 2026*
