# VERA — Historial de Cambios y Decisiones
**Registro cronológico de modificaciones, auditorías, propuestas y decisiones de arquitectura.**

---

## v1.01 — Junio 2026

### 10 jun 2026 — Fix despliegue Vercel + params async

**Problema:**
- `node_modules` no existía en el entorno, causando error críptico de Turbopack: "couldn't find next/package.json from project directory: src/app"
- Route handlers dinámicos con params síncronos (incompatibles con Next.js 16)

**Solución:**
- `npm install` resuelve la causa raíz del error de Turbopack
- Actualizado `params` a `Promise<{ id: string }>` + `await params` en:
  - `src/app/api/contracts/[id]/route.ts`
  - `src/app/api/vehicles/[id]/route.ts`
  - `src/app/api/vehicles/[id]/km/route.ts`

**Nota Next.js 16:** En versiones 15+, los `params` de route handlers son `Promise`. Hay que desestructurarlos con `await`.

---

### 8 jun 2026 — Fase P0: Seguridad Crítica (5 vulnerabilidades)

Auditoría integral reveló que Vera era funcional pero **no lista para producción**. Score: 5.7/10. 5 vulnerabilidades críticas identificadas y cerradas en el mismo día.

#### Auditoría integral (pre-P0)

Estado encontrado vs. documentación:
- **Agentes:** documentados 6, reales 8-9 (+ContactAgent, DraftAgent, PackingAgent)
- **Tablas BD:** documentadas 11, reales 17 (+financeRecords, expenses, attachments, projects, webauthnCredentials, pushSubscriptions)
- **Endpoints API:** documentados 20, reales 64
- **Auth:** documentado PIN, real PIN + WebAuthn + Google OAuth
- **Middleware:** documentado que existe, real: no existía → 50+ endpoints públicos
- **Versión:** confusión v.35 / v1.01 / v2.6.SHA

#### P0.1 — Middleware de autenticación (2h) ✅

**Problema:** 50+ endpoints API sin ninguna verificación de sesión. Acceso público a tareas, contactos, pesos, finanzas.

**Solución:** `src/proxy.ts` centralizado.
- Diferencia API (401) vs. páginas (redirect /lock)
- 17 rutas públicas definidas
- Protección cron con CRON_SECRET
- `src/lib/auth.ts` → nueva interfaz `SessionData { sub, role }`

#### P0.2 — Eliminar NEXT_PUBLIC_CRON_SECRET (1h) ✅

**Problema:** `NEXT_PUBLIC_CRON_SECRET` serializado en el bundle del navegador → cualquiera podía invocar `/api/cron/`.

**Solución:** 
- Nuevo endpoint `/api/admin/run-agent` protegido por proxy
- `AgentsClient.tsx` actualizado para usar la nueva ruta
- Variable `NEXT_PUBLIC_CRON_SECRET` eliminada del código y del dashboard Vercel
- `CRON_SECRET` (sin prefijo NEXT_PUBLIC_) se mantiene solo para Vercel Cron Jobs

#### P0.3 — Sistema de roles user/admin (1.5h) ✅

**Problema:** `/api/admin/*` accesible por cualquier usuario autenticado. Key hardcodeada `'fix-vera-1993'` en endpoints admin.

**Solución:**
- Columna `role TEXT DEFAULT 'user'` en tabla `auth`
- JWT incluye `{ sub, role }`
- Proxy verifica `role='admin'` para rutas `/api/admin/*` → 403 si no
- Setup inicial: primer usuario es `admin` automáticamente

Migración SQL: `ALTER TABLE auth ADD COLUMN role TEXT DEFAULT 'user';`

#### P0.4 — Cifrado Google OAuth tokens (2h) ✅

**Problema:** Tokens de Google Calendar guardados en plaintext en `memory.value`. Acceso a Turso = compromiso de Google Calendar.

**Solución:** Nuevo archivo `src/lib/tokenCrypto.ts`:
- AES-256-GCM con IV aleatorio (12 bytes)
- Clave derivada: PBKDF2(SESSION_SECRET, salt, 100k iter) → 256-bit
- Auth tag 128 bits para integridad
- Almacenamiento: `Base64(iv + tag + ciphertext)`
- Fallback automático para tokens viejos sin cifrar

Archivos modificados: `api/auth/google/callback`, `lib/googleCalendar.ts`

#### P0.5 — Validación centralizada con Zod (2h) ✅

**Problema:** Sin validación de inputs. Solo `if (!title?.trim())` en algunos endpoints. Riesgo XSS + datos inválidos.

**Solución:** `src/lib/validation/schemas.ts` + `src/lib/validation/validate.ts`
- 20+ schemas Zod para todos los recursos
- Helper `validateRequest(req, schema)` reutilizable
- Aplicado a auth, tasks, y patrón replicable al resto
- Mensajes de error consistentes, tipos seguros end-to-end

**Score post-P0:** 5.7/10 → ~9/10

---

## v1.00 → v1.01 — Mayo/Junio 2026

### Hitos de desarrollo completados

**Walking Skeleton (Fase 0):**
- Next.js 16 + Turso + Drizzle + schema base
- Setup PIN + lock screen + cookie de sesión 30 días
- Command Centre desktop con datos reales
- CRUD tareas: crear · ver · marcar hecha

**Captura + Ritual (Fase 1):**
- VoiceAgent integrado en `/api/voice` (Web Speech API)
- Ritual matutino 5 pasos
- `/api/briefing/morning` con Claude API
- PrioAgent + Vercel Cron diario (6:30)
- PWA: manifest.json + sw.js

**Vistas desktop (Fase 2):**
- Tareas, propiedades, viajes, inbox
- Orbital de agentes en Command Centre
- Panel de detalle de tarea

**Agentes activos (Fase 3):**
- AlertAgent + push notifications (VAPID)
- SearchAgent (Brave Search API + Claude)
- ExecutorAgent email (Resend) con confirmación visual
- SolutionAgent

**Fase 4 parcial:**
- Finanzas: CRUD contratos + cifrado AES + enmascaramiento móvil
- WebAuthn (Face ID) — tabla `webauthnCredentials`
- Google OAuth + Google Calendar sync — tokens cifrados AES-256-GCM
- Agentes adicionales: ContactAgent, DraftAgent, PackingAgent
- Proyectos creativos (tabla `projects`)
- Vehículos km tracking
- Calendario de contratos/pagos
- Agenda de eventos y documentos

---

## v0.2 — Mayo 2026 (Especificación)

Cambios respecto a v0.1:

1. **Base de datos:** SQLite local → **Turso** (libSQL distribuido). Schema idéntico.
2. **Despliegue:** Local → **Vercel**. Vercel Cron Jobs + Turso.
3. **Cron:** `node-cron` cada hora → **Vercel Cron 1×/día + on-demand**.
4. **Auth:** Sin auth → **PIN de 6 dígitos**, bloqueo de app y derivación de clave AES.
5. **Cifrado:** Campos financieros **cifrados AES-GCM** con clave del PIN (PBKDF2). Sin PIN, importes ilegibles.
6. **Enmascaramiento financiero:** Solo en móvil — fórmula reversible (`mostrado = real × factor + offset`).
7. **Capabilities:** La app detecta servicios externos y degrada con elegancia.

---

## v0.1 — Antes de mayo 2026

Origen: Excel SandLife que ya funcionaba. Vera es la evolución natural cuando el Excel llegó a su techo.

Conceptos fundacionales establecidos:
- 3 propiedades (Flat, Sarapita, Willy's)
- Sistema de prioridad dinámica PRIO
- Captura universal en 2-3 segundos
- Ritual matutino diario
- 6 agentes: VoiceAgent, PrioAgent, AlertAgent, SearchAgent, ExecutorAgent, SolutionAgent
- Privacidad financiera: importes nunca en Claude API
- Máximo 3 notificaciones al día

---

## Decisiones de arquitectura — registro

### Turso en lugar de Postgres
Control total y simplicidad. SQLite distribuido conserva la filosofía del Excel original: archivo único, schema simple, portable. Turso añade sync multi-dispositivo sin cambiar la API de Drizzle.

### Vercel Cron Jobs en lugar de node-cron
Vercel es serverless — los procesos no persisten. `node-cron` no funciona. Todo la programación va por Vercel Cron Jobs definidos en `vercel.json`.

### Cifrado solo en cliente para finanzas
La clave AES vive en `sessionStorage` del navegador, derivada del PIN con PBKDF2. El servidor nunca puede descifrar los importes. Si alguien obtiene acceso a Turso, solo ve ciphertext.

### Enmascaramiento financiero en móvil
Ofuscación visual adicional para miradas casuales. No es seguridad criptográfica — la seguridad real es el cifrado AES. Los factores (`NEXT_PUBLIC_MASK_FACTOR`, `NEXT_PUBLIC_MASK_OFFSET`) son visibles en el bundle del cliente.

### params como Promise en Next.js 15+
En Next.js 15 y 16, los parámetros dinámicos de route handlers son `Promise<{ id: string }>` y deben awaitearse. Rompe código de versiones anteriores pero es la API correcta.

### Proxy centralizado en lugar de verifySession por endpoint
Implementar autenticación en 50+ endpoints individualmente es propenso a olvidos. Un proxy centralizado (`src/proxy.ts`) asegura que ningún endpoint nuevo quede desprotegido por accidente.

### VERA+ / JARVIS fast path
Sistema de routing inteligente en `/api/voice`. El trigger "jarvis:" activa `runAmiVeraPipeline()` para comandos especiales con respuesta inmediata. No documentado inicialmente, añadido en Fase 4.

---

## Deuda técnica conocida

| Ítem | Prioridad | Descripción |
|------|-----------|------------|
| Tests | Alta | 0% coverage. Ningún test file. |
| N+1 en PrioAgent | Media | Updates 1x1 en loop → debería ser batch |
| financeRecords | Media | 18 campos con nombres crípticos (vb, xc, ps...) sin documentar |
| AgentsClient.tsx | Baja | 500+ líneas — candidato a split |
| Rate limiting | Media | Solo en 2 endpoints, debería ser global |
| Error boundaries | Baja | Sin error boundaries en React → posibles white screens |

---

*Este archivo recoge el "por qué" de cada cambio importante.*  
*Los detalles técnicos completos de cada fase están en `how_we_got_here/`.*
