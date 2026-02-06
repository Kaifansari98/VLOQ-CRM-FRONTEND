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
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import DocumentCard from "@/components/utils/documentCard";
import CustomeTooltip from "@/components/custom-tooltip";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";
import { useAppSelector } from "@/redux/store";
import BaseModal from "@/components/utils/baseModal";
import { ImageComponent } from "@/components/utils/ImageCard";

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

  const queryClient = useQueryClient();
  const { data: vendors } = useCompanyVendors(vendorId);
  const { data: poFileList = [] } = useOrderLoginPoFiles(
    vendorId,
    leadId,
    orderLoginId
  );
  const { mutateAsync } = useHandleFactoryVendorSelection();
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(
    currentCompanyVendorId || null
  );
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [pendingVendorId, setPendingVendorId] = useState<number | null>(null);

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

  // ✅ Sync selected vendor once vendors are loaded or currentCompanyVendorId changes
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

      toast.success("Vendor updated successfully!");
      setSelectedVendorId(pendingVendorId);
      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update vendor");
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

      toast.success(`Marked as ready at ${formattedTime}`);
      setIsCompleted(true);

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["postProductionReady", vendorId, leadId],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as completed");
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
            estimated_completion_date: newDate,
            updated_by: userId,
          },
        ],
      });
      toast.success("Production ready date updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["latestOrderLogin", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["postProductionReady", vendorId, leadId],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update production ready date");
    }
  };

  const canWorkAndView = canViewAndWorkProductionStage(userType, leadStatus);

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
          {/* LEFT */}
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
                    const isImage = doc.doc_og_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
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

          {/* RIGHT */}
          <div className="border-l border-gray-200 dark:border-gray-800 pl-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-300">
              Change {title} Vendor
            </h3>

            <CustomeTooltip
              truncateValue={
                <div
                  className={
                    isCompleted
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
                    disabled={!canWorkAndView}
                    value={selectedVendorId || undefined}
                    onChange={isCompleted ? () => {} : handleVendorChange}
                    placeholder="Search vendor..."
                    emptyLabel="Select vendor"
                  />
                </div>
              }
              value={
                !canWorkAndView && userType === "factory"
                  ? "This lead stage has progressed. Factory users cannot modify this section."
                  : !canWorkAndView
                  ? "You do not have access to assign or change vendors."
                  : isCompleted
                  ? "You cannot change the vendor after this order-login is marked as ready."
                  : "Select a factory vendor."
              }
            />

            <p className="text-xs text-muted-foreground leading-relaxed">
              If you change the vendor, you’ll be prompted to enter a remark
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

            {/* Divider */}
            <Separator orientation="horizontal" className="my-3" />

            {/* Production Ready Date */}
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                Production Ready Date for {title}
              </h4>

              <CustomeTooltip
                truncateValue={
                  <div
                    className={
                      isCompleted || !canWorkAndView
                        ? "opacity-70 pointer-events-none w-full"
                        : "w-full"
                    }
                  >
                    <CustomeDatePicker
                      value={productionReadyDate}
                      onChange={
                        isCompleted || !canWorkAndView
                          ? () => {}
                          : handleDateChange
                      }
                      restriction="futureOnly"
                    />
                  </div>
                }
                value={
                  !canWorkAndView && userType === "factory"
                    ? "This lead stage has progressed. Factory users cannot modify this section."
                    : !canWorkAndView
                    ? "You do not have access to change or set production-ready dates."
                    : isCompleted
                    ? "You cannot change the date after this order-login is marked as ready."
                    : "Select a production ready date."
                }
              />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select a future date to set when this order is expected to be
                production-ready.
              </p>
            </div>

            {/* Divider */}
            <Separator orientation="horizontal" className="my-3" />

            {/* Mark as Completed */}
            <div>
              <CustomeTooltip
                truncateValue={
                  <div
                    className={`w-full ${
                      isCompleted || !productionReadyDate
                        ? "opacity-70 pointer-events-none"
                        : ""
                    }`}
                  >
                    <Button
                      onClick={handleMarkAsCompleted}
                      disabled={
                        isCompleted ||
                        !productionReadyDate ||
                        !isProductionDateReached ||
                        !canWorkAndView
                      }
                      className={`w-full flex items-center justify-center gap-2 ${
                        isCompleted ? "" : ""
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isCompleted ? "Marked as Ready" : "Mark as Ready"}
                    </Button>
                  </div>
                }
                value={
                  !canWorkAndView && userType === "factory"
                    ? "This lead stage has progressed. Factory users cannot modify this section."
                    : !canWorkAndView
                    ? "You do not have access to mark this order-login as completed."
                    : isCompleted
                    ? "This order-login is already completed."
                    : !productionReadyDate
                    ? "Please set the Production Ready Date before marking as completed."
                    : !isProductionDateReached
                    ? "You can mark as completed only once the Production Ready Date has arrived."
                    : "Mark this order-login as completed."
                }
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
