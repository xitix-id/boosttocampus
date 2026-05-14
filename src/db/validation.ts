import { z } from "zod";
import { qrStatuses, scanLogStatuses, systemErrorTypes } from "@/db/schema";

export const uniqueCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9]{6}$/, "Kode QR harus 6 karakter uppercase alphanumeric.");

export const campaignIdSchema = z.string().trim().min(1, "Campaign ID wajib diisi.");

export const phoneWaSchema = z
  .string()
  .trim()
  .regex(/^62\d{8,15}$/, "Nomor WA harus memakai format 62xxxxxxxxxx.");

export const qrStatusSchema = z.enum(qrStatuses);
export const scanLogStatusSchema = z.enum(scanLogStatuses);
export const systemErrorTypeSchema = z.enum(systemErrorTypes);

export const createQrMasterSchema = z.object({
  campaignId: campaignIdSchema,
  uniqueCode: uniqueCodeSchema,
  status: qrStatusSchema.default("unused"),
  used: z.boolean().default(false),
  source: z.string().trim().min(1).default("csv"),
  createdAt: z.date().optional(),
  usedAt: z.date().nullable().optional()
});

export const createScanLogSchema = z.object({
  campaignId: campaignIdSchema,
  uniqueCode: uniqueCodeSchema,
  fullName: z.string().trim().min(1).nullable().optional(),
  phoneWa: phoneWaSchema.nullable().optional(),
  age: z.number().int().min(0).nullable().optional(),
  warungName: z.string().trim().min(1).nullable().optional(),
  status: scanLogStatusSchema,
  ipAddress: z.string().trim().min(1),
  errorType: systemErrorTypeSchema.nullable().optional(),
  attemptedAt: z.date().optional()
});

export const csvQrUploadSchema = z.object({
  campaignId: campaignIdSchema,
  codes: z.array(uniqueCodeSchema).min(1)
});

export type CreateQrMasterInput = z.infer<typeof createQrMasterSchema>;
export type CreateScanLogInput = z.infer<typeof createScanLogSchema>;
export type CsvQrUploadInput = z.infer<typeof csvQrUploadSchema>;
