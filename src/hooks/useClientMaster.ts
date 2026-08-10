import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  getClientTypes,
  createClientType,
} from "@/api/client";
import { CreateClientDTO, UpdateClientDTO } from "@/types/client";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params: any) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
};

export const clientTypeKeys = {
  all: ["client-types"] as const,
  list: (vendorId: number) => [...clientTypeKeys.all, "list", vendorId] as const,
};

export const useClients = (params: { vendor_id?: number; page?: number; limit?: number; search?: string; activeOnly?: boolean }) => {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => getClients({ ...params, vendor_id: params.vendor_id! }),
    enabled: !!params.vendor_id,
  });
};

export const useClient = (vendorId?: number, id?: number) => {
  return useQuery({
    queryKey: clientKeys.detail(id!),
    queryFn: () => getClientById(vendorId!, id!),
    enabled: !!vendorId && !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDTO | FormData) => createClient(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toastManager.add({ title: res.message || "Client created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to create client.", type: "error" });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientDTO | FormData }) => updateClient(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.details() });
      toastManager.add({ title: res.message || "Client updated successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to update client.", type: "error" });
    },
  });
};

export const useClientTypes = (vendorId?: number) => {
  return useQuery({
    queryKey: clientTypeKeys.list(vendorId!),
    queryFn: () => getClientTypes(vendorId!),
    enabled: !!vendorId,
  });
};

export const useCreateClientType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, type }: { vendorId: number; type: string }) => createClientType(vendorId, type),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: clientTypeKeys.list(variables.vendorId) });
      toastManager.add({ title: res.message || "Client type created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to create client type.", type: "error" });
    },
  });
};
