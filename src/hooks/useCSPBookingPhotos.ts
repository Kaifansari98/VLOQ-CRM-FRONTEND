import { useQuery } from "@tanstack/react-query";
import { getCSPBookingPhotos } from "@/api/final-measurement";

export const useCSPBookingPhotos = (
  vendorId: number,
  leadId: number
) => {
  return useQuery({
    queryKey: ["csp-booking-photos", vendorId, leadId],
    queryFn: () => getCSPBookingPhotos(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};
