export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok"
  }).format(new Date(value));
}
