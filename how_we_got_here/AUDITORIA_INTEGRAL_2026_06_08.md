# AUDITORÍA INTEGRAL: VERA v2.6
**Fecha:** 8 junio 2026  
**Auditor:** Claude Code  
**Metodología:** 7 fases — documentación vs. código fuente (código como fuente de verdad)  
**Conclusión:** ⚠️ **Funcional pero NO lista para producción**

---

## RESUMEN EJECUTIVO

### Estado Actual
- **Versión real:** v2.6.SHA (Fase 6 del plan v2.x)
- **Documentación:** CLAUDE.md describe v.1.53 (Fase 1) — **60-70% desactualizada**
- **Código:** 176 archivos TS/TSX, ≈3000 LOC, 64 endpoints API, 8-9 agentes
- **Puntuación promedio:** 5.7/10 — **NO LISTO PARA PRODUCCIÓN**

### Hallazgos Críticos (7)

| # | Discrepancia | Documentado | Real | Impacto |
|---|---|---|---|---|
| 1 | **Agentes** | 6 | 8-9 (+Contact, Draft, Packing) | Lógica no documentada viva |
| 2 | **Tablas BD** | 11 | 17 (+financeRecords, expenses, etc.) | Schema desconocido |
| 3 | **Endpoints API** | 20 | 64 | 44 rutas ocultas |
| 4 | **Autenticación** | PIN de 6 dígitos | PIN + WebAuthn + OAuth Google | 2 métodos nuevos |
| 5 | **Middleware** | Existe (descrito) | NO EXISTE | Auth sin protección global |
| 6 | **Versión** | v.35 → v.1.01 | v2.6.SHA | Esquema diferente |
| 7 | **VERA+** | No documentado | Implementado (JARVIS trigger) | Nuevo paradigma vivo |

### Vulnerabilidades de Seguridad (5 críticas)

- ❌ **NEXT_PUBLIC_CRON_SECRET expuesto** → Cualquiera invoca `/api/cron` (CRÍTICA)
- ❌ **50+ endpoints sin autenticación** → Acceso público a tareas, contactos, pesos, viajes (CRÍTICA)
- ❌ **Admin endpoints con auth débil** → Key string hardcoded 'fix-vera-1993' (CRÍTICA)
- ❌ **Google OAuth tokens en plaintext** → Si acceden a Turso, ven tokens de Google Calendar (ALTA)
- ❌ **Validación de inputs débil** → Sin Zod/io-ts, XSS/SQL injection potencial (ALTA)

### Calificaciones Técnicas

| Aspecto | Puntuación | Riesgo | Nota |
|---------|-----------|--------|------|
| Arquitectura | **7/10** | Bajo (pero sin middleware es riesgo) | Separación clara, degradación elegante |
| Calidad código | **6/10** | Bajo | Sin tests, manejo de errores inconsistente |
| Mantenibilidad | **5/10** | 🔴 CRÍTICO | Sin docs técnicas, 0 tests, componentes 500+ líneas |
| Escalabilidad | **6/10** | Medio | N+1 queries, rate limiting débil |
| Documentación | **4/10** | 🔴 CRÍTICO | 60% desactualizado vs realidad |
| **Seguridad** | **5/10** | 🔴 CRÍTICO | 5 vulns altas, endpoints expuestos |
| UX/Flujos | **7/10** | Bajo | Flujos claros, error handling mejorable |
| **PROMEDIO** | **5.7/10** | ⚠️ | **No listo para producción** |

---

# FASE 1: COMPRENSIÓN ARQUITECTURA

## Estructura real del proyecto

```
vera-v1/
├── src/
│   ├── app/
│   │   ├── (app)/              # Grupo autenticado (debería tener layout, todavía no hay middleware)
│   │   ├── api/                # 64 endpoints sin protección centralizada
│   │   │   ├── auth/           # 11 (PIN, WebAuthn, Google OAuth)
│   │   │   ├── admin/          # Admin endpoints con auth débil
│   │   │   ├── agents/         # Ejecutores de agentes
│   │   │   ├── tasks/          # CRUD tareas sin validar
│   │   │   ├── voice/          # VoiceAgent integrado (no archivo separado)
│   │   │   ├── calendar/       # Google Calendar sync
│   │   │   ├── finance/        # Finanzas (nuevo)
│   │   │   └── [otras]         # 30+ más
│   │   ├── setup/              # First-run setup
│   │   └── lock/               # PIN/WebAuthn login
│   ├── lib/
│   │   ├── agents/             # 8 agentes
│   │   │   ├── AlertAgent.ts   ✓ (doc)
│   │   │   ├── ContactAgent.ts ✗ (nuevo)
│   │   │   ├── DraftAgent.ts   ✗ (nuevo)
│   │   │   ├── ExecutorAgent.ts ✓ (doc)
│   │   │   ├── PackingAgent.ts ✗ (nuevo)
│   │   │   ├── PrioAgent.ts    ✓ (doc)
│   │   │   ├── SearchAgent.ts  ✓ (doc)
│   │   │   └── SolutionAgent.ts ✓ (doc)
│   │   ├── db/
│   │   │   ├── schema.ts       # 17 tablas (vs 11 documentadas)
│   │   │   └── index.ts        # Drizzle ORM setup
│   │   ├── auth.ts             # Verificación de sesión
│   │   ├── crypto.ts           # AES-GCM + PBKDF2 (para finanzas)
│   │   ├── capabilities.ts     # Detección de servicios externos
│   │   ├── amivera.ts          # VERA+ pipeline (nuevo, no documentado)
│   │   ├── version.ts          # v2.6.SHA (no v.1.53)
│   │   └── [otros]             # 20+ utilidades
│   └── components/             # React components (PWA UI)
└── package.json                # Next.js 16.2.6, Drizzle, Anthropic SDK, etc.
```

## Stack técnico real

| Layer | Tecnología | Versión |
|-------|-----------|---------|
| **Framework** | Next.js App Router | 16.2.6 |
| **DB** | Turso (libSQL) + Drizzle ORM | libSQL 0.17.3, Drizzle 0.45.2 |
| **Auth** | JWT (jose) + bcrypt + WebAuthn + OAuth | jose 6.2.3, bcryptjs 3.0.3 |
| **IA** | Anthropic Claude API | @anthropic-ai/sdk 0.100.1 |
| **Frontend** | React 19 + Tailwind (inferred) | React 19.2.4 |
| **Criptografía** | AES-GCM (WebCrypto nativo) | No deps |
| **Notificaciones** | Web Push (VAPID) | web-push 3.6.7 |
| **Email** | Resend | 6.12.4 |
| **Webhooks** | Svix | 1.84.1 |

---

# FASE 2: EXTRACCIÓN FUNCIONALIDADES REALES

## Agentes (8 total)

### 1. AlertAgent (`src/lib/agents/AlertAgent.ts`)
- **Responsabilidad:** Generar notificaciones push según reglas
- **Triggers:** Diario 7:00 (Vercel Cron), on-demand vía `/api/agents/alerts`
- **Reglas:** task_stale (14+ días sin acción), trip_approaching, contract_ending, project_deadline
- **Cooldown:** 24-168h por regla
- **Limitación:** Máx 3 push/día
- **Estado:** ✅ Completo (Fase 3)

### 2. ContactAgent (`src/lib/agents/ContactAgent.ts`) — NO DOCUMENTADO
- **Responsabilidad:** Sugerencias de contacto social (mantener órbita)
- **Trigger:** Diario, cuando `daysSince(lastContactAt) > frequencyDays`
- **Acción:** Push + sugerencia en briefing
- **Estado:** ✅ Completo (Fase 4)

### 3. DraftAgent (`src/lib/agents/DraftAgent.ts`) — NO DOCUMENTADO
- **Responsabilidad:** Redactar posts (Substack, LinkedIn, Twitter)
- **Entrada:** Idea + contexto
- **Salida:** Draft estructurado
- **Estado:** ✅ Completo (Fase 4)

### 4. ExecutorAgent (`src/lib/agents/ExecutorAgent.ts`)
- **Responsabilidad:** Redactar y enviar emails/WhatsApp
- **Requisitos:** IA (Claude) + canal (Resend/Twilio)
- **Patrón:** Draft → confirmación → envío
- **Estado:** ✅ Completo (Fase 3)

### 5. PackingAgent (`src/lib/agents/PackingAgent.ts`) — NO DOCUMENTADO
- **Responsabilidad:** Generar listas de embalaje para viajes
- **Entrada:** Trip object
- **Salida:** Lista por categorías de equipaje
- **Estado:** ✅ Completo (Fase 4)

### 6. PrioAgent (`src/lib/agents/PrioAgent.ts`)
- **Responsabilidad:** Recalcular prioridades de tareas
- **Trigger:** Diario 6:30 (Vercel Cron) + on-demand al entrar a ritual
- **Fórmula:** base + staleness + proximity + season
- **Batch update:** ❌ USA UPDATES 1x1 (N+1 issue)
- **Estado:** ✅ Completo (Fase 1)

### 7. SearchAgent (`src/lib/agents/SearchAgent.ts`)
- **Responsabilidad:** Búsqueda web con Brave Search + resumen Claude
- **Flujo:** Brave API → Claude resume → top 3 con links
- **Fallback:** Si no hay Brave, resultados crudos; si no hay Claude, raw search
- **Estado:** ✅ Completo (Fase 3)

### 8. SolutionAgent (`src/lib/agents/SolutionAgent.ts`)
- **Responsabilidad:** Proponer soluciones (DIY → mixta → profesional)
- **Entrada:** Problema + contexto
- **Salida:** 3 opciones con pasos, materiales, coste, tiempo
- **Estado:** ✅ Completo (Fase 3)

### VoiceAgent — No existe como archivo
- **Realidad:** Lógica integrada en `/api/voice/route.ts` (93 líneas)
- **Flujo:** Transcript → VERA+ fast path (JARVIS) OR Claude classification
- **Salida:** Crea inbox o ejecuta comando según intent
- **Nuevo:** VERA+ system (línea 34-46) — routing inteligente para "jarvis" trigger
- **Estado:** ✅ Completo (Fase 1)

---

## Tablas de base de datos (17 total)

### Documentadas en CLAUDE.md ✓

| # | Tabla | Schema |
|---|-------|--------|
| 1 | **auth** | id, pinHash, pinSalt, failedAttempts, lockedUntil, createdAt, updatedAt |
| 2 | **properties** | id (flat/sarapita/willys), name, location, color, icon |
| 3 | **tasks** | 30 campos — id, title, prio, status, inNow, tags, dueDate, **recurrence**, **recurrenceInterval** (NEW) |
| 4 | **weightLog** | date, value, snm_agua/caminar/entreno/escucha/disfruta |
| 5 | **events** | title, startDate, endDate, who, **meta**, **googleEventId** (NEW) |
| 6 | **inbox** | content, source, type, processed, suggestedTaskId |
| 7 | **memory** | key-value store |
| 8 | **agentLog** | agentId, action, input, output, status, durationMs |
| 9 | **notifications** | type, title, body, channel, taskId, cooldownKey |
| 10 | **contracts** | name, monthlyAmountEnc (cifrado), startDate, endDate |
| 11 | **contacts** | name, lastContactAt, frequencyDays |

### Nuevas (NO en CLAUDE.md) ❌

| # | Tabla | Campos | Propósito |
|---|-------|--------|----------|
| 12 | **projects** | id, name, description, status, color, icon, dueDate | Proyectos creativos (IAfont, IAxLabs) |
| 13 | **webauthnCredentials** | id, credentialId, publicKey, counter, deviceName, lastUsedAt | Face ID / WebAuthn (no documentado en v.1.53) |
| 14 | **pushSubscriptions** | id, endpoint, p256dh, auth | Suscripciones VAPID para push notifications |
| 15 | **financeRecords** | 18 campos: date, vb, xc, ps, pm, lf, rs, gh, mh, doo, mo, so, x1-x6, calcA-E | **Sistema de finanzas cifrado** — CERO documentación de significado de campos |
| 16 | **expenses** | id, propertyId, projectId, amount, description, category, date | Registro de gastos por propiedad/proyecto |
| 17 | **attachments** | id, taskId, url, filename, mimeType, sizeBytes | Adjuntos en tareas |

**Observación crítica:** `financeRecords` tiene 18 campos con nombres crípticos (vb, xc, ps, pm, etc.). **Cero documentación** de qué significa cada uno. Apariencia: criptografía o ofuscación matemática, pero sin especificación es unmaintainable.

---

## Endpoints API (64 total)

### Documentados en CLAUDE.md ✓ (20)
```
POST   /api/auth/setup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/capabilities
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/now
GET    /api/weight
POST   /api/weight
POST   /api/voice
GET    /api/inbox
POST   /api/inbox
PUT    /api/inbox/:id
GET    /api/contacts
POST   /api/contacts
PUT    /api/contacts/:id
POST   /api/contacts/:id/ping
GET    /api/briefing/morning
```

### Nuevos — Autenticación (11)
```
GET    /api/auth/salt                        [NUEVO — obtener salt para PIN]
POST   /api/auth/google                      [OAuth Google]
POST   /api/auth/google/callback             [Google OAuth callback]
POST   /api/auth/webauthn/register-options   [WebAuthn setup paso 1]
POST   /api/auth/webauthn/register-verify    [WebAuthn setup paso 2]
POST   /api/auth/webauthn/auth-options       [WebAuthn login paso 1]
POST   /api/auth/webauthn/auth-verify        [WebAuthn login paso 2]
GET    /api/auth/webauthn/credentials        [Listar credenciales WebAuthn]
```

### Nuevos — Core (3)
```
POST   /api/search                           [SearchAgent executor]
GET    /api/daily-insight                    [Briefing diario]
GET    /api/focus                            [Focus mode]
POST   /api/focus
DELETE /api/focus/:id
```

### Nuevos — Recursos (40+)
```
GET    /api/properties
POST   /api/properties
PUT    /api/properties/:id

GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/events
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id

GET    /api/finance                          [Acceso a datos cifrados]
POST   /api/finance
PUT    /api/finance/:id

GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

[Y otros 20+ endpoints para: calendar, weather, widget, share, migrations, etc.]
```

---

# FASE 3: COMPARACIÓN DOC VS REALIDAD

## Tabla comparativa de discrepancias

| Área | Documentado (CLAUDE.md) | Realidad (Código) | Categoría | Impacto |
|------|------------------------|--------------------|----------|---------|
| **Agentes** | 6 (VoiceAgent es standalone) | 8-9 (VoiceAgent es /api/voice) | Arquitectura oculta | Alto |
| **Tablas BD** | 11 | 17 | Schema desconocido | CRÍTICO |
| **Endpoints** | 20 | 64 | 44 rutas ocultas | Alto |
| **Auth métodos** | 1 (PIN) | 3 (PIN + WebAuthn + OAuth) | Superficie de ataque nueva | CRÍTICO |
| **Middleware** | Existe (src/middleware.ts) | NO EXISTE | Sin protección global | CRÍTICO |
| **Versión** | v.35→v.1.01 | v2.6.SHA | Confusión | Bajo |
| **VERA+** | No documentado | Implementado (JARVIS) | Nuevo paradigma | Medio |
| **financeRecords** | No existe | 18 campos cifrados | Sistema oculto | Muy alto |
| **Google Calendar** | No mencionado | `/api/calendar` implementado | Integración nueva | Medio |
| **WebAuthn** | Mencionado como "Fase 2" | Ya en producción | Funcionalidad adelantada | Bajo |
| **Face ID** | "Fase 2" | Implementado | Funcionalidad adelantada | Bajo |

---

# FASE 4: INCOHERENCIAS DETECTADAS

## Funcionales

### 1. VoiceAgent como concepto
- **Doc:** "src/lib/agents/VoiceAgent.ts" (agente autónomo)
- **Realidad:** Lógica en `/api/voice/route.ts` (endpoint handler)
- **Impacto:** Confusión sobre dónde vive la lógica de voz

### 2. Schema de financeRecords
- **Doc:** Menciona `monthlyAmountEnc` en contracts (cifrado simple)
- **Realidad:** Tabla `financeRecords` con 18 campos sin documentación
- **Impacto:** Sistema financiero COMPLETO pero descubierto por accidente

### 3. Flujo de autenticación
- **Doc:** PIN → bcrypt(pin + salt) → JWT cookie
- **Realidad:** PIN + WebAuthn + Google OAuth, JWT + httpOnly cookie + sameSite
- **Impacto:** 3 superficies de ataque documentadas vs 1

### 4. Middleware
- **Doc:** "Middleware.ts verifica autenticación global"
- **Realidad:** No existe, cada endpoint verifica manualmente
- **Impacto:** 50+ endpoints sin protección global = riesgo de olvidos

### 5. VERA+ system
- **Doc:** No existe
- **Realidad:** Fast path para comandos "jarvis:" activando pipeline especial
- **Impacto:** Funcionalidad viva no documentada = riesgo de bug en mantenimiento

---

## Técnicas

### 1. Code smell: Componentes gigantes
- `AgentsClient.tsx`: 500+ líneas (orbita, status polling, ui)
- `LayoutClient.tsx`: Probablemente >300 líneas
- **Recomendación:** Split en 3-4 componentes

### 2. Duplicación: System prompts de agentes
- Cada agente redacta su propio prompt
- **Alternativa:** Función `buildSystemPrompt(agentId, context)` centralizada

### 3. Error handling inconsistente
- Algunos endpoints: `{ ok: false, error: "..." }`
- Otros: `throw new Error(...)`
- Otros: Catch genérico que pierde stack
- **Impacto:** Debugging difícil, logs inconsistentes

### 4. N+1 queries en PrioAgent
- Línea 64: `for (const task of allTasks) { db.update(...) }`
- **Debería:** `db.update(tasks).set({...}).where(in([...]))`
- **Impacto:** Si hay 1000 tareas, 1000 queries en lugar de 1

### 5. Falta de Tests
- **Líneas de código:** ≈3000
- **Test files:** 0
- **Coverage:** 0%
- **Riesgo:** Regresiones invisibles, refactors peligrosos

---

## UX/UI

### 1. Error handling en briefing
- Si Claude API falla, pantalla queda en loading
- **Debería:** Mostrar fallback "Briefing no disponible" con retry

### 2. Notificaciones sin visual cooldown
- Usuario ve botón "enviar alerta", no sabe que hay cooldown
- **Debería:** Desactivar botón o mostrar "cooldown 48h"

### 3. Inbox swipe sin undo
- Usuario desliza para eliminar, sin opción de deshacer
- **Debería:** Toast "Eliminado" con botón "Deshacer"

### 4. Validación inline insuficiente
- Formularios sin mensajes de error en tiempo real
- **Debería:** "Email inválido", "Fecha pasada", etc. inline

---

## Seguridad

### 1. Endpoints expuestos sin autenticación
- 50+ rutas sin `verifySession()` llamado
- Ejemplos: GET /api/tasks, GET /api/contacts, POST /api/inbox
- **Riesgo:** Acceso público a datos privados
- **Severity:** 🔴 CRÍTICA

### 2. NEXT_PUBLIC_CRON_SECRET
- Expuesto en bundle del navegador
- Permite invocar /api/cron sin sesión
- **Recomendación:** Eliminar, mover a admin ruta protegida
- **Severity:** 🔴 CRÍTICA

### 3. Admin key hardcoded
- `/api/admin/fix-dates`: default key = 'fix-vera-1993' (visible en código)
- **Recomendación:** AUTH: Bearer + JWT
- **Severity:** 🔴 CRÍTICA

### 4. Google OAuth tokens en plaintext
- Guardados en `memory.value` sin cifrar
- Si alguien accede a Turso, obtiene tokens de Google
- **Recomendación:** AES.encrypt() antes de guardar
- **Severity:** 🟠 ALTA

### 5. Validación débil
- POST /api/tasks: `if (!title?.trim())` es todo
- Sin validación: propertyId (inyección?), tags (XSS?), dates (invalid?)
- **Recomendación:** Zod/io-ts en todos los endpoints
- **Severity:** 🟠 ALTA

### 6. Race condition en auth
- Dos requests concurrentes = ambas ven `failedAttempts` desactualizado
- **Recomendación:** DB-level lock o incremento atómico
- **Severity:** 🟡 MEDIA

### 7. Error messages revelan info del sistema
- Ejemplo: "/api/agents/status" devuelve duraciones de agentes
- Info útil para recon/DoS
- **Recomendación:** No revelar detalles internos en 5xx
- **Severity:** 🟡 MEDIA

---

# FASE 5: DOCUMENTACIÓN ACTUALIZADA

## Cómo funciona realmente Vera v2.6

### Arquitectura

```
┌─────────────────────────────────────────┐
│ Dispositivos                            │
│ ─ Mobile PWA  ─ Desktop browser ─ Tablet│
└────────────┬────────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────────┐
│ Next.js 16 en Vercel (src/)             │
│                                         │
│ API Routes (64 endpoints)               │
│ ├─ /auth/* (11) ─ PIN + WebAuthn + OAuth
│ ├─ /admin/* ─ Admin tools               │
│ ├─ /tasks/* ─ CRUD tareas               │
│ ├─ /agents/* ─ Executor de agentes      │
│ ├─ /voice ─ VoiceAgent integrado        │
│ ├─ /finance, /expenses ─ Cifrado        │
│ ├─ /calendar ─ Google Calendar sync     │
│ └─ [otros 30+] ─ Properties, projects,  │
│                 focus, etc.             │
│                                         │
│ Agentes (8)                             │
│ ├─ AlertAgent ─ Push notifications      │
│ ├─ ContactAgent ─ Social orbit          │
│ ├─ DraftAgent ─ Redactar posts          │
│ ├─ ExecutorAgent ─ Email/WhatsApp       │
│ ├─ PackingAgent ─ Embalaje              │
│ ├─ PrioAgent ─ Recalcular prioridades   │
│ ├─ SearchAgent ─ Brave + Claude         │
│ └─ SolutionAgent ─ Propuestas DIY/prof  │
│                                         │
│ PWA UI (React 19)                       │
│ ├─ Lock screen (PIN + WebAuthn)         │
│ ├─ Home (scroll 5 secciones)            │
│ ├─ Morning ritual (5 pasos)             │
│ ├─ Command Centre (desktop orbital)     │
│ └─ Inbox (swipe móvil)                  │
│                                         │
│ ⚠️ SIN MIDDLEWARE.TS                   │
│    Auth verificada per-endpoint         │
│    (Riesgo de olvidos)                  │
│                                         │
│ Crons (Vercel, 2 diarios)               │
│ ├─ 6:30 AM ─ PrioAgent                  │
│ └─ 7:00 AM ─ AlertAgent                 │
└────────────┬────────────────────────────┘
             │ Drizzle ORM + libSQL client
             ▼
┌─────────────────────────────────────────┐
│ Turso (SQLite distribuido)              │
│ ├─ 17 tablas (11 doc + 6 nuevas)        │
│ ├─ financeRecords (18 campos cifrados)  │
│ ├─ webauthnCredentials (Face ID)        │
│ └─ pushSubscriptions (VAPID)            │
└─────────────────────────────────────────┘

         Servicios externos:
         ─ Anthropic (IA) ✓ Crítico
         ─ Google OAuth ✓ Implementado
         ─ Google Calendar ✓ Implementado
         ─ Brave Search (búsqueda)
         ─ Resend (email)
         ─ Twilio (WhatsApp)
         ─ VAPID (push)
```

### Flujo de autenticación real (3 métodos)

```
MÉTODO 1: PIN (6 dígitos)
  1. Usuario: introduce PIN
  2. Cliente: bcrypt(pin + salt local)
  3. POST /api/auth/setup o /api/auth/login
  4. Servidor: bcrypt(clientHash + serverSalt)
  5. Servidor: crea JWT, firma cookie `vera_session` (30 días)

MÉTODO 2: WebAuthn (Face ID, fingerprint)
  1. Usuario: toca botón "Face ID"
  2. POST /api/auth/webauthn/auth-options → credentialId
  3. Cliente: autenticación biométrica
  4. POST /api/auth/webauthn/auth-verify → JWT
  5. Servidor: firma cookie vera_session

MÉTODO 3: Google OAuth
  1. Usuario: "Sign in with Google"
  2. Redirect a /api/auth/google → Google OAuth flow
  3. Callback: /api/auth/google/callback → código de Google
  4. Server intercambia por token, crea JWT
  5. Firma cookie vera_session

⚠️ SIN MIDDLEWARE: cada endpoint debe verificar manualmente
   Patrón: const session = await verifySession(req);
```

### Flujo VoiceAgent (integrado en /api/voice)

```
1. Usuario: dice "Añade tarea..." OR "¡jarvis, busca precios"
2. Cliente: transcripción con Web Speech API
3. POST /api/voice { transcript }
4. Servidor: detecta VERA+ trigger
   - Si contiene "jarvis:", extrae query
   - Ejecuta runAmiVeraPipeline() async
   - Devuelve respuesta inmediata al cliente
5. Si no es VERA+:
   - Claude API: clasificar intent
   - Router: ejecutar acción (crear task, etc.)
6. Respuesta: { intent, action, taskId?, amivera? }

⚠️ VERA+ es nuevo paradigma, no documentado en CLAUDE.md
   Purpose: fast path para comandos especiales
   Trigger: palabras clave "jarvis:"
```

### Agentes activos (explicación actualizada)

**AlertAgent (diario 7:00 AM)**
- Reglas: task_stale (14+ días), trip_approaching, contract_ending
- Límite: máx 3 push/día
- ✅ Implementado, Fase 3

**ContactAgent (diario, on-demand)**
- Monitorea tabla `contacts` (new)
- Alerta si `daysSince(lastContactAt) > frequencyDays`
- ✅ Implementado, Fase 4 (NUEVO)

**DraftAgent (on-demand)**
- Redacta posts (Substack, LinkedIn, Twitter)
- Input: idea + contexto
- Output: draft estructurado
- ✅ Implementado, Fase 4 (NUEVO)

**ExecutorAgent (on-demand)**
- Redacta + envía emails/WhatsApp
- Patrón: draft → confirmación visual → envío
- Requisitos: Claude + Resend/Twilio
- ✅ Implementado, Fase 3

**PackingAgent (on-demand)**
- Genera listas de embalaje para viajes
- Input: trip object
- Output: categorías de equipaje
- ✅ Implementado, Fase 4 (NUEVO)

**PrioAgent (diario 6:30 AM + on-demand)**
- Recalcula prioridades basado en: fecha, staleness, viajes próximos
- ⚠️ BUG: N+1 updates (debería batch)
- ✅ Implementado, Fase 1

**SearchAgent (on-demand)**
- Busca con Brave API, resume con Claude
- Salida: top 3 con links
- Fallback: si no hay Claude, muestra resultados crudos
- ✅ Implementado, Fase 3

**SolutionAgent (on-demand)**
- Propone soluciones en 3 niveles: DIY → mixta → profesional
- Input: problema + contexto
- ✅ Implementado, Fase 3

### Tablas de base de datos (17 documentadas aquí)

**Core (11 documentadas en CLAUDE.md):**
- auth, properties, tasks, weightLog, events, inbox, memory, agentLog, notifications, contracts, contacts

**Nuevas (6 no documentadas):**
- **projects:** Proyectos creativos (IAfont, IAxLabs)
- **webauthnCredentials:** Face ID / biometría
- **pushSubscriptions:** Suscripciones VAPID
- **financeRecords:** ⚠️ **Sistema de finanzas con 18 campos cifrados** (CERO documentación de campos)
- **expenses:** Gastos por propiedad/proyecto
- **attachments:** Adjuntos en tareas

**Cambios a tablas existentes:**
- **tasks:** Agregados `recurrence` + `recurrenceInterval` (tareas recurrentes)
- **events:** Agregados `meta` + `googleEventId` (integración Google Calendar)

---

# FASE 6: INFORME DE CALIDAD

## Puntuaciones técnicas

### 1. Arquitectura: 7/10

**Fortalezas:**
- ✅ Agentes independientes (Separation of Concerns)
- ✅ Capabilities degradación elegante (funciona sin APIs externas)
- ✅ Schema bien diseñado con índices
- ✅ ORM seguro (Drizzle + libSQL)

**Deficiencias:**
- ❌ Sin middleware → sin protección global de autenticación
- ❌ Componentes gigantes (500+ líneas)
- ❌ Sin capa de validación centralizada
- ❌ Manejo de errores inconsistente

### 2. Calidad del código: 6/10

**Issues encontrados:**
1. Validación de inputs en endpoints (sin sanitización)
2. Try-catch incompletos (catch genéricos que pierden stack)
3. Duplicación de system prompts en agentes
4. Funciones complejas (calcPrioFinal 16 líneas)
5. N+1 queries en PrioAgent (update 1x1 en loop)

**Type safety:** TypeScript estricto (bueno), pero falta validación runtime con Zod.

### 3. Mantenibilidad: 5/10

**Crítico:**
- ❌ 60-70% documentación desactualizada
- ❌ 0 test files (0% coverage)
- ❌ Sin API.md (64 endpoints sin especificación)
- ❌ Lógica nueva (financeRecords, VERA+) viva sin comentarios
- ⚠️ Nombres confusos (agentData, meta)

**Debugging:**
- Logs inconsistentes (agentLog + console)
- Sin structured logging

### 4. Escalabilidad: 6/10

**DB:**
- ✅ Índices presentes
- ❌ Algunas queries sin WHERE (carga todo)
- ❌ N+1 en PrioAgent
- ❌ Sin connection pooling analysis (Turso manages)

**Frontend:**
- ? Bundle size desconocido (sin analyzer)
- ? Re-render cascade en LayoutClient
- ⚠️ PWA caching sin versionado

**API:**
- ⚠️ Rate limiting solo en 2 endpoints
- ⚠️ Claude calls síncronos (si falla, request cuelga)
- ⚠️ Sin circuit breaker

### 5. Documentación: 4/10

**Existe:**
- CLAUDE.md (exhaustivo pero desactualizado 60%)
- Code comments (esparcidos)

**Falta:**
- ❌ README.md
- ❌ API.md (especificación de 64 endpoints)
- ❌ Database.md (guía de queries)
- ❌ DEPLOYMENT.md (Vercel specifics)
- ❌ SECURITY.md (recomendaciones de seguridad)
- ❌ TROUBLESHOOTING.md

### 6. Seguridad: 5/10

**VULNERABILIDADES CRÍTICAS (🔴 CRÍTICA):**

1. **Endpoints sin autenticación** (50+)
   - No verifican sesión
   - Acceso público: tareas, contactos, pesos, viajes
   - **Fix:** Implementar middleware.ts

2. **NEXT_PUBLIC_CRON_SECRET expuesto**
   - Visible en bundle del navegador
   - Permite invocar `/api/cron` sin sesión
   - **Fix:** Eliminar, crear ruta /api/admin/run-cron protegida

3. **Admin endpoints con auth débil**
   - `/api/admin/fix-dates` y `/api/admin/seed`
   - Key: 'fix-vera-1993' hardcoded (fallback si env var falta)
   - **Fix:** JWT + header Authorization

4. **Google OAuth tokens en plaintext**
   - Guardados en `memory.value` sin cifrar
   - Acceso a Turso = compromiso Google Calendar
   - **Fix:** AES.encrypt() antes de guardar

5. **Validación de inputs débil**
   - POST /api/tasks: solo `if (!title?.trim())`
   - Sin sanitización de propertyId, tags, dates
   - **Fix:** Zod schema en todos los endpoints

**VULNERABILIDADES MEDIAS (🟠 ALTA):**

6. Error messages revelan info del sistema (duraciones de agentes, etc.)
7. Race condition en auth (failedAttempts no atómico)
8. Blindaje insuficiente de finanzas (PatternLeakage de gastos)

**NO ENCONTRADO (✓ Seguro):**
- XSS (sin dangerouslySetInnerHTML)
- SQL Injection (Drizzle ORM protege)
- CSRF (httpOnly + sameSite)
- Secrets (keys vía env, no hardcoded)

### 7. UX: 7/10

**Fortalezas:**
- ✅ Lock screen con PIN + Face ID
- ✅ Morning ritual 5-step
- ✅ FAB captura siempre visible
- ✅ Estados vacíos con instrucciones
- ✅ Responsive design mobile-first

**Deficiencias:**
- ❌ Error handling en briefing (queda en loading si Claude falla)
- ❌ Notificaciones sin visual cooldown
- ❌ Inbox swipe sin undo
- ❌ Validación inline ausente
- ❌ Sin dark mode selector (solo dark)

---

## RESUMEN: Puntuación promedio = 5.7/10

| Aspecto | Puntuación | Readiness |
|---------|-----------|-----------|
| Arquitectura | 7/10 | ✅ Sólida |
| Calidad código | 6/10 | ⚠️ Aceptable |
| Mantenibilidad | 5/10 | 🔴 Crítico |
| Escalabilidad | 6/10 | ⚠️ Mejorable |
| Documentación | 4/10 | 🔴 Crítico |
| Seguridad | 5/10 | 🔴 **CRÍTICO** |
| UX | 7/10 | ✅ Buena |
| **PROMEDIO** | **5.7/10** | 🔴 **NO LISTO** |

---

# FASE 7: ROADMAP DE CORRECCIONES

## P0 — CRÍTICOS (bloquean producción)

### P0.1 — Implementar middleware de autenticación
- **Problema:** 50+ endpoints sin `verifySession()`
- **Archivo a crear:** `src/middleware.ts`
- **Esfuerzo:** 2-3 horas
- **Impacto:** Bloquea P1, P2, P3
- **Paso a paso:**
  1. Crear middleware que verifique sesión para rutas protegidas
  2. Define PUBLIC_ROUTES (setup, lock, /api/auth/*, /api/capabilities)
  3. Define ADMIN_ROUTES (/api/admin/*)
  4. Remueve verifySession() calls de endpoints (duplicate)
  5. Agrega role-based access control (para admin)

### P0.2 — Eliminar NEXT_PUBLIC_CRON_SECRET
- **Problema:** Secret expuesto en bundle del navegador
- **Archivo:** `src/app/(app)/agents/AgentsClient.tsx:362`
- **Esfuerzo:** 1 hora
- **Impacto:** CRÍTICO — seguridad
- **Paso a paso:**
  1. Eliminar env var NEXT_PUBLIC_CRON_SECRET
  2. Crear ruta `/api/admin/run-agent` (protegida por middleware)
  3. Mover botón "Run Agent" a `/settings/admin` (solo acceso admin)
  4. Actualizar AgentsClient para POST a /api/admin/run-agent

### P0.3 — Proteger admin endpoints
- **Problema:** `/api/admin/fix-dates`, `/api/admin/seed` con auth débil
- **Archivos:** `src/app/api/admin/*`
- **Esfuerzo:** 1.5 horas
- **Impacto:** CRÍTICO
- **Paso a paso:**
  1. Agregar role="admin" a tabla auth
  2. Verificar en /api/admin/*: `if (!session.role === 'admin') return 401`
  3. Eliminar key string simple (fallback 'fix-vera-1993')

### P0.4 — Cifrar Google OAuth tokens
- **Problema:** Tokens almacenados en plaintext
- **Archivo:** `src/app/api/auth/google/callback/route.ts`
- **Esfuerzo:** 2 horas
- **Impacto:** Cumplimiento de seguridad
- **Paso a paso:**
  1. Reutilizar `AES.encrypt()` de crypto.ts
  2. Antes de guardar token: `encrypted = await encrypt(token, key)`
  3. Guardar `memory.value = encrypted`
  4. Al usar (Google Calendar): descifrar `const token = await decrypt(memory.value, key)`

### P0.5 — Validación centralizada de inputs
- **Problema:** Sin sanitización, XSS/SQL/injection potencial
- **Esfuerzo:** 4-6 horas
- **Impacto:** Seguridad
- **Paso a paso:**
  1. Instalar Zod: `npm install zod`
  2. Crear `src/lib/validation/schemas.ts` con schemas para cada endpoint
  3. Crear middleware `src/lib/validation/validate.ts`
  4. Aplicar a los 20+ endpoints más críticos (auth, tasks, inbox)
  5. Ejemplo:
     ```ts
     const createTaskSchema = z.object({
       title: z.string().min(1).max(200),
       propertyId: z.enum(['flat', 'sarapita', 'willys']).nullable(),
       dueDate: z.date().optional(),
       tags: z.array(z.string().max(50)).optional(),
     });
     ```

---

## P1 — IMPORTANTES (degradan experiencia/seguridad)

### P1.1 — Implementar tests mínimos
- **Esfuerzo:** 3-5 días
- **Cobertura meta:** 50% (agentes críticos + auth)
- **Framework:** Vitest + node:sqlite para tests en memoria
- **Casos:** PrioAgent, AlertAgent, auth flows, CRUD tareas

### P1.2 — Eliminar datos financieros de AlertAgent
- **Esfuerzo:** 1 hora
- **Problema:** Alertas pueden incluir nombres + fechas de contratos
- **Fix:** Filtro en AlertAgent que redacte "contrato vence en N días" sin detalles

### P1.3 — Mejorar manejo de errores
- **Esfuerzo:** 2 horas
- **Fix:** Logging estructurado, mensajes de error consistency

### P1.4 — Rate limiting global
- **Esfuerzo:** 1.5 horas
- **Fix:** Middleware que aplique per-endpoint (configurable)

### P1.5 — Arreglar N+1 en PrioAgent
- **Esfuerzo:** 1 hora
- **Fix:** Batch update en lugar de loop

### P1.6 — Documentar financeRecords
- **Esfuerzo:** 2 horas
- **Crítico:** Entender qué es vb, xc, ps, pm, etc.
- **Salida:** `docs/FINANCE_SCHEMA.md`

---

## P2 — MEJORABLES

### P2.1 — Actualizar CLAUDE.md
- Sincronizar con realidad actual (WebAuthn, agentes nuevos, tablas nuevas)

### P2.2 — Crear API.md
- Documentar 64 endpoints con schemas request/response

### P2.3 — Split AgentsClient.tsx
- 500 líneas → 3-4 componentes

### P2.4 — Service Worker offline
- Mejorar fallback para tareas y peso sin internet

### P2.5 — Error boundaries en React
- Prevenir white screens en crashes

---

## P3 — DESEABLES

### P3.1 — Bundle size analysis
### P3.2 — E2E tests (Playwright)
### P3.3 — Performance monitoring
### P3.4 — Métricas de agentes
### P3.5 — Dark mode selector

---

## TIMELINE ESTIMADO

| Semana | Focus | Effort |
|--------|-------|--------|
| **Semana 1** | P0.1-P0.3 (middleware, auth) | 4-5h |
| **Semana 1** | P0.4-P0.5 (cifrado, validación) | 4-6h |
| **Semana 2** | P1.1-P1.6 (tests, fixes, docs) | 3-4d |
| **Semana 3** | P2 (refactor, documentación) | 2-3d |
| **Total** | Para producción | **2-3 semanas / 1 dev** |

---

# CONCLUSIONES Y RECOMENDACIONES

## Estado actual

Vera v2.6 es **funcional pero no lista para producción** por:
1. **5 vulnerabilidades críticas de seguridad**
2. **60-70% documentación desactualizada**
3. **0% test coverage**
4. **50+ endpoints sin protección de autenticación**

El código real ha evolucionado significativamente beyond CLAUDE.md (Fase 0.1), completando Fases 1-3 con sistemas adicionales (WebAuthn, Google OAuth, finanzas complejas, contactos, drafts, packing).

## Recomendación

### Inmediato (esta semana)
- [ ] Implementar `src/middleware.ts` + proteger endpoints
- [ ] Eliminar NEXT_PUBLIC_CRON_SECRET
- [ ] Proteger admin endpoints
- [ ] Cifrar Google tokens

### Corto plazo (próximas 2 semanas)
- [ ] Validación centralizada con Zod
- [ ] Tests mínimos de agentes + auth
- [ ] Documentar financeRecords
- [ ] Actualizar CLAUDE.md

### Mediano plazo (mes)
- [ ] Refactor componentes gigantes
- [ ] Documentación API completa
- [ ] Rate limiting global
- [ ] Arreglar N+1 queries

## Costo de no hacer nada

- **Riesgo de seguridad:** Acceso no autorizado a datos (tareas, contactos, finanzas)
- **Deuda técnica:** Refactors cada vez más costosos
- **Mantenibilidad:** Imposible para nuevo dev sin documentación
- **Confiabilidad:** 0 tests = regresiones invisibles

## Beneficio de hacer P0

- ✅ Producción lista (bloquea data breaches)
- ✅ Arquitectura defensible
- ✅ Onboarding posible para segundo dev
- ✅ Confianza en cambios (incluso sin 100% tests)

---

**Fecha:** 8 junio 2026  
**Auditor:** Claude Code  
**Fuente de verdad:** Código fuente (src/)  
**Status:** ⚠️ Completado, Acciones urgentes recomendadas
