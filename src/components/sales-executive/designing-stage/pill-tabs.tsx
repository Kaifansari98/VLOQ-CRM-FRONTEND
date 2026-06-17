"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CloudUpload, Palette, Plus } from "lucide-react";
import React, { useState } from "react";
import AddQuotationModal from "./pill-tabs-component/modals/add-quotation-modal";
import DesignsModal from "./pill-tabs-component/modals/designs-modal";
import AddMeetingsModal from "./pill-tabs-component/modals/add-meetings-modal";
import BookingModal from "./booking-modal";
import { useAppSelector } from "@/redux/store";
import { useDetails } from "./pill-tabs-component/details-context";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { useLeadById } from "@/hooks/useLeadsQueries";
import AssignDesignerModal from "./assign-designer-modal";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TabItemType = {
  id: string;
  leadId?: number | null;
  label: string;
  content?: React.ReactNode;
};

type PillTabsProps = {
  tabs: TabItemType[];
  defaultActiveId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
  bookingBtn?: boolean;
};

const PillTabs = React.forwardRef<HTMLDivElement, PillTabsProps>(
  (
    {
      tabs,
      defaultActiveId = tabs[0]?.id,
      onTabChange,
      className,
      bookingBtn = true,
    },
    ref,
  ) => {
    const { leadId, accountId, canBook } = useDetails();
    const vendorId = useAppSelector((state) => state.auth?.user?.vendor_id);
    const userId = useAppSelector((state) => state.auth?.user?.id);
    const userType = useAppSelector(
      (state) => state.auth.user?.user_type.user_type,
    );
    const isAuditor = userType?.trim().toLowerCase() === "auditor";
    const vendorCustomUserTypeOnly = useAppSelector(
      (state) =>
        state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only ===
        true,
    );
    const customPrivilegeCodes = useAppSelector(
      (state) => state.customPrivileges.codes,
    );
    const { data: leadStatus } = useLeadStatus(leadId, vendorId);
    const { data: leadDetailsData } = useLeadById(leadId, vendorId, userId);
    const {
      blockedTooltip,
      shouldDisableBlockedActions,
    } = useLeadAccessControl({
      leadId,
      userType,
      lead: leadDetailsData?.data?.lead,
    });
    const [activeTab, setActiveTab] = React.useState(defaultActiveId);
    const [openQuotationModal, setOpenQuotationModal] = useState(false);
    const [openDesignsModal, setOpenDesignsModal] = useState(false);
    const [openMeetingsModal, setOpenMeetingsModal] = useState(false);
    const [openBookingModal, setOpenBookingModal] = useState(false);
    const [openAssignDesignerModal, setOpenAssignDesignerModal] =
      useState(false);

    const leadCurrentStatus = leadStatus?.status_tag;
    const lead = leadDetailsData?.data?.lead;
    const assignedDesigner = lead?.assigned_designer_from_mapping;

    const isAdmin =
      userType?.toLowerCase() === "admin" ||
      userType?.toLowerCase() === "super-admin";
    const canShowButtons = isAdmin || leadCurrentStatus === "Type 3";
    const canUploadQuotation =
      !isAuditor &&
      (userType?.toLowerCase() === "custom"
        ? customPrivilegeCodes.includes(
            "leads.designing_stage.quotation.upload",
          )
        : true);
    const canUploadMeetings =
      !isAuditor &&
      (userType?.toLowerCase() === "custom"
        ? customPrivilegeCodes.includes("leads.designing_stage.meetings.upload")
        : true);
    const canUploadDesigns =
      !isAuditor &&
      (userType?.toLowerCase() === "custom"
        ? customPrivilegeCodes.includes("leads.designing_stage.designs.upload")
        : true);
    const isSuperAdmin = userType?.toLowerCase() === "super-admin";
    const canAssignDesigner =
      vendorCustomUserTypeOnly &&
      (isSuperAdmin ||
        customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.add_lead",
        ));

    const handleClick = (id: string) => {
      setActiveTab(id);
      onTabChange?.(id);
    };

    const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

    return (
      <div ref={ref} className="flex flex-col gap-4">
        {/* Tabs + Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs wrapper (scrollable on mobile) */}
          <div
            className={cn(
              "flex items-center gap-1 p-1 bg-background rounded-full border",
              "max-w-full sm:max-w-none",
              className,
            )}
          >
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleClick(tab.id)}
                  className={cn(
                    "relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition touch-none flex-shrink-0",
                    "text-xs sm:text-sm font-medium",
                    activeTab === tab.id
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="pill-tabs-active-pill"
                      className="absolute inset-0 bg-primary rounded-full"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Button */}

          <div className="flex justify-start gap-2">
            {canShowButtons && (
              <>
                {activeTab === "quotation" && canUploadQuotation && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={shouldDisableBlockedActions}
                          className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                          onClick={() => {
                            if (shouldDisableBlockedActions) return;
                            setOpenQuotationModal(true);
                          }}
                        >
                          <CloudUpload size={16} className="sm:mr-1" />
                          <span>Upload Quotations</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {shouldDisableBlockedActions && (
                      <TooltipContent side="top" className="max-w-64 text-center">
                        {blockedTooltip}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
                {activeTab === "meetings" && canUploadMeetings && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          size="sm"
                          disabled={shouldDisableBlockedActions}
                          className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                          onClick={() => {
                            if (shouldDisableBlockedActions) return;
                            setOpenMeetingsModal(true);
                          }}
                        >
                          <CloudUpload size={16} className="sm:mr-1" />
                          <span>Add Meetings</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {shouldDisableBlockedActions && (
                      <TooltipContent side="top" className="max-w-64 text-center">
                        {blockedTooltip}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
                {activeTab === "designs" &&
                  vendorCustomUserTypeOnly &&
                  (assignedDesigner || canAssignDesigner) && (
                    <>
                      {assignedDesigner ? (
                        <div className="h-9 rounded-md border bg-background px-3 flex items-center gap-2 whitespace-nowrap">
                          <Palette
                            size={16}
                            className="text-muted-foreground"
                          />
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs font-medium">
                              {assignedDesigner.user_name}
                            </span>
                            <span className="text-[8px] uppercase tracking-wide text-muted-foreground">
                              Designer
                            </span>
                          </div>
                        </div>
                      ) : canAssignDesigner ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                          onClick={() => setOpenAssignDesignerModal(true)}
                        >
                          <Palette size={16} className="sm:mr-1" />
                          <span>Assign Designer</span>
                        </Button>
                      ) : null}
                    </>
                  )}
                {activeTab === "designs" && canUploadDesigns && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            size="sm"
                            disabled={shouldDisableBlockedActions}
                            className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                            onClick={() => {
                              if (shouldDisableBlockedActions) return;
                              setOpenDesignsModal(true);
                            }}
                          >
                            <CloudUpload size={16} className="sm:mr-1" />
                            <span>Upload Designs</span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {shouldDisableBlockedActions && (
                        <TooltipContent side="top" className="max-w-64 text-center">
                          {blockedTooltip}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </>
                )}
                {bookingBtn && (
                  <Button
                    size="sm"
                    className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                    disabled={!canBook}
                    onClick={() => setOpenBookingModal(true)}
                  >
                    <Plus size={16} />
                    <span>Booking Done</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Active Content */}
        <div className="mt-2 sm:mt-4">{activeContent}</div>

        {/* Modals */}
        <AddQuotationModal
          open={openQuotationModal}
          onOpenChange={setOpenQuotationModal}
        />
        <DesignsModal
          open={openDesignsModal}
          onOpenChange={setOpenDesignsModal}
        />
        <AssignDesignerModal
          open={openAssignDesignerModal}
          onOpenChange={setOpenAssignDesignerModal}
          data={{
            id: leadId,
            accountId: lead?.account_id ?? accountId,
            franchiseId: lead?.franchise_id ?? null,
          }}
        />
        <AddMeetingsModal
          open={openMeetingsModal}
          onOpenChange={setOpenMeetingsModal}
        />

        <BookingModal
          open={openBookingModal}
          onOpenChange={setOpenBookingModal}
          data={{ id: leadId, accountId }}
        />
      </div>
    );
  },
);

PillTabs.displayName = "PillTabs";
export default PillTabs;
