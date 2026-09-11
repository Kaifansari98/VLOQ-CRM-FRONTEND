import { apiClient } from "@/lib/apiClient";
import type {
  CutListRuleMaster,
  CreateRulePayload,
  UpdateRulePayload,
  RuleFieldMaster,
  RuleActionMaster,
  RuleStatus,
} from "@/types/track-trace";

export const getMachineRulesApi = async (
  machineId: number,
  vendorId?: number
): Promise<CutListRuleMaster[]> => {
  const params = vendorId ? { vendor_id: vendorId } : {};
  const response = await apiClient.get<{ success: boolean; data: CutListRuleMaster[] }>(
    `/track-trace-master/machines/${machineId}/rules`,
    { params }
  );
  return response.data.data;
};

export const getRuleByIdApi = async (
  machineId: number,
  ruleId: number
): Promise<CutListRuleMaster> => {
  const response = await apiClient.get<{ success: boolean; data: CutListRuleMaster }>(
    `/track-trace-master/machines/${machineId}/rules/${ruleId}`
  );
  return response.data.data;
};

export const createRuleApi = async (
  machineId: number,
  payload: CreateRulePayload
): Promise<CutListRuleMaster> => {
  const response = await apiClient.post<{ success: boolean; data: CutListRuleMaster }>(
    `/track-trace-master/machines/${machineId}/rules`,
    payload
  );
  return response.data.data;
};

export const updateRuleApi = async (
  machineId: number,
  ruleId: number,
  payload: UpdateRulePayload
): Promise<CutListRuleMaster> => {
  const response = await apiClient.put<{ success: boolean; data: CutListRuleMaster }>(
    `/track-trace-master/machines/${machineId}/rules/${ruleId}`,
    payload
  );
  return response.data.data;
};

export const deleteRuleApi = async (
  machineId: number,
  ruleId: number
): Promise<void> => {
  await apiClient.delete(`/track-trace-master/machines/${machineId}/rules/${ruleId}`);
};

export const toggleRuleStatusApi = async (
  machineId: number,
  ruleId: number,
  status: RuleStatus
): Promise<CutListRuleMaster> => {
  const response = await apiClient.patch<{ success: boolean; data: CutListRuleMaster }>(
    `/track-trace-master/machines/${machineId}/rules/${ruleId}/status`,
    { status }
  );
  return response.data.data;
};

export const getRuleFieldsApi = async (): Promise<RuleFieldMaster[]> => {
  const response = await apiClient.get<{ success: boolean; data: RuleFieldMaster[] }>(
    `/track-trace-master/rule-masters/fields`
  );
  return response.data.data;
};

export const getVendorRuleActionsApi = async (
  vendorId: number
): Promise<RuleActionMaster[]> => {
  const response = await apiClient.get<{ success: boolean; data: RuleActionMaster[] }>(
    `/track-trace-master/rule-masters/actions`,
    { params: { vendor_id: vendorId } }
  );
  return response.data.data;
};
