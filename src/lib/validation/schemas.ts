import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Schemas de validación para endpoints críticos
//
// Uso:
//   const data = createTaskSchema.parse(req.body);
//
// Con manejo de errores:
//   try {
//     const data = createTaskSchema.parse(req.body);
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 400 });
//   }
// ─────────────────────────────────────────────────────────────────────────────

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authSetupSchema = z.object({
  pinHash: z.string().min(1, 'pinHash requerido'),
  pinSalt: z.string().min(1, 'pinSalt requerido'),
});

export const authLoginSchema = z.object({
  pinHash: z.string().min(1, 'pinHash requerido'),
});

export const webauthnAuthVerifySchema = z.object({
  id: z.string().min(1, 'id requerido'),
  // ... otros campos de WebAuthn
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string()
    .min(1, 'Título requerido')
    .max(200, 'Título máximo 200 caracteres')
    .trim(),
  detail: z.string()
    .max(2000, 'Detalle máximo 2000 caracteres')
    .optional()
    .nullable(),
  propertyId: z.enum(['flat', 'sarapita', 'willys'])
    .optional()
    .nullable(),
  projectId: z.number()
    .int()
    .positive()
    .optional()
    .nullable(),
  prio: z.number()
    .int()
    .min(1, 'Prio mínimo 1')
    .max(9, 'Prio máximo 9')
    .default(5),
  type: z.enum(['task', 'note', 'idea'])
    .default('task'),
  tags: z.string()
    .max(500, 'Tags máximo 500 caracteres')
    .optional()
    .nullable(),
  dueDate: z.string()
    .datetime()
    .optional()
    .nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['wait', 'doing', 'done', 'archived'])
    .optional(),
});

export const taskNowSchema = z.object({
  id: z.number().int().positive('ID requerido'),
});

// ─── Contacts ───────────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  name: z.string()
    .min(1, 'Nombre requerido')
    .max(100, 'Nombre máximo 100 caracteres')
    .trim(),
  frequencyDays: z.number()
    .int()
    .positive('Frecuencia debe ser positiva')
    .default(30),
  notes: z.string()
    .max(1000, 'Notas máximo 1000 caracteres')
    .optional()
    .nullable(),
});

export const updateContactSchema = createContactSchema.partial();

// ─── Inbox ──────────────────────────────────────────────────────────────────

export const createInboxSchema = z.object({
  content: z.string()
    .min(1, 'Contenido requerido')
    .max(5000, 'Contenido máximo 5000 caracteres')
    .trim(),
  source: z.string()
    .max(50, 'Source máximo 50 caracteres')
    .optional()
    .nullable(),
  type: z.enum(['raw', 'note', 'task', 'idea'])
    .default('raw'),
});

// ─── Weight ─────────────────────────────────────────────────────────────────

export const logWeightSchema = z.object({
  value: z.number()
    .positive('Peso debe ser positivo')
    .max(500, 'Peso debe ser menor a 500 kg'),
  date: z.string()
    .date()
    .optional(),
  snmAgua: z.boolean().optional(),
  snmCaminar: z.boolean().optional(),
  snmEntreno: z.boolean().optional(),
  snmEscucha: z.boolean().optional(),
  snmDisfruta: z.boolean().optional(),
  notes: z.string()
    .max(500, 'Notas máximo 500 caracteres')
    .optional()
    .nullable(),
});

// ─── Voice ──────────────────────────────────────────────────────────────────

export const voiceTranscriptSchema = z.object({
  transcript: z.string()
    .min(1, 'Transcript requerido')
    .max(10000, 'Transcript máximo 10000 caracteres')
    .trim(),
});

// ─── Agents ─────────────────────────────────────────────────────────────────

export const runAgentSchema = z.object({
  agent: z.enum(['prio', 'alerts']).describe('Agent debe ser prio o alerts'),
});

// ─── Search ─────────────────────────────────────────────────────────────────

export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Query requerido')
    .max(500, 'Query máximo 500 caracteres')
    .trim(),
});

// ─── Finance ────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  amount: z.number()
    .positive('Monto debe ser positivo')
    .max(1_000_000, 'Monto máximo 1,000,000'),
  description: z.string()
    .min(1, 'Descripción requerida')
    .max(300, 'Descripción máximo 300 caracteres')
    .trim(),
  category: z.string()
    .max(50, 'Categoría máximo 50 caracteres')
    .optional(),
  date: z.string()
    .date()
    .optional(),
  propertyId: z.enum(['flat', 'sarapita', 'willys'])
    .optional()
    .nullable(),
  projectId: z.number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

// ─── Properties ─────────────────────────────────────────────────────────────

export const createPropertySchema = z.object({
  id: z.string()
    .min(1, 'ID requerido')
    .max(50, 'ID máximo 50 caracteres'),
  name: z.string()
    .min(1, 'Nombre requerido')
    .max(100, 'Nombre máximo 100 caracteres')
    .trim(),
  location: z.string()
    .max(200, 'Location máximo 200 caracteres')
    .optional(),
  color: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser hex válido')
    .optional(),
  icon: z.string()
    .max(5, 'Icon máximo 5 caracteres')
    .optional(),
});

// ─── Projects ───────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Nombre requerido')
    .max(200, 'Nombre máximo 200 caracteres')
    .trim(),
  description: z.string()
    .max(2000, 'Descripción máximo 2000 caracteres')
    .optional()
    .nullable(),
  status: z.enum(['active', 'paused', 'archived'])
    .default('active'),
  dueDate: z.string()
    .datetime()
    .optional()
    .nullable(),
  color: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser hex válido')
    .optional(),
  icon: z.string()
    .max(5, 'Icon máximo 5 caracteres')
    .optional(),
});

// ─── Events ─────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string()
    .min(1, 'Título requerido')
    .max(200, 'Título máximo 200 caracteres')
    .trim(),
  startDate: z.string()
    .datetime()
    .optional(),
  endDate: z.string()
    .datetime()
    .optional(),
  type: z.string()
    .max(50, 'Type máximo 50 caracteres')
    .optional(),
  who: z.string()
    .max(200, 'Who máximo 200 caracteres')
    .optional()
    .nullable(),
  status: z.enum(['planning', 'confirmed', 'done', 'cancelled'])
    .default('planning'),
  notes: z.string()
    .max(2000, 'Notas máximo 2000 caracteres')
    .optional()
    .nullable(),
});

