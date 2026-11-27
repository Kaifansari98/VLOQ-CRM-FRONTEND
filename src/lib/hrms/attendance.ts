export type AttendanceBreak = { start: string; end?: string };
export type AttendanceEntry = {
  id: number;
  date: string;
  checkIn: string;
  checkOut?: string;
  location: string;
  timeZone?: string;
  breaks: AttendanceBreak[];
};
export type AttendanceCorrection = {
  id: number; date: string; reason: string; createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requested_check_in?: string | null; requested_check_out?: string | null;
  review_note?: string | null; reviewedBy?: { user_name: string } | null;
};

export function attendanceDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function workMilliseconds(entry: AttendanceEntry, now: Date) {
  const start = Date.parse(entry.checkIn);
  const end = entry.checkOut ? Date.parse(entry.checkOut) : now.getTime();
  const breakTime = entry.breaks.reduce((total, pause) => {
    const breakStart = Math.max(start, Date.parse(pause.start));
    const breakEnd = Math.min(end, pause.end ? Date.parse(pause.end) : end);
    return total + Math.max(0, breakEnd - breakStart);
  }, 0);
  return Math.max(0, end - start - breakTime);
}

export function formatDuration(milliseconds: number, seconds = false) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor(total / 60) % 60).padStart(2, "0");
  return seconds ? `${hours}:${minutes}:${String(total % 60).padStart(2, "0")}` : `${hours}h ${minutes}m`;
}

export function entryStatus(entry: AttendanceEntry) {
  if (entry.checkOut) return "Completed";
  return entry.breaks.some(pause => !pause.end) ? "On break" : "Working";
}

export function attendanceCsv(entries: AttendanceEntry[], timeZone: string, now: Date) {
  const time = (value?: string, zone = timeZone) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value)) : "";
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [["Date", "Check in", "Check out", "Net work time", "Status", "Work location", "Timezone", "Data source"],
    ...entries.map(entry => [entry.date, time(entry.checkIn, entry.timeZone), time(entry.checkOut, entry.timeZone), formatDuration(workMilliseconds(entry, now)), entryStatus(entry), entry.location, entry.timeZone || timeZone, "HRMS attendance"])]
    .map(row => row.map(cell).join(",")).join("\r\n");
}
