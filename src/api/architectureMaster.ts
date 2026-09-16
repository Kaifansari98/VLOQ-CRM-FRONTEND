import { apiClient } from "@/lib/apiClient";
import {
  ArchitectureMasterListResponse,
  ArchitectureMasterResponse,
  CreateArchitectureMasterDTO,
  UpdateArchitectureMasterDTO,
  UpdateArchitectureMasterStatusDTO,
  ArchitectureMasterDropdownResponse,
  BulkUploadArchitectsResponse,
} from "../types/architectureMaster";

const BASE_URL = "/architecture-masters";

export const getArchitectureMasters = async (params?: { page?: number; limit?: number; search?: string }) => {
  const response = await apiClient.get<ArchitectureMasterListResponse>(`${BASE_URL}/list-architecture`, { params });
  return response.data;
};

export const getArchitectureMasterById = async (id: number) => {
  const response = await apiClient.get<ArchitectureMasterResponse>(`${BASE_URL}/get-architecture/${id}`);
  return response.data;
};

export const createArchitectureMaster = async (data: CreateArchitectureMasterDTO) => {
  const response = await apiClient.post<ArchitectureMasterResponse>(`${BASE_URL}/create-architecture`, data);
  return response.data;
};

export const updateArchitectureMaster = async (id: number, data: UpdateArchitectureMasterDTO) => {
  const response = await apiClient.put<ArchitectureMasterResponse>(`${BASE_URL}/update-architecture/${id}`, data);
  return response.data;
};

export const updateArchitectureMasterStatus = async (id: number, data: UpdateArchitectureMasterStatusDTO) => {
  const response = await apiClient.put<ArchitectureMasterResponse>(`${BASE_URL}/update-status/${id}`, data);
  return response.data;
};

export const deleteArchitectureMaster = async (id: number) => {
  const response = await apiClient.delete(`${BASE_URL}/delete-architecture/${id}`);
  return response.data;
};

export const getArchitectureMastersDropdownList = async (vendorId: number) => {
  const response = await apiClient.get<ArchitectureMasterDropdownResponse>(`${BASE_URL}/dropdown-list/${vendorId}`);
  return response.data;
};

export const uploadArchitectureMasters = async (formData: FormData) => {
  const response = await apiClient.post<BulkUploadArchitectsResponse>(`${BASE_URL}/upload-architecture`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
