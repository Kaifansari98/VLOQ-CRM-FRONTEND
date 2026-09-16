import { apiClient } from "@/lib/apiClient";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

export type ProjectDeletedFilter =
  | "active"
  | "deleted"
  | "all";

export type ProjectSortOrder =
  | "asc"
  | "desc";

export type ProjectSortBy =
  | "id"
  | "created_at"
  | "project_name"
  | "order_no"
  | "project_status"
  | "track_trace_status";

export interface TrackTraceProjectFilters {
  page: number;
  limit: number;

  search?: string;

  track_trace_status?: string;
  project_status?: string;

  deleted?: ProjectDeletedFilter;

  date_from?: string;
  date_to?: string;

  sort_by?: ProjectSortBy;
  sort_order?: ProjectSortOrder;
}

export type TrackTraceProjectListRow =
  TrackTraceProject & {
    isDeleted: boolean;

    deleted_by?: number | null;
    deleted_at?: string | null;

    created_at?: string;
  };

export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TrackTraceProjectsResponse {
  projects: TrackTraceProjectListRow[];

  pagination: ProjectPagination;
}

export const getAllTrackTraceProjects = async (
  vendorId: number,
  filters: TrackTraceProjectFilters
): Promise<TrackTraceProjectsResponse> => {
  const { data } = await apiClient.get(
    `/track-trace/project/${vendorId}`,
    {
      params: {
        page: filters.page,
        limit: filters.limit,

        search:
          filters.search || undefined,

        track_trace_status:
          filters.track_trace_status &&
          filters.track_trace_status !== "all"
            ? filters.track_trace_status
            : undefined,

        project_status:
          filters.project_status &&
          filters.project_status !== "all"
            ? filters.project_status
            : undefined,

        deleted:
          filters.deleted || "active",

        date_from:
          filters.date_from || undefined,

        date_to:
          filters.date_to || undefined,

        sort_by:
          filters.sort_by || "created_at",

        sort_order:
          filters.sort_order || "desc",
      },
    }
  );

  return data.data;
};

export const deleteTrackTraceProject = async ({
  vendorId,
  projectId,
  userId,
}: {
  vendorId: number;
  projectId: number;
  userId: number;
}) => {
  const { data } = await apiClient.patch(
    `/track-trace/project/${vendorId}/${projectId}/delete`,
    {
      user_id: userId,
    }
  );

  return data.data;
};

export const fetchMachineTypes = async (
  vendorId?: number
) => {
  const res = await apiClient.get(
    `/track-trace-master/machine-type`,
    {
      params: vendorId
        ? {
            vendorId,
          }
        : undefined,
    }
  );

  return res.data;
};