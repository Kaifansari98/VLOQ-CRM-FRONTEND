import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";

interface GenerateInstallationReportParams {
  vendorId: number;
  franchiseId: number | "all";
  leadId?: number | null;
  franchiseName: string;
  fromDate: string;
  toDate: string;
  allFranchises?: { id: number; name: string }[];
  onProgress?: (stage: string) => void;
}

interface InstallationReportLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;
  franchise_id: number | null;
  franchise_name: string | null;
  actual_installation_start_date: string | null;
  expected_installation_end_date: string | null;
  actual_installation_completion_at: string | null;
  carcass_installation_completion_date: string | null;
  shutter_installation_completion_date: string | null;
  usable_handover_completed_at: string | null;
  final_handover_marked_at: string | null;
  misc_count: number;
  issue_count: number;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  leadId: number | null,
  fromDate: string,
  toDate: string,
): Promise<InstallationReportLead[]> {
  const params: Record<string, string> = {};
  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (leadId !== null) params.lead_id = String(leadId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  console.log("[InstallationReport] Calling API", {
    url: `/leads/installation/under-installation/vendorId/${vendorId}/report/installation-data`,
    params,
  });

  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/report/installation-data`,
    { params },
  );

  console.log("[InstallationReport] API response:", data);

  const leads: InstallationReportLead[] = data?.data ?? [];
  console.log(`[InstallationReport] Leads count: ${leads.length}`);
  return leads;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(from: string | null | undefined, to: string | null | undefined): string {
  if (!from || !to) return "-";
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return "-";
  const diff = Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return String(diff);
}

export async function generateInstallationReport(params: GenerateInstallationReportParams) {
  const { vendorId, franchiseId, leadId = null, fromDate, toDate, allFranchises = [], onProgress } = params;

  console.log("[InstallationReport] Starting report generation", params);

  onProgress?.("Fetching installation data...");

  let leads: InstallationReportLead[] = [];

  if (franchiseId === "all") {
    // Fetch all franchises together (backend handles null = all)
    leads = await fetchReportData(vendorId, null, leadId, fromDate, toDate);
  } else {
    leads = await fetchReportData(vendorId, franchiseId, leadId, fromDate, toDate);
  }

  console.log(`[InstallationReport] Total leads fetched: ${leads.length}`);

  if (leads.length === 0) {
    console.warn("[InstallationReport] No leads found — throwing error");
    throw new Error("No installation leads found for the selected filters.");
  }

  onProgress?.("Building Excel report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Installation Report");

  sheet.columns = [
    { key: "srNo",               width: 8  },
    { key: "leadCode",           width: 14 },
    { key: "leadName",           width: 26 },
    { key: "franchiseStore",     width: 22 },
    { key: "installStartDate",   width: 22 },
    { key: "expectedCompletion", width: 26 },
    { key: "daysTaken",          width: 22 },
    { key: "miscCount",          width: 22 },
    { key: "issueCount",         width: 22 },
    { key: "carcassDate",        width: 26 },
    { key: "shutterDate",        width: 32 },
    { key: "usableHandoverDate", width: 22 },
    { key: "fullCompletionDate", width: 28 },
    { key: "finalHandoverDate",  width: 22 },
  ];

  const totalCols = sheet.columns.length;

  // Title row
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Installation Report";
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  sheet.getRow(1).height = 28;

  // Header row
  const HEADERS = [
    "Sr. No.",
    "Lead Code",
    "Lead Name",
    "Franchise Store",
    "Installation Start Date",
    "Expected Date of Completion",
    "No. of Days Taken",
    "No. of Misc Generated",
    "No. of Issues Generated",
    "Carcass Completion Date",
    "Shutter Installation Completion Date",
    "Usable Handover Date",
    "Full Installation Completion Date",
    "Final Handover Date",
  ];

  const headerRow = sheet.getRow(2);
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  });
  headerRow.height = 28;

  // Data rows
  leads.forEach((lead, idx) => {
    const rowData = [
      idx + 1,
      lead.lead_code ?? "-",
      `${lead.firstname} ${lead.lastname}`.trim() || "-",
      lead.franchise_name ?? "-",
      formatDate(lead.actual_installation_start_date),
      formatDate(lead.expected_installation_end_date),
      daysBetween(lead.actual_installation_start_date, lead.actual_installation_completion_at),
      lead.misc_count,
      lead.issue_count,
      formatDate(lead.carcass_installation_completion_date),
      formatDate(lead.shutter_installation_completion_date),
      formatDate(lead.usable_handover_completed_at),
      formatDate(lead.actual_installation_completion_at),
      formatDate(lead.final_handover_marked_at),
    ];

    const row = sheet.addRow(rowData);
    row.height = 18;

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = colNum === 1 || colNum === 7 || colNum === 8 || colNum === 9;
      cell.alignment = { horizontal: isCenter ? "center" : "left", vertical: "middle" };
      cell.font = { size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9D9D9" } },
        bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        left: { style: "thin", color: { argb: "FFD9D9D9" } },
        right: { style: "thin", color: { argb: "FFD9D9D9" } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
      }
    });
  });

  onProgress?.("Preparing file...");
  console.log("[InstallationReport] Writing Excel buffer...");

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const generatedDate = new Date().toISOString().slice(0, 10);
  const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : "";
  const filename = `${generatedDate}_Installation_Report${dateRange}.xlsx`;
  console.log("[InstallationReport] Saving file:", filename);
  saveAs(blob, filename);
  console.log("[InstallationReport] Done.");
}
