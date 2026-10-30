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

export const getStudioSsoUrl = async (leadId?: number): Promise<string> => {
  const res = await apiClient.post<{
    success: boolean;
    data: { url: string };
    message?: string;
  }>("/cadbid/studio-sso", leadId === undefined ? undefined : { leadId });
  return res.data.data.url;
};

export interface CadbidLeadSyncResult {
  success: boolean;
  skipped: boolean;
  message: string;
}

// Never throws: resolves with a user-friendly message for every outcome
const syncLeadToCadbid = async (
  request: () => Promise<{
    data: { success: boolean; message: string; data: { skipped: boolean } };
  }>,
  fallbackMessage: string,
): Promise<CadbidLeadSyncResult> => {
  try {
    const res = await request();
    return {
      success: res.data.success,
      skipped: !!res.data.data?.skipped,
      message: res.data.message,
    };
  } catch (err: any) {
    return {
      success: false,
      skipped: false,
      message: err?.response?.data?.message || fallbackMessage,
    };
  }
};

export const createCadbidCustomerFromLead = (leadId: number) =>
  syncLeadToCadbid(
    () => apiClient.post(`/cadbid/leads/${leadId}/create-customer`),
    "We couldn't reach Cadbid, so the project was not created there. Please try again later.",
  );

export const updateCadbidCustomerFromLead = (leadId: number) =>
  syncLeadToCadbid(
    () => apiClient.put(`/cadbid/leads/${leadId}/update-customer`),
    "We couldn't reach Cadbid, so the lead's details were not updated there. Please try again later.",
  );

export interface CadbidQuote {
  nQuotationId: number;
  sDocumentNo: string | null;
  sRefNo: string | null;
  sName: string | null;
  sStage: string | null;
  sUserName: string | null;
  nTotalAmt: number | null;
  nDiscountAmt: number | null;
  dtCreated: string | null;
}

export interface CadbidLeadQuotesData {
  connected: boolean;
  linked: boolean;
  quotes: CadbidQuote[];
}

export const getCadbidQuotesForLead = async (
  leadId: number,
): Promise<CadbidLeadQuotesData> => {
  const res = await apiClient.get<{
    success: boolean;
    message: string;
    data: CadbidLeadQuotesData;
  }>(`/cadbid/leads/${leadId}/quotes`);
  return res.data.data;
};
