// useProjectCutList.ts
import { useQuery } from "@tanstack/react-query";
import { CutListSavePayload, getProjectCutList,updateCutListMachine } from "@/api/track-trace/track-trace-cutlist.api";

export function useProjectCutList(vendorId:number, projectId?: string) {
  return useQuery({
    queryKey: ["track-trace-cutlist", projectId],
    queryFn: () => getProjectCutList(vendorId,projectId!),
    enabled: !!projectId,
  });
}


export function useCutListMachine(payload:CutListSavePayload) {
  return updateCutListMachine(payload);
  
}
