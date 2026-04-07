import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

interface GeneratePaymentsBetweenClientAndStoreReportParams {
  vendorId: number;
  vendorReportCode: string;
  franchiseId: number | "all";
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface PaymentsBetweenClientAndStoreReportRow {
  lead_id: number;
  lead_code: string;
  client_name: string;
  franchise_store: string;
  project_mrp: number | null;
  ism_amount_collected: number | null;
  ism_amt_date: string | null;
  ism_amt_description: string | null;
  booking_advance_collected: number | null;
  ba_date: string | null;
  ba_description: string | null;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  fromDate: string,
  toDate: string,
): Promise<PaymentsBetweenClientAndStoreReportRow[]> {
  const params: Record<string, string> = {
    vendor_id: String(vendorId),
  };

  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get(
    "/vendors/reports/payments-between-client-and-store",
    { params },
  );

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

function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function buildPaymentsSheet(
  workbook: ExcelJS.Workbook,
  rows: PaymentsBetweenClientAndStoreReportRow[],
  sheetName: string,
) {
  const sheet = workbook.addWorksheet(sheetName);

  const headers = [
    "Sr. No.",
    "Lead Code",
    "Client Name",
    "Franchise Store",
    "Project MRP",
    "ISM Amount Collected",
    "ISM Amt Date",
    "ISM Amt Description",
    "Booking Advance Collected",
    "BA Date",
    "BA Description",
  ];

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 18 },
    { key: "clientName", width: 24 },
    { key: "franchiseStore", width: 24 },
    { key: "projectMrp", width: 16 },
    { key: "ismAmountCollected", width: 20 },
    { key: "ismAmtDate", width: 18 },
    { key: "ismAmtDescription", width: 32 },
    { key: "bookingAdvanceCollected", width: 24 },
    { key: "baDate", width: 18 },
    { key: "baDescription", width: 32 },
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Payments Report (Between client and Store)";
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
      formatAmount(entry.project_mrp),
      formatAmount(entry.ism_amount_collected),
      formatDate(entry.ism_amt_date),
      entry.ism_amt_description || "-",
      formatAmount(entry.booking_advance_collected),
      formatDate(entry.ba_date),
      entry.ba_description || "-",
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = colNum === 1 || colNum === 5 || colNum === 6 || colNum === 7 || colNum === 9 || colNum === 10;
      cell.alignment = {
        horizontal: isCenter ? "center" : "left",
        vertical: "middle",
        wrapText: true,
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

export async function generatePaymentsBetweenClientAndStoreReport(
  params: GeneratePaymentsBetweenClientAndStoreReportParams,
) {
  const { vendorId, franchiseId, fromDate, toDate, onProgress } = params;

  onProgress?.("Fetching payment data...");

  const rows =
    franchiseId === "all"
      ? await fetchReportData(vendorId, null, fromDate, toDate)
      : await fetchReportData(vendorId, franchiseId, fromDate, toDate);

  if (rows.length === 0) {
    throw new Error("No payment rows found for the selected filters.");
  }

  onProgress?.("Building Excel report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();
  const usedSheetNames = new Set<string>();

  buildPaymentsSheet(
    workbook,
    rows,
    buildSheetName(
      franchiseId === "all"
        ? "Consolidated - All Franchisee"
        : "Payments Report",
      usedSheetNames,
    ),
  );

  if (franchiseId === "all") {
    const groupedRows = new Map<string, PaymentsBetweenClientAndStoreReportRow[]>();
    for (const row of rows) {
      const key = row.franchise_store || "Unknown Franchise";
      const group = groupedRows.get(key) ?? [];
      group.push(row);
      groupedRows.set(key, group);
    }

    for (const [franchiseName, franchiseRows] of groupedRows) {
      buildPaymentsSheet(
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

  saveAs(
    blob,
    buildReportFileName(
      params.vendorReportCode,
      "Payments Report (Between client and Store)",
    ),
  );
}
