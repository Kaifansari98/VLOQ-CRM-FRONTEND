import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";

// ── Installation stages: Type 15 (Under Installation), Type 16 (Final Handover), Type 27+ (Project Completed)
const INSTALLATION_TAGS = ["Type 15", "Type 16", "Type 27", "Type 28", "Type 29", "Type 30", "Type 31"];

interface GenerateInstallationReportParams {
  vendorId: number;
  franchiseId: number | "all";
  franchiseName: string;
  fromDate: string;
  toDate: string;
  allFranchises?: { id: number; name: string }[];
  onProgress?: (stage: string) => void;
}

interface InstallationLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;
  franchise_id: number | null;
  actual_installation_start_date: string | null;
  expected_installation_end_date: string | null;
  actual_installation_completion_at: string | null;
  carcass_installation_completion_date: string | null;
  shutter_installation_completion_date: string | null;
  usable_handover_completed_at: string | null;
  final_handover_marked_at: string | null;
}

async function fetchLeadsForFranchise(
  vendorId: number,
  franchiseId: number,
  dateRange: { from: string; to: string } | undefined,
): Promise<InstallationLead[]> {
  const results: InstallationLead[] = [];

  for (const tag of INSTALLATION_TAGS) {
    let page = 1;
    const limit = 500;
    while (true) {
      const payload: Record<string, unknown> = {
        franchise_id: franchiseId,
        tag,
        page,
        limit,
        filter_name: "",
        filter_lead_code: "",
        contact: "",
        alt_contact_no: "",
        email: "",
        site_address: "",
        archetech_name: "",
        designer_remark: "",
        furniture_type: [],
        furniture_structure: [],
        site_type: [],
        source: [],
        assign_to: [],
        site_map_link: null,
        created_at: "asc",
      };

      if (dateRange) {
        payload.date_range = dateRange;
      }

      const { data } = await apiClient.post(
        `/leads/bookingStage/vendorId/${vendorId}/vendor-leads-by-tag/all-leads`,
        payload,
      );

      const leads: InstallationLead[] = data?.data ?? [];
      results.push(...leads);

      const total: number = data?.count ?? 0;
      if (page * limit >= total) break;
      page++;
    }
  }

  return results;
}

async function fetchAllLeads(
  vendorId: number,
  franchiseId: number | "all",
  fromDate: string,
  toDate: string,
  allFranchises: { id: number; name: string }[],
): Promise<InstallationLead[]> {
  const dateRange = fromDate && toDate ? { from: fromDate, to: toDate } : undefined;

  if (franchiseId === "all") {
    const all: InstallationLead[] = [];
    for (const f of allFranchises) {
      const leads = await fetchLeadsForFranchise(vendorId, f.id, dateRange);
      all.push(...leads);
    }
    return all;
  }

  return fetchLeadsForFranchise(vendorId, franchiseId, dateRange);
}

async function fetchMiscCount(vendorId: number, leadId: number): Promise<number> {
  try {
    const { data } = await apiClient.get(
      `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/get-all`,
    );
    const entries = data?.data ?? data ?? [];
    return Array.isArray(entries) ? entries.length : 0;
  } catch {
    return 0;
  }
}

async function fetchIssueCount(vendorId: number, leadId: number): Promise<number> {
  try {
    const { data } = await apiClient.get(
      `/leads/installation/under-installation/issue-log/vendor/${vendorId}/lead/${leadId}`,
    );
    const entries = data?.data ?? data ?? [];
    return Array.isArray(entries) ? entries.length : 0;
  } catch {
    return 0;
  }
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
  const { vendorId, franchiseId, fromDate, toDate, allFranchises = [], onProgress } = params;

  onProgress?.("Fetching installation leads...");
  const leads = await fetchAllLeads(vendorId, franchiseId, fromDate, toDate, allFranchises);

  if (leads.length === 0) {
    throw new Error("No installation leads found for the selected filters.");
  }

  // Build franchise lookup map
  const franchiseMap = new Map<number, string>(allFranchises.map((f) => [f.id, f.name]));

  // Fetch misc + issue counts in parallel batches
  onProgress?.("Fetching misc & issue counts...");
  const countsData = await Promise.all(
    leads.map(async (lead) => {
      const [miscCount, issueCount] = await Promise.all([
        fetchMiscCount(vendorId, lead.id),
        fetchIssueCount(vendorId, lead.id),
      ]);
      return { miscCount, issueCount };
    }),
  );

  onProgress?.("Building report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Installation Report");

  // ── Column widths ──────────────────────────────────────────────
  sheet.columns = [
    { key: "srNo",               width: 8  },
    { key: "leadCode",           width: 14 },
    { key: "leadName",           width: 26 },
    { key: "franchiseStore",     width: 22 },
    { key: "installStartDate",   width: 22 },
    { key: "expectedCompletion", width: 24 },
    { key: "daysTaken",          width: 22 },
    { key: "miscCount",          width: 22 },
    { key: "issueCount",         width: 22 },
    { key: "carcassDate",        width: 26 },
    { key: "shutterDate",        width: 30 },
    { key: "usableHandoverDate", width: 22 },
    { key: "fullCompletionDate", width: 28 },
    { key: "finalHandoverDate",  width: 22 },
  ];

  const totalCols = sheet.columns.length;

  // ── Title row ──────────────────────────────────────────────────
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Installation Report";
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  sheet.getRow(1).height = 28;

  // ── Header row ─────────────────────────────────────────────────
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

  // ── Data rows ──────────────────────────────────────────────────
  leads.forEach((lead, idx) => {
    const { miscCount, issueCount } = countsData[idx];
    const franchiseName = lead.franchise_id ? (franchiseMap.get(lead.franchise_id) ?? "-") : "-";

    const rowData = [
      idx + 1,
      lead.lead_code ?? "-",
      `${lead.firstname} ${lead.lastname}`.trim() || "-",
      franchiseName,
      formatDate(lead.actual_installation_start_date),
      formatDate(lead.expected_installation_end_date),
      daysBetween(lead.actual_installation_start_date, lead.actual_installation_completion_at),
      miscCount,
      issueCount,
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

  // ── Download ───────────────────────────────────────────────────
  onProgress?.("Preparing file...");
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : "";
  saveAs(blob, `Installation_Report${dateRange}.xlsx`);
}
