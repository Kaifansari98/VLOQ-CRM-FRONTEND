import { apiClient } from "@/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AttendanceLogItem {
  id: number;
  attendance_id: number;
  vendor_id: number;
  franchise_id?: number | null;
  user_id: number;
  action: "IN" | "OUT";
  action_time: string;
  action_time_local?: string | null;
  source: "MANUAL" | "PHONE" | "CARD";
  created_at?: string;
}

export interface AttendanceRecord {
  id: number;
  vendor_id: number;
  franchise_id?: number | null;
  user_id: number;
  attendance_date: string;
  attendance_date_local: string | null;
  vendor_time_zone: string;
  check_in: string;
  check_in_local: string | null;
  check_out?: string | null;
  check_out_local?: string | null;
  duration_formatted?: string | null;
  status?: string | null;
  source: "MANUAL" | "PHONE" | "CARD";
  logs?: AttendanceLogItem[];
  user?: {
    id: number;
    user_name: string;
    user_contact?: string;
    user_email?: string;
    designation?: string;
    user_type?: {
      user_type?: string;
    };
  };
  franchise?: {
    id: number;
    franchise_name: string;
    franchise_code?: string;
  };
}

export interface TodayAttendanceData {
  has_marked_in: boolean;
  vendor_time_zone?: string;
  attendance: AttendanceRecord | null;
  logs: AttendanceLogItem[];
}

export interface TodayAttendanceResponse {
  success: boolean;
  message: string;
  data: TodayAttendanceData;
}

export interface AttendanceListResponse {
  success: boolean;
  message: string;
  data: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface MarkAttendancePayload {
  user_id: number;
  action: "IN" | "OUT";
  source?: "MANUAL" | "PHONE" | "CARD";
}

export interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  data: {
    attendance: AttendanceRecord;
    log: AttendanceLogItem;
  };
}

export interface AttendanceFilterParams {
  vendor_id?: number;
  franchise_id?: number;
  user_id?: number;
  attendance_date?: string;
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
}

/**
 * Fetch today's attendance status for the current or specified employee
 */
export const getTodayAttendance = async (userId?: number): Promise<TodayAttendanceData> => {
  const query = userId ? `?user_id=${userId}` : "";
  const response = await apiClient.get<TodayAttendanceResponse>(`/attendance/today${query}`);
  return response.data.data;
};

/**
 * Hook to get today's attendance
 */
export const useTodayAttendance = (userId?: number) => {
  return useQuery({
    queryKey: ["today-attendance", userId],
    queryFn: () => getTodayAttendance(userId),
    refetchInterval: 30000, // Poll every 30s to keep clock/status fresh
    refetchOnWindowFocus: true,
  });
};

/**
 * Fetch attendance history / list
 */
export const getAttendanceHistory = async (
  params?: AttendanceFilterParams
): Promise<AttendanceListResponse> => {
  const response = await apiClient.get<AttendanceListResponse>("/attendance", {
    params,
  });
  return response.data;
};

/**
 * Hook to get attendance history / list
 */
export const useAttendanceHistory = (params?: AttendanceFilterParams) => {
  return useQuery({
    queryKey: ["attendance-history", params],
    queryFn: () => getAttendanceHistory(params),
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch audit punch logs for a specific attendance record
 */
export const getAttendanceLogsApi = async (
  attendanceId: number
): Promise<AttendanceLogItem[]> => {
  const response = await apiClient.get<{ success: boolean; data: AttendanceLogItem[] }>(
    `/attendance/${attendanceId}/logs`
  );
  return response.data.data;
};

/**
 * Hook to get attendance punch logs
 */
export const useAttendanceLogs = (attendanceId?: number) => {
  return useQuery({
    queryKey: ["attendance-logs", attendanceId],
    queryFn: () => getAttendanceLogsApi(attendanceId!),
    enabled: !!attendanceId,
  });
};

/**
 * Mark IN or OUT attendance punch
 */
export const markAttendanceApi = async (
  payload: MarkAttendancePayload
): Promise<MarkAttendanceResponse> => {
  const response = await apiClient.post<MarkAttendanceResponse>("/attendance/mark", {
    user_id: payload.user_id,
    action: payload.action,
    source: payload.source || "MANUAL",
  });
  return response.data;
};

/**
 * Mutation hook for marking attendance
 */
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAttendanceApi,
    onSuccess: () => {
      // Refresh today's status and history immediately
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-history"] });
    },
  });
};
