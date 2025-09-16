import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import { ClientDocumentationResponse } from "@/types/client-documentation";
import { getClientDocumentationLeads } from "@/api/client-documentation";

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
