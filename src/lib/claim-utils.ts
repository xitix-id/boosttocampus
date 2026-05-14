import { z } from "zod";

export const activeCampaignId = process.env.ACTIVE_CAMPAIGN_ID || "BTC 2026 Lampung";

export const claimCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/);

export const claimFormSchema = z.object({
  campaignId: z.string().trim().min(1),
  uniqueCode: claimCodeSchema,
  fullName: z.string().trim().min(2, "Nama wajib diisi."),
  phoneWa: z
    .string()
    .trim()
    .transform((value) => normalizeIndonesianPhone(value))
    .pipe(z.string().regex(/^62\d{8,15}$/, "Nomor WA harus valid dan diawali 62.")),
  age: z.coerce.number().int().min(21, "Usia minimum 21 tahun."),
  warungName: z.string().trim().min(2, "Nama warung wajib diisi.")
});

export type ClaimFormInput = z.input<typeof claimFormSchema>;
export type ClaimFormData = z.output<typeof claimFormSchema>;

export function normalizeIndonesianPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "").replace(/^\+/, "");

  if (digits.startsWith("08")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  if (digits.startsWith("620")) {
    return `62${digits.slice(3)}`;
  }

  return digits;
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const cfConnectingIp = headers.get("cf-connecting-ip")?.trim();

  return forwarded || realIp || cfConnectingIp || "127.0.0.1";
}

export function getClaimStatusPath(status: "invalid" | "void" | "rate-limit" | "maintenance") {
  return `/${status}`;
}
