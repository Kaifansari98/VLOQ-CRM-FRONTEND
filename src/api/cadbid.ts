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
