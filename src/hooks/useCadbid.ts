"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCadbidStatus,
  verifyCadbidToken,
  connectCadbid,
  disconnectCadbid,
  getStudioSsoUrl,
  createCadbidCustomerFromLead,
  CadbidStatusData,
  VerifyTokenData,
} from "@/api/cadbid";
import { toastManager } from "@/components/ui/toast";

export const CADBID_STATUS_QUERY_KEY = ["cadbid-status"] as const;

export const useCadbidStatus = () => {
  return useQuery<CadbidStatusData>({
    queryKey: CADBID_STATUS_QUERY_KEY,
    queryFn: getCadbidStatus,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useVerifyCadbid = () => {
  return useMutation<VerifyTokenData, Error, string>({
    mutationFn: (token: string) => verifyCadbidToken(token),
  });
};

export const useConnectCadbid = () => {
  const queryClient = useQueryClient();
  return useMutation<CadbidStatusData, Error, string>({
    mutationFn: (token: string) => connectCadbid(token),
    onSuccess: (data) => {
      queryClient.setQueryData(CADBID_STATUS_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: CADBID_STATUS_QUERY_KEY });
      toast.success("Cadbid account connected successfully!");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to connect Cadbid account";
      toast.error(msg);
    },
  });
};

export const useDisconnectCadbid = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: disconnectCadbid,
    onSuccess: () => {
      queryClient.setQueryData(CADBID_STATUS_QUERY_KEY, {
        connected: false,
        studioAccess: false,
        cadbidUser: null,
      });
      queryClient.invalidateQueries({ queryKey: CADBID_STATUS_QUERY_KEY });
      toast.success("Cadbid account disconnected.");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to disconnect Cadbid account";
      toast.error(msg);
    },
  });
};

export const useLaunchStudio = () => {
  const [isLaunching, setIsLaunching] = useState(false);

  const launchStudio = async () => {
    setIsLaunching(true);
    try {
      const url = await getStudioSsoUrl();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to launch Studio. Please check your connection and Studio access.";
      toast.error(msg);
    } finally {
      setIsLaunching(false);
    }
  };

  return { launchStudio, isLaunching };
};

// Fire-and-forget after a lead moves to Designing; silent when Cadbid isn't linked
export const createCadbidCustomerWithToast = (leadId: number) => {
  createCadbidCustomerFromLead(leadId).then((result) => {
    if (result.skipped) return;
    toastManager.add({
      title: result.success
        ? "Project created in Cadbid"
        : "Project not created in Cadbid",
      description: result.message,
      type: result.success ? "success" : "error",
    });
  });
};
