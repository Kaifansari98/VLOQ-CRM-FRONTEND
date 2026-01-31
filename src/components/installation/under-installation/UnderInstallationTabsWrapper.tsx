"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import UnderInstallationDetails from "./UnderInstallationDetails";
import InstallationMiscellaneous from "./InstallationMiscellaneous";
import InstallationIssueLog from "./InstallationIssueLog";
import UsableHandover from "./UsableHandoverDetails";

import { useUnderInstallationDetails } from "@/api/installation/useUnderInstallationStageLeads";
import { useUsableHandoverReady } from "@/api/installation/useUnderInstallationStageLeads";

import { useAppSelector } from "@/redux/store";

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
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("taskId");
  const taskId =
    taskIdParam && !Number.isNaN(Number(taskIdParam))
      ? Number(taskIdParam)
      : undefined;

  // 🔹 Fetch installation details
  const { data: underDetails } = useUnderInstallationDetails(vendorId, leadId);
  const installationStarted = !!underDetails?.actual_installation_start_date;

  // 🔥 Fetch usable handover readiness
  const { data: readyData } = useUsableHandoverReady(vendorId, leadId);

  const usableReady = readyData?.isReady ?? false;

  // 🔥 Build tooltip message dynamically
  const usableHandoverTooltip = usableReady
    ? ""
    : readyData
      ? `Not ready yet :\n${readyData.pending.join(", ")} are required`
      : "Loading status...";

  const tabs = [
    {
      id: "underInstallation",
      title: "Under Installation",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !installationStarted,
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
      color: "bg-zinc-900",
      disabled: !installationStarted,
      disabledReason: "Start installation to access this section",
      cardContent: (
        <InstallationMiscellaneous
          vendorId={vendorId}
          leadId={leadId}
          accountId={account_id}
          initialTaskId={taskId}
        />
      ),
    },

    {
      id: "issueLog",
      title: "Issue Log",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !installationStarted,
      disabledReason: installationStarted
        ? ""
        : "Start installation to access this section",
      cardContent: (
        <InstallationIssueLog
          vendorId={vendorId}
          leadId={leadId}
          accountId={account_id}
        />
      ),
    },

    {
      id: "handover",
      title: "Usable Handover",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !usableReady,
      disabledReason: usableHandoverTooltip,
      cardContent: (
        <UsableHandover
          vendorId={vendorId}
          leadId={leadId}
          accountId={account_id}
        />
      ),
    },
  ];

  const preferredTabId = searchParams.get("tab");
  const resolvedDefaultTabId =
    preferredTabId &&
    tabs.some((tab) => !tab.disabled && tab.id === preferredTabId)
      ? preferredTabId
      : "underInstallation";

  return (
    <div className="w-full h-full bg-[#fff] dark:bg-[#0a0a0a]">
      <SmoothTab
        key={resolvedDefaultTabId}
        items={tabs}
        defaultTabId={resolvedDefaultTabId}
        activeColor="bg-blue-500"
      />
    </div>
  );
}
