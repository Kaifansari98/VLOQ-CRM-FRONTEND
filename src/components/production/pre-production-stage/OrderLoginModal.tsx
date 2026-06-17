"use client";

import React, { useEffect, useState } from "react";

import { motion } from "framer-motion";
import {
  useCompanyVendors,
  useOrderLoginPoFiles,
} from "@/api/production/order-login";
import {
  useHandleFactoryVendorSelection,
  useHandleOrderLoginCompletion,
} from "@/api/production/production-api";
import AssignToPicker from "@/components/assign-to-picker";
import VendorChangeRemarkModal from "./vendorChangeRemarkModal";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import CustomeDatePicker from "@/components/date-picker";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import DocumentCard from "@/components/utils/documentCard";
import CustomeTooltip from "@/components/custom-tooltip";
import {
  useInstanceStage,
  useLeadStatus,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";
import { useAppSelector } from "@/redux/store";
import BaseModal from "@/components/utils/baseModal";
import { ImageComponent } from "@/components/utils/ImageCard";
import { useSearchParams } from "next/navigation";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useLeadById } from "@/hooks/useLeadsQueries";

interface OrderLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  desc: string;
  companyVendorName?: string;
  companyVendorContact?: string;
  vendorId: number;
  leadId: number;
  orderLoginId: number;
  currentCompanyVendorId?: number | null;
  userId: number;
  changedVendorRemark?: string;
  productionDate?: string;
  markedAsCompletedDate?: string;
}

export default function OrderLoginModal({
  open,
  onOpenChange,
  title,
  desc,
  companyVendorName,
  companyVendorContact,
  vendorId,
  leadId,
  orderLoginId,
  currentCompanyVendorId,
  userId,
  changedVendorRemark,
  productionDate,
  markedAsCompletedDate,
}: OrderLoginModalProps) {
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const customPrivilegeCodes = useAppSelector((s) => s.customPrivileges.codes);
  const userIdRedux = useAppSelector((s) => s.auth.user?.id);
  const searchParams = useSearchParams();

  const instanceFromUrl = searchParams.get("instance_id");
  const instanceId = instanceFromUrl ? Number(instanceFromUrl) : undefined;

  const { data: leadResponse } = useLeadById(leadId, vendorId, userIdRedux);
  const lead = leadResponse?.data?.lead;

  const queryClient = useQueryClient();
  const { data: vendors } = useCompanyVendors(vendorId);
  const { data: poFileList = [] } = useOrderLoginPoFiles(
    vendorId,
    leadId,
    orderLoginId,
  );
  const { mutateAsync } = useHandleFactoryVendorSelection();
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(
    currentCompanyVendorId || null,
  );
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { data, isLoading: instanceLoading } = useInstanceStage(
    vendorId,
    leadId,
    instanceId,
  );
  const leadStatusIns = data?.derived_stage;
  const leadStatus = leadData?.status;
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [pendingVendorId, setPendingVendorId] = useState<number | null>(null);

  // ✅ Lead block access control
  const { blockedTooltip, shouldDisableBlockedActions } = useLeadAccessControl({
    leadId,
    userType,
    lead,
  });

  const [productionReadyDate, setProductionReadyDate] = useState<
    string | undefined
  >(productionDate || undefined);

  const [isCompleted, setIsCompleted] = useState(!!markedAsCompletedDate);

  const { mutateAsync: updateCompletionDate } = useHandleOrderLoginCompletion();

  useEffect(() => {
    if (productionDate) {
      setProductionReadyDate(productionDate);
    } else {
      setProductionReadyDate(undefined);
    }
  }, [productionDate]);

  useEffect(() => {
    if (currentCompanyVendorId) {
      setSelectedVendorId(currentCompanyVendorId);
    }
  }, [currentCompanyVendorId, vendors]);

  const handleVendorChange = (id: number | null) => {
    if (id !== currentCompanyVendorId) {
      setPendingVendorId(id);
      setRemarkModalOpen(true);
    }
  };

  const submitVendorChange = async (remark: string) => {
    try {
      if (!pendingVendorId) return;

      await mutateAsync({
        vendorId,
        leadId,
        updates: [
          {
            id: orderLoginId,
            company_vendor_id: pendingVendorId,
            remark,
            updated_by: userId,
          },
        ],
      });

      toastManager.add({ title: "Vendor updated successfully!", type: "success" });
      setSelectedVendorId(pendingVendorId);
      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId, instanceId],
      });
    } catch (err: any) {
      toastManager.add({
        title: err?.message || "Failed to update vendor",
        type: "error",
      });
    }
  };

  const handleMarkAsCompleted = async () => {
    try {
      await updateCompletionDate({
        vendorId,
        leadId,
        updates: [
          {
            id: orderLoginId,
            instance_id: instanceId,
            is_completed: true,
            updated_by: userId,
          },
        ],
      });

      const now = new Date();
      const formattedTime = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      toastManager.add({
        title: `Marked as ready at ${formattedTime}`,
        type: "success",
      });
      setIsCompleted(true);

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId, instanceId],
      });
      queryClient.invalidateQueries({ queryKey: ["leadById", leadId] });
      queryClient.invalidateQueries({
        queryKey: ["postProductionReady", vendorId, leadId],
      });
    } catch (err: any) {
      toastManager.add({
        title: err?.message || "Failed to mark as completed",
        type: "error",
      });
    }
  };

  const isProductionDateReached = productionReadyDate
    ? new Date().setHours(0, 0, 0, 0) >=
      new Date(productionReadyDate).setHours(0, 0, 0, 0)
    : false;

  const initial =
    companyVendorName && companyVendorName.length > 0
      ? companyVendorName.charAt(0).toUpperCase()
      : "";

  const hasVendorInfo =
    (companyVendorName && companyVendorName.trim() !== "") ||
    (companyVendorContact && companyVendorContact.trim() !== "");

  const formattedCompletedDate = markedAsCompletedDate
    ? new Date(markedAsCompletedDate).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const handleDateChange = async (newDate?: string) => {
    setProductionReadyDate(newDate);
    if (!newDate) return;

    try {
      await updateCompletionDate({
        vendorId,
        leadId,
        updates: [
          {
            id: orderLoginId,
            instance_id: instanceId,
            estimated_completion_date: newDate,
            updated_by: userId,
          },
        ],
      });
      toastManager.add({
        title: "Production ready date updated successfully!",
        type: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId, instanceId],
      });
      queryClient.invalidateQueries({ queryKey: ["leadById", leadId] });
      queryClient.invalidateQueries({
        queryKey: ["latestOrderLogin", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["postProductionReady", vendorId, leadId],
      });
    } catch (err: any) {
      toastManager.add({
        title: err?.message || "Failed to update production ready date",
        type: "error",
      });
    }
  };

  console.log("instance id from orderlogin modal : ", instanceId);

  const isPreProd = userType?.toLowerCase() === "pre-prod";
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const canWorkAndView =
    !isPreProd &&
    canViewAndWorkProductionStage(userType, leadStatusIns ?? leadStatus);
  const canTakeUnderProductionAction =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.under_production.expected_ready_date_of_order_action",
        )
      : canWorkAndView;

  // ✅ Vendor tooltip — blocked takes highest priority
  const vendorTooltipMessage = isAuditor
    ? undefined
    : shouldDisableBlockedActions
      ? blockedTooltip
      : canWorkAndView && !isCompleted
        ? undefined
        : isPreProd
          ? "Pre-prod users can only view this section."
          : !canWorkAndView && userType === "factory"
            ? "This lead stage has progressed. Factory users cannot modify this section."
            : !canWorkAndView
              ? "You do not have access to assign or change vendors."
              : "You cannot change the vendor after this order-login is marked as ready.";

  // ✅ Date tooltip — blocked takes highest priority
  const dateTooltipMessage = isAuditor
    ? undefined
    : shouldDisableBlockedActions
      ? blockedTooltip
      : !canTakeUnderProductionAction
        ? "You do not have permission to take action on this."
        : isPreProd
          ? "Pre-prod users can only view this section."
          : !canWorkAndView && userType === "factory"
            ? "This lead stage has progressed. Factory users cannot modify this section."
            : !canWorkAndView
              ? "You do not have access to change or set production-ready dates."
              : isCompleted
                ? "You cannot change the date after this order-login is marked as ready."
                : "Select a production ready date.";

  // ✅ Mark as Ready tooltip — blocked takes highest priority
  const markAsReadyTooltipMessage = isAuditor
    ? undefined
    : shouldDisableBlockedActions
      ? blockedTooltip
      : !canTakeUnderProductionAction
        ? "You do not have permission to take action on this."
        : isPreProd
          ? "Pre-prod users can only view this section."
          : !canWorkAndView && userType === "factory"
            ? "This lead stage has progressed. Factory users cannot modify this section."
            : !canWorkAndView
              ? "You do not have access to mark this order-login as completed."
              : isCompleted
                ? "This order-login is already completed."
                : !productionReadyDate
                  ? "Please set the Production Ready Date before marking as completed."
                  : !isProductionDateReached
                    ? "You can mark as completed only once the Production Ready Date has arrived."
                    : "Mark this order-login as completed.";

  // ✅ Whether each action is actually disabled
  const isVendorDisabled =
    isAuditor || shouldDisableBlockedActions || !canWorkAndView || isCompleted;

  const isDateDisabled =
    isAuditor || shouldDisableBlockedActions || isCompleted || !canTakeUnderProductionAction;

  const isMarkAsReadyDisabled =
    isAuditor ||
    shouldDisableBlockedActions ||
    isCompleted ||
    !productionReadyDate ||
    !isProductionDateReached ||
    !canTakeUnderProductionAction;

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Under Production - Workflow"
        description="Control production workflow by updating vendor details, timelines, and completion status."
        size="xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5"
        >
          {/* ── LEFT ───────────────────────────────────────────────────────── */}
          <div className="space-y-5 h-full flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-md font-semibold text-gray-900 dark:text-gray-300">
                {title}
              </h2>
              <div className="max-h-48 overflow-y-auto p-3 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {desc || "No description available."}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-300">
                  PO Files
                </p>
                {poFileList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No PO files uploaded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 max-h-[250px] overflow-y-scroll">
                    {poFileList.map((doc: any) => {
                      const isImage = doc.doc_og_name?.match(
                        /\.(jpg|jpeg|png|gif|webp)$/i,
                      );
                      if (isImage) {
                        return (
                          <ImageComponent
                            key={doc.id}
                            doc={{
                              id: doc.id,
                              doc_og_name: doc.doc_og_name,
                              signedUrl: doc.signed_url,
                              created_at: doc.created_at,
                            }}
                          />
                        );
                      } else {
                        return (
                          <DocumentCard
                            key={doc.id}
                            doc={{
                              id: doc.id,
                              originalName: doc.doc_og_name,
                              signedUrl: doc.signed_url,
                              created_at: doc.created_at,
                            }}
                          />
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>

            {hasVendorInfo && (
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-lg">
                    {initial}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {companyVendorName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {companyVendorContact}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ──────────────────────────────────────────────────────── */}
          <div className="border-l border-gray-200 dark:border-gray-800 pl-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300">
              Change {title} Vendor
            </h3>

            {/* ✅ Vendor picker — blocked tooltip overrides all */}
            <CustomeTooltip
              truncateValue={
                <div
                  className={
                    isVendorDisabled
                      ? "opacity-70 pointer-events-none w-full"
                      : "w-full"
                  }
                >
                  <AssignToPicker
                    data={
                      vendors?.map((v: any) => ({
                        id: v.id,
                        label: v.company_name,
                      })) ?? []
                    }
                    disabled={isVendorDisabled}
                    value={selectedVendorId || undefined}
                    onChange={isVendorDisabled ? () => {} : handleVendorChange}
                    placeholder="Search vendor..."
                    emptyLabel="Select vendor"
                  />
                </div>
              }
              value={vendorTooltipMessage}
            />

            <p className="text-xs text-muted-foreground leading-relaxed">
              If you change the vendor, you'll be prompted to enter a remark
              explaining the reason.
            </p>

            {changedVendorRemark && (
              <div className="mt-3 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Vendor Change Remark
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {changedVendorRemark}
                </p>
              </div>
            )}

            <Separator orientation="horizontal" className="my-3" />

            {/* ✅ Production Ready Date — blocked tooltip overrides all */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                Production Ready Date for {title}
              </h4>

              <CustomeTooltip
                truncateValue={
                  <div
                    className={
                      isDateDisabled
                        ? "opacity-70 pointer-events-none w-full"
                        : "w-full"
                    }
                  >
                    <CustomeDatePicker
                      value={productionReadyDate}
                      onChange={isDateDisabled ? () => {} : handleDateChange}
                      restriction="futureOnly"
                    />
                  </div>
                }
                value={dateTooltipMessage}
              />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select a future date to set when this order is expected to be
                production-ready.
              </p>
            </div>

            <Separator orientation="horizontal" className="my-3" />

            {/* ✅ Mark as Ready button — blocked tooltip overrides all */}
            <div>
              <CustomeTooltip
                truncateValue={
                  <div
                    className={`w-full ${
                      isMarkAsReadyDisabled ? "opacity-70 pointer-events-none" : ""
                    }`}
                  >
                    <Button
                      onClick={handleMarkAsCompleted}
                      disabled={isMarkAsReadyDisabled}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isCompleted ? "Marked as Ready" : "Mark as Ready"}
                    </Button>
                  </div>
                }
                value={markAsReadyTooltipMessage}
              />

              {isCompleted && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-500" />
                    This order-login has been marked as ready.
                  </p>
                  {formattedCompletedDate && (
                    <p className="pl-5 text-gray-400">
                      Completed on{" "}
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {formattedCompletedDate}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </BaseModal>

      {/* Remark Modal */}
      <VendorChangeRemarkModal
        open={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        onSubmit={submitVendorChange}
      />
    </>
  );
}