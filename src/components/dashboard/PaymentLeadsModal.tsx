"use client";

import { LeadStageItem, StageData } from "@/api/dashboard/dashboard.api";
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
import { useAddPaymentLeads } from "@/api/dashboard/useDashboard";
import { useRouter } from "next/navigation";
import BaseModal from "../utils/baseModal";
import { useState } from "react";
import PaymentInformation from "../tabScreens/PaymentInformationScreen";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentStageLeadModal({ open, onOpenChange }: Props) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const { data: stageData } = useAddPaymentLeads(vendorId, userId);

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null
  );
  const [openAddPaymentModal, setOpenAddPaymentModal] = useState(false);

  const router = useRouter();

  const stageLabels: Record<string, string> = {
    bookingStage: "Booking",
    finalSiteMeasurementStage: "Final Site Measurement",
    clientDocumentationStage: "Client Documentation",
    clientApprovalStage: "Client Approval",
    techCheckStage: "Tech Check",
    orderLoginStage: "Order Login",
    productionStage: "Production",
    readyToDispatchStage: "Ready to Dispatch",
    siteReadinessStage: "Site Readiness",
    dispatchPlanningStage: "Dispatch Planning",
    dispatchStage: "Dispatch",
    underInstallationStage: "Under Installation",
    finalHandoverStage: "Final Handover",
  };

  const stages = stageData ? Object.entries(stageData) : [];

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleLeadClick = (lead: LeadStageItem) => {
    setSelectedLeadId(lead.id);
    setSelectedAccountId(lead.account_id);
    setOpenAddPaymentModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] p-0">
          <Command className="rounded-lg border shadow-sm">
            <CommandInput placeholder="Search leads across stages..." />
            <CommandList className="max-h-[450px]">
              <CommandEmpty>No matching leads found.</CommandEmpty>

              {stages.map(([stageKey, leads]) => {
                const stageName = stageLabels[stageKey] ?? stageKey;
                if (!leads || leads.length === 0) return null;

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
                        onSelect={() => handleLeadClick(lead)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className="
                            flex h-10 w-10 items-center justify-center rounded-full
                            bg-black text-white
                            dark:bg-white dark:text-black
                            font-semibold
                          "
                          >
                            {getInitials(lead.name)}
                          </div>

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
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <BaseModal
        title="Add Payment"
        description="Please fill the payment details below."
        open={openAddPaymentModal}
        onOpenChange={setOpenAddPaymentModal}
        size="xl"
      
      >
      <div className="p-2 ">

        {selectedLeadId && selectedAccountId && (
          <PaymentInformation
            leadIdProps={selectedLeadId}
            accountId={selectedAccountId}
          />
        )}
      </div>
      </BaseModal>
    </>
  );
}
