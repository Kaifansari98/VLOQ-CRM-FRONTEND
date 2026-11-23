import type { CalendarEmployee, CalendarStatus } from "@/api/attendance-calendar";
export const calendarLabels: Record<CalendarStatus, string> = { FULL_DAY: "Full day", HALF_DAY: "Half day", SHORT_DAY: "Short day", WORKING: "Working", MISSING_PUNCH: "Needs review", ABSENT: "Absent", NOT_CHECKED_IN: "Not checked in", ON_LEAVE: "On leave", OFF: "Day off", EXPECTED_PRESENT: "Expected present" };
export const calendarColors: Record<CalendarStatus, string> = {
  FULL_DAY: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200", HALF_DAY: "bg-sky-500/10 text-sky-800 dark:text-sky-200", SHORT_DAY: "bg-amber-500/10 text-amber-800 dark:text-amber-200", WORKING: "bg-blue-500/10 text-blue-800 dark:text-blue-200", MISSING_PUNCH: "bg-purple-500/10 text-purple-800 dark:text-purple-200", ABSENT: "bg-rose-500/10 text-rose-800 dark:text-rose-200", NOT_CHECKED_IN: "bg-rose-500/10 text-rose-800 dark:text-rose-200", ON_LEAVE: "bg-[#FF8D28]/10 text-[#9A4300] dark:text-[#FF8D28]", OFF: "bg-muted text-muted-foreground", EXPECTED_PRESENT: "bg-sky-500/10 text-sky-800 dark:text-sky-200",
};
export const unitLabels: Record<string, string> = { BRANCH: "Branches", FRANCHISE: "Franchises", FACTORY: "Factories", UNASSIGNED: "Unassigned" };
export const calendarDateLabel = (date: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
export const calendarDuration = (minutes: number | null) => minutes === null ? "—" : `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
export function calendarCsv(rows: CalendarEmployee[], zone: string) {
  const cell = (value: unknown) => { let text = String(value ?? ""); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; return `"${text.replace(/"/g, '""')}"`; };
  return [["Date", "Employee", "Employee code", "Location", "Unit", "Status", "Work time", "Break time", "Shift hours", "Check in", "Check out", "Leave", "Note", "Timezone"], ...rows.map(row => [row.date, row.employee, row.employee_code, row.location_name, row.unit, calendarLabels[row.status], calendarDuration(row.work_minutes), calendarDuration(row.break_minutes), row.shift_minutes / 60, row.check_in, row.check_out, row.leave_title, row.note, zone])].map(row => row.map(cell).join(",")).join("\r\n");
}
