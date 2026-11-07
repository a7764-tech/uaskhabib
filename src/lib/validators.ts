import { z } from "zod";
export const bookingSchema = z.object({
  roomId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/),
  purposeType: z.enum(["ORGANISASI", "AKADEMIK", "UMUM"]),
  purpose: z.string().trim().min(3), eventName: z.string().trim().min(2),
  organizationName: z.string().optional(), programStudy: z.string().optional(), course: z.string().optional(),
  participants: z.coerce.number().int().positive(), documentUrl: z.string().optional(),
}).refine(d => d.startTime < d.endTime, { message: "Jam selesai harus setelah jam mulai" });
export const registerSchema = z.object({
  name: z.string().trim().min(3), email: z.string().trim().email().transform(value => value.toLowerCase()), password: z.string().min(8),
  phone: z.string().optional(), nimNip: z.string().optional(),
});
export const roomSchema = z.object({
  name: z.string().min(2), type: z.enum(["KELAS","LAB","AULA","RAPAT"]), capacity: z.coerce.number().int().positive(),
  building: z.string().min(2), floor: z.coerce.number().int().nonnegative(), facilities: z.string().default(""), pricePerHour: z.coerce.number().int().nonnegative().default(0),
  imageUrl: z.string().optional(),
});
