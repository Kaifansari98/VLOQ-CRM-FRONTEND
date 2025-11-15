"use client";

import React from "react";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import UnderInstallationDetails from "./UnderInstallationDetails";
import { useUnderInstallationDetails } from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";
import InstallationMiscellaneous from "./InstallationMiscellaneous";

export default function UnderInstallationTabsWrapper({
  leadId,
  accountId,
  name,
}: {
  leadId: number;
  accountId?: number;
  name?: string;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const account_id = accountId || 0;

  // 🔹 Fetch installation details (to check start date)
  const { data: underDetails } = useUnderInstallationDetails(vendorId, leadId);

  const installationStarted = !!underDetails?.actual_installation_start_date;

  const tabs = [
    {
      id: "underInstallation",
      title: "Under Installation",
      color: "bg-blue-500 hover:bg-blue-600",
      disabled: !installationStarted, // always accessible
      disabledReason: installationStarted
        ? ""
        : "Start installation to access this section",
      cardContent: (
        <UnderInstallationDetails
          leadId={leadId}
          accountId={accountId}
          name={name}
        />
      ),
    },

    {
        id: "misc",
        title: "Miscellaneous",
        color: "bg-gray-400",
        disabled: !installationStarted,
        disabledReason: "Start installation to access this section",
        cardContent: (
          <InstallationMiscellaneous
            vendorId={vendorId}
            leadId={leadId}
            accountId={account_id}
          />
        ),
      },

    {
      id: "issueLog",
      title: "Issue Log",
      color: "bg-gray-400",
      disabled: !installationStarted, // 🚫 disabled until installation starts
      disabledReason: installationStarted
        ? "Still yet to come ✨"
        : "Start installation to access this section",
      cardContent: (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Issue Log section is coming soon...
        </div>
      ),
    },

    {
      id: "handover",
      title: "Usable Handover",
      color: "bg-gray-400",
      disabled: !installationStarted, // 🚫 disabled until installation starts
      disabledReason: installationStarted
        ? "Still yet to come ✨"
        : "Start installation to access this section",
      cardContent: (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Usable Handover section is coming soon...
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full">
      <SmoothTab
        items={tabs}
        defaultTabId="underInstallation"
        activeColor="bg-blue-500"
        contentHeightClass="h-[130vh]"
      />
    </div>
  );
}
