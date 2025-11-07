"use client";

import { useAppSelector } from "@/redux/store";
import { useOrderLoginByLead } from "@/api/production/order-login";
import OrderLoginCard from "./OrderLoginCard";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { motion } from "framer-motion";

interface PreProductionDetailsProps {
  leadId?: number;
  accountId?: number;
}

export default function PreProductionDetails({
  leadId,
  accountId,
}: PreProductionDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data, isLoading, isError } = useOrderLoginByLead(vendorId, leadId);
  const {
    data: ClientRequiredCompletionDate,
    isLoading: ClientRequiredCompletionDateIsLoading,
  } = useClientRequiredCompletionDate(vendorId, leadId);

  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">
        Loading order login data...
      </p>
    );

  if (isError)
    return (
      <p className="text-sm text-red-500">Failed to load order login data.</p>
    );

  const orders = Array.isArray(data) ? data : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  return (
    <div className="space-y-4">
      <motion.div
        className="w-full flex items-center justify-start gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Animated green circle */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-full space-y-8 overflow-y-scroll"
        >
          {/* 🔹 Client Required Completion Section */}
          <motion.div
            className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ✅ Animated green status dot */}
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut",
              }}
            />

            {/* ✅ Text + Date */}
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground tracking-wide">
                Client required delivery date
              </p>
              <span className="text-sm font-medium text-foreground mt-0.5">
                {ClientRequiredCompletionDate?.client_required_order_login_complition_date
                  ? new Date(
                      ClientRequiredCompletionDate.client_required_order_login_complition_date
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
      </motion.div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No order login details found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((item) => (
            <OrderLoginCard
              key={item.id}
              orderLoginId={item.id}
              title={item.item_type}
              desc={item.item_desc}
              companyVendorName={item.companyVendor?.company_name}
              companyVendorContact={item.companyVendor?.contact_no}
              leadId={leadId || 0}
              vendorId={vendorId || 0}
              factory_user_vendor_selection_remark={
                item.factory_user_vendor_selection_remark
              }
              estimated_completion_date={item.estimated_completion_date}
              markedAsCompletedDate={item.completion_date}
            />
          ))}
        </div>
      )}
    </div>
  );
}
