"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import ProductionFilesSection from "./ProductionFilesModal";
import ApprovedDocsSection from "./ApprovedDocsModal";
import OrderLoginTab from "./OrderloginTab";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { useAppSelector } from "@/redux/store";

interface OrderLoginDetailsProps {
  leadId: number;
  accountId: number;
  name?: string;
  forceDefaultTab?: string;
}

const OrderLoginDetails: React.FC<OrderLoginDetailsProps> = ({
  leadId,
  accountId,
  forceDefaultTab,
}) => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data } = useClientRequiredCompletionDate(vendorId, leadId);

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
    tabMapping[tabParam || ""] || forceDefaultTab
      ? "order-login"
      : "approved-docs";

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
              <ProductionFilesSection leadId={leadId} accountId={accountId} />
            ),
          },
          {
            id: "order-login",
            title: "Order Login",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: (
              <OrderLoginTab leadId={leadId} accountId={accountId} />
            ),
          },
        ]}
      />
    </div>
  );
};

export default OrderLoginDetails;