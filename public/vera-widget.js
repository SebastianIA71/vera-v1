// ═══════════════════════════════════════════════════════
//  VERA Widget · Scriptable · medium size
//  1. Copia TODO este código en Scriptable (nueva script)
//  2. Ponle nombre "Vera" y ejecuta una vez para probar
//  3. Añade un widget medium → long press → Edit Widget → Script: Vera
// ═══════════════════════════════════════════════════════

const APP_URL = "https://vera-v1-bhxy.vercel.app";
const API     = APP_URL + "/api/widget/summary";

// ── Fetch ────────────────────────────────────────────
let data;
try {
  const req = new Request(API);
  req.timeoutInterval = 15;
  data = JSON.parse(await req.loadString());
} catch (e) {
  data = {
    today: "Sin datos", time: "--:--",
    urgentTasks: [], inboxCount: 0,
    weight: null, nextTrip: null,
    events: [], propertyCounts: { flat: 0, sarapita: 0, willys: 0 },
    projects: [], vehicle: null, focusActive: false,
  };
}

// ── Paleta ───────────────────────────────────────────
const C = {
  bg:     new Color("#07080a"),
  bg2:    new Color("#0d0f12"),
  bg3:    new Color("#131619"),
  bg4:    new Color("#1a1d22"),
  text:   new Color("#eceae2"),
  text2:  new Color("#7d7c87"),
  text3:  new Color("#3e3d48"),
  gold:   new Color("#c4a86a"),
  gold2:  new Color("#e8d5a3"),
  green:  new Color("#4ecb8d"),
  red:    new Color("#e05c5c"),
  amber:  new Color("#e8a020"),
  blue:   new Color("#5ba8e8"),
  purple: new Color("#9b7fe8"),
  cyan:   new Color("#3ecfcf"),
};

// Color con transparencia (Scriptable no soporta hex de 8 dígitos)
function ca(hex, alpha) { return new Color(hex, alpha); }

const PROP = {
  flat:     { icon: "🏙", c: C.blue,   hex: "#5ba8e8" },
  sarapita: { icon: "🌿", c: C.purple, hex: "#9b7fe8" },
  willys:   { icon: "🎪", c: C.green,  hex: "#4ecb8d" },
};

// ── Widget base ──────────────────────────────────────
const w = new ListWidget();
w.url = APP_URL;  // pulsar el widget abre la app

const grad = new LinearGradient();
grad.locations = [0, 0.5, 1];
grad.colors    = [new Color("#111316"), new Color("#09090b"), new Color("#07080a")];
w.backgroundGradient = grad;
w.setPadding(12, 14, 10, 14);

// ════════════════════════════════════════════════════
// HEADER:  ✦ VERA  ·  [foco?]  ·  hora
// ════════════════════════════════════════════════════
const hdr = w.addStack();
hdr.layoutHorizontally();
hdr.centerAlignContent();

const brand = hdr.addText("✦ VERA");
brand.textColor = C.gold2;
brand.font      = Font.boldSystemFont(12);

if (data.focusActive) {
  hdr.addSpacer(8);
  const fBadge = hdr.addStack();
  fBadge.layoutHorizontally();
  fBadge.centerAlignContent();
  fBadge.backgroundColor = ca("#9b7fe8", 0.12);
  fBadge.cornerRadius    = 5;
  fBadge.setPadding(2, 5, 2, 5);
  const fTxt = fBadge.addText("FOCO");
  fTxt.textColor = C.purple;
  fTxt.font      = Font.mediumSystemFont(8);
}

hdr.addSpacer();

const timeChip = hdr.addStack();
timeChip.layoutHorizontally();
timeChip.centerAlignContent();
timeChip.backgroundColor = C.bg4;
timeChip.cornerRadius    = 5;
timeChip.setPadding(2, 6, 2, 6);
const timeT = timeChip.addText(data.time ?? "--:--");
timeT.textColor = C.text2;
timeT.font      = Font.regularMonospacedSystemFont(10);

w.addSpacer(8);

// ════════════════════════════════════════════════════
// MAIN: izquierda (urgentes)  |  derecha (viaje/peso)
// ════════════════════════════════════════════════════
const main = w.addStack();
main.layoutHorizontally();

// ── IZQUIERDA: tareas urgentes ──────────────────────
const left = main.addStack();
left.layoutVertically();
left.topAlignContent();

const urgCount = data.urgentTasks?.length ?? 0;

const urgHdr = left.addStack();
urgHdr.layoutHorizontally();
urgHdr.centerAlignContent();
const urgDot = urgHdr.addText("● ");
urgDot.textColor = urgCount > 0 ? C.red : C.green;
urgDot.font      = Font.boldSystemFont(7);
const urgLbl = urgHdr.addText(urgCount > 0 ? `${urgCount} URGENTES` : "TODO EN ORDEN");
urgLbl.textColor = C.text3;
urgLbl.font      = Font.mediumSystemFont(8);

left.addSpacer(6);

if (urgCount > 0) {
  for (const t of data.urgentTasks.slice(0, 3)) {
    const row = left.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    const prop = PROP[t.prop] ?? { icon: "·", c: C.gold, hex: "#c4a86a" };
    const bar  = row.addText("▎");
    bar.textColor = prop.c;
    bar.font      = Font.boldSystemFont(16);
    row.addSpacer(4);

    const tStack = row.addStack();
    tStack.layoutVertically();
    const tTitle = tStack.addText(t.title);
    tTitle.textColor = C.text;
    tTitle.font      = Font.systemFont(12);
    tTitle.lineLimit = 1;
    if (t.prop) {
      const tProp = tStack.addText(`${prop.icon} ${t.prop.toUpperCase()}`);
      tProp.textColor = prop.c;
      tProp.font      = Font.mediumSystemFont(8);
    }
    left.addSpacer(5);
  }
} else {
  const okTxt = left.addText("✓ Sin urgentes hoy");
  okTxt.textColor = C.green;
  okTxt.font      = Font.systemFont(11);
}

main.addSpacer();

// ── DIVISOR vertical ────────────────────────────────
const divLine = main.addStack();
divLine.backgroundColor = C.bg4;
divLine.size            = new Size(0.5, 0);
main.addSpacer(12);

// ── DERECHA: viaje hero + peso + inbox ──────────────
const right = main.addStack();
right.layoutVertically();
right.topAlignContent();
right.centerAlignContent();

const trip = data.nextTrip;
if (trip && trip.days !== null) {
  const days    = trip.days;
  const daysNum = right.addText(days <= 0 ? "HOY" : String(days));
  daysNum.textColor = C.blue;
  daysNum.font      = Font.boldSystemFont(days <= 0 ? 20 : 34);
  daysNum.lineLimit = 1;

  if (days > 0) {
    const lbl = right.addText("✈ DÍAS");
    lbl.textColor = C.text3;
    lbl.font      = Font.mediumSystemFont(8);
    right.addSpacer(2);
  }

  const tripName = right.addText(trip.title);
  tripName.textColor = C.text2;
  tripName.font      = Font.systemFont(9);
  tripName.lineLimit = 2;
  right.addSpacer(5);
} else {
  const noTrip = right.addText("Sin viajes\npróximos");
  noTrip.textColor = C.text3;
  noTrip.font      = Font.systemFont(10);
  noTrip.lineLimit = 2;
  right.addSpacer(5);
}

if (data.weight) {
  const wRow = right.addStack();
  wRow.layoutHorizontally();
  wRow.centerAlignContent();
  const wVal = wRow.addText(`${data.weight.value} kg `);
  wVal.textColor = C.text2;
  wVal.font      = Font.boldSystemFont(10);
  const tColor = data.weight.trend === '↓' ? C.green
               : data.weight.trend === '↑' ? C.red
               : C.text3;
  const wTrend = wRow.addText(data.weight.trend ?? "→");
  wTrend.textColor = tColor;
  wTrend.font      = Font.boldSystemFont(11);
  right.addSpacer(4);
}

if ((data.inboxCount ?? 0) > 0) {
  const ibRow = right.addStack();
  ibRow.layoutHorizontally();
  ibRow.centerAlignContent();
  ibRow.backgroundColor = ca("#e8a020", 0.1);
  ibRow.cornerRadius    = 5;
  ibRow.setPadding(2, 6, 2, 6);
  const ibTxt = ibRow.addText(`${data.inboxCount} inbox`);
  ibTxt.textColor = C.amber;
  ibTxt.font      = Font.mediumSystemFont(9);
}

// ════════════════════════════════════════════════════
// BOTTOM BAR: propiedades · vehículo · proyectos · fecha
// ════════════════════════════════════════════════════
w.addSpacer();

const btm = w.addStack();
btm.layoutHorizontally();
btm.centerAlignContent();

// Propiedades con contador de tareas
const propCounts = data.propertyCounts ?? {};
for (const [id, cfg] of Object.entries(PROP)) {
  const cnt   = propCounts[id] ?? 0;
  const badge = btm.addStack();
  badge.layoutHorizontally();
  badge.centerAlignContent();
  badge.backgroundColor = ca(cfg.hex, 0.1);
  badge.cornerRadius    = 5;
  badge.setPadding(2, 5, 2, 5);
  const bi = badge.addText(cfg.icon);
  bi.font = Font.systemFont(9);
  badge.addSpacer(2);
  const bc = badge.addText(String(cnt));
  bc.textColor = cfg.c;
  bc.font      = Font.boldSystemFont(9);
  btm.addSpacer(4);
}

// Vehículo
if (data.vehicle) {
  const vColor = data.vehicle.status === 'pasado' ? C.red
               : data.vehicle.status === 'corto'  ? C.amber
               : C.green;
  const vBadge = btm.addStack();
  vBadge.layoutHorizontally();
  vBadge.centerAlignContent();
  vBadge.backgroundColor = ca("#5ba8e8", 0.1);
  vBadge.cornerRadius    = 5;
  vBadge.setPadding(2, 5, 2, 5);
  const vi = vBadge.addText("🚗");
  vi.font = Font.systemFont(9);
  vBadge.addSpacer(2);
  const vKm = vBadge.addText(`${(data.vehicle.latestKm ?? 0).toLocaleString('es')} km`);
  vKm.textColor = vColor;
  vKm.font      = Font.boldSystemFont(9);
  btm.addSpacer(4);
}

// Proyectos con contador de tareas pendientes
for (const p of (data.projects ?? []).slice(0, 3)) {
  const pHex   = (p.color ?? "#9b7fe8").slice(0, 7);
  const pColor = new Color(pHex);
  const pb     = btm.addStack();
  pb.layoutHorizontally();
  pb.centerAlignContent();
  pb.backgroundColor = ca(pHex, 0.1);
  pb.cornerRadius    = 5;
  pb.setPadding(2, 5, 2, 5);
  const pi = pb.addText(p.icon ?? "●");
  pi.font = Font.systemFont(9);
  if ((p.taskCount ?? 0) > 0) {
    pb.addSpacer(2);
    const pc = pb.addText(String(p.taskCount));
    pc.textColor = pColor;
    pc.font      = Font.boldSystemFont(9);
  }
  btm.addSpacer(4);
}

btm.addSpacer();

const dateT = btm.addText(data.today ?? "");
dateT.textColor = C.text3;
dateT.font      = Font.systemFont(9);

// ── Fin ──────────────────────────────────────────────
if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
