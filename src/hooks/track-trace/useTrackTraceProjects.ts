import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteTrackTraceProject,
  fetchMachineTypes,
  getAllTrackTraceProjects,
  TrackTraceProjectFilters,
  TrackTraceProjectsResponse,
} from "@/api/track-trace/track-trace.api";

import { useAppSelector } from "@/redux/store";

export function useTrackTraceProjects(
  vendorId: number | undefined,
  filters: TrackTraceProjectFilters
) {
  return useQuery<TrackTraceProjectsResponse>({
    queryKey: [
      "track-trace-projects",
      vendorId,
      filters,
    ],

    queryFn: () =>
      getAllTrackTraceProjects(
        vendorId!,
        filters
      ),

    enabled: !!vendorId,
    placeholderData: keepPreviousData,
  });
}

export function useDeleteTrackTraceProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrackTraceProject,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "track-trace-projects",
        ],
      });
    },
  });
}

export const useMachineTypes = (
  vendorId?: number
) => {
  const authVendorId =
    useAppSelector(
      (s) => s.auth.user?.vendor_id
    );

  const targetVendorId =
    vendorId ?? authVendorId;

  return useQuery({
    queryKey: [
      "machine-types",
      targetVendorId,
    ],

    queryFn: () =>
      fetchMachineTypes(
        targetVendorId
      ),

    enabled: !!targetVendorId,
  });
};