import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface GenerateOnlineLeadHistoryReportParams {
  leadId: number;
  leadName?: string | null;
  leadContact?: string | null;
  historyLogs: any[];
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

export async function generateOnlineLeadHistoryReport({
  leadId,
  leadName,
  leadContact,
  historyLogs,
}: GenerateOnlineLeadHistoryReportParams): Promise<void> {
  if (historyLogs.length === 0) {
    throw new Error("No history logs found for this lead.");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const sheetLabel = leadName ? `${leadName} - History` : `Lead ${leadId} - History`;
  const sheet = workbook.addWorksheet(sheetLabel.slice(0, 31));

  sheet.columns = [
    { key: "srNo",     width: 7  },
    { key: "message",  width: 66 },
    { key: "dateTime", width: 32 },
    { key: "user",     width: 26 },
    { key: "status",   width: 22 },
    { key: "store",    width: 22 },
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
  const titleSuffix = [leadName, leadContact].filter(Boolean).join("  -  ");
  titleCell.value = `Online Lead History  ·  ${titleSuffix || `Lead #${leadId}`}`;
  titleCell.font  = { bold: true, size: 13, color: { argb: TITLE_FG } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_BG } };
  sheet.getRow(1).height = 30;

  // ── Header row ─────────────────────────────────────────────────
  const HEADERS = ["Sr. No.", "Message", "Date & Time", "User", "Status", "Store"];
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
  historyLogs.forEach((log, idx) => {
    const bgArgb  = idx % 2 === 0 ? ROW_ODD : ROW_EVEN;
    const message = (log.remark || `Status updated to ${log.status?.status_name || 'N/A'}`).replace(/\s+/g, " ").trim();
    const dateTime = formatDateTime(log.created_at);
    const userName = log.createdBy?.user_name || "Unknown";
    const statusVal = log.status?.status_name || "-";
    const storeVal = log.franchise?.franchise_name || "-";
    const row = sheet.addRow([idx + 1, message, dateTime, userName, statusVal, storeVal]);

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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileSlug = [leadName, leadContact].filter(Boolean).join("_").replace(/\s+/g, "_");
  const fileName = fileSlug
    ? `Online_Lead_History_${fileSlug}.xlsx`
    : `Online_Lead_History_${leadId}.xlsx`;

  saveAs(blob, fileName);
}
