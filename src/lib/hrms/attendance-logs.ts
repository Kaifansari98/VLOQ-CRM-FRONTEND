export type LogStatus = "WORKING" | "ON_BREAK" | "COMPLETED" | "MISSING_PUNCH" | "NO_RECORD";
export type LogSource = "MANUAL" | "PHONE" | "CARD";
export const logStatuses: Record<LogStatus, string> = { WORKING: "Working", ON_BREAK: "On break", COMPLETED: "Completed", MISSING_PUNCH: "Missing punch", NO_RECORD: "No record" };
export type LogEmployee = { id: number; name: string; designation: string | null; role: string; location: string; location_id: string; unit: "BRANCH" | "FRANCHISE" | "FACTORY" | null };
export type AttendanceLogRow = {
  id: string; date: string; employee: LogEmployee; status: LogStatus; attendance_id: number | null;
  check_in: string | null; check_out: string | null; source: LogSource | null; work_location: string | null; time_zone: string;
  break_minutes: number; work_minutes: number | null; corrected: boolean;
};
type PunchSnapshot = { check_in?: string | null; check_out?: string | null } | null;
export type AttendanceLogEvent = {
  id: number; action: "IN" | "OUT" | "BREAK_START" | "BREAK_END" | "CORRECTED"; time: string; source: LogSource; actor: string | null;
  before: PunchSnapshot; after: PunchSnapshot; correction: { reason: string; review_note: string | null; requested_by: string } | null;
};
export type AttendanceLogSummary = { employee: LogEmployee; recorded: number; completed: number; missing: number; work_minutes: number; average_minutes: number | null; latest: AttendanceLogRow };

export function shiftLogDate(date: string, offset: number) {
  const result = new Date(`${date}T12:00:00Z`); result.setUTCDate(result.getUTCDate() + offset);
  return result.toISOString().slice(0, 10);
}
export const logDuration = (minutes: number) => {
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded / 60)}h ${String(rounded % 60).padStart(2, "0")}m`;
};
export const logTime = (value: string | null | undefined, timeZone: string) => value
  ? new Intl.DateTimeFormat("en-IN", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)).toUpperCase()
  : "—";
export const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");

export function attendanceLogCsv(rows: AttendanceLogRow[]) {
  const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [["Employee ID", "Employee", "Date", "Role", "Designation", "Location", "Unit type", "Work location", "Check in", "Check out", "Break time", "Net work time", "Status", "Punch source", "Corrected", "Timezone"],
    ...rows.map(row => [row.employee.id, row.employee.name, row.date, row.employee.role, row.employee.designation, row.employee.location, row.employee.unit, row.work_location ? titleCase(row.work_location) : "",
      row.check_in ? logTime(row.check_in, row.time_zone) : "", row.check_out ? logTime(row.check_out, row.time_zone) : "", row.attendance_id ? logDuration(row.break_minutes) : "",
      row.work_minutes === null ? "" : logDuration(row.work_minutes), logStatuses[row.status], row.source ? titleCase(row.source) : "", row.corrected ? "Yes" : "No", row.time_zone])]
    .map(row => row.map(cell).join(",")).join("\r\n");
}
