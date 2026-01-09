"use client";

import { LeadStageItem } from "@/api/dashboard/dashboard.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useAppSelector } from "@/redux/store";
import {
  useGetAdminDashboardAllLeads,
  useGetDashboardAllLeads,
} from "@/api/dashboard/useDashboard";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalLeadSearchModal({ open, onOpenChange }: Props) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector(
    (s) => s.auth.user?.user_type.user_type
  );

  const isAdminUser =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin";
  const { data: adminStageData } = useGetAdminDashboardAllLeads(
    isAdminUser ? vendorId : 0
  );
  const { data: salesStageData } = useGetDashboardAllLeads(
    vendorId,
    isAdminUser ? 0 : userId
  );
  const stageData = isAdminUser ? adminStageData : salesStageData;
  const router = useRouter();

  // -----------------------------------------------
  // 1️⃣ FULL ROUTE MAP (covers all 17+ stages)
  // -----------------------------------------------
  const STAGE_PATH_MAP: Record<string, string> = {
    openStage: "/dashboard/leads/leadstable/details",
    initialSiteMeasurementStage:
      "/dashboard/leads/initial-site-measurement/details",
    designingStage: "/dashboard/leads/designing-stage/details",
    bookingStage: "/dashboard/leads/booking-stage/details",

    clientDocumentationStage: "/dashboard/project/client-documentation/details",
    clientApprovalStage: "/dashboard/project/client-approval/details",
    finalSiteMeasurementStage: "/dashboard/project/final-measurement/details",

    techCheckStage: "/dashboard/production/tech-check/details",
    orderLoginStage: "/dashboard/production/order-login/details",
    productionStage: "/dashboard/production/pre-post-prod/details",
    readyToDispatchStage: "/dashboard/production/ready-to-dispatch/details",

    dispatchPlanningStage: "/dashboard/installation/dispatch-planning/details",
    dispatchStage: "/dashboard/installation/dispatch-stage/details",
    siteReadinessStage: "/dashboard/installation/site-readiness/details",
    underInstallationStage:
      "/dashboard/installation/under-installation/details",
    finalHandoverStage: "/dashboard/installation/final-handover/details",

    projectCompletedStage: "", // no details page
  };

  // -----------------------------------------------
  // 2️⃣ Stage labels
  // -----------------------------------------------
  const stageLabels: Record<string, string> = {
    openStage: "Open",
    bookingStage: "Booking",
    designingStage: "Designing",
    initialSiteMeasurementStage: "Initial Site Measurement",
    finalSiteMeasurementStage: "Final Site Measurement",

    clientDocumentationStage: "Client Documentation",
    clientApprovalStage: "Client Approval",

    techCheckStage: "Tech Check",
    orderLoginStage: "Order Login",
    productionStage: "Production",
    readyToDispatchStage: "Ready to Dispatch",

    dispatchPlanningStage: "Dispatch Planning",
    dispatchStage: "Dispatch",
    siteReadinessStage: "Site Readiness",
    underInstallationStage: "Under Installation",
    finalHandoverStage: "Final Handover",

    projectCompletedStage: "Project Completed",
  };

  // -----------------------------------------------
  // 3️⃣ Convert API object → [key, leads[]]
  // -----------------------------------------------
  const stages = stageData ? Object.entries(stageData) : [];

  // -----------------------------------------------
  // 4️⃣ Helper - Avatar Initials
  // -----------------------------------------------



  // -----------------------------------------------
  // 5️⃣ Handle Lead Click → Navigate to details
  // -----------------------------------------------
  const handleLeadClick = (stageKey: string, lead: LeadStageItem) => {
    const basePath = STAGE_PATH_MAP[stageKey];

    if (!basePath) {
      console.warn("❌ No route mapped for stage:", stageKey);
      return;
    }

    router.push(`${basePath}/${lead.id}?accountId=${lead.account_id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0">
        <Command className="rounded-lg border shadow-sm">
          <CommandInput placeholder="Search leads across stages..." />
          <CommandList className="max-h-[450px]">
            <CommandEmpty>No matching leads found.</CommandEmpty>

            {/* Loop all stages dynamically */}
            {stages.map(([stageKey, leads]) => {
              if (!leads || leads.length === 0) return null;

              const stageName = stageLabels[stageKey] ?? stageKey;

              return (
                <CommandGroup
                  key={stageKey}
                  heading={stageName}
                  className="px-2"
                >
                  {leads.map((lead: LeadStageItem) => (
                    <CommandItem
                      key={lead.id}
                      value={`${lead.name} ${lead.lead_code}`}
                      className="cursor-pointer"
                      onSelect={() => handleLeadClick(stageKey, lead)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {/* Avatar */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold">
                          {getInitials(lead.name)}
                        </div>

                        {/* Lead details */}
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-medium">
                            {lead.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {lead.lead_code || "No Code"}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
