import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import { buildReportFileName } from "@/lib/reports/fileName";

interface GenerateTechCheckStageReportParams {
  vendorId: number;
  vendorReportCode: string;
  franchiseId: number | "all";
  fromDate: string;
  toDate: string;
  onProgress?: (stage: string) => void;
}

interface TechCheckStageReportRow {
  lead_id: number;
  instance_id: number | null;
  lead_code: string;
  client_name: string;
  franchise_store: string;
  tech_check_req_date: string | null;
  rejection_dates: string[];
  revised_upload_dates: string[];
  tech_check_approved_date: string | null;
}

async function fetchReportData(
  vendorId: number,
  franchiseId: number | null,
  fromDate: string,
  toDate: string,
): Promise<TechCheckStageReportRow[]> {
  const params: Record<string, string> = {
    vendor_id: String(vendorId),
  };

  if (franchiseId !== null) params.franchise_id = String(franchiseId);
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  const { data } = await apiClient.get("/vendors/reports/techcheck-stage", {
    params,
  });

  return data?.data ?? [];
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function ordinalLabel(index: number): string {
  const value = index + 1;
  if (value % 100 >= 11 && value % 100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

export async function generateTechCheckStageReport(
  params: GenerateTechCheckStageReportParams,
) {
  const { vendorId, franchiseId, fromDate, toDate, onProgress } = params;

  onProgress?.("Fetching tech check data...");

  const rows =
    franchiseId === "all"
      ? await fetchReportData(vendorId, null, fromDate, toDate)
      : await fetchReportData(vendorId, franchiseId, fromDate, toDate);

  if (rows.length === 0) {
    throw new Error("No tech check stage rows found for the selected filters.");
  }

  onProgress?.("Building Excel report...");

  const maxCycles = rows.reduce(
    (max, row) =>
      Math.max(max, row.rejection_dates.length, row.revised_upload_dates.length),
    0,
  );
  const visibleCycles = Math.min(maxCycles, 4);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("TechCheck Stage");

  const baseHeaders = [
    "Sr. No.",
    "Lead Code",
    "Client Name",
    "Franchise Store",
    "TechCheck Req Date",
  ];
  const rejectionHeaders = Array.from(
    { length: visibleCycles },
    (_, index) => `${ordinalLabel(index)} rejection Date/Time`,
  );
  const revisedUploadHeaders = Array.from(
    { length: visibleCycles },
    (_, index) => `${ordinalLabel(index)} Revised File Uploaded Date/Time`,
  );
  const headers = [
    ...baseHeaders,
    ...rejectionHeaders,
    ...revisedUploadHeaders,
    "Techcheck Approved Date",
  ];

  sheet.columns = headers.map((header, index) => ({
    key: `col_${index + 1}`,
    width:
      index === 0
        ? 8
        : index === 1
          ? 16
          : index === 2
            ? 24
            : index === 3
              ? 24
              : 24,
  }));

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "TechCheck Stage Report";
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
    const rejectionValues = Array.from(
      { length: visibleCycles },
      (_, cycleIndex) => formatDateTime(entry.rejection_dates[cycleIndex]),
    );
    const revisedUploadValues = Array.from(
      { length: visibleCycles },
      (_, cycleIndex) => formatDateTime(entry.revised_upload_dates[cycleIndex]),
    );

    const row = sheet.addRow([
      index + 1,
      entry.lead_code,
      entry.client_name,
      entry.franchise_store,
      formatDateTime(entry.tech_check_req_date),
      ...rejectionValues,
      ...revisedUploadValues,
      formatDateTime(entry.tech_check_approved_date),
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isCenter = colNum === 1 || colNum >= 5;
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

  onProgress?.("Preparing file...");

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, buildReportFileName(params.vendorReportCode, "TechCheck Stage Report"));
}
