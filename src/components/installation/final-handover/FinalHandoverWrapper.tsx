"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import { ClipboardCheck, FileText, AlertCircle } from "lucide-react";
import FinalHandover from "./FinalHandoverDetails";
import PendingWorkTab from "./PendingWorkTab";
import SmallOrderRequestsTable from "../small-order/SmallOrderRequestsTable";
import { useAppSelector } from "@/redux/store";
import { useSmallOrderRequestsByLead } from "@/hooks/useLeadsQueries";
import InstallationMiscellaneous from "../under-installation/InstallationMiscellaneous";
import { useMiscellaneousResolutionStatus } from "@/api/installation/useUnderInstallationStageLeads";

export default function FinalHandoverWrapper({
  leadId,
  accountId,
}: {
  leadId: number;
  accountId: number;
  instanceId?: number | null;
}) {
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const customPrivilegeCodes = useAppSelector(
    (s) => s.customPrivileges.codes,
  );
  const { data: smallOrderRequestsData } = useSmallOrderRequestsByLead(
    vendorId,
    leadId,
  );
  const hasFinalHandoverSmallOrderRequests =
    (smallOrderRequestsData?.data ?? []).some(
      (request) => request.request_source === "final_handover",
    );

  const { data: miscStatus } = useMiscellaneousResolutionStatus(
    vendorId,
    leadId,
  );
  const hasPendingMisc = miscStatus?.all_resolved === false;

  const canViewPendingWorkTab =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "installation.final_handover.pending_work.enable_disable_action",
        )
      : true;

  const TAB_ITEMS = [
    {
      id: "finalHandover",
      title: (
        <div className="flex items-center gap-1">
          <ClipboardCheck className="w-3 h-3" />
          Final Handover
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <div  className="p-2 bg-[#fff] dark:bg-[#0a0a0a]">
          <div>
            <FinalHandover leadId={leadId} accountId={accountId} />
          </div>
        </div>
      ),
    },
    {
      id: "pendingWork",
      title: (
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Pending Work
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <div>
          <PendingWorkTab leadId={leadId} accountId={accountId} />
        </div>
      ),
    },
    {
      id: "smallOrderRequest",
      title: (
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Small Order Request
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <div>
          <SmallOrderRequestsTable
            vendorId={vendorId}
            leadId={leadId}
            requestSource="final_handover"
          />
        </div>
      ),
    },
    {
      id: "miscellaneousWork",
      title: (
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Miscellaneous Work
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <div>
          <InstallationMiscellaneous
            vendorId={vendorId}
            leadId={leadId}
            accountId={accountId}
            hideAddButton={true}
          />
        </div>
      ),
    },
  ].filter((tab) => {
    if (tab.id === "pendingWork") return canViewPendingWorkTab;
    if (tab.id === "smallOrderRequest")
      return hasFinalHandoverSmallOrderRequests;
    if (tab.id === "miscellaneousWork") return hasPendingMisc;
    return true;
  });

  return (
    <SmoothTab
      items={TAB_ITEMS}
      defaultTabId="finalHandover"
      className="w-fit"
    />
  );
}
