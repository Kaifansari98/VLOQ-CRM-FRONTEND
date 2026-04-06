import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

interface GenerateLeadTrackingReportParams {
  vendorId: number;
  vendorReportCode: string;
  userId: number | "all";
  userType: string;
  franchiseId: number | "all";
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface LeadTrackingReportRow {
  lead_id: number;
  instance_id: number;
  lead_code: string;
  client_name: string;
  franchise_store: string;
  designer: string;
  furniture_type: string;
  furniture_structure: string;
  lead_creation_date: string | null;
  ism_completion_date: string | null;
  booking_done_date: string | null;
  booking_adv_cleared_date: string | null;
  fm_scheduled_date: string | null;
  fm_completion_date: string | null;
  client_approval_date: string | null;
  tc_req_date: string | null;
  tc_approval_date: string | null;
  ol_date: string | null;
  production_start_date: string | null;
  production_completion_date: string | null;
  site_readiness_scheduled_date: string | null;
  site_readiness_completion_date: string | null;
  dispatch_planning_done_date: string | null;
  dispatch_date: string | null;
  installation_start_date: string | null;
  carcass_completion_date: string | null;
  shutter_installation_completion_date: string | null;
  usable_handover_date: string | null;
  full_installation_completion_date: string | null;
  final_handover_date: string | null;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  userType: string | null,
  userId: number | null,
  fromDate: string,
  toDate: string,
): Promise<LeadTrackingReportRow[]> {
  const params: Record<string, string> = {
    vendor_id: String(vendorId),
  };

  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (userType && userType !== "all") params.user_type = userType;
  if (userId !== null) params.user_id = String(userId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get("/vendors/reports/lead-tracking", {
    params,
  });

  return data?.data ?? [];
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildLeadTrackingSheet(
  workbook: ExcelJS.Workbook,
  rows: LeadTrackingReportRow[],
  sheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName);

  const headers = [
    "Sr. No.",
    "Lead Code",
    "Client Name",
    "Franchise Name",
    "Designer",
    "Furniture Type",
    "Furniture Structure",
    "Lead Creation Date",
    "ISM Completion Date",
    "Booking Done Date",
    "Booking Adv Cleared Date (AT HO)",
    "FM Scheduled Date",
    "FM Completion Date",
    "Client Approval Date",
    "TC Req Date",
    "TC Approval Date",
    "OL Date",
    "Production Start Date",
    "Production Completion Date",
    "Site Readiness Scheduled Date",
    "Site Readiness Completion Date",
    "Dispatch Planning Done Date",
    "Dispatch Date",
    "Installation Start Date",
    "Carcass Completion Date",
    "Shutter Installation Completion Date",
    "Usable Handover Date",
    "Full Installation Completion Date",
    "Final Handover",
  ];

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 18 },
    { key: "clientName", width: 24 },
    { key: "franchiseName", width: 24 },
    { key: "designer", width: 22 },
    { key: "furnitureType", width: 20 },
    { key: "furnitureStructure", width: 24 },
    { key: "leadCreationDate", width: 18 },
    { key: "ismCompletionDate", width: 18 },
    { key: "bookingDoneDate", width: 18 },
    { key: "bookingAdvClearedDate", width: 22 },
    { key: "fmScheduledDate", width: 18 },
    { key: "fmCompletionDate", width: 18 },
    { key: "clientApprovalDate", width: 18 },
    { key: "tcReqDate", width: 18 },
    { key: "tcApprovalDate", width: 18 },
    { key: "olDate", width: 18 },
    { key: "productionStartDate", width: 18 },
    { key: "productionCompletionDate", width: 22 },
    { key: "siteReadinessScheduledDate", width: 22 },
    { key: "siteReadinessCompletionDate", width: 22 },
    { key: "dispatchPlanningDoneDate", width: 22 },
    { key: "dispatchDate", width: 18 },
    { key: "installationStartDate", width: 18 },
    { key: "carcassCompletionDate", width: 20 },
    { key: "shutterInstallationCompletionDate", width: 26 },
    { key: "usableHandoverDate", width: 18 },
    { key: "fullInstallationCompletionDate", width: 24 },
    { key: "finalHandover", width: 18 },
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Lead Tracking Report";
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
  headerRow.height = 32;

  rows.forEach((entry, index) => {
    const row = sheet.addRow([
      index + 1,
      entry.lead_code,
      entry.client_name,
      entry.franchise_store,
      entry.designer,
      entry.furniture_type,
      entry.furniture_structure,
      formatDate(entry.lead_creation_date),
      formatDate(entry.ism_completion_date),
      formatDate(entry.booking_done_date),
      formatDate(entry.booking_adv_cleared_date),
      formatDate(entry.fm_scheduled_date),
      formatDate(entry.fm_completion_date),
      formatDate(entry.client_approval_date),
      formatDate(entry.tc_req_date),
      formatDate(entry.tc_approval_date),
      formatDate(entry.ol_date),
      formatDate(entry.production_start_date),
      formatDate(entry.production_completion_date),
      formatDate(entry.site_readiness_scheduled_date),
      formatDate(entry.site_readiness_completion_date),
      formatDate(entry.dispatch_planning_done_date),
      formatDate(entry.dispatch_date),
      formatDate(entry.installation_start_date),
      formatDate(entry.carcass_completion_date),
      formatDate(entry.shutter_installation_completion_date),
      formatDate(entry.usable_handover_date),
      formatDate(entry.full_installation_completion_date),
      formatDate(entry.final_handover_date),
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = colNum === 1 || colNum >= 8;
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

export async function generateLeadTrackingReport(
  params: GenerateLeadTrackingReportParams,
) {
  const {
    vendorId,
    vendorReportCode,
    userId,
    userType,
    franchiseId,
    fromDate,
    toDate,
    onProgress,
  } = params;

  onProgress?.("Fetching lead tracking data...");

  const rows =
    franchiseId === "all"
      ? await fetchReportData(
          vendorId,
          null,
          userType || null,
          userId === "all" ? null : userId,
          fromDate,
          toDate,
        )
      : await fetchReportData(
          vendorId,
          franchiseId,
          userType || null,
          userId === "all" ? null : userId,
          fromDate,
          toDate,
        );

  if (rows.length === 0) {
    throw new Error("No lead tracking rows found for the selected filters.");
  }

  onProgress?.("Building Excel report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const usedSheetNames = new Set<string>();
  buildLeadTrackingSheet(
    workbook,
    rows,
    buildSheetName(
      franchiseId === "all" ? "Consolidated - All Franchisee" : "Lead Tracking Report",
      usedSheetNames,
    ),
  );

  if (franchiseId === "all") {
    const groupedRows = new Map<string, LeadTrackingReportRow[]>();
    for (const row of rows) {
      const key = row.franchise_store || "Unknown Franchise";
      const group = groupedRows.get(key) ?? [];
      group.push(row);
      groupedRows.set(key, group);
    }

    for (const [franchiseName, franchiseRows] of groupedRows) {
      buildLeadTrackingSheet(
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

  saveAs(blob, buildReportFileName(vendorReportCode, "Lead Tracking Report"));
}
