# VERA — Documento de Diseño UX
**Versión:** 0.1 · Mayo 2026
**Estado:** Pantallas móviles cerradas (parcial) + Command Centre desktop

Este documento recoge todas las decisiones de diseño tomadas y aprobadas.
Es la referencia canónica para implementar componentes. No implementar nada
que contradiga lo que hay aquí sin actualizar primero este documento.

---

## IDENTIDAD VISUAL (resumen rápido)

```
Fondo:       #07080a (casi negro)
Fondo2:      #0d0f12
Fondo3:      #131619
Fondo4:      #1a1d22
Texto:       #eceae2
Texto2:      #7d7c87
Texto3:      #3e3d48
Texto4:      #5f5e5a

Gold:        #e8d5a3  (palabra ancla, números grandes)
Gold2:       #c4a86a  (logo, bordes activos, elementos Vera)
Verde:       #4ecb8d  (ok, activo, tendencia positiva)
Rojo:        #e05c5c  (urgente, vence pronto)
Ámbar:       #e8a020  (stale, atención)
Azul:        #5ba8e8  (viajes, cuenta atrás)
Púrpura:     #9b7fe8  (sugerencias Vera)
Cyan:        #3ecfcf  (SolutionAgent — pendiente de uso)

Tipografía:
  Headers / números grandes / logo → Syne
  Texto general → DM Sans
  Etiquetas / código / tiempo / metadata → DM Mono
```

**Símbolo de Vera:** ✦ sparkle de 8 puntas. SVG:
```svg
<path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" fill="currentColor"/>
```
Usar en: anillo del lock screen, nodo VERA del orbital, sugerencias proactivas.

**Lenguaje de la UI:**
- Etiquetas de sistema → inglés mayúsculas DM Mono (CAPTURE, LISTENING, NOW, INBOX…)
- Contenido real → español (títulos de tareas, briefing, nombres…)
- Frases motivacionales → inglés, Syne, con palabra ancla en cursiva gold

---

## CONVENCIONES DE COMPONENTES

### Código de color de tareas
| Color | Uso |
|-------|-----|
| Borde rojo `#e05c5c` | Urgente / vence en < 21 días |
| Borde ámbar `#e8a020` | Stale (≥14 días sin movimiento, prio ≥4) |
| Borde púrpura `#9b7fe8` | Sugerencia de Vera / tarea creativa |
| Sin borde especial | Tarea normal |

### Chips de clasificación
```
Color del dot → categoría:
  #9b7fe8  Propiedad / contexto
  #e8a020  Prioridad
  #5ba8e8  Tipo de tarea
  #7d7c87 (borde dashed)  Editable / incierto
```

### Contadores / números grandes
- Siempre en Syne
- Viajes/días → color azul `#5ba8e8`
- Peso → color texto principal `#eceae2`
- Urgentes / alertas → color rojo `#e05c5c`
- Sugerencias Vera → color púrpura `#9b7fe8`
- Inbox sin procesar → color gold `#e8d5a3`

---

## MOBILE — PANTALLAS CERRADAS

### Principios móviles
- Mobile first para captura y ritual. Command Centre es desktop.
- Sin tab bar. Scroll único con secciones o pantallas independientes.
- FAB gold permanente en todas las pantallas (micrófono, 62px, abajo derecha).
- Cierre de modales/sheets: deslizar hacia abajo. Sin botón X.
- Handle gris (36×4px) en sheets para comunicar el gesto.

---

### M1 — Lock Screen (PIN + Face ID)

**Layout:**
```
[Handle gris]
[Hora real]          [VERA + ✦]
────────────────────────────────

      Estado 1 — Face ID activo:
      [Anillo doble ✦ gold — 56px]
      [Frase motivacional Syne 22px]
        con [palabra en cursiva gold]

      [Icono Face ID — 68×68px redondeado]
      [LOOK TO UNLOCK — DM Mono]

      [USE PIN INSTEAD — pill gris]

      Estado 2 — PIN fallback:
      [Anillo doble ✦ gold — 56px]
      [Frase motivacional]
      [Dots de progreso — 6 puntos]
      [Pad 3×4 — teclas rectangulares redondeadas]
        Inferior izquierda: FACE (volver a Face ID)
        Inferior centro: 0
        Inferior derecha: CLR

[VERA · MEMORY POWERED BY CLAUDE — DM Mono 8px #3e3d48]
```

**Frases motivacionales:**
- Fichero: `src/lib/quotes.ts`
- 100 frases en inglés con palabra ancla marcada `*así*`
- Selección aleatoria por carga: `getRandomQuote()`
- Selección estable por día: `getDailyQuote(date?)`
- Parser: `parseQuote(raw)` → array `{text, anchor}`
- La palabra ancla se renderiza en `<em>` con color `#e8d5a3` y cursiva

**Face ID:**
- Web Authentication API (`navigator.credentials`)
- Durante setup del PIN: registrar credencial biométrica
- La clave AES cifrada con clave biométrica → guardada en localStorage
- Al autenticar con Face ID: descifrar clave AES envuelta → sessionStorage
- Fallback: PIN siempre disponible

**Interacciones:**
- 3 fallos de PIN → lockout con backoff exponencial
- Cookie de sesión: 30 días
- En desktop: sesión persistente, sin pantalla de PIN salvo primera vez o expiración

---

### M2 — Captura Rápida

**Acceso:**
- Widget de iOS en lock screen → Face ID → captura directa
- FAB desde cualquier pantalla de la app
- Share Sheet desde otras apps (Instagram, Safari, etc.)

**Autenticación:** Face ID requerido. Sin autenticación no se abre.

**3 estados en secuencia:**

**Estado 1 — Reposo:**
```
[Handle]
[Hora]               [✦ VERA]    [SWIPE ↓]
────────────────────────────────────────────
               CAPTURE
          Say it. Type it. Snap it.

         [Micrófono — 168px — anillo gold doble]
              TAP TO SPEAK

              [TEXT 56px]  [PHOTO 56px]
```

**Estado 2 — Grabando:**
- Micrófono → rojo `#e05c5c`, anillos pulsando hacia fuera
- Label "LISTENING" en rojo
- Timer en DM Mono rojo
- Transcripción en vivo: Syne 16px + cursor parpadeante gold
- Botón "TAP TO STOP" como pill al pie
- Tocar el micrófono también para

**Estado 3 — Confirmación:**
- Label "CAPTURED" en verde
- Review card con lo que Vera entendió (texto limpio, sin meta-instrucciones)
- Chips: propiedad (púrpura) · prio (ámbar) · tipo (azul) · "+ EDIT" (gris dashed)
- Countdown 2 segundos con anillo gold → guarda por inacción
- Botones: EDIT · SAVE NOW
- Si no se hace nada en 2s → guarda automáticamente

**Pendiente (aparcado):**
- Captura por texto (textarea + teclado)
- Captura por foto (cámara nativa iOS + OCR)
- Pantalla de edición desde confirmación

---

### M3 — Home Móvil

**Estructura (scroll único, sin tab bar):**

```
[Hora]                         [⚙ Ajustes]
✦ VERA

[Syne 26px] Wednesday, [*quiet morning*.]
[DM Mono 10px] 78.4 KG · [ESCANDINAVIA · 49 D] · IAFONT · 33 D
                          └── gold ──────────┘

─── NOW ──────────────────── 3 ACTIVAS ──
[Tarjeta tarea urgente × 3]
  prio | título | propiedad · tiempo
  check circle a la derecha

─── INBOX ───────────────── ABRIR → ──
[Strip borde dashed]
  [Número grande gold] capturas sin procesar
                       2 INSTAGRAM · 1 VOZ · 1 NOTA

─── PESO ────────────────── 14 DÍAS ──
[Card]
  [78.4 — Syne 32px]   [● ESTABLE — pill verde]
  KG · HOY
  [SVG curva línea verde 14 días + punto activo]
  [Línea objetivo discontinua gris]
  [SNM: 💧 🚶 💪 🧘 🍴 — toggles, activos brillantes]

─── UPCOMING ─────────────── VER TODO → ──
[Card próximo viaje]
  [Título]    [días — Syne 28px azul]
  [Fechas · quién]
  [● pendiente — ámbar]

─── VERA ─────────────────── 1 SUGERENCIA ──
[Card fondo púrpura muy sutil, borde #2d2640]
  [✦ icono púrpura]
  VERA SUGIERE — DM Mono púrpura
  [Texto sugerencia Syne 14px, parte key en cursiva gold]
  [SÍ (púrpura)] [MAÑANA] [IGNORAR]
```

**FAB:**
- Posición: fijo, abajo derecha, 22px margen
- Tamaño: 62×62px, border-radius 50%
- Fondo: #07080a, borde gold, anillo sutil expandido
- Icono: micrófono
- Acción: abre M2 Captura

**Finanzas:** no aparecen en home. Versión estricta.

---

### M4 — Ritual Matutino (5 pasos)

**Acceso:** apertura de la app entre 7:00–7:30. Si ya se completó hoy → resumen.

**Navegación:** deslizar horizontalmente + botón Siguiente. Cualquier paso saltable (SALTAR → arriba derecha, DM Mono gris muy oscuro).

**Indicador de progreso:** línea gold en el borde superior. Crece de 0% a 100% en 5 pasos (20%/40%/60%/80%/100%). Sin números ni puntos.

**Carga:** PrioAgent recalcula en background mientras ves el paso 1. Sin splash, sin espera.

---

**Paso 1 — Saludo + Notificaciones:**
```
[Línea 20%]
RITUAL · 1 DE 5                    SALTAR →
[Syne 22px] Good morning, [*Sebastián*.]
[DM Mono] MIÉRCOLES · 7:14 · 3 AVISOS

[Notif roja]   título · URGENTE · contexto
[Notif ámbar]  título · STALE · deadline
[Notif púrpura] título · SUGERENCIA VERA

                    DESLIZA PARA CONTINUAR →
```

**Paso 2 — Peso + SNM:**
```
[Línea 40%]
RITUAL · 2 DE 5                    SALTAR →
¿Cuánto pesas [*hoy*?]
ÚLTIMO · 78.4 KG · HACE 1 DÍA

[−0.5] [−0.2] [78.4★] [+0.2] [+0.5]  ← botones ajuste rápido

[🎙 O DI UN NÚMERO · "78 PUNTO 4"]

[78.4 — Syne 52px] KG  [= AYER — verde]

INTENCIONES DE HOY
[💧on] [🚶on] [💪] [🧘on] [🍴]
```

**Paso 3 — Foco del día:**
```
[Línea 60%]
RITUAL · 3 DE 5                    SALTAR →
Foco de [*hoy*.]
3 URGENTES · 2 SUGERIDAS

[9] Reservar tren Oslo→Flåm       [○]
    ESCANDINAVIA · VENCE 19 D
[8] Coche de alquiler en Sogndal   [○]
    ESCANDINAVIA · VENCE 14 D
[7] IAfont — definir slot          [○]
    CREATIVO · 11 D SIN MOVER

[✦] VERA SUGIERE                   [○]
    Revisar duplicados alojamiento
    PUEDE EVITAR GASTO

[🎙 AÑADIR POR VOZ]
```

**Paso 4 — Briefing + Sugerencia:**
```
[Línea 80%]
RITUAL · 4 DE 5                    SALTAR →
Vera [*habla*.]

[Card oscura — briefing]
  BRIEFING · fecha
  [Párrafo Claude — Syne 13px #c8c6be, key en cursiva gold]
  Max 3-4 líneas. Nunca una lista.

[Card púrpura — sugerencia proactiva]
  VERA SUGIERE — DM Mono púrpura
  [Texto — DM Sans 12px, key en cursiva gold]
  [SÍ (púrpura)] [MAÑANA] [IGNORAR]
```

**Paso 5 — Resumen:**
```
[Línea 100%]
RITUAL · COMPLETADO

[Anillo gold completo — 72px con minutos en el centro]

Ritual [*completado*.]

[78.4 KG] [3 FOCO]
[3/5 SNM] [1 SUGERENCIA]

[Escandinavia en *49 días*. Mueve el coche de Sogndal hoy.]

[IR AL DASHBOARD →]
```

---

## DESKTOP — PANTALLAS CERRADAS

### Principios desktop
- Siempre 3 columnas: nav izquierda · contenido central · panel derecho.
- Nav izquierda colapsable (200px ↔ 52px solo iconos).
- Panel derecho fijo (280px).
- Sin FAB. La captura es el botón "OYE VERA" en el top bar.
- Sesión persistente (30 días). Sin pantalla de PIN en uso normal.
- Finanzas: módulo aparte, sin importes en ninguna vista compartida.

---

### D1 — Command Centre

**Top bar (44px):**
```
[✦ VERA] [MIÉ · 27 MAY · 07:42:18]    [● 2 URGENTES] [● 1 STALE] [● 4 INBOX]    [● SISTEMA ACTIVO] [🎙 OYE VERA]
```

**Nav izquierda (200px / colapsable a 52px):**
```
[← toggle colapsar]

[◉] COMMAND    ← activo: barrita gold, fondo sutil
[✓] TAREAS
[~] INBOX      [4] ← badge rojo
[✈] VIAJES
[🏠] PROPIEDADES
────────────
[$] FINANZAS
────────────
[⚙] AJUSTES
```

**Centro — Orbital (440×440px):**
```
4 anillos concéntricos:
  Ring 1 (140px): borde gold tenue (.25 opacity) — zona caliente
  Ring 2 (260px): gris muy oscuro
  Ring 3 (380px): gris muy oscuro
  Ring 4 (440px): dashed, casi invisible

Núcleo VERA (80px):
  Fondo #07080a, borde gold
  Dos anillos exteriores sutiles (rgba gold .18 / .07)
  "VERA" — Syne bold gold
  "● ACTIVA" — DM Mono verde pequeño

6 nodos en posición de reloj (aprox):
  12h — VOICE    (running: gold + pulso)
  2h  — PRIO     (active: verde)
  5h  — ALERT    (idle: gris)
  6h  — SOLUTION (idle: gris)
  8h  — EXECUTOR (idle: gris)
  10h — SEARCH   (idle: gris)

Estados de nodo:
  running: borde gold, icono gold, box-shadow pulsante, dot gold animado
  active:  borde verde, icono verde, dot verde
  idle:    borde #1a1d22, icono #3e3d48, dot gris

Líneas de conexión:
  Desde centro (220,220) a cada nodo
  Activos: rgba(gold,.35) animada (pulse)
  Idle: rgba(gold,.12) estática
```

**Panel derecho (280px) — 3 pestañas:**
```
PUNCH LIST | INBOX [4] | ALERTAS

Punch List:
  HOY · N TAREAS                    VER TODAS →
  [Tarjeta tarea × N] — misma lógica que home móvil
  ─────────────────────────────
  PRÓXIMO VIAJE
  [Mini card viaje con días azul]

Inbox:
  [Item con source en azul · texto · timestamp]

Alertas:
  [Item con tipo coloreado · texto · timestamp]
```

**Bottom bar (32px):**
```
[● VOICE — ESCUCHANDO] [● PRIO — SYNC 07:30] [○ ALERT — IDLE] [○ SEARCH — IDLE] [○ EXECUTOR — IDLE] [○ SOLUTION — IDLE]
                                                                                    VERA v0.2 · TURSO SYNC OK · VERCEL
```

---

## FICHEROS DE REFERENCIA VISUAL

Cada pantalla cerrada tiene un HTML autocontenido en `/reference/`.
Claude Code debe leer el HTML correspondiente antes de implementar ese componente.

| Fichero | Pantalla | Fase | Componente principal |
|---------|----------|------|---------------------|
| `ref-setup.html` | Setup — Primer arranque (3 pasos) | 0 | `src/app/setup/page.tsx` |
| `ref-lock-screen.html` | Lock Screen — PIN + Face ID | 0 | `src/app/lock/page.tsx` |
| `ref-command-centre.html` | Command Centre Desktop | 0 | `src/app/(app)/dashboard/page.tsx` |
| `ref-tasks-desktop.html` | Tareas Desktop + panel detalle | 0/2 | `src/app/(app)/tasks/page.tsx` |
| `ref-capture.html` | Captura Rápida — 3 estados | 1 | `src/components/capture/CaptureSheet.tsx` |
| `ref-morning-ritual.html` | Ritual Matutino — 5 pasos | 1 | `src/components/morning/MorningRitual.tsx` |
| `ref-home-mobile.html` | Home Móvil — scroll 5 secciones | 1 | `src/app/(app)/page.tsx` |
| `ref-task-detail.html` | Tarea Individual Móvil | 1 | `src/app/(app)/tasks/[id]/page.tsx` |
| `ref-properties-desktop.html` | Propiedades — 3 columnas | 2 | `src/app/(app)/properties/page.tsx` |
| `ref-trips-desktop.html` | Viajes Desktop | 2 | `src/app/(app)/trips/page.tsx` |
| `ref-inbox-desktop.html` | Inbox Desktop | 2 | `src/app/(app)/inbox/page.tsx` |
| `ref-agent-panel.html` | Panel de Agente (orbital) | 2 | `src/components/command/AgentPanel.tsx` |
| `ref-inbox.html` | Inbox Móvil — cartas swipe | 3 | `src/components/inbox/InboxCard.tsx` |

Cada HTML tiene comentario de cabecera con decisiones de diseño y notas de implementación.
No copiar CSS directamente — reimplementar con Tailwind usando los mismos tokens.

---

## PANTALLAS SIN DISEÑO EXPLÍCITO — REGLAS DE INFERENCIA

Las pantallas no cubiertas por un ref-*.html se infieren del sistema visual.
No inventar estilos nuevos. Aplicar estas reglas:

**Estados vacíos:**
Anillo ✦ gold (64px) centrado · Título Syne 20px · Subtítulo DM Mono gris · Botón opcional borde gold.
Ejemplo: inbox vacío, lista de tareas sin resultados, propiedades sin tareas.

**Estados de error:**
Igual que vacío pero icono y texto en rojo (#e05c5c). Sin anillo gold.

**Loading:**
Texto "···" en DM Mono color #c4a86a. Skeleton con fondo #0d0f12. Sin spinners.

**Formularios:**
Input: border .5px solid #1a1d22 · border-radius 10px · focus border #c4a86a.
Placeholder: color #3e3d48. Fondo: transparent.

**Dropdowns y popovers:**
Fondo #0d0f12 · border .5px solid #1a1d22 · border-radius 10px.
Item hover: background #131619. Item activo: color #c4a86a.

**Ajustes / Capabilities:**
Lista de servicios: dot verde/gris + nombre DM Sans + estado a la derecha.
Verde (#4ecb8d): activo · Gris (#3e3d48): sin clave · Rojo (#e05c5c): error.

**Notificaciones push:**
Icono ✦ gold. Título Syne máx 50 chars. Cuerpo DM Sans máx 100 chars / 2 líneas.
Nunca incluir importes financieros.

**Tarea individual desktop:**
Reutilizar TaskDetailPanel de ref-tasks-desktop.html. Mismo contenido que
ref-task-detail.html adaptado al ancho disponible. No crear componente nuevo.

---

## ESTADO DEL DISEÑO

### Cerrado con HTML de referencia
- [x] Setup — ref-setup.html
- [x] Lock Screen — ref-lock-screen.html
- [x] Captura Rápida — ref-capture.html
- [x] Home Móvil — ref-home-mobile.html
- [x] Ritual Matutino — ref-morning-ritual.html
- [x] Inbox Móvil — ref-inbox.html
- [x] Tarea Individual Móvil — ref-task-detail.html
- [x] Command Centre Desktop — ref-command-centre.html
- [x] Tareas Desktop — ref-tasks-desktop.html
- [x] Propiedades Desktop — ref-properties-desktop.html
- [x] Viajes Desktop — ref-trips-desktop.html
- [x] Inbox Desktop — ref-inbox-desktop.html
- [x] Panel de Agente — ref-agent-panel.html

### Inferir del sistema visual (ver reglas arriba)
- Ajustes / Capabilities
- Finanzas (móvil y desktop) — Fase 4
- Estados vacíos de todas las vistas
- Loading states
- Tarea individual desktop (reutilizar TaskDetailPanel)
- Dropdowns y popovers (ChipEditor, filtros)
- Ramas de captura (texto, foto, edición) — aparcadas

---

## NOTAS DE IMPLEMENTACIÓN

### `src/components/LockScreen.tsx`
- Face ID: `navigator.credentials.get({ publicKey: ... })`
- PIN pad: componente sin librería externa, estado local
- Frases: importar `getRandomQuote` + `parseQuote` de `src/lib/quotes.ts`
- La `<em>` dentro de la frase debe recibir `className="anchor"` con `color: #e8d5a3; font-style: italic`

### `src/components/capture/CaptureSheet.tsx`
- Implementar como bottom sheet (posición fixed, transform translateY)
- El gesto de cierre: `touch-action: pan-y`, detectar swipe down con delta > 80px
- Voz: `window.SpeechRecognition || window.webkitSpeechRecognition`
- Transcript en vivo: evento `onresult` del SpeechRecognition
- Al parar grabación: POST /api/voice con transcript → Vera clasifica → mostrar estado 3
- Countdown: `setTimeout(2000, () => saveToInbox())`

### `src/components/home/MobileHome.tsx`
- Scroll: `overflow-y: auto` con `scroll-behavior: smooth`
- Sección Peso: SVG generado en cliente con los últimos 14 registros de `weightLog`
- SNM: toggles locales que se persisten al cerrar (POST /api/weight con snm*)
- FAB: `position: fixed`, `z-index: 50`, nunca ocultarlo salvo en modales

### `src/components/morning/MorningRitual.tsx`
- Estructura: array de 5 componentes, índice activo controlado por estado
- Navegación: Swiper o CSS scroll-snap horizontal
- Línea de progreso: `width: ${(step / 5) * 100}%` con `transition: width .4s ease`
- PrioAgent: disparar `POST /api/agents/prio/run` en `useEffect` del paso 1
- Paso 2 (peso): el botón "igual que ayer" preseleccionado si hay registro previo del mismo día

### `src/components/command/OrbitalMap.tsx`
- SVG o div absolutos — div absolutos más fáciles de mantener
- Polling de estado: `useInterval(() => fetch('/api/agents/status'), 8000)`
- Al clicar nodo: `setActiveAgent(agentId)` → panel de detalle a la derecha (pendiente)
- Animaciones: solo CSS, sin librería de animación
- Líneas de conexión: divs con `transform-origin: 0 0` y rotación calculada

### `src/components/command/BottomBar.tsx`
- Polling: mismo intervalo que OrbitalMap, compartir estado via context o prop drilling
- Estados: `'running' | 'active' | 'idle' | 'error'`

### `src/components/finance/Amount.tsx` — CRÍTICO: SSR
```typescript
// isMobile() usa window.innerWidth — NUNCA llamar fuera de useEffect (rompe SSR).
// Patrón correcto para evitar hydration mismatch:
export function Amount({ encrypted }: { encrypted: string }) {
  const key = useAesKey();
  const [real, setReal] = useState<number | null>(null);
  const [masked, setMasked] = useState(false); // false por defecto (SSR safe)

  useEffect(() => {
    setMasked(isMobile()); // solo se ejecuta en cliente
    decrypt(encrypted, key).then(s => setReal(parseFloat(s)));
  }, [encrypted, key]);

  if (real === null) return <span aria-label="cargando importe">···</span>;
  const display = masked ? maskAmount(real) : real;
  return <span>{display.toFixed(2)} €</span>;
}
// Si masked=true (móvil) → aplica fórmula de enmascaramiento
// Si masked=false (desktop) → muestra importe real descifrado
```

### `src/app/setup/page.tsx` — Primer arranque
- Mostrar si tabla `auth` está vacía (sin PIN configurado aún)
- Dos campos: PIN + confirmar PIN (6 dígitos, sin mostrar)
- Al confirmar: POST /api/auth/setup → crea hash + salt → redirect /morning
- Diseño: simple, sin florituras — se ve una sola vez
- Pendiente de diseño visual aprobado

---

*Documento vivo. Actualizar con cada pantalla nueva que se decida.*
*Versión 0.1 · Mayo 2026*
