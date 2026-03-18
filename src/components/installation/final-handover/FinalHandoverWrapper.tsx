"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import { ClipboardCheck, FileText } from "lucide-react";
import FinalHandover from "./FinalHandoverDetails";
import PendingWorkTab from "./PendingWorkTab";

export default function FinalHandoverWrapper({
  leadId,
  accountId,
}: {
  leadId: number;
  accountId: number;
}) {
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
  ];

  return (
    <SmoothTab
      items={TAB_ITEMS}
      defaultTabId="finalHandover"
      className="w-fit"
    />
  );
}
