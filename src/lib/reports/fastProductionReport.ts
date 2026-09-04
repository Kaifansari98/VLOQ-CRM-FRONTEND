import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

interface GenerateFastProductionReportParams {
  vendorId: number;
  vendorReportCode: string;
  franchiseId: number | number[] | "all";
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface FastProductionRow {
  id: number;
  parent_lead_code: string;
  client_name: string;
  franchise_store: string;
  designer: string;
  current_stage: string;
  furniture_type: string;
  furniture_structure: string;
  carcass_selection: string;
  shutter_selection: string;
  handle_selection: string;
  hardware: string;
  accessory: string;
  created_at: string;
  supervisor_approved_at: string | null;
  admin_approved_at: string | null;
  required_date: string;
  tc_date: string | null;
  ol_date: string | null;
  prod_date: string | null;
  rtd_date: string | null;
  is_fast_production?: boolean;
}

function sanitizeStageText(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatJustDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  fromDate: string,
  toDate: string,
): Promise<FastProductionRow[]> {
  const params: Record<string, string> = {
    vendor_id: String(vendorId),
  };

  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get("/vendors/reports/fast-production", {
    params,
  });

  const rows: FastProductionRow[] = data?.data ?? [];
  return rows.filter((row) => row.is_fast_production !== false);
}

function buildFastProductionSheet(
  workbook: ExcelJS.Workbook,
  rows: FastProductionRow[],
  sheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 16 },
    { key: "clientName", width: 24 },
    { key: "franchiseStore", width: 24 },
    { key: "designer", width: 24 },
    { key: "currentStage", width: 20 },
    { key: "furnitureType", width: 22 },
    { key: "furnitureStructure", width: 24 },
    { key: "carcassSelection", width: 22 },
    { key: "shutterSelection", width: 22 },
    { key: "handleSelection", width: 22 },
    { key: "hardware", width: 22 },
    { key: "accessory", width: 22 },
    { key: "raisedDate", width: 26 },
    { key: "factoryApprovalDate", width: 26 },
    { key: "superAdminApprovalDate", width: 26 },
    { key: "clientRequiredDate", width: 20 },
    { key: "tcDate", width: 22 },
    { key: "olDate", width: 22 },
    { key: "prodDate", width: 22 },
    { key: "rtdDate", width: 22 },
  ];

  // Title Row
  const titleRow = sheet.addRow(["Fast Production Leads Report"]);
  titleRow.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells(`A1:U1`);
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  titleRow.height = 30;

  // Headers
  const headers = [
    "Sr. No",
    "Lead Code",
    "Client Name",
    "Franchise Store",
    "Designer",
    "Current Stage",
    "Furniture Type",
    "Furniture Structure",
    "Carcass Selection",
    "Shutter Selection",
    "Handle Selection",
    "Hardware",
    "Accessory",
    "Fast Prod request raised Date",
    "Approval Date by Factory",
    "Approval Date by Super Admin",
    "Client Required Date",
    "Lead Moved to TC Date",
    "Lead Moved to OL Stage Date",
    "Lead Moved to Production Date",
    "Lead Moved to RTD Date",
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  headerRow.height = 35;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data Rows
  rows.forEach((row, index) => {
    const dataRow = sheet.addRow([
      index + 1,
      row.parent_lead_code,
      row.client_name || "-",
      row.franchise_store || "-",
      row.designer || "-",
      sanitizeStageText(row.current_stage),
      row.furniture_type || "-",
      row.furniture_structure || "-",
      row.carcass_selection || "-",
      row.shutter_selection || "-",
      row.handle_selection || "-",
      row.hardware || "-",
      row.accessory || "-",
      formatDate(row.created_at),
      formatDate(row.supervisor_approved_at),
      formatDate(row.admin_approved_at),
      formatJustDate(row.required_date),
      formatDate(row.tc_date),
      formatDate(row.ol_date),
      formatDate(row.prod_date),
      formatDate(row.rtd_date),
    ]);

    dataRow.alignment = { vertical: "middle", wrapText: true };
    const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";

    dataRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      
      // Center align specific columns
      if ([1, 12, 14].includes(colNumber)) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });
}

export async function generateFastProductionReport({
  vendorId,
  vendorReportCode,
  franchiseId,
  fromDate,
  toDate,
  onProgress,
}: GenerateFastProductionReportParams) {
  try {
    onProgress?.("Fetching Data...");

    const isAll = franchiseId === "all";
    const fIds = Array.isArray(franchiseId) ? franchiseId : isAll ? null : [franchiseId];
    
    // We fetch one by one to avoid massive parallel query overload if there are many franchises
    const rows: FastProductionRow[] = [];
    if (fIds && fIds.length > 0) {
      for (const id of fIds) {
        const data = await fetchReportData(vendorId, id as number, fromDate, toDate);
        rows.push(...data);
      }
    } else {
      const data = await fetchReportData(vendorId, null, fromDate, toDate);
      rows.push(...data);
    }

    onProgress?.("Generating Excel...");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Furnix CRM";
    workbook.created = new Date();

    const sheetName = buildSheetName("Fast Production", new Set());
    buildFastProductionSheet(workbook, rows, sheetName);

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = buildReportFileName(
      vendorReportCode,
      "Fast_Production_Leads",
    );

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);

    return true;
  } catch (error) {
    console.error("Error generating Fast Production report:", error);
    throw error;
  }
}
