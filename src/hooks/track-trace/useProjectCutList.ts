import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CutListSavePayload,
  getProjectCutList,
  updateCutListMachine,
  Lead,
  LinkLeadPayload,
  linkLeadToProject,
  searchLeads,
  uploadMachineAssignApi,
} from "@/api/track-trace/track-trace-cutlist.api";
import { apiClient } from "@/lib/apiClient";
import { toast } from "react-toastify";
import { ValidationError } from "next/dist/compiled/amphtml-validator";

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Centralised so invalidation always targets the right cache entry
export const TRACK_TRACE_KEYS = {
  projects: (vendorId: number) => ["track-trace-projects", vendorId] as const,
  cutlist: (projectId: string) => ["track-trace-cutlist", projectId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProjectCutList(vendorId: number, projectId?: string) {
  return useQuery({
    queryKey: TRACK_TRACE_KEYS.cutlist(projectId ?? ""),
    queryFn: () => getProjectCutList(vendorId, projectId!),
    enabled: !!projectId,
  });
}

export function useCutListMachine(payload: CutListSavePayload) {
  return updateCutListMachine(payload);
}

export function useLeadSearch(vendorId: number) {
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setLeads([]);
        return;
      }
      setIsSearching(true);
      setError(null);
      try {
        const results = await searchLeads(searchTerm, vendorId);
        setLeads(results);
      } catch {
        setError("Could not load leads. Please try again.");
        setLeads([]);
      } finally {
        setIsSearching(false);
      }
    },
    [vendorId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, fetchLeads]);

  const reset = () => {
    setQuery("");
    setLeads([]);
    setError(null);
  };

  return { query, setQuery, leads, isSearching, error, reset };
}

interface UseLinkLeadOptions {
  vendorId: number;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useLinkLeadToProject({
  vendorId,
  onSuccess,
  onError,
}: UseLinkLeadOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LinkLeadPayload) => linkLeadToProject(payload),
    onSuccess: () => {
      // Invalidate the projects list so the table refetches automatically
      queryClient.invalidateQueries({
        queryKey: TRACK_TRACE_KEYS.projects(vendorId),
      });
      onSuccess?.();
    },
    onError,
  });
}

interface UploadMachineExcelPayload {
  vendorId: number;
  projectToken: string;
  file: File;
  userId: number;
}

export const useUploadMachineExcel = (projectToken: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadMachineExcelPayload) =>
      uploadMachineAssignApi(
        payload.vendorId,
        payload.projectToken,
        payload.file,
        payload.userId,
      ),

    onSuccess: () => {
      toast.success("Machine assigned successfully");

      queryClient.invalidateQueries({
        queryKey: TRACK_TRACE_KEYS.cutlist(projectToken),
      });
    },

    onError: (error: any) => {
      const data = error?.response?.data;
      toast.error(data?.message ?? "Excel processing failed");
    },
  });
};
