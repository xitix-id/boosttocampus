export type QRStatus = "unused" | "used" | "flagged";

export type ScanLogStatus =
  | "success"
  | "invalid_brute"
  | "already_used"
  | "failed_validation"
  | "rate_limited"
  | "system_error";

export type Campaign = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "scheduled" | "closed";
};

export type DashboardKpi = {
  totalScan: number;
  successfulClaims: number;
  successRate: number;
  uniqueUsers: number;
  scansToday: number;
  scansThisWeek: number;
};

export type QRMasterRow = {
  id: string;
  campaignId: string;
  uniqueCode: string;
  status: QRStatus;
  used: boolean;
  source: "csv";
  createdAt: string;
  usedAt: string | null;
};

export type ScanLogRow = {
  id: string;
  campaignId: string;
  uniqueCode: string;
  fullName: string | null;
  phoneWa: string | null;
  age: number | null;
  warungName: string | null;
  status: ScanLogStatus;
  ipAddress: string;
  errorType: "db_timeout" | "network_failure" | "validation_error" | null;
  attemptedAt: string;
};

export type TransactionPoint = {
  label: string;
  success: number;
  failed: number;
  cumulative: number;
};

export type DashboardQuery = {
  campaignId: string;
  qrStatus?: QRStatus | "all";
  logStatus?: ScanLogStatus | "all";
  search?: string;
};

export type SystemSignal = {
  label: string;
  value: string;
  state: "ready" | "watch" | "incident";
};

export type DashboardSnapshot = {
  campaigns: Campaign[];
  activeCampaign: Campaign;
  kpi: DashboardKpi;
  qrRows: QRMasterRow[];
  scanLogs: ScanLogRow[];
  transactions: TransactionPoint[];
  systemSignals: SystemSignal[];
  generatedAt: string;
};

export type CsvValidationIssue = {
  row: number;
  code: string;
  reason: "empty" | "invalid_format" | "duplicate";
};

export type CsvValidationResult = {
  fileName: string;
  validCodes: string[];
  issues: CsvValidationIssue[];
};
