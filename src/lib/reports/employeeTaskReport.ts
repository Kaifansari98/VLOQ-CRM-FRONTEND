import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { apiClient } from "@/lib/apiClient";
import type { VendorUserTasksApiResponse, VendorUserTask } from "@/hooks/useTasksQueries";
import { buildReportFileName } from "@/lib/reports/fileName";

interface GenerateEmployeeTaskReportParams {
  vendorId: number;
  vendorReportCode: string;
  userId: number | "all";
  franchiseId: number | "all";
  franchiseName: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  allFranchises?: { id: number; name: string }[]; // required when franchiseId === "all"
  onProgress?: (stage: string) => void;
}

type TaggedTask = VendorUserTask & { _franchiseName: string };

async function fetchTasksForFranchise(
  vendorId: number,
  userId: number | "all",
  franchiseId: number,
  franchiseName: string,
  dateRange: object,
): Promise<TaggedTask[]> {
  const basePayload = {
    page: 1,
    limit: 10000,
    created_at: "asc" as const,
    franchise_id: franchiseId,
    ...dateRange,
  };

  if (userId === "all") {
    const { data } = await apiClient.post<VendorUserTasksApiResponse>(
      `/leads/tasks/vendorId/${vendorId}/tasks/report/filter/all`,
      basePayload,
    );
    return (data.data ?? []).map((t) => ({ ...t, _franchiseName: franchiseName }));
  }

  const { data } = await apiClient.post<VendorUserTasksApiResponse>(
    `/leads/tasks/vendorId/${vendorId}/userId/${userId}/tasks/report/filter`,
    basePayload,
  );
  return (data.data ?? []).map((t) => ({ ...t, _franchiseName: franchiseName }));
}

async function fetchAllTasks(
  vendorId: number,
  userId: number | "all",
  franchiseId: number | "all",
  franchiseName: string,
  fromDate: string,
  toDate: string,
  allFranchises: { id: number; name: string }[] = [],
): Promise<TaggedTask[]> {
  const dateRange = fromDate && toDate ? { assignat_range: { from: fromDate, to: toDate } } : {};

  if (franchiseId === "all") {
    const results: TaggedTask[] = [];
    for (const f of allFranchises) {
      const tasks = await fetchTasksForFranchise(vendorId, userId, f.id, f.name, dateRange);
      results.push(...tasks);
    }
    return results;
  }

  return fetchTasksForFranchise(vendorId, userId, franchiseId, franchiseName, dateRange);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTaskStatusLabel(status: string | null | undefined): string {
  if (!status) return "-";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getTaskStatus(dueDate: string | null | undefined, referenceDate: string | Date | null | undefined): string {
  if (!dueDate) return "-";

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return "-";

  const comparisonDate = referenceDate ? new Date(referenceDate) : new Date();
  if (isNaN(comparisonDate.getTime())) return "-";

  const today = new Date(comparisonDate);
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return "Today";
  if (due > today) return "Upcoming";
  return "Overdue";
}

function getDisplayStatus(status: string | null | undefined): string {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === "open") return "Pending";
  if (normalizedStatus === "closed") return "Completed";
  if (normalizedStatus === "completed") return "Completed";
  if (normalizedStatus === "cancelled") return "Cancelled";

  return formatTaskStatusLabel(status);
}

export async function generateEmployeeTaskReport(params: GenerateEmployeeTaskReportParams) {
  const {
    vendorId,
    vendorReportCode,
    userId,
    franchiseId,
    franchiseName,
    employeeName,
    fromDate,
    toDate,
    onProgress,
  } = params;

  onProgress?.("Fetching data...");
  const tasks = await fetchAllTasks(vendorId, userId, franchiseId, franchiseName, fromDate, toDate, params.allFranchises ?? []);

  onProgress?.("Building report...");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FurnixCRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Employee Task Report");

  // ── Column widths ──────────────────────────────────────────────
  sheet.columns = [
    { key: "srNo",           width: 8  },
    { key: "employeeName",   width: 22 },
    { key: "franchiseStore", width: 20 },
    { key: "leadCode",       width: 14 },
    { key: "leadName",       width: 22 },
    { key: "taskType",       width: 28 },
    { key: "generatedOn",    width: 22 },
    { key: "dueDate",        width: 18 },
    { key: "completionDate", width: 22 },
    { key: "taskStatus",     width: 14 },
    { key: "status",         width: 14 },
  ];

  const totalCols = sheet.columns.length;

  // ── Title row ──────────────────────────────────────────────────
  sheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Employee Task Report";
  titleCell.font = { bold: true, size: 13 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  sheet.getRow(1).height = 28;

  // ── Header row ─────────────────────────────────────────────────
  const HEADERS = [
    "Sr. No.", "Employee Name", "Franchise Store", "Lead Code", "Lead Name",
    "Task Type", "Task Generated on", "Due date", "Task Completion Date", "Task Status", "Status",
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
  headerRow.height = 22;

  // ── Data rows ──────────────────────────────────────────────────
  tasks.forEach((task, idx) => {
    const { userLeadTask, leadMaster } = task;
    const normalizedStatus = userLeadTask.status?.toLowerCase();
    const isEndedTask =
      normalizedStatus === "completed" ||
      normalizedStatus === "closed" ||
      normalizedStatus === "cancelled";
    const completionDateRaw = isEndedTask
      ? (userLeadTask.closed_at ?? userLeadTask.updated_at)
      : null;
    const completionDate = completionDateRaw ? formatDate(completionDateRaw) : "-";
    const taskStatus = getTaskStatus(userLeadTask.due_date, completionDateRaw);
    const displayStatus = getDisplayStatus(userLeadTask.status);

    const rowEmployeeName = userId === "all"
      ? (userLeadTask.assigned_to_name ?? userLeadTask.created_by_name ?? employeeName)
      : employeeName;

    const rowData = [
      idx + 1,
      rowEmployeeName,
      task._franchiseName,
      leadMaster.lead_code ?? "-",
      leadMaster.name ?? "-",
      userLeadTask.task_type ?? "-",
      formatDate(userLeadTask.created_at),
      formatDate(userLeadTask.due_date),
      completionDate,
      taskStatus,
      displayStatus,
    ];

    const row = sheet.addRow(rowData);
    row.height = 18;

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.alignment = { horizontal: colNum === 1 ? "center" : "left", vertical: "middle" };
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

    const taskStatusCell = row.getCell(10);
    const taskStatusColors: Record<string, string> = {
      Upcoming: "FFD9EAD3",
      Overdue: "FFF4CCCC",
      Today: "FF9FC5E8",
    };
    if (taskStatusColors[taskStatus]) {
      taskStatusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: taskStatusColors[taskStatus] },
      };
    }

    const statusCell = row.getCell(11);
    const statusColors: Record<string, string> = {
      Completed: "FFD9EAD3",
      Pending: "FF9FC5E8",
      Cancelled: "FFF4CCCC",
    };
    if (statusColors[displayStatus]) {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: statusColors[displayStatus] },
      };
    }
  });

  // ── Download ───────────────────────────────────────────────────
  onProgress?.("Preparing file...");
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, buildReportFileName(vendorReportCode, "Employee Task Report"));
}
