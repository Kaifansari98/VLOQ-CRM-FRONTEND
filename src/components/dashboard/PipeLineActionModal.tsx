"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { useSalesExecutiveStageLeads } from "@/api/dashboard/useDashboard";
import { SalesExecutiveStageLead } from "@/api/dashboard/dashboard.api";
import { useRouter } from "next/navigation";

interface PipeLineActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number;
  userId: number;
  stageKey: string | null;
  stageName: string | null;
  stageType: string | null;
}

const STAGE_API_KEYS = {
  openLead: "openLead",
  ismLead: "ismLead",
  designing: "designing",
  bookingDone: "bookingDone",
  clientDocumentation: "clientDocumentation",
  clientApproval: "clientApproval",
  techCheck: "techCheck",
  readyToDispatch: "readyToDispatch",
  dispatchPlanning: "dispatchPlanning",
} as const;

const avatarColors = [
  "bg-[#101016]", // light warm grey
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // muted taupe
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // dark sand grey
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // stone brown-grey
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // soft charcoal brown
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // deep brownish charcoal
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // very dark grey-brown
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // deep industrial steel
  "bg-[#101016]",
  "bg-[#101016]",

  "bg-[#101016]", // near-black cool tone
  "bg-[#101016]",
  "bg-[#101016]",
];

// Maps Type → Route
const STAGE_ROUTE_MAP: Record<string, string> = {
  "Type 1": "/dashboard/leads/leadstable/details",
  "Type 2": "/dashboard/leads/initial-site-measurement/details",
  "Type 3": "/dashboard/leads/designing-stage/details",
  "Type 4": "/dashboard/leads/booking-stage/details",
  "Type 6": "/dashboard/project/client-documentation/details",
  "Type 7": "/dashboard/project/client-approval/details",
  "Type 8": "/dashboard/production/tech-check/details",
  "Type 11": "/dashboard/production/ready-to-dispatch/details",
  "Type 13": "/dashboard/installation/dispatch-planning/details",
};

// Avatar color based on name
const getColorForName = (name: string) => {
  if (!name) return "bg-gray-500";
  const index =
    (name.trim()[0].toUpperCase().charCodeAt(0) - 65) % avatarColors.length;
  return avatarColors[index];
};

// Initials
const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function PipeLineActionModal({
  open,
  onOpenChange,
  vendorId,
  userId,
  stageKey,
  stageName,
  stageType,
}: PipeLineActionModalProps) {
  const router = useRouter();
  const { data, isLoading, error } = useSalesExecutiveStageLeads(
    vendorId,
    userId
  );

  const leads: SalesExecutiveStageLead[] = useMemo(() => {
    if (!stageKey || !data) return [];
    const key = STAGE_API_KEYS[stageKey as keyof typeof STAGE_API_KEYS];
    return (data[key] as SalesExecutiveStageLead[]) ?? [];
  }, [data, stageKey]);

  const handleLeadClick = (lead: SalesExecutiveStageLead) => {
    if (!stageType) return;

    const baseRoute = STAGE_ROUTE_MAP[stageType];

    if (!baseRoute) {
      console.warn("No route found for stageType:", stageType);
      return;
    }

    router.push(`${baseRoute}/${lead.id}?accountId=${lead.account_id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        {/* EXACT SAME UI AS AssignLeadModal */}
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search leads..." />

          <CommandList>
            <CommandGroup heading={stageName ?? "Stage"}>
              {/* Loading */}
              {isLoading && (
                <div className="p-4 text-sm text-gray-500">
                  Loading leads...
                </div>
              )}

              {/* API Error */}
              {error && (
                <div className="p-4 text-sm text-red-500">
                  Failed to load leads.
                </div>
              )}

              {/* Leads */}
              {leads.length > 0
                ? leads.map((lead) => (
                    <CommandItem
                      key={lead.id}
                      onSelect={() => handleLeadClick(lead)}
                      className={cn("cursor-pointer")}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {/* Avatar */}
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold",
                            getColorForName(lead.name)
                          )}
                        >
                          {getInitials(lead.name)}
                        </div>

                        {/* Details */}
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-medium">
                            {lead.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {lead.lead_code ?? "No Code"}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))
                : !isLoading && (
                    <div className="p-4 text-sm text-gray-500">
                      No leads found.
                    </div>
                  )}
            </CommandGroup>

            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
