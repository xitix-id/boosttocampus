import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { qrMaster, scanLogs } from "@/db/schema";
import { activeCampaignId } from "@/lib/claim-utils";
import type {
  Campaign,
  DashboardKpi,
  DashboardQuery,
  DashboardSnapshot,
  QRMasterRow,
  ScanLogRow,
  SystemSignal,
  TransactionPoint
} from "@/lib/types";

const systemSignals: SystemSignal[] = [
  { label: "Dashboard data source", value: "Live DB", state: "ready" },
  { label: "Claim write path", value: "Integrated", state: "ready" },
  { label: "Rate limit window", value: "2 / 24h / IP", state: "watch" },
  { label: "Turso mode", value: process.env.TURSO_DATABASE_URL ? "Remote" : "Local", state: "watch" }
];

function includesSearch(value: string | null | number | boolean, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

function toQrRow(row: typeof qrMaster.$inferSelect): QRMasterRow {
  return {
    id: row.id,
    campaignId: row.campaignId,
    uniqueCode: row.uniqueCode,
    status: row.status,
    used: row.used,
    source: "csv",
    createdAt: row.createdAt.toISOString(),
    usedAt: row.usedAt?.toISOString() ?? null
  };
}

function toScanLogRow(row: typeof scanLogs.$inferSelect): ScanLogRow {
  return {
    id: row.id,
    campaignId: row.campaignId,
    uniqueCode: row.uniqueCode,
    fullName: row.fullName,
    phoneWa: row.phoneWa,
    age: row.age,
    warungName: row.warungName,
    status: row.status,
    ipAddress: row.ipAddress,
    errorType: row.errorType,
    attemptedAt: row.attemptedAt.toISOString()
  };
}

function buildCampaigns(campaignIds: string[]) {
  const ids = Array.from(new Set([activeCampaignId, ...campaignIds])).filter(Boolean);

  return ids.map<Campaign>((id) => ({
    id,
    name: id === activeCampaignId ? `${id} Active Campaign` : id,
    startsAt: new Date(0).toISOString(),
    endsAt: new Date("2099-12-31T23:59:59.000Z").toISOString(),
    status: id === activeCampaignId ? "active" : "closed"
  }));
}

function buildKpi(logs: ScanLogRow[]): DashboardKpi {
  const totalScan = logs.length;
  const successfulClaims = logs.filter((row) => row.status === "success").length;
  const uniqueUsers = new Set(logs.filter((row) => row.status === "success" && row.phoneWa).map((row) => row.phoneWa)).size;
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    totalScan,
    successfulClaims,
    successRate: totalScan ? Math.round((successfulClaims / totalScan) * 1000) / 10 : 0,
    uniqueUsers,
    scansToday: logs.filter((row) => row.attemptedAt.slice(0, 10) === today).length,
    scansThisWeek: logs.filter((row) => new Date(row.attemptedAt).getTime() >= weekAgo).length
  };
}

function buildTransactions(logs: ScanLogRow[]): TransactionPoint[] {
  const dayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "Asia/Bangkok" });
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Bangkok" });
  let cumulative = 0;

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = dateFormatter.format(date);
    const dayLogs = logs.filter((row) => dateFormatter.format(new Date(row.attemptedAt)) === key);
    const success = dayLogs.filter((row) => row.status === "success").length;
    const failed = dayLogs.length - success;
    cumulative += success;

    return { label: dayFormatter.format(date), success, failed, cumulative };
  });
}

export async function getDashboardSnapshotFromDb(query: DashboardQuery): Promise<DashboardSnapshot> {
  const db = getDb();
  const campaignId = query.campaignId || activeCampaignId;
  const search = query.search?.trim() ?? "";

  const [rawQrRows, rawLogs, qrCampaigns, logCampaigns] = await Promise.all([
    db.select().from(qrMaster).where(eq(qrMaster.campaignId, campaignId)).orderBy(desc(qrMaster.createdAt)),
    db.select().from(scanLogs).where(eq(scanLogs.campaignId, campaignId)).orderBy(desc(scanLogs.attemptedAt)),
    db.select({ campaignId: qrMaster.campaignId }).from(qrMaster),
    db.select({ campaignId: scanLogs.campaignId }).from(scanLogs)
  ]);

  const allQrRows = rawQrRows.map(toQrRow);
  const allLogs = rawLogs.map(toScanLogRow);
  const campaigns = buildCampaigns([...qrCampaigns.map((row) => row.campaignId), ...logCampaigns.map((row) => row.campaignId)]);
  const activeCampaign = campaigns.find((campaign) => campaign.id === campaignId) ?? campaigns[0];

  const qrRows = allQrRows
    .filter((row) => query.qrStatus === "all" || !query.qrStatus || row.status === query.qrStatus)
    .filter((row) => !search || includesSearch(row.uniqueCode, search) || includesSearch(row.status, search));

  const filteredLogs = allLogs
    .filter((row) => query.logStatus === "all" || !query.logStatus || row.status === query.logStatus)
    .filter(
      (row) =>
        !search ||
        includesSearch(row.uniqueCode, search) ||
        includesSearch(row.fullName, search) ||
        includesSearch(row.phoneWa, search) ||
        includesSearch(row.warungName, search) ||
        includesSearch(row.ipAddress, search)
    );

  return {
    campaigns,
    activeCampaign,
    kpi: buildKpi(allLogs),
    qrRows,
    scanLogs: filteredLogs,
    transactions: buildTransactions(allLogs),
    systemSignals,
    generatedAt: new Date().toISOString()
  };
}
