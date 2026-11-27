export const leaveTypes = ["Paid Leave", "Sick Leave", "Casual Leave", "Unpaid Leave"] as const;
export const leaveTypeCodes: Record<string, string> = { "Paid Leave": "PAID", "Sick Leave": "SICK", "Casual Leave": "CASUAL", "Unpaid Leave": "UNPAID" };
export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export type LeaveLocation = { id: string; name: string; unit: string };
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "RECORDED";
export type Holiday = { id: string; date: string; name: string; remark: string; scope: string };
export type WeekOffPolicy = Record<string, number[]>;
export type LeaveAttachment = { name: string; size: number };
export type LeaveDraft = { title: string; type: string; remark: string; startDate: string; endDate: string; file?: File };
export type LeaveRequest = {
  id: string; userId: number; employee: string; code: string; franchise: string; locationName: string;
  title: string; type: string; remark: string; startDate: string; endDate: string; dayCount: number; status: LeaveStatus; isBackdated: boolean; approvalRequired: boolean;
  submittedAt: string; submittedDate: string; reviewedDate?: string | null; rejectionReason?: string; reviewedBy?: string; reviewedAt?: string;
  attachment?: LeaveAttachment;
};
export function scopeName(scope: string, locations: LeaveLocation[] = []) { return scope === "company" ? "Company-wide" : locations.find(item => item.id === scope)?.name || `Location #${scope}`; }
export function validLeaveDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
export function leaveDateLabel(date: string, long = false) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: long ? "long" : "short", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}
export function effectiveHolidays(holidays: Holiday[], scope: string, year: number) {
  const rows = holidays.filter(row => row.date.startsWith(String(year)) && (row.scope === "company" || row.scope === scope));
  return [...new Map(rows.sort((a, b) => Number(a.scope !== "company") - Number(b.scope !== "company")).map(row => [row.date, row])).values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function effectiveWeeklyOffs(policies: WeekOffPolicy, scope: string) { return policies[scope] ?? policies.company ?? []; }

export function leaveDayCount(start: string, end: string) {
  if (!validLeaveDate(start) || !validLeaveDate(end) || end < start) return 0;
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
}

export function sortHolidaysByProximity(holidays: Holiday[], today: string) {
  const currentDay = Date.parse(`${today}T00:00:00Z`);
  return [...holidays].sort((a, b) => {
    const aDistance = Math.abs(Date.parse(`${a.date}T00:00:00Z`) - currentDay);
    const bDistance = Math.abs(Date.parse(`${b.date}T00:00:00Z`) - currentDay);
    return aDistance - bDistance || Number(a.date < today) - Number(b.date < today) || a.date.localeCompare(b.date);
  });
}
