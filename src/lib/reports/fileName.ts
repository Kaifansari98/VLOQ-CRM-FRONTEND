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

export function buildSheetName(
  preferredName: string,
  usedNames: Set<string>,
): string {
  const baseName = (sanitizeSegment(preferredName) || "Sheet").slice(0, 31);

  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let counter = 2;
  while (counter < 1000) {
    const suffix = ` (${counter})`;
    const candidate = `${baseName.slice(0, 31 - suffix.length)}${suffix}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    counter += 1;
  }

  const fallback = `Sheet ${usedNames.size + 1}`.slice(0, 31);
  usedNames.add(fallback);
  return fallback;
}
