import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";

interface GenerateSiteHistoryReportParams {
  leadId: number;
  vendorId: number;
  leadCode?: string | null;
  leadName?: string | null;
  onProgress?: (stage: string) => void;
  userTypeId?: number;
}

function sanitizeRole(role: string | null | undefined): string {
  if (!role) return "-";
  return role
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";

  const datePart = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
}

export async function generateSiteHistoryReport({
  leadId,
  vendorId,
  leadCode,
  leadName,
  onProgress,
  userTypeId,
}: GenerateSiteHistoryReportParams): Promise<void> {
  onProgress?.("Fetching logs...");
  const query = new URLSearchParams({ limit: "9999" });
  if (userTypeId) query.append("user_type_id", String(userTypeId));

  const response = await apiClient.get(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/logs?${query.toString()}`,
  );

  const logs: any[] = response.data.data ?? [];

  if (logs.length === 0) {
    throw new Error("No history logs found for this lead.");
  }

  onProgress?.("Building report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const sheetLabel = leadCode ? `${leadCode} - History` : `Lead ${leadId} - History`;
  const sheet = workbook.addWorksheet(sheetLabel.slice(0, 31));

  sheet.columns = [
    { key: "srNo",     width: 7  },
    { key: "message",  width: 66 },
    { key: "dateTime", width: 32 },
    { key: "user",     width: 26 },
    { key: "role",     width: 22 },
  ];

  const TITLE_BG   = "FF4C3A34";
  const TITLE_FG   = "FFFAF4E5";
  const ROW_ODD    = "FFFFFFFF";
  const ROW_EVEN   = "FFFFF8F0";
  const BORDER_CLR = "FFE5DDD5";

  // ── Title row ──────────────────────────────────────────────────
  const totalCols = sheet.columns.length;
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell("A1");
  const titleSuffix = [leadCode, leadName].filter(Boolean).join("  -  ");
  titleCell.value = `Site History  ·  ${titleSuffix || `Lead #${leadId}`}`;
  titleCell.font  = { bold: true, size: 13, color: { argb: TITLE_FG } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_BG } };
  sheet.getRow(1).height = 30;

  // ── Header row ─────────────────────────────────────────────────
  const HEADERS = ["Sr. No.", "Message", "Date & Time", "User", "User Role"];
  const headerRow = sheet.getRow(2);
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_BG } };
    cell.font   = { bold: true, color: { argb: TITLE_FG }, size: 10 };
    cell.border = {
      top:    { style: "thin" },
      bottom: { style: "thin" },
      left:   { style: "thin" },
      right:  { style: "thin" },
    };
  });
  headerRow.height = 22;

  // ── Data rows ──────────────────────────────────────────────────
  logs.forEach((log, idx) => {
    const bgArgb  = idx % 2 === 0 ? ROW_ODD : ROW_EVEN;
    const message = (log.action ?? "-").replace(/\s+/g, " ").trim();
    const dateTime = formatDateTime(log.created_at);
    const userName = log.created_by?.name
      ? log.created_by.name
          .split(" ")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "Unknown";

    const userRole = sanitizeRole(log.created_by?.role);
    const row = sheet.addRow([idx + 1, message, dateTime, userName, userRole]);

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      cell.border = {
        top:    { style: "thin", color: { argb: BORDER_CLR } },
        bottom: { style: "thin", color: { argb: BORDER_CLR } },
        left:   { style: "thin", color: { argb: BORDER_CLR } },
        right:  { style: "thin", color: { argb: BORDER_CLR } },
      };
      cell.font = { size: 10 };

      if (colNumber === 1) {
        cell.alignment = { horizontal: "center", vertical: "top" };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
      } else {
        cell.alignment = { horizontal: "center", vertical: "top" };
      }
    });

    row.height = 20;
  });

  onProgress?.("Saving file...");

  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileSlug = [leadCode, leadName].filter(Boolean).join("_").replace(/\s+/g, "_");
  const fileName = fileSlug
    ? `Site_History_${fileSlug}.xlsx`
    : `Site_History_Lead_${leadId}.xlsx`;

  saveAs(blob, fileName);
}
