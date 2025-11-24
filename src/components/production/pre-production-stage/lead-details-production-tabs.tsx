"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import PreProductionDetails from "./PreProductionDetails";
import PostProductionDetails from "./PostProductionDetails";
import { useCheckPostProductionReady } from "@/api/production/production-api";
import { useAppSelector } from "@/redux/store";
import React, { useEffect, useState } from "react";
import { canViewDefaultSubTabProductionStage } from "@/components/utils/privileges";

interface LeadDetailsProductionUtilProps {
  leadId: number;
  accountId?: number;
}

export default function LeadDetailsProductionUtil({
  leadId,
  accountId,
}: LeadDetailsProductionUtilProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const { data } = useCheckPostProductionReady(vendorId, leadId);

  const readyForPostProduction = data?.readyForPostProduction ?? false;

  const defaultTab = canViewDefaultSubTabProductionStage(userType);

  const allTabs = [
    {
      id: "preProduction",
      title: "Under Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !defaultTab,
      disabledReason: readyForPostProduction
        ? "You do not have permission to view this record."
        : "This lead is work on under production",

      cardContent: (
        <PreProductionDetails leadId={leadId} accountId={accountId} />
      ),
    },
    {
      id: "postProduction",
      title: "Post Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !readyForPostProduction,
      disabledReason:
        "You can access Post Production only after completing Under-Production.",
      cardContent: (
        <PostProductionDetails leadId={leadId} accountId={accountId} />
      ),
    },
  ];

  return (
    <div className="h-full">
      <SmoothTab
        items={allTabs}
        defaultTabId={defaultTab ? "preProduction" : "postProduction"}
      />
    </div>
  );
}
