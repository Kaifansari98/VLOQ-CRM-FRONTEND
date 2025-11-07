"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import PreProductionDetails from "./PreProductionDetails";
import PostProductionDetails from "./PostProductionDetails";
import { useCheckPostProductionReady } from "@/api/production/production-api";
import { useAppSelector } from "@/redux/store";
import React, { useEffect, useState } from "react";

interface LeadDetailsProductionUtilProps {
  leadId?: number;
  accountId?: number;
}

export default function LeadDetailsProductionUtil({
  leadId,
  accountId,
}: LeadDetailsProductionUtilProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);

  const { data } = useCheckPostProductionReady(vendorId, leadId);

  const readyForPostProduction = data?.readyForPostProduction ?? false;

  const allTabs = [
    {
      id: "preProduction",
      title: "Pre Production",
      color: "bg-blue-500 hover:bg-blue-700",
      cardContent: (
        <PreProductionDetails leadId={leadId} accountId={accountId} />
      ),
    },
    {
      id: "postProduction",
      title: "Post Production",
      color: "bg-green-500 hover:bg-green-700",
      disabled: !readyForPostProduction,
      disabledReason:
        "You can access Post Production only after completing Pre-Production.",
      cardContent: (
        <PostProductionDetails leadId={leadId} accountId={accountId} />
      ),
    },
  ];

  return (
    <div className="h-full">
      <SmoothTab items={allTabs} defaultTabId="preProduction" />
    </div>
  );
}
