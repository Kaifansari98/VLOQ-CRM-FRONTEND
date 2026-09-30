import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type {
  FactoryERDCalendarItem,
  FactoryUpcomingDispatch,
} from "@/api/dashboard/dashboard.api";
import { buildReportFileName, buildSheetName } from "@/lib/reports/fileName";

type TabId = "pending" | "upcoming";

interface GenerateFactoryCalendarReportParams {
  activeTab: TabId;
  month: number;
  year: number;
  vendorReportCode: string;
  rows: FactoryERDCalendarItem[] | FactoryUpcomingDispatch[];
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function applyHeaderCellStyle(cell: ExcelJS.Cell) {
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
}

function buildSheet(
  workbook: ExcelJS.Workbook,
  rows: FactoryERDCalendarItem[] | FactoryUpcomingDispatch[],
  sheetName: string,
  title: string,
  dateColumnLabel: string,
  dateSelector: (row: FactoryERDCalendarItem | FactoryUpcomingDispatch) => string | null,
) {
  const sheet = workbook.addWorksheet(sheetName);
  const headers = ["Sr. No.", "Lead Code", "Name", dateColumnLabel];

  sheet.columns = [
    { key: "srNo", width: 8 },
    { key: "leadCode", width: 18 },
    { key: "name", width: 28 },
    { key: "date", width: 18 },
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
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
    applyHeaderCellStyle(cell);
  });
  headerRow.height = 28;

  rows.forEach((entry, index) => {
    const row = sheet.addRow([
      index + 1,
      entry.lead_code || "—",
      entry.name || "—",
      formatDate(dateSelector(entry)),
    ]);

    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.alignment = {
        horizontal: colNum === 1 || colNum === 4 ? "center" : "left",
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

export async function generateFactoryCalendarReport({
  activeTab,
  month,
  year,
  vendorReportCode,
  rows,
}: GenerateFactoryCalendarReportParams) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const usedSheetNames = new Set<string>();
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const title =
    activeTab === "pending"
      ? `ERD Calendar - ${monthLabel}`
      : `Upcoming Dispatches - ${monthLabel}`;
  const dateColumnLabel = activeTab === "pending" ? "ERD Date" : "Dispatch Date";
  const dateSelector = (
    row: FactoryERDCalendarItem | FactoryUpcomingDispatch,
  ) =>
    activeTab === "pending"
      ? (row as FactoryERDCalendarItem).production_erd_date
      : (row as FactoryUpcomingDispatch).dispatch_date;

  buildSheet(
    workbook,
    rows,
    buildSheetName(title, usedSheetNames),
    title,
    dateColumnLabel,
    dateSelector,
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(
    blob,
    buildReportFileName(
      vendorReportCode,
      activeTab === "pending" ? `ERD Calendar ${monthLabel}` : `Upcoming Dispatches ${monthLabel}`,
    ),
  );
}
