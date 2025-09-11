import {
  BookingPayload,
  getAllSiteSuperVisors,
  moveToBookingStage,
} from "@/api/booking";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useMoveToBookingStage = () => {
  return useMutation({
    mutationFn: (payload: BookingPayload) => moveToBookingStage(payload),
    onSuccess: (data) => {
      toast.success("Lead moved to Booking Stage successfully");
      console.log("Lead moved to Booking Stage:", data);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
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
