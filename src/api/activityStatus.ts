import { apiClient } from "@/lib/apiClient";
import { Lead } from "./leads";

export interface UpdateActivityStatusPayload {
  vendorId: number;
  accountId: number;
  userId: number;
  status: string;
  remark: string;
  createdBy: number;
}

export interface RevertActivityStatusPayload {
  vendorId: number;
  accountId: number;
  userId: number;
  remark: string;
  createdBy: number;
}

export const updateLeadActivityStatus = async (
  leadId: number,
  payload: UpdateActivityStatusPayload
) => {
  const response = await apiClient.post(
    `/leads/lead-activity-status/leadId/${leadId}/activity-status`,
    payload
  );
  return response.data;
};

export const getOnHoldLeads = async (vendorId: number): Promise<Lead[]> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/onHold`
  );
  return res.data.data;
};

export const getLostApprovalLeads = async (vendorId: number): Promise<Lead[]> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/lostApproval`
  );
  return res.data.data;
};

export const getLostLeads = async (vendorId: number): Promise<Lead[]> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/lost`
  );
  return res.data.data;
};

export const revertLeadToOnGoing = async (
  leadId: number,
  payload: RevertActivityStatusPayload
) => {
  const res = await apiClient.post(
    `/leads/lead-activity-status/leadId/${leadId}/activity-status/revert`,
    payload
  );
  return res.data;
};