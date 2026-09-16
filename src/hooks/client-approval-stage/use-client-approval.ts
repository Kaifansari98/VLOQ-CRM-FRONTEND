import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";

import {
  getClientApprovalLeads,
  getClientApprovalDetails,
  uploadMoreClientApprovalDocs,
  UploadApprovalDocPayload,
} from "@/api/client-approval";

// ✅ Get all leads
export const useClientApprovalLeads = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  return useQuery({
    queryKey: ["clientApprovalLeads", vendorId, userId],
    queryFn: () => {
      if (!vendorId || !userId) throw new Error("Vendor ID or User ID missing");
      return getClientApprovalLeads(vendorId, userId);
    },
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

// ✅ Get details
export const useClientApprovalDetails = (
  vendorId: number,
  leadId: number,
  productTypeId?: number,
) => {
  return useQuery({
    queryKey: ["clientApprovalDetails", vendorId, leadId, productTypeId],
    queryFn: () => getClientApprovalDetails(vendorId, leadId, productTypeId),
    enabled: !!vendorId && !!leadId,
    staleTime: 5 * 60 * 1000,
  });
};

// ✅ Upload more docs
export const useUploadMoreClientApprovalDocs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadApprovalDocPayload) =>
      uploadMoreClientApprovalDocs(payload),
    onSuccess: async (data, variables) => {
      toastManager.add({ title: "Approval documents uploaded successfully!", type: "success" });
      await queryClient.refetchQueries({
        queryKey: ["clientApprovalDetails", variables.vendorId, variables.leadId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || "Upload failed";
      toastManager.add({ title: message, type: "error" });
    },
  });
};

