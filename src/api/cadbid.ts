import { apiClient } from "@/lib/apiClient";

export interface CadbidUser {
  name: string;
  email: string;
  companyName: string;
}

export interface CadbidStatusData {
  connected: boolean;
  studioAccess: boolean;
  cadbidUser: CadbidUser | null;
  error?: string;
}

export interface VerifyTokenData {
  cadbidUser: CadbidUser;
  studioAccess: boolean;
}

export const getCadbidStatus = async (): Promise<CadbidStatusData> => {
  const res = await apiClient.get<{ success: boolean; data: CadbidStatusData }>(
    "/cadbid/status",
  );
  return res.data.data;
};

export const verifyCadbidToken = async (
  token: string,
): Promise<VerifyTokenData> => {
  const res = await apiClient.post<{
    success: boolean;
    data: VerifyTokenData;
    message: string;
  }>("/cadbid/verify", { token });
  return res.data.data;
};

export const connectCadbid = async (
  token: string,
): Promise<CadbidStatusData> => {
  const res = await apiClient.post<{
    success: boolean;
    data: CadbidStatusData;
    message: string;
  }>("/cadbid/connect", { token });
  return res.data.data;
};

export const disconnectCadbid = async (): Promise<void> => {
  await apiClient.post<{ success: boolean; message: string }>(
    "/cadbid/disconnect",
  );
};

export const getStudioSsoUrl = async (): Promise<string> => {
  const res = await apiClient.post<{
    success: boolean;
    data: { url: string };
    message?: string;
  }>("/cadbid/studio-sso");
  return res.data.data.url;
};

export interface CreateCadbidCustomerResult {
  success: boolean;
  skipped: boolean;
  message: string;
}

// Never throws: resolves with a user-friendly message for every outcome
export const createCadbidCustomerFromLead = async (
  leadId: number,
): Promise<CreateCadbidCustomerResult> => {
  try {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      data: { skipped: boolean };
    }>(`/cadbid/leads/${leadId}/create-customer`);
    return {
      success: res.data.success,
      skipped: !!res.data.data?.skipped,
      message: res.data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      skipped: false,
      message:
        err?.response?.data?.message ||
        "We couldn't reach Cadbid, so the project was not created there. Please try again later.",
    };
  }
};
