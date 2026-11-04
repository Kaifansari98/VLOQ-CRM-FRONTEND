import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { AttendanceCorrection, AttendanceEntry } from "@/lib/hrms/attendance";

export interface ServerCorrection extends Omit<AttendanceCorrection, "date" | "createdAt"> {
  attendance_date: string;
  created_at: string;
  user?: { id: number; user_name: string };
}
type ServerEntry = {
  id: number; attendance_date: string; check_in: string; check_out: string | null;
  work_location: string | null; vendor_time_zone: string; breaks: { started_at: string; ended_at: string | null }[];
};
export const mapCorrection = (request: ServerCorrection): AttendanceCorrection => ({ ...request, date: request.attendance_date.slice(0, 10), createdAt: request.created_at });
const mapEntry = (entry: ServerEntry): AttendanceEntry => ({ id: entry.id, date: entry.attendance_date.slice(0, 10), checkIn: entry.check_in, checkOut: entry.check_out || undefined,
  timeZone: entry.vendor_time_zone,
  location: entry.work_location ? entry.work_location.charAt(0) + entry.work_location.slice(1).toLowerCase() : "Unspecified",
  breaks: entry.breaks.map(pause => ({ start: pause.started_at, end: pause.ended_at || undefined })),
});

export function useHrmsAttendance(vendorId?: number, userId?: number, month?: string) {
  return useQuery({
    queryKey: ["hrms-attendance-workspace", vendorId, userId, month], enabled: !!vendorId && !!userId,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { entries: ServerEntry[]; current: ServerEntry | null; corrections: ServerCorrection[]; vendor_time_zone: string; server_time: string; can_review: boolean } }>("/attendance/workspace", { params: { month } });
      const result = data.data;
      return { ...result, entries: result.entries.map(mapEntry), current: result.current ? mapEntry(result.current) : null, corrections: result.corrections.map(mapCorrection) };
    },
    staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30000, retry: 1,
  });
}

export function useAttendanceAction(vendorId?: number, userId?: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input:
      | { kind: "punch"; action: "IN" | "OUT" | "BREAK_START" | "BREAK_END"; work_location: string }
      | { kind: "request"; attendance_date: string; reason: string; requested_check_in?: string; requested_check_out?: string }
      | { kind: "decision"; id: number; status: "APPROVED" | "REJECTED" | "CANCELLED"; review_note?: string; requested_check_in?: string; requested_check_out?: string }) => {
      if (input.kind === "punch") return (await apiClient.post("/attendance/punch", { action: input.action, work_location: input.work_location, source: "MANUAL" })).data;
      if (input.kind === "request") { const { kind: _kind, ...body } = input; return (await apiClient.post("/attendance/corrections", body)).data; }
      const { kind: _kind, id, ...body } = input;
      return (await apiClient.patch(`/attendance/corrections/${id}`, body)).data;
    },
    onSettled: async () => { await Promise.all([
      client.invalidateQueries({ queryKey: ["hrms-attendance-workspace", vendorId, userId] }),
      client.invalidateQueries({ queryKey: ["attendance-corrections", vendorId] }),
      client.invalidateQueries({ queryKey: ["today-attendance"] }),
      client.invalidateQueries({ queryKey: ["attendance-history"] }),
      client.invalidateQueries({ queryKey: ["attendance-logs"] }),
    ]); },
  });
}

export function useAttendanceCorrectionInbox(vendorId: number | undefined, page: number) {
  return useQuery({ queryKey: ["attendance-corrections", vendorId, page], enabled: !!vendorId,
    queryFn: async () => (await apiClient.get<{ data: { items: ServerCorrection[]; total: number; total_pages: number; vendor_time_zone: string } }>("/attendance/corrections", { params: { status: "PENDING", page } })).data.data,
    refetchOnWindowFocus: true,
  });
}
