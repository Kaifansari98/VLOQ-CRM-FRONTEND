import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { leaveTypeCodes, type Holiday, type LeaveDraft, type LeaveLocation, type LeaveRequest, type WeekOffPolicy } from "@/lib/hrms/leaves";
export type LeaveWorkspaceData = { year: number; scope: string; today: string; time_zone: string; company_name: string; franchises: LeaveLocation[]; holidays: Holiday[]; policies: WeekOffPolicy; summary: { total: number; pending: number; approved: number; rejected: number; recorded: number }; available_years: number[] };
export type LeaveQuery = { mode: "admin" | "personal"; year: number; scope: string };
export const leaveErrorMessage = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not save changes. Please try again.";
export function useLeaveWorkspace(vendorId: number, userId: number, params: LeaveQuery) {
  return useQuery({ queryKey: ["hrms-leaves", vendorId, userId, "workspace", params],
    queryFn: async ({ signal }) => (await apiClient.get<{ data: LeaveWorkspaceData }>("/leaves/workspace", { params, signal })).data.data,
    staleTime: 0, retry: 1, refetchOnWindowFocus: true, refetchInterval: 30000,
  });
}
export type LeaveRequestFilters = LeaveQuery & { status: string; search: string; type: string; from: string; to: string; page: number };
export function useLeaveRequests(vendorId: number, userId: number, params: LeaveRequestFilters) {
  return useQuery({ queryKey: ["hrms-leaves", vendorId, userId, "requests", params],
    queryFn: async ({ signal }) => (await apiClient.get<{ data: { items: LeaveRequest[]; total: number; counts: { all: number; PENDING: number; APPROVED: number; REJECTED: number; RECORDED: number }; page: number; page_size: number; total_pages: number } }>("/leaves/requests", { params: { ...params, type: leaveTypeCodes[params.type] || params.type, from: params.from || undefined, to: params.to || undefined }, signal })).data.data,
    retry: 1, refetchOnWindowFocus: true, refetchInterval: 30000,
  });
}
type LeaveAction =
  | { kind: "import"; scope: string; year: number; rows: { date: string; name: string; remark: string }[]; allow_updates: boolean }
  | { kind: "delete"; id: string }
  | { kind: "weekly"; scope: string; days?: number[]; inherit: boolean }
  | { kind: "create"; input: LeaveDraft }
  | { kind: "decision"; id: string; status: "APPROVED" | "REJECTED"; rejection_reason?: string };
export function useLeaveActions(vendorId: number) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (action: LeaveAction) => {
    if (action.kind === "create") {
      const form = new FormData();
      for (const field of ["title", "type", "remark"] as const) form.append(field, field === "type" ? leaveTypeCodes[action.input.type] || action.input.type : action.input[field]);
      form.append("start_date", action.input.startDate);
      form.append("end_date", action.input.endDate);
      if (action.input.file) form.append("attachment", action.input.file);
      return (await apiClient.post<{ data: LeaveRequest }>("/leaves/requests", form, { headers: { "Content-Type": "multipart/form-data" } })).data.data;
    }
    if (action.kind === "delete") return (await apiClient.delete(`/leaves/holidays/${action.id}`)).data;
    if (action.kind === "weekly") { const { kind: _kind, ...body } = action; return (await apiClient.put("/leaves/weekly-offs", body)).data; }
    if (action.kind === "decision") { const { kind: _kind, id, ...body } = action; return (await apiClient.patch(`/leaves/requests/${id}/decision`, body)).data; }
    const { kind: _kind, ...body } = action;
    return (await apiClient.post("/leaves/holidays/import", body)).data;
  }, onSettled: () => client.invalidateQueries({ queryKey: ["hrms-leaves", vendorId] }) });
}
export async function downloadLeaveAttachment(request: LeaveRequest) {
  const { data } = await apiClient.get<{ data: { url: string } }>(`/leaves/requests/${request.id}/attachment`);
  const link = document.createElement("a"); link.href = data.data.url; link.download = request.attachment?.name || "leave-attachment"; link.rel = "noopener"; link.click();
}
