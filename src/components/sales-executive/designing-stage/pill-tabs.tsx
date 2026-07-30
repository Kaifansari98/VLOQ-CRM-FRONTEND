"use client";

import { motion } from "framer-motion";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CloudUpload, Palette, Plus, Pencil } from "lucide-react";
import React, { useState } from "react";
import AddQuotationModal from "./pill-tabs-component/modals/add-quotation-modal";
import DesignsModal from "./pill-tabs-component/modals/designs-modal";
import AddMeetingsModal from "./pill-tabs-component/modals/add-meetings-modal";
import BookingModal from "./booking-modal";
import { useAppSelector } from "@/redux/store";
import { useDetails } from "./pill-tabs-component/details-context";
import {
  useDesignsDoc,
  useLeadStatus,
  useQuotationDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import {
  useLeadById,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import AssignDesignerModal from "./assign-designer-modal";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TabItemType = {
  id: string;
  leadId?: number | null;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
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
    const handlesLargeScaleProjects = useAppSelector(
      (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
    );
    const customPrivilegeCodes = useAppSelector(
      (state) => state.customPrivileges.codes,
    );
    const { data: leadStatus } = useLeadStatus(leadId, vendorId);
    const { data: leadDetailsData } = useLeadById(leadId, vendorId, userId);
    const { data: designDocsData } = useDesignsDoc(vendorId!, leadId);
    const { data: quotationDocsData } = useQuotationDoc(vendorId, leadId);
    const { data: structureInstancesData } = useLeadProductStructureInstances(
      leadId,
      vendorId,
      handlesLargeScaleProjects,
    );
    const {
      blockedTooltip,
      shouldDisableBlockedActions,
    } = useLeadAccessControl({
      leadId,
      userType,
      lead: leadDetailsData?.data?.lead,
    });
    const uniqueId = React.useId();
    const [activeTab, setActiveTab] = React.useState(defaultActiveId);

    React.useEffect(() => {
      if (defaultActiveId) {
        setActiveTab(defaultActiveId);
      }
    }, [defaultActiveId]);
    const [openQuotationModal, setOpenQuotationModal] = useState(false);
    const [openDesignsModal, setOpenDesignsModal] = useState(false);
    const [openMeetingsModal, setOpenMeetingsModal] = useState(false);
    const [openBookingModal, setOpenBookingModal] = useState(false);
    const [openAssignDesignerModal, setOpenAssignDesignerModal] =
      useState(false);

    const leadCurrentStatus = leadStatus?.status_tag;
    const lead = leadDetailsData?.data?.lead;
    const designDocs = designDocsData?.data?.documents || [];
    const quotationDocs = quotationDocsData?.data?.documents || [];
    const structureInstances: any[] = Array.isArray(structureInstancesData?.data)
      ? structureInstancesData.data
      : [];
    const assignedDesigners: Array<{
      user_id: number;
      user_name: string | null;
      created_at: string;
    }> = lead?.assigned_designers_from_mapping ?? [];
    const isDesignerAssignedIfRequired =
      !vendorCustomUserTypeOnly ||
      !leadDetailsData ||
      assignedDesigners.length > 0;

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

    const largeScaleBookingDocValidation = React.useMemo(() => {
      if (!handlesLargeScaleProjects) {
        return {
          isReady: true,
          tooltip: "",
        };
      }

      const productTypeGroups = new Map<
        number,
        { label: string; instanceIds: number[] }
      >();

      for (const instance of structureInstances) {
        const productTypeId =
          instance.productType?.id ??
          instance.productItemCode?.productStructure?.productType?.id;
        const productTypeLabel =
          instance.productType?.type ||
          instance.productItemCode?.productStructure?.productType?.type;

        if (!productTypeId || !productTypeLabel) continue;

        const existing = productTypeGroups.get(productTypeId);
        if (existing) {
          existing.instanceIds.push(instance.id);
          continue;
        }

        productTypeGroups.set(productTypeId, {
          label: productTypeLabel,
          instanceIds: [instance.id],
        });
      }

      const missingGroups: string[] = [];

      for (const [productTypeId, group] of productTypeGroups.entries()) {
        const hasDesign = designDocs.some((doc: any) => {
          const instanceId = doc.product_structure_instance_id;
          const docProductTypeId = doc.product_type_id;

          return (
            (instanceId != null && group.instanceIds.includes(Number(instanceId))) ||
            (docProductTypeId != null && Number(docProductTypeId) === productTypeId)
          );
        });

        const hasQuotation = quotationDocs.some((doc: any) => {
          const instanceId = doc.product_structure_instance_id;
          const docProductTypeId = doc.product_type_id;

          return (
            (instanceId != null && group.instanceIds.includes(Number(instanceId))) ||
            (docProductTypeId != null && Number(docProductTypeId) === productTypeId)
          );
        });

        if (!hasDesign || !hasQuotation) {
          const missingParts = [
            !hasDesign ? "design" : null,
            !hasQuotation ? "quotation" : null,
          ]
            .filter(Boolean)
            .join(" and ");

          missingGroups.push(`${group.label}: missing ${missingParts}`);
        }
      }

      if (missingGroups.length === 0) {
        return {
          isReady: true,
          tooltip: "",
        };
      }

      return {
        isReady: false,
        tooltip: `Upload at least one design and one quotation for each product type before moving to booking. ${missingGroups.join("; ")}`,
      };
    }, [
      designDocs,
      handlesLargeScaleProjects,
      quotationDocs,
      structureInstances,
    ]);

    const bookingButtonTooltip = shouldDisableBlockedActions
      ? blockedTooltip
      : !canBook
        ? "Complete the required prerequisites before moving to booking."
        : !largeScaleBookingDocValidation.isReady
          ? largeScaleBookingDocValidation.tooltip
          : "";

    const isBookingButtonDisabled =
      shouldDisableBlockedActions ||
      !canBook ||
      !largeScaleBookingDocValidation.isReady;

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
              "flex space-x-6 overflow-x-auto pb-px scrollbar-none border-b",
              "max-w-full sm:max-w-none",
              className,
            )}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none whitespace-nowrap shrink-0",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId={`pill-tabs-active-line-${uniqueId}`}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
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
                  (assignedDesigners.length > 0 || canAssignDesigner) && (
                    <>
                      {assignedDesigners.length > 0 ? (
                        <div className="h-9 rounded-md border bg-background pl-2 pr-1.5 flex items-center gap-2 whitespace-nowrap">
                          <div className="flex -space-x-2">
                            {assignedDesigners.slice(0, 3).map((designer) => (
                              <Tooltip key={designer.user_id}>
                                <TooltipTrigger asChild>
                                  <Avatar
                                    className={cn(
                                      "h-6 w-6 ring-2 ring-background text-white cursor-default",
                                      getAvatarColor(
                                        designer.user_name || "User",
                                      ),
                                    )}
                                  >
                                    <AvatarFallback className="bg-transparent text-[9px] font-semibold">
                                      {getInitials(
                                        designer.user_name || "User",
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  {designer.user_name || "Designer"}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {assignedDesigners.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[9px] font-semibold cursor-default">
                                    +{assignedDesigners.length - 3}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-56">
                                  {assignedDesigners
                                    .slice(3)
                                    .map((d) => d.user_name || "Designer")
                                    .join(", ")}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {assignedDesigners.length > 1
                              ? "Designers"
                              : "Designer"}
                          </span>
                          {canAssignDesigner && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground bg-muted/50"
                              onClick={() => setOpenAssignDesignerModal(true)}
                              title="Manage Designers"
                            >
                              <Pencil size={12} />
                            </Button>
                          )}
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
                            disabled={shouldDisableBlockedActions || !isDesignerAssignedIfRequired}
                            className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                            onClick={() => {
                              if (shouldDisableBlockedActions || !isDesignerAssignedIfRequired) return;
                              setOpenDesignsModal(true);
                            }}
                          >
                            <CloudUpload size={16} className="sm:mr-1" />
                            <span>Upload Designs</span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {(shouldDisableBlockedActions || !isDesignerAssignedIfRequired) && (
                        <TooltipContent side="top" className="max-w-64 text-center">
                          {shouldDisableBlockedActions
                            ? blockedTooltip
                            : "Please assign a designer before uploading designs."}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </>
                )}
                {bookingBtn && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          size="sm"
                          className="text-xs sm:text-xs px-2 sm:px-4 whitespace-nowrap"
                          disabled={isBookingButtonDisabled}
                          onClick={() => {
                            if (isBookingButtonDisabled) return;
                            setOpenBookingModal(true);
                          }}
                        >
                          <Plus size={16} />
                          <span>Booking Done</span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {bookingButtonTooltip && (
                      <TooltipContent side="top" className="max-w-80 text-center">
                        {bookingButtonTooltip}
                      </TooltipContent>
                    )}
                  </Tooltip>
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
            assignedDesigners,
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
