import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCompanyVendorMetaData,
  fetchDetailedCompanyVendor,
  createDetailedCompanyVendor,
  updateDetailedCompanyVendor,
  deleteDetailedCompanyVendor,
} from "@/api/typesMasterApi";

// Cache query keys
export const getCompanyVendorMetaDataQueryKey = (vendorId?: number) => [
  "companyVendorMetaData",
  vendorId,
];
export const getDetailedCompanyVendorQueryKey = (id?: number) => [
  "detailedCompanyVendor",
  id,
];
// Note: This key matches the existing key so that we invalidate the main list!
export const getCompanyVendorsMasterQueryKey = (
  vendorId?: number,
  isInventory?: boolean,
) => [
  "companyVendorsMaster",
  vendorId,
  isInventory,
];

export const useCompanyVendorMetaData = (vendorId?: number) => {
  return useQuery({
    queryKey: getCompanyVendorMetaDataQueryKey(vendorId),
    queryFn: () => fetchCompanyVendorMetaData(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useDetailedCompanyVendor = (id?: number) => {
  return useQuery({
    queryKey: getDetailedCompanyVendorQueryKey(id),
    queryFn: () => fetchDetailedCompanyVendor(id!),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useCreateDetailedCompanyVendor = (
  vendorId?: number,
  userId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      createDetailedCompanyVendor(formData, vendorId!, userId!),
    onSuccess: () => {
      // Invalidate both lists
      queryClient.invalidateQueries({
        queryKey: ["companyVendorsMaster"],
      });
      queryClient.invalidateQueries({
        queryKey: getCompanyVendorMetaDataQueryKey(vendorId),
      });
      queryClient.invalidateQueries({
        queryKey: ["companyVendors", vendorId],
      });
    },
  });
};

export const useUpdateDetailedCompanyVendor = (
  vendorId?: number,
  userId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      updateDetailedCompanyVendor(id, formData, vendorId!, userId!),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["companyVendorsMaster"],
      });
      queryClient.invalidateQueries({
        queryKey: getDetailedCompanyVendorQueryKey(id),
      });
      queryClient.invalidateQueries({
        queryKey: ["companyVendors", vendorId],
      });
    },
  });
};

export const useDeleteDetailedCompanyVendor = (
  vendorId?: number,
  userId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteDetailedCompanyVendor(id, vendorId!, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyVendorsMaster"],
      });
      queryClient.invalidateQueries({
        queryKey: ["companyVendors", vendorId],
      });
    },
  });
};
