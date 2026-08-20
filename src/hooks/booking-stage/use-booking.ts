import {
  BookingPayload,
  EditBookingForm,
  EditBookingPayload,
  getAllSiteSuperVisors,
  getAllHeadSiteSupervisors,
  getBookingLeadById,
  getBookingLeads,
  getPaymentLogs,
  getLeadBillingInformation,
  reassignSiteSupervisor,
  updateMrpValue,
  updateBasicAmount,
  updateGstPercentage,
  updatePaymentLogAmount,
  updateTotalProjectAmount,
  updateBookingAmount,
  upsertLeadBillingInformation,
  moveToBookingStage,
  PaymentLogsResponse,
  UploadBookingDoc,
  UploadBookintPayload,
  UpsertLeadBillingInformationPayload,
  getUnderInstallationLeadsWithMiscellaneous,
  UniversalTablePayload,
} from "@/api/booking";
import { BookingLeadResponse } from "@/types/booking-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";
import { addAdditionalPayment, AddPaymentPayload } from "@/api/booking";
import { UniversalStageLeadResponse } from "@/api/universalstage";
export const useMoveToBookingStage = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  return useMutation({
    mutationFn: (payload: BookingPayload) => moveToBookingStage(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, userId],
        exact: true,
      });
      console.log("Lead moved to Booking Stage:", data);
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message, type: "error" });
      console.log("Error moving lead to Booking Stage:", error);
    },
  });
};

export const useSiteSupervisors = (vendorId: number) => {
  return useQuery({
    queryKey: ["site-supervisors", vendorId], // ✅ unique cache per vendor
    queryFn: () => getAllSiteSuperVisors(vendorId),
    enabled: !!vendorId, // ✅ only run when vendorId exists
    staleTime: 5 * 60 * 1000, // cache data for 5 minutes
  });
};

export const useHeadSiteSupervisors = (vendorId: number) => {
  return useQuery({
    queryKey: ["head-site-supervisors", vendorId],
    queryFn: () => getAllHeadSiteSupervisors(vendorId),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useBookingLeads = (vendorId: number, userId: number) => {
  return useQuery<BookingLeadResponse>({
    queryKey: ["bookingLeads", vendorId, userId],
    queryFn: () => getBookingLeads(vendorId, userId),
    enabled: !!vendorId && !!userId, // ✅ only fetch if both are available
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
};

export const useEditBooking = () => {
  return useMutation({
    mutationFn: (payload: EditBookingPayload) => EditBookingForm(payload),
  });
};

export const useBookingLeadById = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["bookingLead", vendorId, leadId],
    queryFn: () => getBookingLeadById(vendorId!, leadId!), // fetch function
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadBookingDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadBookintPayload) => UploadBookingDoc(payload),
    onSuccess: (_data, variables) => {
      // Invalidate booking lead so UI refreshes
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.lead_id],
      });
    },
  });
};

export const useISMPaymentInfo = (leadId?: number) => {
  return useQuery({
    queryKey: ["ismPaymentInfo", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data } = await apiClient.get(`/leads/initial-site-measurement/leadId/${leadId}/payment-info`);
      return data.data; // API wraps inside { success, data }
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const usePaymentLogs = (leadId: number, vendorId: number) => {
  return useQuery<PaymentLogsResponse>({
    queryKey: ["paymentLogs", leadId, vendorId],
    queryFn: () => getPaymentLogs(leadId, vendorId),
    enabled: !!leadId && !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddPaymentPayload) => addAdditionalPayment(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["paymentLogs", variables.lead_id, variables.vendor_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.vendor_id, variables.lead_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendor_id],
      });
    },
  });
};

export const useReassignSiteSupervisor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      siteSupervisorId,
      createdBy,
    }: {
      vendorId: number;
      leadId: number;
      siteSupervisorId: number;
      createdBy: number;
    }) =>
      reassignSiteSupervisor(vendorId, leadId, {
        siteSupervisorId,
        created_by: createdBy,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.vendorId, variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentLogs", variables.leadId, variables.vendorId],
      });
    },
  });
};

export const useUpdateMrpValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      mrpValue,
      updatedBy,
    }: {
      vendorId: number;
      leadId: number;
      mrpValue: number;
      updatedBy: number;
    }) => updateMrpValue(vendorId, leadId, { mrp_value: mrpValue, updated_by: updatedBy }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
    },
  });
};

export const useUpdateTotalProjectAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      totalProjectAmount,
      updatedBy,
    }: {
      vendorId: number;
      leadId: number;
      totalProjectAmount: number;
      updatedBy: number;
    }) =>
      updateTotalProjectAmount(vendorId, leadId, {
        total_project_amount: totalProjectAmount,
        updated_by: updatedBy,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
    },
  });
};

export const useUpdateBookingAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      bookingAmount,
      updatedBy,
      productTypeId,
    }: {
      vendorId: number;
      leadId: number;
      bookingAmount: number;
      updatedBy: number;
      productTypeId?: number;
    }) =>
      updateBookingAmount(vendorId, leadId, {
        booking_amount: bookingAmount,
        updated_by: updatedBy,
        product_type_id: productTypeId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentLogs", variables.leadId, variables.vendorId],
      });
    },
  });
};

export const useUpdateBasicAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      basicAmount,
      updatedBy,
      productTypeId,
    }: {
      vendorId: number;
      leadId: number;
      basicAmount: number;
      updatedBy: number;
      productTypeId: number;
    }) =>
      updateBasicAmount(vendorId, leadId, {
        basic_amount: basicAmount,
        updated_by: updatedBy,
        product_type_id: productTypeId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.vendorId, variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentLogs", variables.leadId, variables.vendorId],
      });
    },
  });
};

export const useUpdateGstPercentage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      gstPercentage,
      updatedBy,
      productTypeId,
    }: {
      vendorId: number;
      leadId: number;
      gstPercentage: number;
      updatedBy: number;
      productTypeId: number;
    }) =>
      updateGstPercentage(vendorId, leadId, {
        gst_percentage: gstPercentage,
        updated_by: updatedBy,
        product_type_id: productTypeId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.vendorId, variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentLogs", variables.leadId, variables.vendorId],
      });
    },
  });
};

export const useUpdatePaymentLogAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      paymentId,
      amount,
      updatedBy,
      productTypeId,
    }: {
      vendorId: number;
      leadId: number;
      paymentId: number;
      amount: number;
      updatedBy: number;
      productTypeId: number;
    }) =>
      updatePaymentLogAmount(vendorId, leadId, paymentId, {
        amount,
        updated_by: updatedBy,
        product_type_id: productTypeId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookingLead", variables.vendorId, variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentLogs", variables.leadId, variables.vendorId],
      });
    },
  });
};

export const useUnderInstallationLeadsWithMiscellaneous = (
  vendorId: number,
  payload: UniversalTablePayload
) => {
  return useQuery<UniversalStageLeadResponse>({
    queryKey: ["under-installation-misc-leads", vendorId, payload],
    queryFn: () => getUnderInstallationLeadsWithMiscellaneous(vendorId, payload),
    enabled: !!vendorId && !!payload?.userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLeadBillingInformation = (
  vendorId?: number,
  leadId?: number,
  productTypeId?: number | null,
) => {
  return useQuery({
    queryKey: ["leadBillingInformation", vendorId, leadId, productTypeId ?? null],
    queryFn: () => getLeadBillingInformation(vendorId!, leadId!, productTypeId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useUpsertLeadBillingInformation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: UpsertLeadBillingInformationPayload;
    }) => upsertLeadBillingInformation(vendorId, leadId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leadBillingInformation", variables.vendorId, variables.leadId],
      });
    },
  });
};
