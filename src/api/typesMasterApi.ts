import { apiClient } from "@/lib/apiClient"

export const fetchSourceTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-source-types/${vendorId}`)
  return res.data
}

export const fetchProductStructureTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-productStructure-types/${vendorId}`)
  return res.data
}

export const fetchSiteTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-site-types/${vendorId}`)
  return res.data
}

export const fetchProductTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-product-types/${vendorId}`)
  return res.data
}