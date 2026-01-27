import {
  BookingPayload,
  EditBookingForm,
  EditBookingPayload,
  getAllSiteSuperVisors,
  getBookingLeadById,
  getBookingLeads,
  getPaymentLogs,
  reassignSiteSupervisor,
  updateMrpValue,
  updateTotalProjectAmount,
  updateBookingAmount,
  moveToBookingStage,
  PaymentLogsResponse,
  UploadBookingDoc,
  UploadBookintPayload,
  getUnderInstallationLeadsWithMiscellaneous,
  UniversalTablePayload,
} from "@/api/booking";
import { BookingLeadResponse } from "@/types/booking-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
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
      toast.error(error?.response?.data?.message);
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
    queryKey: ["bookingLead", leadId], // cache key
    queryFn: () => getBookingLeadById(vendorId!, leadId!), // fetch function
    enabled: !!leadId, // only run when leadId exists
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
  return useMutation({
    mutationFn: (payload: AddPaymentPayload) => addAdditionalPayment(payload),
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
        queryKey: ["bookingLead", variables.leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookingLeads", variables.vendorId],
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
    }: {
      vendorId: number;
      leadId: number;
      bookingAmount: number;
      updatedBy: number;
    }) =>
      updateBookingAmount(vendorId, leadId, {
        booking_amount: bookingAmount,
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
