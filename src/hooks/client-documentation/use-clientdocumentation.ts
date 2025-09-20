import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import {
  ClientDocDetailsResponse,
  ClientDocumentationResponse,
} from "@/types/client-documentation";
import {
  getClientDocumentationDetails,
  getClientDocumentationLeads,
  uploadMoreClientDocumentation,
  UploadMoreDocPayload,
} from "@/api/client-documentation";
import { toast } from "react-toastify";

export const useClientDocumentationLeads = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  return useQuery<ClientDocumentationResponse>({
    queryKey: ["clientDocumentationLeads", vendorId, userId],
    queryFn: () => {
      if (!vendorId || !userId) throw new Error("Vendor ID or User ID missing");
      return getClientDocumentationLeads(vendorId, userId);
    },
    enabled: !!vendorId && !!userId, // tabhi call kare jab dono exist karte ho
    staleTime: 1000 * 60 * 2, // 2 min ke liye fresh data consider
  });
};

export const useClientDocumentationDetails = (
  vendorId: number,
  leadId: number
) => {
  return useQuery<ClientDocDetailsResponse>({
    queryKey: ["clientDocumentationDetails", vendorId, leadId],
    queryFn: () => getClientDocumentationDetails(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUploadMoreClientDocumentation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadMoreDocPayload) =>
      uploadMoreClientDocumentation(payload),
    onSuccess: async (data, variables) => {
      toast.success("Documents uploaded successfully!");
      await queryClient.refetchQueries({
        queryKey: [
          "clientDocumentationDetails",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || "Upload failed";
      toast.error(message);
    },
  });
};
