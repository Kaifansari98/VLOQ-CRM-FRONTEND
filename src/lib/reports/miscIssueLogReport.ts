import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

interface GenerateMiscIssueLogReportParams {
  vendorId: number;
  vendorReportCode: string;
  franchiseId: number | "all";
  leadId?: number | null;
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface MiscIssueLogRow {
  row_type: "misc" | "issue";
  row_id: number;
  lead_id: number;
  lead_code: string | null;
  client_name: string | null;
  franchise_store: string | null;
  miscl_issue_type: string | null;
  responsible_team: string | null;
  issue_impact: string | null;
  instance: string | null;
  reorder_material_type: string | null;
  approve_reject_date: string | null;
  rtd_date: string | null;
  dispatch_req_date: string | null;
  dispatch_date: string | null;
  resolved_date: string | null;
  created_at: string;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  leadId: number | null,
  fromDate: string,
  toDate: string,
): Promise<MiscIssueLogRow[]> {
  const params: Record<string, string> = {};
  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (leadId !== null) params.lead_id = String(leadId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/report/misc-issue-log-data`,
    { params },
  );

  return data?.data ?? [];
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildMiscIssueSheet(
  workbook: ExcelJS.Workbook,
  rows: MiscIssueLogRow[],
  sheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 16 },
    { key: "clientName", width: 24 },
    { key: "franchiseStore", width: 24 },
    { key: "typeLabel", width: 18 },
    { key: "type", width: 24 },
    { key: "team", width: 24 },
    { key: "impact", width: 18 },
    { key: "instance", width: 14 },
    { key: "reorderMaterialType", width: 24 },
    { key: "approveRejectDate", width: 20 },
    { key: "rtdDate", width: 18 },
    { key: "dispatchReqDate", width: 22 },
    { key: "dispatchDate", width: 20 },
    { key: "resolvedDate", width: 20 },
  ];

  const headers = [
    "Sr. No.",
    "Lead Code",
    "Client Name",
    "Franchise Store",
    "Type",
    "Miscl/Issue Type",
    "Responsible Team",
    "Issue Impact",
    "Instance",
    "Reorder Material Type",
    "Miscl Approve/Reject Date",
    "Miscl RTD Date",
    "Miscl Disp Req Date",
    "Miscl Dispatch Date",
    "Miscl Resolved Date",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Miscl + Issue Log Report";
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };
  sheet.getRow(1).height = 28;

  const headerRow = sheet.getRow(2);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
  headerRow.height = 28;

  rows.forEach((entry, index) => {
    const row = sheet.addRow([
      index + 1,
      entry.lead_code ?? "-",
      entry.client_name ?? "-",
      entry.franchise_store ?? "-",
      entry.row_type === "misc" ? "Miscellaneous" : "Issue Log",
      entry.miscl_issue_type ?? "-",
      entry.responsible_team ?? "-",
      entry.issue_impact ?? "-",
      entry.instance ?? "-",
      entry.reorder_material_type ?? "-",
      formatDate(entry.approve_reject_date),
      formatDate(entry.rtd_date),
      formatDate(entry.dispatch_req_date),
      formatDate(entry.dispatch_date),
      formatDate(entry.resolved_date),
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = [1, 10, 11, 12, 13, 14].includes(colNum);
      cell.alignment = {
        horizontal: isCenter ? "center" : "left",
        vertical: "middle",
      };
      cell.font = { size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9D9D9" } },
        bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        left: { style: "thin", color: { argb: "FFD9D9D9" } },
        right: { style: "thin", color: { argb: "FFD9D9D9" } },
      };
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" },
        };
      }
    });
  });
}

export async function generateMiscIssueLogReport(
  params: GenerateMiscIssueLogReportParams,
) {
  const { vendorId, franchiseId, leadId = null, fromDate, toDate, onProgress } = params;

  onProgress?.("Fetching misc and issue logs...");

  const rows =
    franchiseId === "all"
      ? await fetchReportData(vendorId, null, leadId, fromDate, toDate)
      : await fetchReportData(vendorId, franchiseId, leadId, fromDate, toDate);

  if (rows.length === 0) {
    throw new Error(
      "No miscellaneous or issue log rows found for the selected filters.",
    );
  }

  onProgress?.("Building Excel report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();
  const usedSheetNames = new Set<string>();
  buildMiscIssueSheet(
    workbook,
    rows,
    buildSheetName(
      franchiseId === "all" ? "Consolidated - All Franchisee" : "Miscl + Issue Log",
      usedSheetNames,
    ),
  );

  if (franchiseId === "all") {
    const groupedRows = new Map<string, MiscIssueLogRow[]>();
    for (const row of rows) {
      const key = row.franchise_store || "Unknown Franchise";
      const group = groupedRows.get(key) ?? [];
      group.push(row);
      groupedRows.set(key, group);
    }

    for (const [franchiseName, franchiseRows] of groupedRows) {
      buildMiscIssueSheet(
        workbook,
        franchiseRows,
        buildSheetName(franchiseName, usedSheetNames),
      );
    }
  }

  onProgress?.("Preparing file...");

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, buildReportFileName(params.vendorReportCode, "Miscl + Issue Log Report"));
}
