import { validLeaveDate, type Holiday } from "./leaves";
export type HolidayImportRow = { row: number; date: string; name: string; remark: string; errors: string[]; existing: boolean };
const headers = ["Date", "Leave Name", "Remark"];
export async function downloadLeaveTemplate(year: number) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Paid Leave Calendar");
  sheet.addRow(headers); sheet.addRow([`${year}-01-26`, "Republic Day", "Company paid holiday"]);
  sheet.addRow([`${year}-08-15`, "Independence Day", "Company paid holiday"]);
  sheet.columns = [{ width: 20 }, { width: 35 }, { width: 55 }];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const instructions = workbook.addWorksheet("Instructions");
  ["Paid Leave Calendar upload", "Use the Paid Leave Calendar worksheet. Keep the column headings unchanged.", `All dates must be in ${year}, using YYYY-MM-DD or Excel date cells.`, "Date and Leave Name are mandatory; Remark is optional. Maximum 366 holidays per upload.", "Choose Company-wide or a franchise on the page before importing.", "Company holidays apply to every location. Franchise holidays add to the company calendar.", "A franchise entry on the same date takes precedence over the company entry.", "Duplicate dates inside a workbook must be resolved. Existing entries in the chosen scope can be updated after preview.", "Rows are validated again on the server and saved only after you confirm the import."].forEach(text => instructions.addRow([text]));
  instructions.getColumn(1).width = 120;
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a"); link.href = url; link.download = `paid-leave-calendar-template-${year}.xlsx`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function parseLeaveWorkbook(file: File, year: number, holidays: Holiday[], scope: string): Promise<HolidayImportRow[]> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Choose an .xlsx file. Save older .xls files as .xlsx first.");
  if (file.size > 5 * 1024 * 1024) throw new Error("The Excel workbook must be 5 MB or smaller.");
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet("Paid Leave Calendar");
  if (!sheet) throw new Error('The workbook needs a worksheet named "Paid Leave Calendar". Download the template to get started.');
  if (headers.some((label, index) => sheet.getRow(1).getCell(index + 1).text.trim().toLowerCase() !== label.toLowerCase())) throw new Error("Column headings must be Date, Leave Name and Remark, in that order.");
  const rows: HolidayImportRow[] = [];
  const seen = new Set<string>();
  sheet.eachRow((row, index) => {
    if (index === 1 || ![1, 2, 3].some(column => row.getCell(column).text.trim())) return;
    if (rows.length >= 366) throw new Error("Import up to 366 holiday rows at a time.");
    const dateCell = row.getCell(1), nameCell = row.getCell(2), remarkCell = row.getCell(3);
    const date = dateCell.value instanceof Date ? dateCell.value.toISOString().slice(0, 10) : dateCell.text.trim();
    const name = nameCell.text.trim(), remark = remarkCell.text.trim(), errors: string[] = [];
    if ([dateCell, nameCell, remarkCell].some(cell => cell.type === ExcelJS.ValueType.Formula)) errors.push("Use values instead of formulas.");
    if (!validLeaveDate(date)) errors.push("Enter a valid date using YYYY-MM-DD.");
    else if (Number(date.slice(0, 4)) !== year) errors.push(`Date must be in ${year}.`);
    if (!name || name.length > 100) errors.push("Leave Name must contain 1–100 characters.");
    if (remark.length > 500) errors.push("Remark cannot exceed 500 characters.");
    if (seen.has(date)) errors.push("Duplicate date in this workbook.");
    seen.add(date);
    rows.push({ row: index, date, name, remark, errors, existing: holidays.some(holiday => holiday.scope === scope && holiday.date === date) });
  });
  if (!rows.length) throw new Error("The workbook does not contain any holiday rows.");
  return rows;
}
