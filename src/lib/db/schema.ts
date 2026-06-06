import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const auth = sqliteTable('auth', {
  id: integer('id').primaryKey(),
  pinHash: text('pin_hash').notNull(),
  pinSalt: text('pin_salt').notNull(),
  failedAttempts: integer('failed_attempts').default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  color: text('color'),
  icon: text('icon'),
});

export const projects = sqliteTable('projects', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  description: text('description'),
  status:      text('status').default('active'),
  color:       text('color'),
  icon:        text('icon'),
  dueDate:     integer('due_date', { mode: 'timestamp' }),
  createdAt:   integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt:   integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  propertyId: text('property_id').references(() => properties.id),
  projectId: integer('project_id').references(() => projects.id),
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
  recurrence: text('recurrence'),           // 'daily'|'weekly'|'monthly'|'custom'|null
  recurrenceInterval: integer('recurrence_interval'), // días (solo para 'custom')
}, (t) => ({
  statusPrioIdx: index('tasks_status_prio').on(t.status, t.prioFinal),
  propertyIdx:   index('tasks_property').on(t.propertyId),
  inNowIdx:      index('tasks_in_now').on(t.inNow),
}));

export const weightLog = sqliteTable('weight_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  value: real('value').notNull(),
  source: text('source').default('manual'),
  snmAgua: integer('snm_agua', { mode: 'boolean' }),
  snmCaminar: integer('snm_caminar', { mode: 'boolean' }),
  snmEntreno: integer('snm_entreno', { mode: 'boolean' }),
  snmEscucha: integer('snm_escucha', { mode: 'boolean' }),
  snmDisfruta: integer('snm_disfruta', { mode: 'boolean' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
}, (t) => ({
  dateIdx: index('weight_log_date').on(t.date),
}));

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
  meta: text('meta'),
}, (t) => ({
  startDateIdx: index('events_start_date').on(t.startDate),
  typeIdx:      index('events_type').on(t.type),
}));

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
}, (t) => ({
  processedIdx: index('inbox_processed').on(t.processed),
  createdIdx:   index('inbox_created').on(t.createdAt),
}));

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
}, (t) => ({
  agentCreatedIdx: index('agent_log_agent_created').on(t.agentId, t.createdAt),
}));

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
  monthlyAmountEnc: text('monthly_amount_enc'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).default(true),
  alertDaysBefore: integer('alert_days_before').default(45),
  notes: text('notes'),
});

export const webauthnCredentials = sqliteTable('webauthn_credentials', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey:    text('public_key').notNull(),
  counter:      integer('counter').notNull().default(0),
  deviceName:   text('device_name'),
  createdAt:    integer('created_at', { mode: 'timestamp' }).defaultNow(),
  lastUsedAt:   integer('last_used_at', { mode: 'timestamp' }),
});

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  lastContactAt: integer('last_contact_at', { mode: 'timestamp' }),
  frequencyDays: integer('frequency_days').default(30),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const financeRecords = sqliteTable('finance_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  // Grupo 1
  vb: real('vb').default(0),
  xc: real('xc').default(0),
  ps: real('ps').default(0),
  pm: real('pm').default(0),
  // Grupo 2
  lf: real('lf').default(0),
  rs: real('rs').default(0),
  gh: real('gh').default(0),
  mh: real('mh').default(0),
  // Grupo 3
  doo: real('doo').default(0),   // 'do' es palabra reservada SQL
  mo: real('mo').default(0),
  so: real('so').default(0),
  // Libre
  x1: real('x1').default(0),
  x2: real('x2').default(0),
  x3: real('x3').default(0),
  x4: real('x4').default(0),
  x5: real('x5').default(0),
  x6: real('x6').default(0),
  // Calculados (guardados para queries)
  calcA: real('calc_a'),  // VB + XC
  calcB: real('calc_b'),  // VB + XC + PS + PM
  calcC: real('calc_c'),  // LF + RS + GH + MH/2
  calcD: real('calc_d'),  // (A+B+C)/1000
  calcE: real('calc_e'),  // DO + MO + SO
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export const expenses = sqliteTable('expenses', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  propertyId:  text('property_id').references(() => properties.id),
  projectId:   integer('project_id').references(() => projects.id),
  amount:      real('amount').notNull(),
  description: text('description').notNull(),
  category:    text('category').default('otro'), // mantenimiento|suministros|reforma|compra|otro
  date:        text('date').notNull(),           // YYYY-MM-DD
  createdAt:   integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export const attachments = sqliteTable('attachments', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  taskId:    integer('task_id').notNull().references(() => tasks.id),
  url:       text('url').notNull(),
  filename:  text('filename').notNull(),
  mimeType:  text('mime_type'),
  sizeBytes: integer('size_bytes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});

export type EventMeta = {
  destination?: string;
  budget?: { total: number; currency: string; spent: number };
  documents?: { name: string; url?: string; notes?: string }[];
  schedule?: { day: string; description: string }[];
  companions?: { name: string; relation?: string }[];
};

export type EventRow = typeof events.$inferSelect;
