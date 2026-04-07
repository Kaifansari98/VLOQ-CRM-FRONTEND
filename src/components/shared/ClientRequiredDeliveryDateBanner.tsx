"use client";

import { motion } from "framer-motion";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";

interface ClientRequiredDeliveryDateBannerProps {
  leadId: number;
  className?: string;
}

export default function ClientRequiredDeliveryDateBanner({
  leadId,
  className,
}: ClientRequiredDeliveryDateBannerProps) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const { data } = useClientRequiredCompletionDate(vendorId, leadId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        `
          flex items-center gap-3
          bg-muted/50
          dark:bg-neutral-900/50
          border border-border
          rounded-xl
          px-4 py-3
          backdrop-blur-sm
        `,
        className,
      )}
    >
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
  );
}
