import { apiClient } from "@/lib/apiClient";
import {
  ApplyConfigurationPayload,
  ApplyConfigurationResponse,
  ConfigureResponse,
  CreateMachinePayload,
  GetMachinesByVendorResponse,
  MachineData,
  UpdateMachineParams,
  VendorLeadsPostPayload,
  VendorLeadsResponse,
} from "@/types/track-trace";

export const getMachinesByVendor = async (
  vendorId: number,
): Promise<GetMachinesByVendorResponse> => {
  const response = await apiClient.get<GetMachinesByVendorResponse>(
    `/track-trace-master/machines/vendor/${vendorId}`,
  );

  return response.data;
};

export const createMachine = async (
  payload: CreateMachinePayload,
): Promise<MachineData> => {
  const formData = new FormData();

  formData.append("vendor_id", String(payload.vendor_id));
  formData.append("machine_name", payload.machine_name);
  formData.append("machine_code", payload.machine_code);
  formData.append("machine_type", payload.machine_type);
  formData.append("status", payload.status);
  formData.append("scan_type", payload.scan_type);

  formData.append("description", payload.description);

  formData.append("sequence_no", String(payload.sequence_no));

  formData.append("target_per_hour", String(payload.target_per_hour));

  if (payload.factory_id !== undefined && payload.factory_id !== null)
    formData.append("factory_id", String(payload.factory_id));

  formData.append("created_by", String(payload.created_by));
  formData.append("machine_image", payload.machine_image);

  const res = await apiClient.post("/track-trace-master/machines", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};

export const updateMachine = async ({
  id,
  vendor_id,
  data,
}: UpdateMachineParams) => {
  const formData = new FormData();

  formData.append("machine_name", data.machine_name);
  formData.append("machine_code", data.machine_code);
  formData.append("machine_type", data.machine_type);
  formData.append("status", data.status);
  formData.append("scan_type", data.scan_type);
  formData.append("description", data.description);
  formData.append("sequence_no", String(data.sequence_no));
  formData.append("target_per_hour", String(data.target_per_hour));
  formData.append("updated_by", String(data.updated_by));

  if (data.factory_id !== undefined && data.factory_id !== null) {
    formData.append("factory_id", String(data.factory_id));
  }

  if (data.machine_image) {
    formData.append("machine_image", data.machine_image);
  }

  const res = await apiClient.put(
    `/track-trace-master/machines/${id}/vendor/${vendor_id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return res.data.data;
};

export const fetchVendorLeads = async (
  token: string,
  projectId: string,
): Promise<ConfigureResponse> => {
  const { data } = await apiClient.get<ConfigureResponse>(
    `/track-trace-configure/project/${token}/${projectId}`,
  );

  return data;
};

export const applyConfigurationApi = async (
  payload: ApplyConfigurationPayload,
): Promise<ApplyConfigurationResponse> => {
  const { data } = await apiClient.post<ApplyConfigurationResponse>(
    "/track-trace-configure/apply",
    payload,
  );

  return data;
};

export const postVendorLeads = async (
  token: string,
  projectId: string,
  payload: VendorLeadsPostPayload,
): Promise<VendorLeadsResponse> => {
  const { data } = await apiClient.post(
    `/track-trace-configure/project/${token}/${projectId}/leads`,
    payload,
  );

  return data;
};
