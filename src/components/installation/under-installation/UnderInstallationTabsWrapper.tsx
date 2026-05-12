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
  instanceId?: number | null;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const customPrivilegeCodes = useAppSelector(
    (s) => s.customPrivileges.codes,
  );
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

  // 🔥 derive pending properly
 // 🔥 Always derive from flags — backend pending array pe trust mat karo
  const derivedPending = React.useMemo(() => {
    if (!readyData) return [];

    const p: string[] = [];

    if (!readyData.details?.carcassCompleted) {
      p.push("Carcass Installation");
    }

    if (!readyData.details?.shutterCompleted) {
      p.push("Shutter Installation");
    }

    if (!readyData.details?.expectedEndDateFilled) {
      p.push("Expected Installation End Date");
    }

    if (!readyData.details?.installersAssigned) {
      p.push("Installer Assignment");
    }

    return p;
  }, [readyData]);


  console.log(readyData)
  // 🔥 Final Tooltip — always string return karo
  const usableHandoverTooltip = React.useMemo(() => {
    if (!readyData) return "Checking readiness...";
    if (readyData.isReady) return "";
    if (!derivedPending.length) return "Not ready yet.";

    const list = derivedPending
      .map((item: any) => ` ${item}`)
      .join(", ");
    return `Complete to unlock: ${list}`;
  }, [readyData, derivedPending]);

  const canViewMiscellaneousTab =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "installation.under_installation.miscellaneous_section.enable_disable_action",
        )
      : true;
  const canViewIssueLogTab =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "installation.under_installation.issue_log.enable_disable_action",
        )
      : true;
  const canViewUsableHandoverTab =
    userType === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith("installation.under_installation.usable_handover."),
        )
      : true;

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
  ].filter((tab) => {
    if (tab.id === "misc") return canViewMiscellaneousTab;
    if (tab.id === "issueLog") return canViewIssueLogTab;
    if (tab.id === "handover") return canViewUsableHandoverTab;
    return true;
  });

  const preferredTabId = searchParams.get("tab");
  const resolvedDefaultTabId =
    preferredTabId &&
    tabs.some((tab) => !tab.disabled && tab.id === preferredTabId)
      ? preferredTabId
      : "underInstallation";

  return (
    <div className="w-full h-full bg-white dark:bg-[#0a0a0a]">
      <SmoothTab
        key={resolvedDefaultTabId}
        items={tabs}
        defaultTabId={resolvedDefaultTabId}
        activeColor="bg-blue-500"
      />
    </div>
  );
}
