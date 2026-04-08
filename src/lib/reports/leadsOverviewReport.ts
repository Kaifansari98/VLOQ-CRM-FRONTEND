import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

interface GenerateLeadsOverviewReportParams {
  vendorId: number;
  vendorReportCode: string;
  franchiseId: number | "all";
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface LeadsOverviewRow {
  lead_id: number;
  instance_id: number | null;
  lead_code: string;
  client_name: string;
  franchise_store: string;
  client_number: string;
  address: string;
  site_type: string;
  source: string;
  furniture_type: string;
  furniture_structure: string;
  instance: string;
  architect_name: string;
  carcass_selection: string;
  shutter_selection: string;
  handle_selection: string;
  designer_assigned: string;
  supervisor_assigned: string;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  fromDate: string,
  toDate: string,
): Promise<LeadsOverviewRow[]> {
  const params: Record<string, string> = {
    vendor_id: String(vendorId),
  };

  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get("/vendors/reports/leads-overview", {
    params,
  });

  return data?.data ?? [];
}

function buildLeadsOverviewSheet(
  workbook: ExcelJS.Workbook,
  rows: LeadsOverviewRow[],
  sheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 16 },
    { key: "clientName", width: 24 },
    { key: "franchiseStore", width: 24 },
    { key: "clientNumber", width: 18 },
    { key: "address", width: 28 },
    { key: "siteType", width: 16 },
    { key: "source", width: 18 },
    { key: "furnitureType", width: 22 },
    { key: "furnitureStructure", width: 24 },
    { key: "instance", width: 20 },
    { key: "architectName", width: 22 },
    { key: "carcassSelection", width: 22 },
    { key: "shutterSelection", width: 22 },
    { key: "handleSelection", width: 22 },
    { key: "designerAssigned", width: 22 },
    { key: "supervisorAssigned", width: 22 },
  ];

  const headers = [
    "Sr. No.",
    "Lead Code",
    "Client Name",
    "Franchise Store",
    "Client Number",
    "Address",
    "Site Type",
    "Source",
    "Furniture Type",
    "Furniture Structure",
    "Instances",
    "Architect Name",
    "Carcass Selection",
    "Shutter Selection",
    "Handle Selection",
    "Designer Assigned",
    "Supervisor Assigned",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Leads Overview Report";
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFAF4E5" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4C3A34" },
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
      fgColor: { argb: "FF4C3A34" },
    };
    cell.font = { bold: true, color: { argb: "FFFAF4E5" }, size: 10 };
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
      entry.lead_code,
      entry.client_name,
      entry.franchise_store,
      entry.client_number,
      entry.address,
      entry.site_type,
      entry.source,
      entry.furniture_type,
      entry.furniture_structure,
      entry.instance,
      entry.architect_name,
      entry.carcass_selection,
      entry.shutter_selection,
      entry.handle_selection,
      entry.designer_assigned,
      entry.supervisor_assigned,
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = [1, 7, 11].includes(colNum);
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

export async function generateLeadsOverviewReport(
  params: GenerateLeadsOverviewReportParams,
) {
  const { vendorId, franchiseId, fromDate, toDate, onProgress } = params;

  onProgress?.("Fetching leads...");

  const rows =
    franchiseId === "all"
      ? await fetchReportData(vendorId, null, fromDate, toDate)
      : await fetchReportData(vendorId, franchiseId, fromDate, toDate);

  if (rows.length === 0) {
    throw new Error("No leads found for the selected filters.");
  }

  onProgress?.("Building Excel report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();
  const usedSheetNames = new Set<string>();
  buildLeadsOverviewSheet(
    workbook,
    rows,
    buildSheetName(
      franchiseId === "all" ? "Consolidated - All Franchisee" : "Leads Overview Report",
      usedSheetNames,
    ),
  );

  if (franchiseId === "all") {
    const groupedRows = new Map<string, LeadsOverviewRow[]>();
    for (const row of rows) {
      const key = row.franchise_store || "Unknown Franchise";
      const group = groupedRows.get(key) ?? [];
      group.push(row);
      groupedRows.set(key, group);
    }

    for (const [franchiseName, franchiseRows] of groupedRows) {
      buildLeadsOverviewSheet(
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

  saveAs(blob, buildReportFileName(params.vendorReportCode, "Leads Overview Report"));
}
