import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardSnapshotFromDb } from "@/lib/dashboard-db";
import type { QRStatus, ScanLogStatus } from "@/lib/types";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  const snapshot = await getDashboardSnapshotFromDb({
    campaignId: url.searchParams.get("campaignId") || "BTC-2026-JKT",
    qrStatus: (url.searchParams.get("qrStatus") as QRStatus | "all" | null) || "all",
    logStatus: (url.searchParams.get("logStatus") as ScanLogStatus | "all" | null) || "all",
    search: url.searchParams.get("search") || ""
  });

  return NextResponse.json(snapshot);
}
