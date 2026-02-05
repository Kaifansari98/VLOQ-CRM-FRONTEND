import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import {
  // ClientDocDetailsResponse,
  ClientDocumentationResponse,
} from "@/types/client-documentation";
import {
  getClientDocumentationDetails,
  getClientDocumentationLeads,
  getOrderLoginEligibility,
  OrderLoginEligibilityResponse,
  moveLeadToClientApproval,
  uploadMoreClientDocumentation,
  UploadMoreDocPayload,
} from "@/api/client-documentation";
import { toast } from "react-toastify";

export interface ClientDoc {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  signed_url: string;
  tech_check_status: string;
  created_at: string;
  product_structure_instance_id?: number | null;
}

export interface ClientDocInstanceGroup {
  instance_id: number | null;
  instance_title: string;
  quantity_index: number | null;
  product_structure: {
    id: number;
    type: string;
  } | null;
  documents: {
    ppt: ClientDoc[];
    pytha: ClientDoc[];
  };
}

export interface ClientDocDetailsResponse {
  id: number;
  vendor_id: number;
  status_id: number;
  instance_count?: number;
  product_structure_instances?: {
    id: number;
    title: string;
    quantity_index: number;
    productStructure?: {
      id: number;
      type: string;
    };
  }[];
  documents: {
    ppt: ClientDoc[];
    pytha: ClientDoc[];
  };
  documents_by_instance?: ClientDocInstanceGroup[];
}

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
  leadId: number,
  userId: number,
) => {
  return useQuery<ClientDocDetailsResponse>({
    queryKey: ["clientDocumentationDetails", vendorId, leadId],
    queryFn: () => getClientDocumentationDetails(vendorId, leadId, userId),
    enabled: !!vendorId && !!leadId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useOrderLoginEligibility = (vendorId: number, leadId: number) => {
  return useQuery<OrderLoginEligibilityResponse>({
    queryKey: ["MoveToOrderLogin", vendorId, leadId],

    queryFn: () => getOrderLoginEligibility(vendorId, leadId),

    enabled: !!vendorId && !!leadId,

    staleTime: 2 * 60 * 1000, // eligibility should refresh quickly
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

export const useMoveLeadToClientApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      leadId: number;
      vendorId: number;
      updatedBy: number;
    }) => moveLeadToClientApproval(payload),
    onSuccess: async (_data, variables) => {
      toast.success("Lead moved to Client Approval");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["clientDocumentationDetails", variables.vendorId, variables.leadId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["clientDocumentationLeads"],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ["leadStatus", variables.leadId, variables.vendorId],
        }),
      ]);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || "Failed to move lead";
      toast.error(message);
    },
  });
};
