export function displayText(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\b(crm|ho|hss|ss|upi|neft|rtgs|imps|sms)\b/gi, (word) =>
      word.toUpperCase(),
    );
}
export function complaintDate(
  value: string | null | undefined,
  withTime = false,
) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }
      : {}),
    // UTC-midnight date columns retain their day in India; timestamps also use the CRM timezone.
    timeZone: "Asia/Kolkata",
  }).format(date);
}
export function complaintMoney(
  value: string | number | null | undefined,
  currency = "INR",
) {
  if (value === null || value === undefined || value === "")
    return "Not recorded";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not recorded";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
