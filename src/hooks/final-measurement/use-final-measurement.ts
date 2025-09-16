"use client";

import {
  FinalMeasurementPayload,
  UploadFinalMeasurement,
} from "@/api/final-measurement";
import { useMutation } from "@tanstack/react-query";

export const useFinalMeasurement = () => {
  return useMutation({
    mutationFn: (payload: FinalMeasurementPayload) =>
      UploadFinalMeasurement(payload),
  });
};
