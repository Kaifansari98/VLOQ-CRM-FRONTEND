"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import PreProductionDetails from "./PreProductionDetails";
import PostProductionDetails from "./PostProductionDetails";
import { useCheckPostProductionReady } from "@/api/production/production-api";
import { useAppSelector } from "@/redux/store";
import React from "react";
import { canViewDefaultSubTabProductionStage } from "@/components/utils/privileges";
import ProductionFilesSection from "../order-login-stage/ProductionFilesModal";

interface LeadDetailsProductionUtilProps {
  leadId: number;
  accountId?: number;
  instanceId?: number | null;
}

export default function LeadDetailsProductionUtil({
  leadId,
  accountId,
  instanceId,
}: LeadDetailsProductionUtilProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const { data } = useCheckPostProductionReady(
    vendorId,
    leadId,
    instanceId ?? undefined
  );

  const readyForPostProduction = data?.readyForPostProduction ?? false;

  const defaultTab = canViewDefaultSubTabProductionStage(userType);

  const allTabs = [
    {
      id: "productionFiles",
      title: "Production Files",
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <ProductionFilesSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={instanceId}
          readOnly
        />
      ),
    },
    {
      id: "preProduction",
      title: "Under Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !defaultTab,
      disabledReason: readyForPostProduction
        ? "You do not have permission to view this record."
        : "This lead is work on under production",

      cardContent: (
        <PreProductionDetails
          leadId={leadId}
          accountId={accountId}
          instanceId={instanceId}
        />
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
