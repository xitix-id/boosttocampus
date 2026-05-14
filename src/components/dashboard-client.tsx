"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Database, Download, Gauge, Loader2, Lock, RefreshCw, Search, Upload, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LogoutButton } from "@/components/logout-button";
import { exportQrRows, exportScanLogs, validateCsvCodes } from "@/lib/csv";
import { getDashboardSnapshot } from "@/lib/dashboard-api";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { CsvValidationResult, DashboardQuery, DashboardSnapshot, QRStatus, ScanLogStatus } from "@/lib/types";

const qrStatusOptions: Array<QRStatus | "all"> = ["all", "unused", "used", "flagged"];
const logStatusOptions: Array<ScanLogStatus | "all"> = ["all", "success", "invalid_brute", "already_used", "failed_validation", "rate_limited", "system_error"];

const statusTone: Record<string, string> = {
  unused: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  used: "border-btc-lime/40 bg-btc-lime/15 text-btc-limeSoft",
  flagged: "border-amber-300/40 bg-amber-300/15 text-amber-100",
  success: "border-btc-lime/40 bg-btc-lime/15 text-btc-limeSoft",
  invalid_brute: "border-rose-300/40 bg-rose-300/15 text-rose-100",
  already_used: "border-violet-200/40 bg-violet-200/15 text-violet-100",
  failed_validation: "border-amber-300/40 bg-amber-300/15 text-amber-100",
  rate_limited: "border-orange-300/40 bg-orange-300/15 text-orange-100",
  system_error: "border-red-300/50 bg-red-300/15 text-red-100"
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={cx("inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-[0.16em]", tone)}>{children}</span>;
}

function KpiCard({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper: string }) {
  return (
    <section className="btc-panel p-4 shadow-neon">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center bg-btc-lime text-btc-ink" style={{ borderRadius: 8 }}>{icon}</span>
        <span className="text-right text-[10px] font-black uppercase tracking-[0.18em] text-btc-mist">{label}</span>
      </div>
      <div className="text-3xl font-black italic leading-none text-white">{value}</div>
      <p className="mt-2 text-sm font-semibold text-btc-mist">{helper}</p>
    </section>
  );
}

function UploadManager() {
  const [result, setResult] = useState<CsvValidationResult | null>(null);
  const [isParsing, setParsing] = useState(false);

  async function parseFile(file?: File) {
    if (!file) return;
    setParsing(true);
    try {
      setResult(await validateCsvCodes(file));
    } finally {
      setParsing(false);
    }
  }

  return (
    <section className="btc-panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black italic text-white">CSV Upload Manager</h2>
          <p className="text-sm font-semibold text-btc-mist">Validasi frontend-only untuk kode 6 karakter uppercase.</p>
        </div>
        <Upload className="size-6 text-btc-lime" aria-hidden="true" />
      </div>
      <label className="btc-focus flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-btc-line bg-white/5 px-4 text-center transition hover:border-btc-lime/50" style={{ borderRadius: 8 }}>
        {isParsing ? <Loader2 className="size-7 animate-spin text-btc-lime" /> : <Upload className="size-7 text-btc-lime" />}
        <span className="text-sm font-black uppercase tracking-[0.16em] text-white">Pilih CSV</span>
        <input className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => void parseFile(event.target.files?.[0])} />
      </label>
      {result ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-btc-lime/30 bg-btc-lime/10 p-3" style={{ borderRadius: 8 }}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-btc-limeSoft">Valid Codes</p>
            <p className="mt-1 text-2xl font-black italic text-white">{result.validCodes.length}</p>
          </div>
          <div className="border border-amber-300/30 bg-amber-300/10 p-3" style={{ borderRadius: 8 }}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Issues</p>
            <p className="mt-1 text-2xl font-black italic text-white">{result.issues.length}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function DashboardClient() {
  const [query, setQuery] = useState<DashboardQuery>({ campaignId: "BTC 2026 Lampung", qrStatus: "all", logStatus: "all", search: "" });
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await getDashboardSnapshot(query));
    } catch {
      setError("Dashboard gagal memuat data. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const selectedCampaign = useMemo(() => snapshot?.campaigns.find((campaign) => campaign.id === query.campaignId), [query.campaignId, snapshot?.campaigns]);

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 rotate-3 items-center justify-center bg-btc-lime text-btc-ink shadow-neon" style={{ borderRadius: 8 }}>
              <Database className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-black italic leading-none text-white">BTC 2026</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-btc-mist">Admin Portal</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="border-btc-lime/40 bg-btc-lime/15 text-btc-limeSoft">System live & ready</Badge>
            <button aria-label="Refresh" title="Refresh" onClick={() => void loadDashboard()} className="btc-focus inline-flex size-9 items-center justify-center border border-btc-line bg-white/8" type="button" style={{ borderRadius: 8 }}>
              <RefreshCw className={cx("size-4", isLoading && "animate-spin")} aria-hidden="true" />
            </button>
            <LogoutButton />
          </div>
        </header>

        <section className="btc-panel grid gap-3 p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_auto]">
          <select className="btc-focus min-h-11 border border-btc-line bg-white/8 px-3 text-sm font-bold text-white" style={{ borderRadius: 8 }} value={query.campaignId} onChange={(event) => setQuery((current) => ({ ...current, campaignId: event.target.value }))}>
            {(snapshot?.campaigns ?? [{ id: query.campaignId, name: query.campaignId }]).map((campaign) => <option key={campaign.id} className="bg-btc-ink" value={campaign.id}>{campaign.name}</option>)}
          </select>
          <select className="btc-focus min-h-11 border border-btc-line bg-white/8 px-3 text-sm font-bold text-white" style={{ borderRadius: 8 }} value={query.qrStatus} onChange={(event) => setQuery((current) => ({ ...current, qrStatus: event.target.value as QRStatus | "all" }))}>
            {qrStatusOptions.map((status) => <option key={status} className="bg-btc-ink" value={status}>{status}</option>)}
          </select>
          <select className="btc-focus min-h-11 border border-btc-line bg-white/8 px-3 text-sm font-bold text-white" style={{ borderRadius: 8 }} value={query.logStatus} onChange={(event) => setQuery((current) => ({ ...current, logStatus: event.target.value as ScanLogStatus | "all" }))}>
            {logStatusOptions.map((status) => <option key={status} className="bg-btc-ink" value={status}>{status}</option>)}
          </select>
          <label className="flex min-h-11 items-center gap-2 border border-btc-line bg-white/8 px-3" style={{ borderRadius: 8 }}>
            <Search className="size-4 text-btc-lime" aria-hidden="true" />
            <input className="btc-focus min-w-0 flex-1 bg-transparent text-sm font-bold text-white placeholder:text-btc-mist" placeholder="Cari kode, nama, HP, IP..." value={query.search} onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value }))} />
          </label>
          <button type="button" className="btc-focus min-h-11 bg-btc-lime px-4 text-sm font-black uppercase tracking-[0.14em] text-btc-ink" style={{ borderRadius: 8 }} onClick={() => setQuery({ campaignId: "BTC 2026 Lampung", qrStatus: "all", logStatus: "all", search: "" })}>Reset</button>
        </section>

        {error ? <section className="btc-panel border-red-300/40 bg-red-300/10 p-4 text-sm font-bold text-red-100">{error}</section> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard icon={<Activity className="size-5" />} label="Total Scan" value={isLoading || !snapshot ? "..." : formatNumber(snapshot.kpi.totalScan)} helper="Semua attempt campaign" />
          <KpiCard icon={<CheckCircle2 className="size-5" />} label="Klaim Sukses" value={isLoading || !snapshot ? "..." : formatNumber(snapshot.kpi.successfulClaims)} helper="Per campaign aktif" />
          <KpiCard icon={<Gauge className="size-5" />} label="Success Rate" value={isLoading || !snapshot ? "..." : `${snapshot.kpi.successRate}%`} helper="Success / total scan" />
          <KpiCard icon={<Users className="size-5" />} label="Pengguna Unik" value={isLoading || !snapshot ? "..." : formatNumber(snapshot.kpi.uniqueUsers)} helper="Berdasarkan nomor WA" />
          <KpiCard icon={<Lock className="size-5" />} label="Hari / Minggu" value={isLoading || !snapshot ? "..." : `${snapshot.kpi.scansToday}/${snapshot.kpi.scansThisWeek}`} helper="Scan hari ini dan pekan ini" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="btc-panel p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-black italic text-white">Campaign Command Center</h1>
                <p className="text-sm font-semibold text-btc-mist">{selectedCampaign?.id ?? query.campaignId} · Updated {snapshot ? formatDateTime(snapshot.generatedAt) : "-"}</p>
              </div>
              <Badge tone="border-white/20 bg-white/10 text-white">{selectedCampaign?.status ?? "loading"}</Badge>
            </div>
            <div className="h-72 min-h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshot?.transactions ?? []} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#bca6db" tickLine={false} axisLine={false} />
                  <YAxis stroke="#bca6db" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#16002f", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8 }} />
                  <Area isAnimationActive={false} type="monotone" dataKey="success" name="Success" stroke="#8fe70b" fill="rgba(143,231,11,0.18)" strokeWidth={3} />
                  <Area isAnimationActive={false} type="monotone" dataKey="failed" name="Failed" stroke="#ffb86b" fill="rgba(255,184,107,0.12)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-5">
            <section className="btc-panel p-4">
              <h2 className="text-lg font-black italic text-white">System Signals</h2>
              <div className="mt-4 space-y-3">
                {(snapshot?.systemSignals ?? []).map((signal) => <div key={signal.label} className="flex items-center justify-between gap-3 border border-btc-line bg-white/5 p-3 text-sm" style={{ borderRadius: 8 }}><span className="font-bold text-white">{signal.label}</span><span className="font-black uppercase text-btc-limeSoft">{signal.value}</span></div>)}
              </div>
            </section>
            <UploadManager />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <DataPanel title="Master QR" subtitle="Single source daftar kode pre-uploaded." actionLabel="Export QR CSV" onExport={() => snapshot && exportQrRows(snapshot.qrRows)}>
            <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm"><thead className="text-[10px] font-black uppercase tracking-[0.16em] text-btc-mist"><tr><th className="border-b border-btc-line px-3 py-3">Code</th><th className="border-b border-btc-line px-3 py-3">Status</th><th className="border-b border-btc-line px-3 py-3">Source</th><th className="border-b border-btc-line px-3 py-3">Created</th><th className="border-b border-btc-line px-3 py-3">Used At</th></tr></thead><tbody>{snapshot?.qrRows.map((row) => <tr key={row.id}><td className="border-b border-btc-line px-3 py-3 font-black tracking-[0.08em] text-white">{row.uniqueCode}</td><td className="border-b border-btc-line px-3 py-3"><Badge tone={statusTone[row.status]}>{row.status}</Badge></td><td className="border-b border-btc-line px-3 py-3 font-semibold uppercase">{row.source}</td><td className="border-b border-btc-line px-3 py-3 text-btc-mist">{formatDateTime(row.createdAt)}</td><td className="border-b border-btc-line px-3 py-3 text-btc-mist">{formatDateTime(row.usedAt)}</td></tr>)}</tbody></table></div>
          </DataPanel>
          <DataPanel title="Scan Logs" subtitle="Riwayat validasi, klaim, rate-limit, dan error." actionLabel="Export Logs CSV" onExport={() => snapshot && exportScanLogs(snapshot.scanLogs)}>
            <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm"><thead className="text-[10px] font-black uppercase tracking-[0.16em] text-btc-mist"><tr><th className="border-b border-btc-line px-3 py-3">Time</th><th className="border-b border-btc-line px-3 py-3">Code</th><th className="border-b border-btc-line px-3 py-3">Status</th><th className="border-b border-btc-line px-3 py-3">Participant</th><th className="border-b border-btc-line px-3 py-3">Phone</th><th className="border-b border-btc-line px-3 py-3">IP</th></tr></thead><tbody>{snapshot?.scanLogs.map((row) => <tr key={row.id}><td className="border-b border-btc-line px-3 py-3 text-btc-mist">{formatDateTime(row.attemptedAt)}</td><td className="border-b border-btc-line px-3 py-3 font-black tracking-[0.08em] text-white">{row.uniqueCode}</td><td className="border-b border-btc-line px-3 py-3"><Badge tone={statusTone[row.status]}>{row.status}</Badge></td><td className="border-b border-btc-line px-3 py-3 font-semibold">{row.fullName ?? "-"}</td><td className="border-b border-btc-line px-3 py-3 text-btc-mist">{row.phoneWa ?? "-"}</td><td className="border-b border-btc-line px-3 py-3 text-btc-mist">{row.ipAddress}</td></tr>)}</tbody></table></div>
          </DataPanel>
        </section>

        <section className="btc-panel p-4"><h2 className="mb-4 text-lg font-black italic text-white">Weekly Mix</h2><div className="h-64 min-h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={snapshot?.transactions ?? []} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} /><XAxis dataKey="label" stroke="#bca6db" tickLine={false} axisLine={false} /><YAxis stroke="#bca6db" tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#16002f", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8 }} /><Bar isAnimationActive={false} dataKey="success" name="Success" fill="#8fe70b" radius={[4, 4, 0, 0]} /><Bar isAnimationActive={false} dataKey="failed" name="Failed" fill="#ffb86b" radius={[4, 4, 0, 0]} /><Bar isAnimationActive={false} dataKey="cumulative" name="Cumulative" fill="#ffffff" opacity={0.3} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      </div>
    </main>
  );
}

function DataPanel({ title, subtitle, actionLabel, onExport, children }: { title: string; subtitle: string; actionLabel: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <section className="btc-panel min-w-0 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-black italic text-white">{title}</h2><p className="text-sm font-semibold text-btc-mist">{subtitle}</p></div>
        <button type="button" onClick={onExport} className="btc-focus inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap border border-btc-lime/40 bg-btc-lime/15 px-3 text-xs font-black uppercase tracking-[0.14em] text-btc-limeSoft transition hover:bg-btc-lime/25 sm:w-auto" style={{ borderRadius: 8 }}><Download className="size-4" aria-hidden="true" />{actionLabel}</button>
      </div>
      {children}
    </section>
  );
}
