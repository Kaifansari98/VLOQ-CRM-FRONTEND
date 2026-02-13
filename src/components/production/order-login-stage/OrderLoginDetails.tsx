"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import ProductionFilesSection from "./ProductionFilesModal";
import ApprovedDocsSection from "./ApprovedDocsModal";
import OrderLoginTab from "./OrderloginTab";
import {
  useClientRequiredCompletionDate,
  useTechCheckInstanceStatus,
} from "@/api/tech-check";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";

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
  const instanceFromUrl = instanceFromUrlRaw ? Number(instanceFromUrlRaw) : null;
  const lockInstanceFromUrl =
    Number.isFinite(instanceFromUrl) && !!instanceFromUrl;
  const resolvedInstanceId =
    Number.isFinite(instanceFromUrl) && instanceFromUrl
      ? instanceFromUrl
      : instanceId ?? null;
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;

  const { data } = useClientRequiredCompletionDate(vendorId, leadId);
  const { data: clientDocs } = useClientDocumentationDetails(vendorId, leadId);
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
  }, [
    hasMultipleInstances,
    resolvedInstanceId,
    instances,
    activeInstanceId,
  ]);

  const scopedInstanceId = hasMultipleInstances
    ? activeInstanceId
    : resolvedInstanceId;
  const { data: techCheckInstanceStatus } = useTechCheckInstanceStatus(
    vendorId,
    leadId,
    scopedInstanceId
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

  return (
    <div className="space-y-6 bg-[#fff] dark:bg-[#0a0a0a]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-4"
      >
        {/* Client Required Completion Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="
            flex items-center gap-3 
            bg-muted/50 
            dark:bg-neutral-900/50
            border border-border 
            rounded-xl 
            px-4 py-3 
            backdrop-blur-sm
          "
        >
          {/* Animated green indicator */}
          <motion.div
            className="
              w-3 h-3 rounded-full 
              bg-green-500 
              shadow-[0_0_8px_rgba(34,197,94,0.6)]
            "
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut",
            }}
          />

          {/* Text + Date */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground tracking-wide">
              Client Required Delivery Date
            </p>

            <span className="text-sm font-semibold text-foreground">
              {data?.client_required_order_login_complition_date
                ? new Date(
                    data.client_required_order_login_complition_date,
                  ).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Not specified"}
            </span>
          </div>
        </motion.div>
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
            <div className="flex flex-wrap items-end gap-2 border-b border-border">
              {instances.map((instance: any) => {
                const isActive = scopedInstanceId === instance.id;
                return (
                  <div
                    key={instance.id}
                    className={`cursor-pointer transition px-3 py-2 rounded-t-lg border border-b-0 ${
                      isActive
                        ? "bg-background text-foreground border-border shadow-sm"
                        : "bg-muted/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                    }`}
                    onClick={() => setActiveInstanceId(instance.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-semibold leading-none">
                        {instance.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {instance.productStructure?.type || "Product Structure"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      <SmoothTab
        defaultTabId={activeTab}
        className="-mt-3"
        items={[
          {
            id: "approved-docs",
            title: "Approved Documents",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: <ApprovedDocsSection leadId={leadId} />,
          },
          {
            id: "production-files",
            title: "Production Files",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: (
              <ProductionFilesSection
                leadId={leadId}
                accountId={accountId}
                instanceId={scopedInstanceId}
              />
            ),
          },
          {
            id: "order-login",
            title: "Order Login",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: (
              <OrderLoginTab
                leadId={leadId}
                accountId={accountId}
                instanceId={scopedInstanceId}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default OrderLoginDetails;
