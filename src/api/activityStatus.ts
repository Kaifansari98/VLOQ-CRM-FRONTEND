import { apiClient } from "@/lib/apiClient";
import { Lead } from "./leads";
import { vendored } from "next/dist/server/route-modules/app-page/module.compiled";

export interface UpdateActivityStatusPayload {
  vendorId: number;
  accountId: number;
  userId: number;
  status: string;
  remark: string;
  createdBy: number;
  dueDate?: string;
}

export interface RevertActivityStatusPayload {
  vendorId: number;
  accountId: number;
  userId: number;
  remark: string;
  createdBy: number;
}

export interface ApiActivityStatusCounts {
  totalOnGoing: number;
  openOnGoing: number;
  onHold: number;
  lostApproval: number;
  lost: number;
}

export interface UiActivityStatusCounts {
  total: number;   // maps totalOnGoing
  open: number;    // maps openOnGoing
  onHold: number;
  lostApproval: number;
  lost: number;
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

export const getLostApprovalLeads = async (
  vendorId: number
): Promise<Lead[]> => {
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

export const getActivityStatusCounts = async (
  vendorId: number
): Promise<UiActivityStatusCounts> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendorId/${vendorId}/activity-status-counts`
  );
  const data: ApiActivityStatusCounts = res.data.data;

  return {
    total: data.totalOnGoing || 0,
    open: data.openOnGoing || 0,
    onHold: data.onHold || 0,
    lostApproval: data.lostApproval || 0,
    lost: data.lost || 0,
  };
};