// src/hooks/useUploadCSPBooking.ts
import { useMutation } from "@tanstack/react-query";
import {
  uploadCSPBooking,
  UploadCSPBookingPayload,
} from "@/api/final-measurement";

export const useUploadCSPBooking = () => {
  return useMutation({
    mutationFn: (payload: UploadCSPBookingPayload) =>
      uploadCSPBooking(payload),
  });
};
