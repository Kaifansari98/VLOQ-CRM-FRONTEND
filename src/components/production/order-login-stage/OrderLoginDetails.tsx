"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import ProductionFilesSection from "./ProductionFilesModal";
import ApprovedDocsSection from "./ApprovedDocsModal";
import OrderLoginTab from "./OrderloginTab";
import { useTechCheckInstanceStatus } from "@/api/tech-check";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useLeadById, useLeadSuperAdminApprovalLockIns } from "@/hooks/useLeadsQueries";
import { useUpdateSoValueReceivedStatus } from "@/api/production/order-login";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";
import { Checkbox } from "@/components/ui/checkbox";
import { toastManager } from "@/components/ui/toast";

interface OrderLoginDetailsProps {
  leadId: number;
  accountId: number;
  name?: string;
  forceDefaultTab?: string;
  instanceId?: number | null;
}

const OrderLoginDetails: React.FC<OrderLoginDetailsProps> = ({
  leadId,
  accountId,
  forceDefaultTab,
  instanceId,
}) => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const instanceFromUrlRaw = searchParams.get("instance_id");
  const instanceFromUrl = instanceFromUrlRaw
    ? Number(instanceFromUrlRaw)
    : null;
  const lockInstanceFromUrl =
    Number.isFinite(instanceFromUrl) && !!instanceFromUrl;
  const resolvedInstanceId =
    Number.isFinite(instanceFromUrl) && instanceFromUrl
      ? instanceFromUrl
      : (instanceId ?? null);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const updateSoValueReceived = useUpdateSoValueReceivedStatus(vendorId, leadId);
  const {
    data: orderLoginLockIns = [],
    isLoading: orderLoginLockInsLoading,
  } = useLeadSuperAdminApprovalLockIns(vendorId, leadId, "order_login");
  const { data: leadResponse } = useLeadById(leadId, vendorId, userId);

  const { data: clientDocs } = useClientDocumentationDetails(
    vendorId,
    leadId,
    userId!,
    instanceFromUrl!,
  );
  const isSmallOrderRequestLead =
    leadResponse?.data?.lead?.is_small_order_request === true;
  const instances = clientDocs?.product_structure_instances ?? [];
  const hasMultipleInstances = (clientDocs?.instance_count ?? 0) > 1;
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(
    resolvedInstanceId,
  );

  useEffect(() => {
    if (!hasMultipleInstances) {
      setActiveInstanceId(resolvedInstanceId);
      return;
    }
    if (resolvedInstanceId) {
      setActiveInstanceId(resolvedInstanceId);
      return;
    }
    if (!activeInstanceId && instances.length > 0) {
      setActiveInstanceId(instances[0]?.id ?? null);
    }
  }, [hasMultipleInstances, resolvedInstanceId, instances, activeInstanceId]);

  const scopedInstanceId = hasMultipleInstances
    ? activeInstanceId
    : resolvedInstanceId;
  const { data: techCheckInstanceStatus } = useTechCheckInstanceStatus(
    vendorId,
    leadId,
    scopedInstanceId,
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  const tabMapping: Record<string, string> = {
    orderLogin: "order-login",
    approvedDocs: "approved-docs",
    productionFiles: "production-files",
  };

  const activeTab =
    tabMapping[tabParam || ""] || forceDefaultTab || "order-login";
  const hasPendingOrderLoginApproval = orderLoginLockIns.some((lockIn) => {
    const pendingTasks = Array.isArray(lockIn.pending_tasks)
      ? lockIn.pending_tasks
      : [];

    if (scopedInstanceId) {
      return pendingTasks.some((task) => task.instance_id === scopedInstanceId);
    }

    if (pendingTasks.length > 0) {
      return true;
    }

    return !lockIn.is_approved;
  });
  const isOrderLoginLocked =
    orderLoginLockInsLoading || hasPendingOrderLoginApproval;
  const lockedTabsTooltip = orderLoginLockInsLoading
    ? "Checking accounts approval status"
    : "Accounts approval for Order Login is still pending";
  const canViewApprovedDocuments =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.order_login.approved_documents.view",
        )
      : true;
  const canViewProductionFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.order_login.production_files.view",
        )
      : true;
  const canAccessOrderLoginDetails =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.order_login.order_login_details.enable_disable",
        )
      : true;
  const safeDefaultTab =
    isOrderLoginLocked &&
    (activeTab === "order-login" || activeTab === "production-files")
      ? "approved-docs"
      : activeTab;
  const resolvedDefaultTab =
    safeDefaultTab;
  const smallOrderRequestDocuments =
    leadResponse?.data?.lead?.smallOrderRequest?.documents ?? [];
  const tabItems = [
    {
      id: "approved-docs",
      title: "Approved Documents",
      color: "bg-zinc-800 hover:bg-zinc-900",
      disabled: !canViewApprovedDocuments,
      disabledReason:
        "You don’t have permission to access Approved Documents.",
      cardContent: (
        <ApprovedDocsSection
          leadId={leadId}
          instanceId={scopedInstanceId}
          isSmallOrderRequestLead={isSmallOrderRequestLead}
          smallOrderRequestDocuments={smallOrderRequestDocuments}
        />
      ),
    },
    {
      id: "production-files",
      title: "Production Files",
      color: "bg-zinc-800 hover:bg-zinc-900",
      disabled: isOrderLoginLocked || !canViewProductionFiles,
      disabledReason: !canViewProductionFiles
        ? "You don’t have permission to access Production Files."
        : lockedTabsTooltip,
      cardContent: (
        <ProductionFilesSection
          leadId={leadId}
          accountId={accountId}
          instanceId={scopedInstanceId}
          orderLoginApprovalPending={isOrderLoginLocked}
          orderLoginApprovalPendingTooltip={lockedTabsTooltip}
        />
      ),
    },
    {
      id: "order-login",
      title: "Order Login",
      color: "bg-zinc-800 hover:bg-zinc-900",
      disabled: isOrderLoginLocked || !canAccessOrderLoginDetails,
      disabledReason: !canAccessOrderLoginDetails
        ? "You don’t have permission to access Order Login."
        : lockedTabsTooltip,
      cardContent: (
        <OrderLoginTab
          leadId={leadId}
          accountId={accountId}
          instanceId={scopedInstanceId}
          orderLoginApprovalPending={isOrderLoginLocked}
          orderLoginApprovalPendingTooltip={lockedTabsTooltip}
        />
      ),
    },
  ];

  const lead = leadResponse?.data?.lead;
  const isSoValueReceived = lead?.is_so_value_received === true;
  const soValueReceivedAt = lead?.so_value_received_at ?? null;
  const formatSoValueReceivedAt = (value: string | null) => {
    if (!value) return "";

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
      .format(new Date(value))
      .replace(", ", " - ");
  };

  const handleSoValueToggle = async (checked: boolean) => {
    if (!userId) return;

    try {
      await updateSoValueReceived.mutateAsync({
        is_so_value_received: checked,
        updated_by: userId,
      });
      toastManager.add({
        title: checked
          ? "SO value marked as sent."
          : "SO value marked as not sent.",
        type: "success",
      });
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update SO value status.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6 bg-[#fff] dark:bg-[#0a0a0a]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-4"
      >
        <ClientRequiredDeliveryDateBanner leadId={leadId} />
      </motion.div>

      {hasMultipleInstances &&
        instances.length > 0 &&
        techCheckInstanceStatus?.is_tech_check_completed === true &&
        techCheckInstanceStatus?.is_order_login_completed === true &&
        techCheckInstanceStatus?.is_production_completed === true &&
        !lockInstanceFromUrl && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <motion.div variants={containerVariants}>
              <div className="border-b border-border">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex items-end gap-2 sm:flex-wrap">
                    {instances.map((instance: any) => {
                      const isActive = scopedInstanceId === instance.id;
                      return (
                        <div
                          key={instance.id}
                          onClick={() => setActiveInstanceId(instance.id)}
                          className={`
                cursor-pointer transition-all shrink-0
                px-3 py-2 rounded-t-lg border border-b-0
                min-w-[100px] max-w-[160px]
                ${
                  isActive
                    ? "bg-background text-foreground border-border"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                }
              `}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-semibold leading-none truncate w-full">
                              {instance.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1 truncate w-full">
                              {instance.productStructure?.type ||
                                "Product Structure"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </motion.div>
          </motion.div>
        )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <SmoothTab
          key={`${leadId}-${scopedInstanceId ?? "all"}-${resolvedDefaultTab}-${isOrderLoginLocked ? "locked" : "open"}-${isSmallOrderRequestLead ? "small-order" : "standard"}`}
          defaultTabId={resolvedDefaultTab}
          className="-mt-3"
          items={tabItems}
        />

        <div className="flex items-start gap-3 xl:shrink-0 xl:pt-1">
          <Checkbox
            checked={isSoValueReceived}
            disabled={updateSoValueReceived.isPending || !userId}
            onCheckedChange={(checked) => handleSoValueToggle(checked === true)}
            className="mt-1 data-[state=checked]:bg-[#8F8F8F] data-[state=checked]:border-[#8F8F8F]"
          />
          <div className="space-y-1">
            <p className="text-[15px] font-medium text-foreground">
              SO Value Sent
            </p>
            <p className="text-sm text-muted-foreground">
              {isSoValueReceived && soValueReceivedAt
                ? formatSoValueReceivedAt(soValueReceivedAt)
                : "Currently SO value is considered as not sent."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderLoginDetails;
