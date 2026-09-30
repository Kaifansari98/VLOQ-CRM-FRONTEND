import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMachineRulesApi,
  getRuleByIdApi,
  createRuleApi,
  updateRuleApi,
  deleteRuleApi,
  toggleRuleStatusApi,
  getRuleFieldsApi,
  getVendorRuleActionsApi,
} from "@/api/trackAndTrace/cut-list-rules";
import type {
  CreateRulePayload,
  UpdateRulePayload,
  RuleStatus,
  CutListRuleMaster,
} from "@/types/track-trace";

export const useMachineRules = (machineId: number, vendorId?: number) => {
  return useQuery({
    queryKey: ["machine-rules", machineId, vendorId],
    queryFn: () => getMachineRulesApi(machineId, vendorId),
    enabled: !!machineId && !isNaN(machineId),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
};

export const useRuleDetails = (machineId: number, ruleId: number | null) => {
  return useQuery({
    queryKey: ["machine-rule-details", machineId, ruleId],
    queryFn: () => getRuleByIdApi(machineId, ruleId!),
    enabled: !!machineId && !!ruleId && !isNaN(ruleId),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateRule = (machineId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRulePayload) => createRuleApi(machineId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine-rules", machineId] });
    },
  });
};

export const useUpdateRule = (machineId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: number; payload: UpdateRulePayload }) =>
      updateRuleApi(machineId, ruleId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["machine-rules", machineId] });
      queryClient.invalidateQueries({
        queryKey: ["machine-rule-details", machineId, variables.ruleId],
      });
    },
  });
};

export const useDeleteRule = (machineId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: number) => deleteRuleApi(machineId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machine-rules", machineId] });
    },
  });
};

export const useToggleRuleStatus = (machineId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, status }: { ruleId: number; status: RuleStatus }) =>
      toggleRuleStatusApi(machineId, ruleId, status),
    onMutate: async ({ ruleId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["machine-rules"] });
      const queryKey = ["machine-rules", machineId];
      const previousRules = queryClient.getQueryData<CutListRuleMaster[]>(queryKey);

      if (previousRules) {
        queryClient.setQueryData<CutListRuleMaster[]>(
          queryKey,
          previousRules.map((r) => (r.id === ruleId ? { ...r, status } : r))
        );
      }

      return { previousRules, queryKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRules && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousRules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["machine-rules"] });
    },
  });
};

export const useRuleFields = () => {
  return useQuery({
    queryKey: ["rule-fields-master"],
    queryFn: () => getRuleFieldsApi(),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
};

export const useVendorRuleActions = (vendorId?: number) => {
  return useQuery({
    queryKey: ["vendor-rule-actions", vendorId],
    queryFn: () => getVendorRuleActionsApi(vendorId!),
    enabled: !!vendorId && !isNaN(vendorId),
    staleTime: 1000 * 60 * 10, // 10 mins
  });
};
