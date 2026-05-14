import "server-only";

import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { qrMaster, scanLogs } from "@/db/schema";
import { activeCampaignId, claimCodeSchema, claimFormSchema } from "@/lib/claim-utils";

const RATE_LIMIT_MAX = 2;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ClaimGateResult =
  | { status: "valid"; campaignId: string; uniqueCode: string }
  | { status: "invalid" | "void" | "rate-limit" | "maintenance" };

async function getRecentScanCount(ipAddress: string) {
  const db = getDb();
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const [result] = await db
    .select({ value: count() })
    .from(scanLogs)
    .where(and(eq(scanLogs.ipAddress, ipAddress), gte(scanLogs.attemptedAt, since)));

  return result?.value ?? 0;
}

async function writeAttemptLog(input: {
  campaignId: string;
  uniqueCode: string;
  ipAddress: string;
  status: "invalid_brute" | "already_used" | "rate_limited" | "system_error";
  errorType?: "db_timeout" | "network_failure" | "validation_error";
}) {
  await getDb().insert(scanLogs).values({
    campaignId: input.campaignId,
    uniqueCode: input.uniqueCode,
    status: input.status,
    ipAddress: input.ipAddress,
    errorType: input.errorType ?? null
  });
}

export async function evaluateClaimGate(input: {
  code: string | null | undefined;
  campaignId?: string | null;
  ipAddress: string;
}): Promise<ClaimGateResult> {
  const parsedCode = claimCodeSchema.safeParse(input.code ?? "");
  const campaignId = input.campaignId?.trim() || activeCampaignId;

  if (!parsedCode.success) {
    return { status: "invalid" };
  }

  const uniqueCode = parsedCode.data;

  try {
    const recentScanCount = await getRecentScanCount(input.ipAddress);

    if (recentScanCount >= RATE_LIMIT_MAX) {
      await writeAttemptLog({
        campaignId,
        uniqueCode,
        ipAddress: input.ipAddress,
        status: "rate_limited"
      });
      return { status: "rate-limit" };
    }

    const [qrCode] = await getDb()
      .select()
      .from(qrMaster)
      .where(and(eq(qrMaster.uniqueCode, uniqueCode), eq(qrMaster.campaignId, campaignId)))
      .limit(1);

    if (!qrCode) {
      await writeAttemptLog({
        campaignId,
        uniqueCode,
        ipAddress: input.ipAddress,
        status: "invalid_brute"
      });
      return { status: "invalid" };
    }

    if (qrCode.used || qrCode.status === "used") {
      await writeAttemptLog({
        campaignId,
        uniqueCode,
        ipAddress: input.ipAddress,
        status: "already_used"
      });
      return { status: "void" };
    }

    return { status: "valid", campaignId, uniqueCode };
  } catch {
    return { status: "maintenance" };
  }
}

export async function submitClaim(input: Record<string, unknown> & { ipAddress: string }) {
  const parsed = claimFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      status: "failed_validation" as const,
      message: parsed.error.issues[0]?.message || "Data belum valid."
    };
  }

  const data = parsed.data;

  try {
    const recentScanCount = await getRecentScanCount(input.ipAddress);

    if (recentScanCount >= RATE_LIMIT_MAX) {
      await writeAttemptLog({
        campaignId: data.campaignId,
        uniqueCode: data.uniqueCode,
        ipAddress: input.ipAddress,
        status: "rate_limited"
      });
      return { ok: false as const, status: "rate_limited" as const, message: "Batas scan harian tercapai." };
    }

    const result = await getDb().transaction(async (tx) => {
      const [qrCode] = await tx
        .select()
        .from(qrMaster)
        .where(and(eq(qrMaster.uniqueCode, data.uniqueCode), eq(qrMaster.campaignId, data.campaignId)))
        .limit(1);

      if (!qrCode) {
        await tx.insert(scanLogs).values({
          campaignId: data.campaignId,
          uniqueCode: data.uniqueCode,
          status: "invalid_brute",
          ipAddress: input.ipAddress
        });
        return { status: "invalid" as const };
      }

      if (qrCode.used || qrCode.status === "used") {
        await tx.insert(scanLogs).values({
          campaignId: data.campaignId,
          uniqueCode: data.uniqueCode,
          status: "already_used",
          ipAddress: input.ipAddress
        });
        return { status: "already_used" as const };
      }

      await tx
        .update(qrMaster)
        .set({
          status: "used",
          used: true,
          usedAt: new Date()
        })
        .where(and(eq(qrMaster.uniqueCode, data.uniqueCode), eq(qrMaster.campaignId, data.campaignId), eq(qrMaster.used, false)));

      await tx.insert(scanLogs).values({
        campaignId: data.campaignId,
        uniqueCode: data.uniqueCode,
        fullName: data.fullName,
        phoneWa: data.phoneWa,
        age: data.age,
        warungName: data.warungName,
        status: "success",
        ipAddress: input.ipAddress
      });

      const [claimCount] = await tx
        .select({ value: count() })
        .from(scanLogs)
        .where(and(eq(scanLogs.campaignId, data.campaignId), eq(scanLogs.phoneWa, data.phoneWa), eq(scanLogs.status, "success")));

      return {
        status: "success" as const,
        claimCount: claimCount?.value ?? 1,
        phoneWa: data.phoneWa
      };
    });

    if (result.status === "success") {
      return {
        ok: true as const,
        claimCount: result.claimCount,
        phoneWa: result.phoneWa
      };
    }

    return {
      ok: false as const,
      status: result.status,
      message: result.status === "already_used" ? "Kode sudah digunakan." : "Kode tidak valid."
    };
  } catch {
    return { ok: false as const, status: "system_error" as const, message: "Sistem sedang dalam pemeliharaan." };
  }
}
