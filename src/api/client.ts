import { apiClient } from "@/lib/apiClient";
import {
  ClientListResponse,
  ClientResponse,
  ClientTypeListResponse,
  ClientTypeResponse,
  CreateClientDTO,
  UpdateClientDTO,
} from "@/types/client";

const BASE_URL = "/clients";
const CLIENT_TYPE_BASE_URL = "/client-types";

export const getClients = async (params: {
  vendor_id: number;
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
}) => {
  const response = await apiClient.get<ClientListResponse>(`${BASE_URL}/list-clients`, { params });
  return response.data;
};

export const getClientById = async (vendor_id: number, id: number) => {
  const response = await apiClient.get<ClientResponse>(`${BASE_URL}/get-client/${id}`, {
    params: { vendor_id },
  });
  return response.data;
};

export const createClient = async (data: CreateClientDTO | FormData) => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.post<ClientResponse>(`${BASE_URL}/create-client`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data;
};

export const updateClient = async (id: number, data: UpdateClientDTO | FormData) => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.put<ClientResponse>(`${BASE_URL}/update-client/${id}`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data;
};

export const getClientTypes = async (vendorId: number) => {
  const response = await apiClient.get<ClientTypeListResponse>(
    `${CLIENT_TYPE_BASE_URL}/list-client-types/${vendorId}`,
  );
  return response.data;
};

export const createClientType = async (vendor_id: number, type: string) => {
  const response = await apiClient.post<ClientTypeResponse>(`${CLIENT_TYPE_BASE_URL}/create-client-type`, {
    vendor_id,
    type,
  });
  return response.data;
};
