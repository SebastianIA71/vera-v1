// ═══════════════════════════════════════════════════════
//  VERA Widget · Scriptable · medium size
//  Pega este código en Scriptable y añade un widget
//  medium a tu pantalla de inicio.
// ═══════════════════════════════════════════════════════

const API = "https://vera-v1-bhxy.vercel.app/api/widget/summary";

// ── Fetch ──────────────────────────────────────────────
let data;
try {
  const req = new Request(API);
  req.timeoutInterval = 15;
  data = JSON.parse(await req.loadString());
} catch(e) {
  data = {
    today: "Sin datos", time: "--:--",
    urgentTasks: [], inboxCount: 0,
    weight: null, nextTrip: null,
    events: [], propertyCounts: { flat: 0, sarapita: 0, willys: 0 },
    projects: [], vehicle: null, focusActive: false,
  };
}

// ── Paleta ─────────────────────────────────────────────
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

const PROP = {
  flat:     { icon: "🏙", c: new Color("#5ba8e8"), hex: "#5ba8e8" },
  sarapita: { icon: "🌿", c: new Color("#9b7fe8"), hex: "#9b7fe8" },
  willys:   { icon: "🎪", c: new Color("#4ecb8d"), hex: "#4ecb8d" },
};

// ── Widget ─────────────────────────────────────────────
const w = new ListWidget();

const grad = new LinearGradient();
grad.locations = [0, 0.5, 1];
grad.colors    = [new Color("#111316"), new Color("#09090b"), new Color("#07080a")];
w.backgroundGradient = grad;
w.setPadding(12, 14, 10, 14);

// ════════════════════════════════════════════════
// HEADER: ✦ VERA  ·  [focus?]  ·  hora
// ════════════════════════════════════════════════
const hdr = w.addStack();
hdr.layoutHorizontally();
hdr.centerAlignContent();

// Logo
const logo = hdr.addText("✦");
logo.textColor = C.gold;
logo.font = Font.boldSystemFont(11);
hdr.addSpacer(4);
const brand = hdr.addText("VERA");
brand.textColor = C.gold2;
brand.font = Font.boldSystemFont(12);

// Focus badge
if (data.focusActive) {
  hdr.addSpacer(8);
  const fBadge = hdr.addStack();
  fBadge.layoutHorizontally();
  fBadge.centerAlignContent();
  fBadge.backgroundColor = new Color("#9b7fe820");
  fBadge.cornerRadius = 5;
  fBadge.setPadding(2, 5, 2, 5);
  const fTxt = fBadge.addText("FOCO ACTIVO");
  fTxt.textColor = C.purple;
  fTxt.font = Font.mediumSystemFont(8);
}

hdr.addSpacer();

// Hora en chip
const timeChip = hdr.addStack();
timeChip.layoutHorizontally();
timeChip.centerAlignContent();
timeChip.backgroundColor = C.bg4;
timeChip.cornerRadius = 5;
timeChip.setPadding(2, 6, 2, 6);
const timeT = timeChip.addText(data.time ?? "--:--");
timeT.textColor = C.text2;
timeT.font = Font.regularMonospacedSystemFont(10);

w.addSpacer(6);

// Separator line
const sep = w.addStack();
sep.backgroundColor = C.bg4;
sep.size = new Size(0, 0.5);

w.addSpacer(7);

// ════════════════════════════════════════════════
// MAIN: columna izquierda (tareas) + columna derecha (viaje)
// ════════════════════════════════════════════════
const main = w.addStack();
main.layoutHorizontally();

// ── Izquierda: Urgentes ───────────────────────
const left = main.addStack();
left.layoutVertically();
left.topAlignContent();

// Cabecera sección
const urgHdr = left.addStack();
urgHdr.layoutHorizontally();
urgHdr.centerAlignContent();
const urgDot = urgHdr.addText("●");
urgDot.textColor = data.urgentTasks?.length > 0 ? C.red : C.green;
urgDot.font = Font.boldSystemFont(7);
urgHdr.addSpacer(5);
const urgLbl = urgHdr.addText(
  data.urgentTasks?.length > 0
    ? `${data.urgentTasks.length} URGENTES`
    : "SIN URGENTES"
);
urgLbl.textColor = C.text3;
urgLbl.font = Font.mediumSystemFont(8);

left.addSpacer(6);

if (data.urgentTasks?.length > 0) {
  for (const t of (data.urgentTasks || []).slice(0, 3)) {
    const row = left.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    // Barra de color de propiedad
    const prop = PROP[t.prop] ?? { icon: "●", c: C.gold, hex: "#c4a86a" };
    const bar = row.addText("▎");
    bar.textColor = prop.c;
    bar.font = Font.boldSystemFont(18);
    row.addSpacer(4);

    // Título
    const tStack = row.addStack();
    tStack.layoutVertically();
    const tTitle = tStack.addText(t.title);
    tTitle.textColor = C.text;
    tTitle.font = Font.systemFont(12);
    tTitle.lineLimit = 1;
    if (t.prop) {
      const tProp = tStack.addText(`${prop.icon} ${t.prop.toUpperCase()}`);
      tProp.textColor = prop.c;
      tProp.font = Font.mediumSystemFont(8);
    }

    left.addSpacer(4);
  }
} else {
  const okTxt = left.addText("Todo en orden ✓");
  okTxt.textColor = C.green;
  okTxt.font = Font.systemFont(11);
}

main.addSpacer();

// ── Divisor vertical ─────────────────────────
const divLine = main.addStack();
divLine.backgroundColor = C.bg4;
divLine.size = new Size(0.5, 0);

main.addSpacer(12);

// ── Derecha: Viaje hero + stats ───────────────
const right = main.addStack();
right.layoutVertically();
right.topAlignContent();
right.centerAlignContent();

if (data.nextTrip && data.nextTrip.days !== null) {
  // BIG número tipo Spotify
  const daysNum = right.addText(String(data.nextTrip.days));
  daysNum.textColor = C.blue;
  daysNum.font = Font.boldSystemFont(38);
  daysNum.lineLimit = 1;

  // Etiqueta con ícono de tipo
  const typeIcon = data.nextTrip.type === 'viaje' ? "✈" : "📅";
  const daysLbl = right.addText(`${typeIcon} DÍAS`);
  daysLbl.textColor = C.text3;
  daysLbl.font = Font.mediumSystemFont(8);

  right.addSpacer(3);

  // Nombre del viaje
  const tripName = right.addText(data.nextTrip.title);
  tripName.textColor = C.text2;
  tripName.font = Font.systemFont(9);
  tripName.lineLimit = 2;

  right.addSpacer(5);
} else {
  // Sin viajes próximos
  const noTrip = right.addText("Sin viajes\npróximos");
  noTrip.textColor = C.text3;
  noTrip.font = Font.systemFont(10);
  noTrip.lineLimit = 2;
  right.addSpacer(5);
}

// Weight
if (data.weight) {
  const wRow = right.addStack();
  wRow.layoutHorizontally();
  wRow.centerAlignContent();
  const wVal = wRow.addText(`${data.weight.value} kg`);
  wVal.textColor = C.text2;
  wVal.font = Font.boldSystemFont(10);
  wRow.addSpacer(3);
  const trendColor =
    data.weight.trend === '↓' ? C.green :
    data.weight.trend === '↑' ? C.red : C.text3;
  const wTrend = wRow.addText(data.weight.trend);
  wTrend.textColor = trendColor;
  wTrend.font = Font.boldSystemFont(11);
  right.addSpacer(3);
}

// Inbox badge
if (data.inboxCount > 0) {
  const ibRow = right.addStack();
  ibRow.layoutHorizontally();
  ibRow.centerAlignContent();
  ibRow.backgroundColor = new Color("#e8a02018");
  ibRow.cornerRadius = 5;
  ibRow.setPadding(2, 5, 2, 5);
  const ibNum = ibRow.addText(String(data.inboxCount));
  ibNum.textColor = C.amber;
  ibNum.font = Font.boldSystemFont(10);
  ibRow.addSpacer(3);
  const ibLbl = ibRow.addText("inbox");
  ibLbl.textColor = C.amber;
  ibLbl.font = Font.mediumSystemFont(8);
}

// ════════════════════════════════════════════════
// BOTTOM BAR: propiedades · proyectos · vehículo · fecha
// ════════════════════════════════════════════════
w.addSpacer();

const btm = w.addStack();
btm.layoutHorizontally();
btm.centerAlignContent();

// Property badges
const counts = data.propertyCounts ?? {};
for (const [id, cfg] of Object.entries(PROP)) {
  const cnt = counts[id] ?? 0;
  const badge = btm.addStack();
  badge.layoutHorizontally();
  badge.centerAlignContent();
  badge.backgroundColor = new Color(cfg.hex + "1a"); // ~10% opacity
  badge.cornerRadius = 5;
  badge.setPadding(2, 5, 2, 5);
  const bi = badge.addText(cfg.icon);
  bi.font = Font.systemFont(9);
  badge.addSpacer(2);
  const bc = badge.addText(String(cnt));
  bc.textColor = cfg.c;
  bc.font = Font.boldSystemFont(9);
  btm.addSpacer(4);
}

// Vehicle km (si existe)
if (data.vehicle) {
  btm.addSpacer(4);
  const vBadge = btm.addStack();
  vBadge.layoutHorizontally();
  vBadge.centerAlignContent();
  const vStatusColor =
    data.vehicle.status === 'pasado' ? C.red :
    data.vehicle.status === 'corto'  ? C.amber : C.green;
  vBadge.backgroundColor = new Color("#5ba8e81a");
  vBadge.cornerRadius = 5;
  vBadge.setPadding(2, 5, 2, 5);
  const vIcon = vBadge.addText("🚗");
  vIcon.font = Font.systemFont(9);
  vBadge.addSpacer(2);
  const vKm = vBadge.addText(`${(data.vehicle.latestKm ?? 0).toLocaleString('es')} km`);
  vKm.textColor = vStatusColor;
  vKm.font = Font.boldSystemFont(9);
}

// Projects activos (sólo iconos)
if (data.projects?.length > 0) {
  btm.addSpacer(6);
  const projRow = btm.addStack();
  projRow.layoutHorizontally();
  projRow.centerAlignContent();
  for (const p of (data.projects ?? []).slice(0, 3)) {
    const icon = projRow.addText(p.icon ?? "●");
    icon.font = Font.systemFont(10);
    projRow.addSpacer(3);
  }
}

btm.addSpacer();

// Fecha
const dateT = btm.addText(data.today ?? "");
dateT.textColor = C.text3;
dateT.font = Font.systemFont(9);

// ── Fin ───────────────────────────────────────
if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
