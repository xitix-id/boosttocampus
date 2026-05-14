import type { DashboardQuery, DashboardSnapshot } from "@/lib/types";

export async function getDashboardSnapshot(query: DashboardQuery): Promise<DashboardSnapshot> {
  const params = new URLSearchParams();
  params.set("campaignId", query.campaignId);
  params.set("qrStatus", query.qrStatus ?? "all");
  params.set("logStatus", query.logStatus ?? "all");
  if (query.search) params.set("search", query.search);

  const response = await fetch(`/api/admin/dashboard?${params.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Dashboard API request failed.");
  }

  return (await response.json()) as DashboardSnapshot;
}
