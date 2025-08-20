// src/hooks/useTypesMaster.ts
import { useQuery } from "@tanstack/react-query"
import {
  fetchSourceTypes,
  fetchProductStructureTypes,
  fetchSiteTypes,
  fetchProductTypes,
} from "@/api/typesMasterApi"
import { useAppSelector } from "@/redux/store" // assuming you have typed hooks

export const useSourceTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: ["sourceTypes", vendorId],
    queryFn: () => fetchSourceTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useProductStructureTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productStructureTypes", vendorId],
    queryFn: () => fetchProductStructureTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useSiteTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["siteTypes", vendorId],
    queryFn: () => fetchSiteTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useProductTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productTypes", vendorId],
    queryFn: () => fetchProductTypes(vendorId!),
    enabled: !!vendorId,
  })
}