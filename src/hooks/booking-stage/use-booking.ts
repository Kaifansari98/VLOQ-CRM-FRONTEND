import {
  BookingPayload,
  EditBookingForm,
  EditBookingPayload,
  getAllSiteSuperVisors,
  getBookingLeadById,
  getBookingLeads,
  moveToBookingStage,
  UploadBookingDoc,
  UploadBookintPayload,
} from "@/api/booking";
import { BookingLeadResponse } from "@/types/booking-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";


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