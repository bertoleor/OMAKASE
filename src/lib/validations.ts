/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas for all user inputs.
 * Used in both client-side forms and server-side API routes.
 */

import { z } from "zod";

/**
 * Common validation patterns
 */
const phoneRegex = /^\+?[\d\s\-()]{8,20}$/;
const dniRegex = /^[A-Za-z0-9]{5,15}$/;

/**
 * Booking form validation schema
 */
export const bookingSchema = z.object({
  customerName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es muy largo"),
  
  customerEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Correo electrónico inválido" })
    .max(255, "El correo es muy largo"),
  
  customerPhone: z
    .string()
    .regex(phoneRegex, "Teléfono inválido"),
  
  customerDni: z
    .string()
    .regex(dniRegex, "DNI inválido")
    .optional()
    .or(z.literal("")),
  
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  
  bookingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  
  pax: z
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 comensal")
    .max(20, "Máximo 20 comensales"),
  
  zone: z
    .enum(["indoor_tables", "outdoor_pergola", "indoor_bar"]),
  
  notes: z
    .string()
    .max(500, "Las notas son muy largas")
    .optional()
    .or(z.literal("")),
  
  depositAmount: z
    .number()
    .min(0, "El depósito no puede ser negativo")
    .max(10000, "El depósito máximo es $10,000"),
});

/**
 * TypeScript type inferred from booking schema
 */
export type BookingFormData = z.infer<typeof bookingSchema>;

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Correo electrónico inválido" })
    .max(255),
  
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Customer profile update schema
 */
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100)
    .optional(),
  
  phone: z
    .string()
    .regex(phoneRegex, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
  
  dni: z
    .string()
    .regex(dniRegex, "DNI inválido")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

/**
 * Admin reservation update schema
 */
export const reservationUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "seated",
    "completed",
    "cancelled",
    "no_show",
  ]),
  
  tableId: z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, { message: "ID de mesa inválido" })
    .nullable(),
  
  notes: z
    .string()
    .max(1000)
    .optional(),
  
  depositAmount: z
    .number()
    .min(0)
    .max(10000)
    .optional(),
  
  durationMinutes: z
    .number()
    .int()
    .min(15, "Mínimo 15 minutos")
    .max(480, "Máximo 8 horas")
    .optional(),
});

export type ReservationUpdateData = z.infer<typeof reservationUpdateSchema>;

/**
 * Settings update schema
 */
export const settingsUpdateSchema = z.object({
  defaultDurationMinutes: z
    .number()
    .int()
    .min(15)
    .max(480)
    .optional(),
  
  gapMinutes: z
    .number()
    .int()
    .min(0)
    .max(120)
    .optional(),
  
  maxAdvanceDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional(),
  
  openingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  
  closingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  
  maxPaxPerBooking: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),
  
  minAdvanceMinutes: z
    .number()
    .int()
    .min(0)
    .max(1440)
    .optional(),
  
  termsAndConditions: z
    .string()
    .max(5000)
    .optional(),
  
  contactEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Email inválido" })
    .optional()
    .or(z.literal("")),
  
  contactPhone: z
    .string()
    .regex(phoneRegex, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
  
  socialInstagram: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  
  socialFacebook: z
    .string()
    .url({ message: "URL inválida" })
    .optional()
    .or(z.literal("")),
  
  address: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
});

export type SettingsUpdateData = z.infer<typeof settingsUpdateSchema>;

/**
 * Zone/Table validation schemas
 */
export const zoneSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100),
  
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  
  capacityPax: z
    .number()
    .int()
    .min(1)
    .max(500),
  
  isActive: z.boolean().optional(),
  
  displayOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});

export type ZoneFormData = z.infer<typeof zoneSchema>;

export const tableSchema = z.object({
  zoneId: z
    .uuid("ID de zona inválido"),
  
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50),
  
  seats: z
    .number()
    .int()
    .min(1)
    .max(50),
  
  positionX: z
    .number()
    .min(0)
    .max(1000)
    .optional(),
  
  positionY: z
    .number()
    .min(0)
    .max(1000)
    .optional(),
  
  width: z
    .number()
    .min(20)
    .max(500)
    .optional(),
  
  height: z
    .number()
    .min(20)
    .max(500)
    .optional(),
  
  shape: z
    .enum(["rectangle", "circle", "square"])
    .optional(),
  
  rotation: z
    .number()
    .min(0)
    .max(360)
    .optional(),
  
  isActive: z.boolean().optional(),
  
  displayOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});

export type TableFormData = z.infer<typeof tableSchema>;

/**
 * Staff member validation schema
 */
export const staffSchema = z.object({
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Correo electrónico inválido" }),
  
  fullName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  
  role: z.enum(["admin", "manager", "staff", "cashier"]),
});

export type StaffFormData = z.infer<typeof staffSchema>;

/**
 * Server-action input schema for createBooking.
 *
 * Strict: unknown keys (raw card number, CVV, expiry, legacy paymentToken /
 * cardBrand / cardLastFour) are rejected. Only Mercado Pago reference IDs
 * may accompany a booking — never PAN data.
 */
export const createBookingInputSchema = z
  .object({
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z
      .string()
      .trim()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Invalid email" })
      .max(255),
    customerPhone: z.string().trim().regex(phoneRegex, "Invalid phone"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
    pax: z.number().int().min(1).max(20),
    zone: z.enum(["indoor-tables", "outdoor-pergola", "indoor-bar"]),
    notes: z.string().trim().max(500).optional(),
    idempotencyKey: z.uuid("Invalid idempotency key").optional(),
    mpPaymentId: z
      .string()
      .trim()
      .regex(/^\d{1,32}$/, "Invalid payment reference")
      .optional(),
    mpPreferenceId: z.string().trim().min(1).max(64).optional(),
    honeypot: z.string().max(500).optional(),
    renderedAt: z.string().max(64).optional(),
  })
  .strict();

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

/**
 * Utility function to validate and return formatted errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  
  return { success: false, errors };
}
