import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
export type CalendarStatus = "FULL_DAY" | "HALF_DAY" | "SHORT_DAY" | "WORKING" | "MISSING_PUNCH" | "ABSENT" | "NOT_CHECKED_IN" | "ON_LEAVE" | "OFF" | "EXPECTED_PRESENT";
export type CalendarCounts = { people: number; present: number; absent: number; off: number; full_day: number; half_day: number; short_day: number; working: number; on_leave: number; not_checked_in: number; needs_review: number; pending_leave: number; work_minutes: number };
export type CalendarLocation = { id: string; name: string; unit: string; shift_minutes: number };
export type CalendarDay = { date: string; is_forecast: boolean; is_live: boolean; counts: CalendarCounts; units: Record<string, CalendarCounts> };
export type AttendanceCalendarData = { month: string; today: string; server_time: string; time_zone: string; company_name: string; locations: CalendarLocation[]; weekly_off_configured: boolean; days: CalendarDay[] };
export type CalendarEmployee = { user_id: number; employee: string; employee_code: string; designation: string | null; role: string; date: string; location_id: string; location_name: string; unit: string; status: CalendarStatus; present: boolean; absent: boolean; shift_minutes: number; half_day_minutes: number; work_minutes: number | null; break_minutes: number; is_open: boolean; note: string; attendance_id: number | null; check_in: string | null; check_out: string | null; leave_title: string | null; leave_status: string | null; pending_leave: boolean; off_reason: string | null };
export type CalendarDayDetail = { date: string; today: string; is_forecast: boolean; is_live: boolean; time_zone: string; server_time: string; counts: CalendarCounts; groups: (CalendarLocation & { counts: CalendarCounts })[]; employees: CalendarEmployee[]; total: number; page: number; page_size: number; total_pages: number };
export type CalendarFilters = { location: string; unit: string };
export type CalendarDetailFilters = CalendarFilters & { date: string; search: string; status: string; page: number };
export function useAttendanceCalendar(vendorId: number, userId: number, month: string, filters: CalendarFilters) {
  return useQuery({ queryKey: ["attendance-calendar", vendorId, userId, "month", month, filters], queryFn: async ({ signal }) => (await apiClient.get<{ data: AttendanceCalendarData }>("/attendance/calendar", { params: { month, ...filters }, signal })).data.data, retry: 1, refetchOnWindowFocus: true, refetchInterval: 30000 });
}
export function useAttendanceCalendarDay(vendorId: number, userId: number, params: CalendarDetailFilters, enabled: boolean) {
  return useQuery({ queryKey: ["attendance-calendar", vendorId, userId, "day", params], enabled, queryFn: async ({ signal }) => (await apiClient.get<{ data: CalendarDayDetail }>("/attendance/calendar/day", { params, signal })).data.data, retry: 1, refetchOnWindowFocus: true, refetchInterval: 30000 });
}
export function useUpdateFranchiseShift(vendorId: number) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, shift_minutes }: { id: number; shift_minutes: number }) => (await apiClient.patch(`/franchises/${id}/shift`, { shift_minutes })).data,
    onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: ["attendance-calendar", vendorId] }), client.invalidateQueries({ queryKey: ["franchises"] })]),
  });
}
export async function exportCalendarDay(params: CalendarDetailFilters) {
  return (await apiClient.get<{ data: CalendarDayDetail }>("/attendance/calendar/day", { params: { ...params, export: "true" } })).data.data;
}
