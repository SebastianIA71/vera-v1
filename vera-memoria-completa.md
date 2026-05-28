# VERA — Documento de Memoria del Proyecto
**Fecha:** Mayo 2026
**Estado:** Especificación iterada · pendiente de desarrollo
**Versión:** 0.2
**Propietario:** Sebastián

---

## CAMBIOS RESPECTO A v0.1

Si vienes del documento anterior, esto es lo que ha cambiado:

1. **Almacenamiento:** SQLite local → Turso (SQLite distribuido en la nube).
2. **Hosting:** Local / Railway → **Vercel** con Vercel Cron Jobs.
3. **Cron:** `node-cron` cada hora → Vercel Cron diario + recálculo on-demand.
4. **Acceso:** Sin auth → **PIN de 6 dígitos local**, válido en cualquier dispositivo.
5. **Finanzas:** Datos en claro localmente → **cifrados AES-GCM** con clave derivada del PIN, descifrados sólo en cliente.
6. **Móvil:** Importes enmascarados con fórmula reversible (sólo móvil; desktop muestra real).
7. **Capabilities:** Nueva capa — los servicios externos son opcionales y la app degrada con elegancia cuando faltan.

Todo lo demás del documento sigue vigente.

---

## 1. QUÉ ES VERA

Vera es un sistema operativo de vida personal. No es una app de tareas, no es un calendario, no es un gestor de proyectos. Es un segundo cerebro activo que:

- Captura cualquier cosa de cualquier canal en 2-3 segundos
- Recuerda todo sin que se lo repitas
- Conecta puntos que no tienes tiempo de conectar
- Actúa cuando puede, pregunta cuando debe, respeta cuando toca
- Conoce tus principios y los aplica sin que los expliques cada vez
- Tiene personalidad propia que se gana con el uso

**El nombre:** Vera. En latín, *verdad*. Se habla con ella por voz: "Oye Vera…"

**El origen:** Evolución del Excel SandLife que ya funciona. No reemplaza la lógica — la amplifica. El Excel llegó a su techo; Vera es lo que viene después.

**La cobertura:** 80% de la vida privada de Sebastián. Nunca será total — hay un 20% que es suyo y Vera no entra.

---

## 2. QUIÉN ES SEBASTIÁN

**Familia:** Mujer + hija 20 años + hijo 16 años. Sistema solo para Sebastián de momento. Si en algún momento se abre a la familia, la arquitectura lo permite.

**Ritmos:**
- Se levanta a las 7h
- Ritual matutino real de 15-20 min revisando el sistema (viene del Excel)
- Noche sin interrupciones del sistema
- Personal Trainer lunes y miércoles — en pausa hasta junio
- Captura instantánea de ideas y tareas en el momento: hábito forzado que funciona

**Vehículos:** Dos coches en renting — Porsche y BMW. El seguro y mantenimiento lo gestiona la renting. Vera controla fechas de contrato, kilometraje y renovaciones.

**Gestión:** Sin gestoría — Sebastián lleva él mismo lo fiscal y contable. Sin asistente personal.

**Principio económico base:** Antes de gastar, agotar todas las opciones propias.
```
¿Se puede hacer sin gastar?
    ↓ no
¿Se puede hacer con lo que ya tenemos?
    ↓ no
¿Se puede hacer con alguien de confianza más barato?
    ↓ no
¿Se puede buscar mejor precio?
    ↓ agotado todo
Entonces sí, gastamos
```
**Excepciones al principio:** cuando el tiempo vale más que el dinero, cuando la calidad no es negociable, cuando ya se ha pasado por el proceso antes. Se irán definiendo.

**Caprichos:** Permitidos y necesarios. No necesitan justificación ni análisis. Vera los ejecuta sin cuestionar.

---

## 3. LOS TRES INMUEBLES

### Flat · Palma
Piso en Palma. Lista de continuidad de mejoras y tareas del hogar.

### Sarapita · Campos
Casa en Campos (Sarapita). Incluye parcela exterior.

### Willy's · Marratxí
Finca/parcela. Espacio de eventos, escenario, barra, zona exterior. Tiene piscina.

**Nota:** Los datos actuales del Excel son orientativos — los correctos se cargarán en el proceso de seed de la base de datos.

---

## 4. LOS VIAJES 2026

| Viaje | Fechas | Quién | Transporte | Alojamiento | Pendiente clave |
|-------|--------|-------|-----------|-------------|-----------------|
| Madrid · Bruno Mars | 11–12 jul | Pareja | ✓ vuelos | ✓ reservado | Confirmar entradas |
| Escandinavia | 15–27 jul | Familia | ✓ vuelos | ✓ (revisar duplicados) | Coche Sogndal · tren Flåm · excursiones |
| Alcudia / Pto. Pollença | 7–9 ago | Familia | — | ✓ reservado | Transporte PMI→Alcudia |
| Cofrentes | 14–17 ago | Familia | ✓ barco | ✓ reservado | Actividades |
| Zaragoza | 10–12 oct | Amigos | ✓ vuelos | ✓ reservado | Plan actividades |
| Como + Milán | 28 dic–1 ene | Familia | ✓ vuelos | ✓ reservado | Restaurantes · actividades Navidad |

**Observaciones:**
- Verano muy cargado: 4 viajes en 6 semanas (11 jul → 17 ago)
- Escandinavia en refinamiento — estructura base cerrada, falta capa de experiencia
- Como+Milán: Vera alerta en septiembre para no dejar para última hora
- Hueco oct–dic: ventana natural para proyectos e IAfont+IAxLabs
- Cada viaje es un proyecto con fases: planificando / refinando / listo / en curso / cerrado

---

## 5. LOS PROYECTOS CREATIVOS

### IAfont
Substack de comunicación sobre IA. Casi listo técnicamente.
**Slot máximo: junio 2026.** Vera lo marca como urgente en las próximas semanas.

### IAxLabs
Laboratorio experimental. GitHub/Vercel.
**Mismo slot: junio 2026.**

**El problema real:** No es tiempo ni trabajo técnico. Es decisión y energía de lanzamiento. Falta el empujón: decidir que es el momento, generar expectativa, salir.

**Cómo Vera ayuda:**
- Mantiene el contexto caliente entre viajes
- Propone microdecisiones concretas en lugar de "acabar IAfont" (demasiado vago)
- Sugiere el slot adecuado cuando detecta energía y tiempo
- Ayuda a construir el mensaje de lanzamiento

**Tratamiento:** Igual que el resto de tareas. Misma PRIO, mismas subtareas, mismo sistema.

---

## 6. FINANZAS

**Filosofía:** Módulo aparte, consulta bajo demanda, fuera del flujo diario. Lo económico no repercute en la creatividad ni en el día a día.

**Estructura:**
```
INGRESOS (varios orígenes)
    − GASTOS FIJOS (~1.452€/mes entre 3 propiedades)
    − GASTOS VARIABLES (estimados por categoría)
    ─────────────────────────────────────────
    = MARGEN MENSUAL → ¿ahorro? ¿inversión?
```

### Privacidad multi-capa

Los importes financieros tienen **tres capas de protección**, no una:

**Capa 1 — Cifrado AES-GCM en reposo.**
Los importes se guardan en Turso como ciphertext. La clave AES vive sólo en el navegador de Sebastián, derivada del PIN con PBKDF2. Ni Turso, ni Vercel, ni el código del servidor pueden descifrarlos. Si alguien obtuviese acceso a la base de datos, vería cadenas ilegibles.

**Capa 2 — Aislamiento del modelo.**
Los importes nunca se incluyen en llamadas a Claude API. El `buildSystemPrompt` no consulta las tablas financieras. Los agentes (AlertAgent, ExecutorAgent) que mencionan contratos lo hacen sin tocar importes.

**Capa 3 — Enmascaramiento visual en móvil.**
En el móvil, los importes descifrados pasan por una fórmula reversible que sólo Sebastián conoce (`mostrado = real × factor + offset`). Es ofuscación contra miradas casuales, no seguridad criptográfica. En desktop se muestran reales.

**Gastos fijos conocidos:**
- Agua: SR 151,83€ · Palma 78,33€ · Parcela 49,12€
- Electricidad: SR 144,69€ · Palma 109,50€ · Parcela 193,06€
- Comunicaciones: SR (IBRED) 31,99€ · Palma (Vodafone) 81,89€ · Parcela (Jazztel) 156,76€
- Porsche leasing: 291,50€/mes · 19/60 cuotas · fin dic 2029
- iPhone 15: 35,50€/mes · termina ago 2026

**Inversiones:** Momento de centrar el tiro. Contexto pendiente para más adelante.

---

## 7. SALUD

**Método SNM:** 5 pilares diarios que Sebastián sigue:
- 💧 Agua
- 🚶 Caminar
- 💪 Entrenamiento
- 🧘 Escuchar al cuerpo
- 🍴 Disfrutar

**Peso actual:** ~78,7 kg · rango objetivo 77-80 · IMC ~23
**Registro:** Diario, por voz ("Vera, peso 78,2") o input directo
**Tendencia:** Estable 10+ días

---

## 8. EL SISTEMA DE TAREAS

### Estructura de una tarea

Cada tarea tiene dos capas:

**Capa fija — se define al crear:**
- Tipo: proyecto / acción directa / gestión / evento / compra / creativo
- Contexto guardado: todo lo que Vera necesita saber para hablar de esa tarea como Sebastián
- Restricciones: decisiones cerradas que no se cuestionan
- Referencias: links, documentos, contactos, presupuestos

**Capa viva — evoluciona:**
- Historial de acciones y conversaciones
- Decisiones tomadas con fecha
- Lo que Vera ha buscado o ejecutado
- Notas añadidas por voz en cualquier momento

### Alta de tareas — las dos velocidades

**Modo captura (3 segundos):**
Sebastián solo tiene tiempo de soltar un nombre. Vera guarda en bruto sin preguntar. Va al Inbox.

**Modo desarrollo (cuando hay tiempo):**
Vera saca las entradas del Inbox una a una y hace las preguntas necesarias para construir el contexto.

### Tareas que generan tareas

Las tareas son árboles, no listas. Una tarea puede tener subtareas, y estas pueden tener sub-subtareas. Pero Vera gestiona el árbol completo — Sebastián solo ve el siguiente paso concreto.

**Regla:** Vera nunca presenta el árbol completo a menos que se pida. Solo sube lo que necesita atención o decisión.

**El árbol crece solo:** El SearchAgent puede crear subtareas de compra. El ExecutorAgent puede crear subtareas de seguimiento. Los agentes alimentan el árbol.

### Prioridad dinámica (PRIO)

La prioridad no es un número fijo. Se recalcula:
- 1× al día por Vercel Cron (6:30, antes del ritual)
- On-demand al entrar al ritual matutino
- On-demand tras cualquier mutación de tarea

```
PRIO final = min(9, prio_base + staleness + proximity + season)

staleness:  días sin acción × 0.1 (cap +2)
proximity:  +3 si hay evento relacionado en <14 días
season:     +2 si la propiedad tiene evento próximo
```

### Estados de tarea
`wait` · `week` · `active` · `recover` · `design` · `material` · `done` · `archived`

### NoW — la lista de foco

Tareas elevadas a NoW se copian — siguen en su origen con marca ⚡ y aparecen en el panel principal. NoW no es una lista separada, es una vista de las más urgentes de todo el sistema.

---

## 9. EL RITUAL MATUTINO

**Hora:** ~7:15 (configurable)
**Duración:** 5 minutos
**Canal:** Push notification que abre directo al ritual · WhatsApp si hay urgencia real · apertura directa cuando quiera

### Las 5 pantallas

1. **Saludo + notificaciones** — hora, día, cuántas urgentes. Máximo 3 tarjetas: rojo urgente, ámbar stale, púrpura sugerencia
2. **Peso + SNM** — input por voz o botones rápidos. 5 iconos SNM para intenciones del día
3. **Foco del día** — top 3 urgentes (PrioAgent) + 2 que Vera sugiere adelantar. Check rápido. Campo de voz para añadir
4. **Briefing + sugerencias** — párrafo de Claude con contexto del día. 1-2 sugerencias proactivas con [Sí / Mañana / Ignorar]
5. **Resumen** — confirmación, tiempo del ritual, acceso al dashboard

---

## 10. CAPTURA UNIVERSAL

**El caso de uso más crítico del sistema:**

Sebastián ve algo en Instagram, escucha algo en una conversación, se le ocurre algo en la ducha. Tiene 2-3 segundos. Captura y sigue con su vida. Vera recoge, clasifica en background, devuelve cuando toca.

**Puerta de entrada universal:**

| Origen | Cómo llega |
|--------|-----------|
| Instagram / TikTok | Botón compartir → Vera |
| Safari / Chrome | Botón compartir → Vera |
| YouTube | Compartir URL → Vera |
| WhatsApp | Reenviar al chat de Vera |
| Email | Reenviar a dirección de Vera |
| Conversación | Voz → Vera |
| Tienda física | Foto + voz → Vera |
| Pensamiento | Voz → Vera |
| 3am | Widget pantalla de bloqueo → Vera |

**El Inbox:** Todo lo capturado sin contexto va aquí. En el ritual matutino o cuando hay tiempo, Vera los presenta uno a uno para desarrollar o descartar.

**Las Inspiraciones:** Categoría especial del Inbox. Cosas vistas o leídas que podrían convertirse en algo — como la URL del gresite para la piscina de Willy's.

---

## 11. LA MEMORIA DE VERA

La memoria es la columna vertebral. Sin memoria Vera es otra app. Con memoria es un sistema que mejora.

**Qué recuerda Vera sin que se lo pidas:**
- Que en Leroy Merlin Sebastián prefiere ir a ver antes de comprar online
- Que las tareas médicas se posponen — necesita insistir un poco más
- Que IAfont se activa con energía, no con tiempo libre
- Que los viernes tarde no son productivos
- Que Cofrentes es destino repetido

**Cómo funciona técnicamente:**
Claude no tiene memoria entre sesiones. Pero Turso sí. Cada conversación con Vera empieza con un system prompt construido en ese momento con los datos reales de la base de datos.

```
Sebastián habla
    ↓
Vera carga de Turso:
  — perfil de Sebastián
  — contexto de la tarea mencionada
  — historial relevante
  — decisiones inamovibles
  (NUNCA: importes financieros — están cifrados y no salen del cliente)
    ↓
Claude recibe todo + lo que dice Sebastián
    ↓
Responde como si lo supiera de siempre
```

---

## 12. LOS AGENTES

### VoiceAgent (Fase 0)
Convierte voz en acciones. Comandos en español natural.
- "Añade en Willy's que hay que revisar el generador, prio 7"
- "Peso 78,2 kilos"
- "Marca como hecha la baja de IBRED"
- "Busca precios de plastonda"

### PrioAgent (Fase 1)
Recalcula prioridades. Triggers: cron diario, entrada al ritual, mutación de tareas. Detecta tareas stale. Genera alertas para AlertAgent.

### AlertAgent (Fase 1)
Decide cuándo y cómo notificar. Gestiona cooldowns. Máximo 3 notificaciones al día salvo urgencia. Agrupa las de baja prioridad en el briefing matutino. **Nunca menciona importes en plantillas** (los contratos sí, pero sólo nombre y fecha).

### SearchAgent (Fase 2)
Busca precios y opciones. **Siempre aplica el principio de mínimo coste.** Antes de sugerir gasto, agota opciones propias. Presenta top 3 con precio, link y resumen de Claude.

### ExecutorAgent (Fase 2)
Redacta y envía emails y WhatsApps. **Siempre muestra borrador para confirmación.** Nunca envía sin aprobación de Sebastián.

### SolutionAgent (Fase 2)
Propone soluciones concretas ante problemas. Primero opciones DIY. Materiales, pasos, coste, dificultad. 2-3 propuestas ordenadas por coste/esfuerzo.

### Sugerencias proactivas — 3 activas

Vera lanza una sugerencia a la vez (la más relevante). Tipos:

- **`social_contact`:** "Llevas X días sin quedar con [nombre]." Usa tabla `contacts` — personas que Sebastián quiere mantener en órbita con `frequencyDays` personalizable. Se actualiza con `POST /api/contacts/:id/ping`.
- **`trip_prep`:** viaje en < 21 días con pendientes sin resolver.
- **`stale_task`:** tarea prio ≥4 sin movimiento > 14 días.

`meal_planning` descartado — no hay tabla de comidas en el schema actual.

---

## 13. NOTIFICACIONES

**Canales:** Push web · Email · WhatsApp — sin límites de horario de momento
**Regla de oro:** Máximo 3 al día salvo urgencia real
**Briefing matutino:** Agrupa las de baja prioridad

**Reglas de alerta:**
- Tarea prio ≥4 sin movimiento >14 días → push · cooldown 72h
- Evento próximo <21 días con pendientes → push diario
- Peso sin registrar >2 días → push suave · cooldown 20h
- Contrato termina en <45 días → push + email · cooldown 168h (sin importe)

---

## 14. AUTENTICACIÓN

**PIN de 6 dígitos local.**

- Setup la primera vez. Después, pantalla de PIN al entrar.
- Cookie de sesión firmada de 30 días tras introducir correcto.
- 3 fallos → lockout temporal con backoff exponencial.
- El PIN nunca viaja al servidor en claro (sólo bcrypt+salt).
- El PIN deriva una clave AES (PBKDF2) que vive en `sessionStorage` mientras dura la sesión.
- Sin PIN no se accede a nada — ni un GET de tasks.

**Si Sebastián olvida el PIN:**
Se pierde el acceso a los importes cifrados. El resto del sistema sigue accesible si se resetea el PIN. Mitigación: PIN de recuperación o backup cifrado de clave maestra (Fase 2).

---

## 15. UX Y DISEÑO

**Documento canónico de diseño:** `vera-ux-design.md`. Contiene todas las pantallas cerradas con especificación completa, tokens de diseño, convenciones de componentes y notas de implementación.

**Ficheros de referencia visual:** HTMLs autocontenidos en `reference/` — uno por pantalla aprobada. Claude Code los lee antes de implementar cada componente.

### Pantallas cerradas

**Móvil:**
- **Lock Screen** — PIN de 6 dígitos + Face ID primario. Anillo gold con ✦, frase motivacional con palabra ancla en cursiva gold, guiño "VERA · MEMORY POWERED BY CLAUDE" al pie. 100 frases en `src/lib/quotes.ts`.
- **Captura Rápida** — Sheet con handle de deslizamiento. Micrófono 168px protagonista, TEXT y PHOTO secundarios 56px. Transcripción en vivo durante grabación. Confirmación con chips de clasificación + countdown 2s que guarda por inacción.
- **Home Móvil** — Scroll único sin tab bar. 5 secciones: greeting (Syne 26px, palabra ancla gold) + status line → NoW (3 tareas con borde lateral de color) → Inbox (borde dashed, número gold) → Peso (curva SVG 14 días + SNM toggles) → Vera (una sugerencia proactiva). FAB gold fijo abajo derecha.
- **Ritual Matutino** — 5 pasos con línea gold de progreso. Cualquier paso saltable. PrioAgent recalcula en background al montar el paso 1. Pasos: Saludo + notificaciones → Peso + SNM → Foco del día → Briefing Claude + sugerencia → Resumen con anillo gold completo.

**Desktop:**
- **Command Centre** — 3 columnas: nav colapsable (200px↔52px) · orbital central · panel derecho fijo (280px). Top bar con reloj de segundos + contadores + OYE VERA. Orbital: 6 nodos en 4 anillos concéntricos, líneas activas pulsantes, bottom bar con estado en tiempo real.

### Identidad visual
- Fondo: #07080a · Tipografía: Syne + DM Sans + DM Mono
- Gold: #e8d5a3 (palabra ancla) / #c4a86a (bordes activos, logo)
- Verde #4ecb8d · Rojo #e05c5c · Ámbar #e8a020 · Azul #5ba8e8 · Púrpura #9b7fe8
- Símbolo ✦: `<path d="M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z"/>`
- Lenguaje UI: etiquetas en inglés mayúsculas (DM Mono), contenido en español

---

## 16. ARQUITECTURA TÉCNICA

### Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + Tailwind |
| Base de datos | **Turso (libSQL distribuido)** + Drizzle ORM |
| Hosting | **Vercel** |
| Cron | **Vercel Cron Jobs** (no `node-cron`) |
| Autenticación | **PIN 6 dígitos local + bcrypt** |
| Cifrado finanzas | **AES-GCM (WebCrypto) + PBKDF2 del PIN** |
| Voz entrada | Web Speech API + Whisper API (fallback) |
| Voz salida | ElevenLabs (Fase 3) |
| IA core | Claude API (claude-sonnet-4-6) |
| Email | Resend API |
| WhatsApp | Twilio |
| Push | Web Push API (VAPID) |
| Búsqueda | Brave Search API |

**Servicios externos opcionales:** todos salvo Anthropic y Turso son opcionales. La capa de capabilities detecta cuáles hay configurados y la app degrada con elegancia.

### Fases de desarrollo

**Fase 0 — Fundación (días 1-2)**
- Setup Next.js + Drizzle + libSQL
- Configurar Turso (cuenta + DB + token)
- Schema (incluyendo tablas `auth` y `contacts`)
- Capa cifrado + capabilities + middleware de sesión
- Pantalla `/setup` — primer arranque (PIN setup + seed básico)
- Pantalla `/lock` — PIN login + Face ID
- Redirect automático: sin auth → `/setup`, sin sesión → `/lock`
- Import SandLife.xlsx → seed (importes en una segunda pasada cifrada)
- Dashboard Command Centre (ya diseñado)
- CRUD tareas por propiedad
- VoiceAgent MVP: añadir tarea + registrar peso

**Fase 1 — Core vital (días 3-5)**
- PrioAgent + Vercel Cron diario + recálculo on-demand
- AlertAgent + push notifications
- Módulo peso completo con gráficas
- NoW dinámico
- Briefing diario generado por Claude (sin finanzas)
- Memory store
- Componente `<Amount/>` con descifrado + enmascaramiento móvil
- Despliegue a Vercel + Turso producción

**Fase 2 — Agentes activos (semanas 2-3)**
- SearchAgent (Brave Search)
- ExecutorAgent email (Resend) con confirmación
- ExecutorAgent WhatsApp (Twilio)
- SolutionAgent
- Inbox universal
- PWA manifest + instalable

**Fase 3 — Autonomía (mes 2)**
- Share Extension móvil
- Wake word local
- ElevenLabs TTS
- Google Calendar integración
- PIN de recuperación + backup cifrado de clave

### Estructura de carpetas
```
vera/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── setup/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── capabilities/route.ts
│   │   ├── tasks/route.ts
│   │   ├── weight/route.ts
│   │   ├── voice/route.ts
│   │   ├── inbox/route.ts
│   │   ├── briefing/route.ts
│   │   ├── agents/
│   │   │   ├── prio/route.ts
│   │   │   ├── search/route.ts
│   │   │   ├── executor/route.ts
│   │   │   ├── solution/route.ts
│   │   │   └── alert/route.ts
│   │   └── cron/
│   │       ├── prio/route.ts        # invocado por Vercel Cron
│   │       └── alerts/route.ts      # invocado por Vercel Cron
│   ├── dashboard/page.tsx
│   ├── morning/page.tsx
│   ├── properties/page.tsx
│   ├── upcoming/page.tsx
│   ├── settings/
│   │   └── capabilities/page.tsx
│   ├── lock/page.tsx                # pantalla de PIN
│   └── layout.tsx
├── components/
│   ├── command/
│   │   ├── OrbitalMap.tsx
│   │   ├── AgentNode.tsx
│   │   ├── PunchList.tsx
│   │   ├── InboxPanel.tsx
│   │   └── AlertsPanel.tsx
│   ├── morning/
│   │   └── MorningRitual.tsx
│   ├── voice/
│   │   ├── VoiceButton.tsx
│   │   └── useVoice.ts
│   ├── finance/
│   │   └── Amount.tsx               # descifra + enmascara
│   ├── auth/
│   │   ├── PinPad.tsx
│   │   └── useAesKey.ts
│   └── shared/
│       ├── TaskCard.tsx
│       └── QuickCapture.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts                 # cliente libSQL
│   │   ├── schema.ts
│   │   ├── seed.ts
│   │   └── queries.ts
│   ├── agents/
│   │   ├── AgentBus.ts
│   │   ├── VoiceAgent.ts
│   │   ├── PrioAgent.ts
│   │   ├── AlertAgent.ts
│   │   ├── SearchAgent.ts
│   │   ├── ExecutorAgent.ts
│   │   └── SolutionAgent.ts
│   ├── crypto.ts                    # PBKDF2, AES-GCM (cliente)
│   ├── auth-server.ts               # bcrypt, sesión (servidor)
│   ├── capabilities.ts              # detección de servicios
│   ├── finance-mask.ts              # fórmula reversible
│   ├── claude.ts
│   ├── memory.ts
│   └── notifications.ts
├── public/
│   ├── sw.js
│   └── manifest.json                # PWA
├── vercel.json                      # Vercel Cron Jobs
├── .env.local
└── CLAUDE.md
```

---

## 17. LO QUE VERA NO HACE

- No toma decisiones finales — Sebastián siempre tiene el control
- No envía nada sin confirmación explícita
- No entra en el 20% privado
- No mezcla finanzas en el flujo diario
- No repite lo que ya sabe
- No agobia — máximo 3 notificaciones al día
- No cuestiona los caprichos
- No sugiere gastar sin antes agotar opciones propias
- **No descifra importes en el servidor — la clave vive sólo en el cliente**
- **No incluye datos financieros en llamadas a Claude API**
- **No muestra importes reales en móvil — los enmascara con fórmula reversible**

---

*Documento vivo. Actualizar con cada iteración.*
*Versión 0.2 · Mayo 2026.*
