"use client";

import {
  FinalMeasurementPayload,
  getAllFinalMeasurementLeads,
  uploadClientDocPayload,
  UploadClientDocumantation,
  UploadFinalMeasurement,
} from "@/api/final-measurement";
import { FinalMeasurementLeadsResponse } from "@/types/final-measurement";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useFinalMeasurement = () => {
  return useMutation({
    mutationFn: (payload: FinalMeasurementPayload) =>
      UploadFinalMeasurement(payload),
  });
};

export const useFinalMeasurementLeads = (vendorId: number, userId: number) => {
  return useQuery<FinalMeasurementLeadsResponse>({
    queryKey: ["finalMeasurementLeads", vendorId, userId],
    queryFn: () => getAllFinalMeasurementLeads(vendorId, userId),
    enabled: !!vendorId && !!userId, // fetch only when IDs are available
    staleTime: 1000 * 60 * 5, // cache for 5 mins
  });
};

export const useUploadClientDocumentation = () => {
  return useMutation({
    mutationFn: (payload: uploadClientDocPayload) =>
      UploadClientDocumantation(payload),
  });
};
