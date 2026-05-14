import type { CsvValidationIssue, CsvValidationResult, QRMasterRow, ScanLogRow } from "@/lib/types";

const codePattern = /^[A-Z0-9]{6}$/;

function csvEscape(value: string | number | boolean | null | undefined) {
  const normalized = value == null ? "" : String(value);
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function downloadCsv(fileName: string, headers: string[], rows: Array<Array<string | number | boolean | null>>) {
  const body = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function validateCsvCodes(file: File): Promise<CsvValidationResult> {
  const text = await file.text();
  const rawCodes = text
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item, index, source) => item || source.length === 1);
  const seen = new Set<string>();
  const validCodes: string[] = [];
  const issues: CsvValidationIssue[] = [];

  rawCodes.forEach((code, index) => {
    const row = index + 1;
    if (!code) {
      issues.push({ row, code, reason: "empty" });
      return;
    }
    if (!codePattern.test(code)) {
      issues.push({ row, code, reason: "invalid_format" });
      return;
    }
    if (seen.has(code)) {
      issues.push({ row, code, reason: "duplicate" });
      return;
    }
    seen.add(code);
    validCodes.push(code);
  });

  return { fileName: file.name, validCodes, issues };
}

export function exportQrRows(rows: QRMasterRow[]) {
  downloadCsv(
    `btc-qr-master-${new Date().toISOString().slice(0, 10)}.csv`,
    ["id", "campaign_id", "unique_code", "status", "used", "source", "created_at", "used_at"],
    rows.map((row) => [row.id, row.campaignId, row.uniqueCode, row.status, row.used, row.source, row.createdAt, row.usedAt])
  );
}

export function exportScanLogs(rows: ScanLogRow[]) {
  downloadCsv(
    `btc-scan-logs-${new Date().toISOString().slice(0, 10)}.csv`,
    ["id", "campaign_id", "unique_code", "full_name", "phone_wa", "age", "warung_name", "status", "ip_address", "error_type", "attempted_at"],
    rows.map((row) => [row.id, row.campaignId, row.uniqueCode, row.fullName, row.phoneWa, row.age, row.warungName, row.status, row.ipAddress, row.errorType, row.attemptedAt])
  );
}
