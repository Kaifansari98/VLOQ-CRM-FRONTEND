"use client";

import {
  addFinalMeasurmentDoc,
  addFinalMeasurmentDocPayload,
  addMoreFinalMeasurementFiles,
  AddMoreFinalMeasurementFilesPayload,
  addMoreFinalMeasurementSitePhotos,
  AddMoreFinalMeasurementSitePhotosPayload,
  FinalMeasurementPayload,
  getAllFinalMeasurementLeads,
  getFinalMeasurmentLeadById,
  RescheduleFinalMeasurementPayload,
  rescheduleFinalMeasurementTask,
  UpdateNotes,
  uploadClientDocPayload,
  UploadClientDocumantation,
  UploadFinalMeasurement,
  skipFinalMeasurementStage,
  SkipFinalMeasurementPayload,
} from "@/api/final-measurement";
import {
  FinalMeasurementLeadDetails,
  FinalMeasurementLeadsResponse,
} from "@/types/final-measurement";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useFinalMeasurement = () => {
  return useMutation({
    mutationFn: (payload: FinalMeasurementPayload) =>
      UploadFinalMeasurement(payload),
  });
};

export const useRescheduleFinalMeasurementTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: RescheduleFinalMeasurementPayload;
    }) => rescheduleFinalMeasurementTask(leadId, taskId, payload),
  });
};

export const useFinalMeasurementLeads = (vendorId: number, userId: number) => {
  return useQuery<FinalMeasurementLeadsResponse>({
    queryKey: ["finalMeasurementLeads", vendorId, userId],
    queryFn: () => getAllFinalMeasurementLeads(vendorId, userId),
    enabled: !!vendorId && !!userId, // ✅ only fetch when both exist
    staleTime: 1000 * 60 * 5, // 5 min cache
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

export const useAddMoreFinalMeasurementFiles = () => {
  return useMutation({
    mutationFn: (payload: AddMoreFinalMeasurementFilesPayload) =>
      addMoreFinalMeasurementFiles(payload),
  });
};

export const useAddMoreFinalMeasurementSitePhotos = () => {
  return useMutation({
    mutationFn: (payload: AddMoreFinalMeasurementSitePhotosPayload) =>
      addMoreFinalMeasurementSitePhotos(payload),
  });
};

export const useSkipFinalMeasurement = () => {
  return useMutation({
    mutationFn: (payload: SkipFinalMeasurementPayload) =>
      skipFinalMeasurementStage(payload),
  });
};
