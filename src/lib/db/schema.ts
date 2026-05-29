import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

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
  monthlyAmountEnc: text('monthly_amount_enc'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).default(true),
  alertDaysBefore: integer('alert_days_before').default(45),
  notes: text('notes'),
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
