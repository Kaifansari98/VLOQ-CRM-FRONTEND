import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

interface GenerateLeadServicingReportParams {
  vendorId: number;
  vendorReportCode: string;
  franchiseId: number | number[] | "all";
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface LeadServicingReportRow {
  lead_id: number;
  instance_id: number | null;
  lead_code: string;
  client_name: string;
  franchise_store: string;
  product_type: string;
  instance: string;
  usable_handover_date: string | null;
  final_handover_date: string | null;
  service_1_due_date: string | null;
  service_1_completed_date: string | null;
  service_2_due_date: string | null;
  service_2_completed_date: string | null;
  service_3_due_date: string | null;
  service_3_completed_date: string | null;
  amc_opted_date: string | null;
  amc_dates_same_as_service_dates: string;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  fromDate: string,
  toDate: string,
): Promise<LeadServicingReportRow[]> {
  const params: Record<string, string> = {
    vendor_id: String(vendorId),
  };

  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get("/vendors/reports/lead-servicing", { params });
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

function buildLeadServicingSheet(
  workbook: ExcelJS.Workbook,
  rows: LeadServicingReportRow[],
  sheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName);
  const headers = [
    "Sr. No.",
    "Lead Code",
    "Client Name",
    "Franchise Store",
    "Product Type",
    "Instance",
    "Usable Handover Date",
    "Final Handover Date",
    "Service 1 due date",
    "Service 1 Completed date",
    "Service 2 due date",
    "Service 2 Completed date",
    "Service 3 due date",
    "Service 3 Completed date",
    "AMC Opted Date",
    "AMC Dates same as service dates",
  ];

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 16 },
    { key: "clientName", width: 24 },
    { key: "franchiseStore", width: 24 },
    { key: "productType", width: 20 },
    { key: "instance", width: 20 },
    { key: "usableHandoverDate", width: 22 },
    { key: "finalHandoverDate", width: 22 },
    { key: "service1DueDate", width: 20 },
    { key: "service1CompletedDate", width: 24 },
    { key: "service2DueDate", width: 20 },
    { key: "service2CompletedDate", width: 24 },
    { key: "service3DueDate", width: 20 },
    { key: "service3CompletedDate", width: 24 },
    { key: "amcOptedDate", width: 20 },
    { key: "amcDatesSameAsServiceDates", width: 30 },
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Lead Servicing Report";
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
      entry.product_type,
      entry.instance,
      formatDate(entry.usable_handover_date),
      formatDate(entry.final_handover_date),
      formatDate(entry.service_1_due_date),
      formatDate(entry.service_1_completed_date),
      formatDate(entry.service_2_due_date),
      formatDate(entry.service_2_completed_date),
      formatDate(entry.service_3_due_date),
      formatDate(entry.service_3_completed_date),
      formatDate(entry.amc_opted_date),
      entry.amc_dates_same_as_service_dates,
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = colNum === 1 || colNum === 2 || colNum >= 7;
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

export async function generateLeadServicingReport(params: GenerateLeadServicingReportParams) {
  const { vendorId, franchiseId, fromDate, toDate, onProgress } = params;

  onProgress?.("Fetching servicing data...");

  const rows =
    franchiseId === "all"
      ? await fetchReportData(vendorId, null, fromDate, toDate)
      : Array.isArray(franchiseId)
      ? (
          await Promise.all(
            franchiseId.map((id) =>
              fetchReportData(vendorId, id, fromDate, toDate),
            ),
          )
        ).flat()
      : await fetchReportData(vendorId, franchiseId, fromDate, toDate);

  if (rows.length === 0) {
    throw new Error("No servicing rows found for the selected filters.");
  }

  onProgress?.("Building Excel report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();
  const usedSheetNames = new Set<string>();
  buildLeadServicingSheet(
    workbook,
    rows,
    buildSheetName(
      franchiseId === "all" || Array.isArray(franchiseId) ? "Consolidated" : "Servicing Report",
      usedSheetNames,
    ),
  );

  if (franchiseId === "all" || Array.isArray(franchiseId)) {
    const groupedRows = new Map<string, LeadServicingReportRow[]>();
    for (const row of rows) {
      const key = row.franchise_store || "Unknown Franchise";
      const group = groupedRows.get(key) ?? [];
      group.push(row);
      groupedRows.set(key, group);
    }

    for (const [franchiseName, franchiseRows] of groupedRows) {
      buildLeadServicingSheet(
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

  saveAs(blob, buildReportFileName(params.vendorReportCode, "Lead Servicing Report"));
}
