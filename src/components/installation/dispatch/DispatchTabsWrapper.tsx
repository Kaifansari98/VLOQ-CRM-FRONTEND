"use client";

import React from "react";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Truck, ClipboardCheck } from "lucide-react";
import DispatchStageDetails from "./DispatchStageDetails";
import { useCheckReadyForPostDispatch } from "@/api/installation/useDispatchStageLeads";
import { useAppSelector } from "@/redux/store";
import PostDispatchStage from "./PostDispatchStage";

interface DispatchTabsWrapperProps {
  leadId: number;
  accountId: number;
  name?: string;
}

const DispatchTabsWrapper: React.FC<DispatchTabsWrapperProps> = ({
  leadId,
  accountId,
  name,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;

  // ✅ Fetch readiness info from API
  const { data: readinessData, isLoading } = useCheckReadyForPostDispatch(
    vendorId,
    leadId
  );

  const isReady = readinessData?.readyForPostDispatch || false;
  const disabledReason =
    readinessData?.message ||
    "Missing required fields to proceed to Post Dispatch.";

  // ✅ Setup tabs
  const tabItems = [
    {
      id: "dispatch",
      title: (
        <div className="flex items-center gap-1">
          <Truck className="h-3.5 w-3.5" /> Dispatch
        </div>
      ),
      color: "bg-blue-500 hover:bg-blue-600",
      cardContent: (
        <DispatchStageDetails
          leadId={leadId}
          accountId={accountId}
          name={name}
        />
      ),
    },
    {
      id: "post-dispatch",
      title: (
        <div className="flex items-center gap-1">
          <ClipboardCheck className="h-3.5 w-3.5" /> Post Dispatch
        </div>
      ),
      color: "bg-emerald-500 hover:bg-emerald-600",
      cardContent: (
        <PostDispatchStage leadId={leadId} accountId={accountId} />
      ),
      disabled: !isReady && !isLoading,
      disabledReason: !isReady ? disabledReason : undefined,
    },
  ];

  return (
    <SmoothTab
      items={tabItems}
      defaultTabId="dispatch"
      activeColor="bg-primary"
    />
  );
};

export default DispatchTabsWrapper;
