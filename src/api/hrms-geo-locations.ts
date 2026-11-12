import { apiClient } from "@/lib/apiClient";

export interface AttendanceLocationItem {
  id: number;
  vendor_id: number;
  franchise_id?: number | null;
  name: string;
  location_type: "OFFICE" | "SITE";
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  franchise?: {
    id: number;
    franchise_name: string;
    Department?: string | null;
  } | null;
  _count?: {
    userAssignments: number;
    attendanceRecords: number;
  };
  userAssignments?: Array<{
    user_id: number;
    user?: {
      id: number;
      user_name: string;
      user_email: string;
      designation?: string | null;
    };
  }>;
}

export interface CreateAttendanceLocationPayload {
  name: string;
  location_type?: "OFFICE" | "SITE";
  franchise_id?: number | null;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  is_active?: boolean;
}

export interface UpdateAttendanceLocationPayload {
  name?: string;
  location_type?: "OFFICE" | "SITE";
  franchise_id?: number | null;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  is_active?: boolean;
}

export async function fetchAttendanceLocations(params?: {
  is_active?: boolean | string;
  search?: string;
  location_type?: string;
  franchise_id?: number | string;
}): Promise<AttendanceLocationItem[]> {
  const { data } = await apiClient.get<{ success: boolean; data: AttendanceLocationItem[] }>(
    "/attendance/locations",
    { params }
  );
  return data.data;
}

export async function fetchAuthorizedLocations(): Promise<AttendanceLocationItem[]> {
  const { data } = await apiClient.get<{ success: boolean; data: AttendanceLocationItem[] }>(
    "/attendance/locations/authorized"
  );
  return data.data;
}

export async function createAttendanceLocation(
  payload: CreateAttendanceLocationPayload
): Promise<AttendanceLocationItem> {
  const { data } = await apiClient.post<{ success: boolean; data: AttendanceLocationItem }>(
    "/attendance/locations",
    payload
  );
  return data.data;
}

export async function updateAttendanceLocation(
  id: number,
  payload: UpdateAttendanceLocationPayload
): Promise<AttendanceLocationItem> {
  const { data } = await apiClient.patch<{ success: boolean; data: AttendanceLocationItem }>(
    `/attendance/locations/${id}`,
    payload
  );
  return data.data;
}

export async function deleteAttendanceLocation(id: number): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean; data: { success: boolean } }>(
    `/attendance/locations/${id}`
  );
  return data.data;
}

export async function fetchAssignableEmployees(): Promise<
  Array<{
    id: number;
    user_name: string;
    user_email: string;
    designation?: string;
    user_contact?: string;
    franchise?: { id: number; franchise_name: string };
  }>
> {
  const { data } = await apiClient.get<{
    success: boolean;
    data: Array<{
      id: number;
      user_name: string;
      user_email: string;
      designation?: string;
      user_contact?: string;
      franchise?: { id: number; franchise_name: string };
    }>;
  }>("/attendance/locations/employees");
  return data.data || [];
}

export async function assignLocationsToEmployees(payload: {
  location_id: number;
  user_ids: number[];
}): Promise<{ assigned_count: number }> {
  const { data } = await apiClient.post<{ success: boolean; data: { assigned_count: number } }>(
    "/attendance/locations/assign",
    payload
  );
  return data.data;
}

