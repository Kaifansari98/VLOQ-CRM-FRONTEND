function sanitizeSegment(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "").trim();
}

export function buildReportFileName(
  vendorReportCode: string,
  reportName: string,
): string {
  const safePrefix = sanitizeSegment(vendorReportCode || "REPORT");
  const safeReportName = sanitizeSegment(reportName || "Report");
  return `${safePrefix}_(${safeReportName}).xlsx`;
}
