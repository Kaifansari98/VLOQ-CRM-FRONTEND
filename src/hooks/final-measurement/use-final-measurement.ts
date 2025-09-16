"use client";

import {
  addFinalMeasurmentDoc,
  addFinalMeasurmentDocPayload,
  FinalMeasurementPayload,
  getAllFinalMeasurementLeads,
  getFinalMeasurmentLeadById,
  UpdateNotes,
  uploadClientDocPayload,
  UploadClientDocumantation,
  UploadFinalMeasurement,
} from "@/api/final-measurement";
import { FinalMeasurementLeadDetails, FinalMeasurementLeadsResponse } from "@/types/final-measurement";
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

export const useFinalMeasurementLeadById = (
  vendorId: number,
  leadId: number
) => {
  return useQuery<FinalMeasurementLeadDetails>({
    queryKey: ["finalMeasurementLead", vendorId, leadId],
    queryFn: () => getFinalMeasurmentLeadById(vendorId, leadId),
    enabled: !!vendorId && !!leadId, 
  });
};

export const useUpdateNotes = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      notes,
    }: {
      vendorId: number;
      leadId: number;
      notes: string;
    }) => UpdateNotes(vendorId, leadId, notes),
  });
};

export const useAddFinalMeasurementDoc = () => {
  return useMutation({
    mutationFn: (payload: addFinalMeasurmentDocPayload) =>
      addFinalMeasurmentDoc(payload),
  });
};
