"use client";

import { useAppSelector } from "@/redux/store";
import { useOrderLoginByLead } from "@/api/production/order-login";
import OrderLoginCard from "./OrderLoginCard";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { motion } from "framer-motion";
import ComingSoon from "@/components/generics/ComingSoon";

interface PreProductionDetailsProps {
  leadId?: number;
  accountId?: number;
  instanceId?: number | null;
}

export interface CompanyVendor {
  id: number;
  company_name: string;
  contact_no: string;
}

export interface OrderLoginItem {
  id: number;
  item_type: string;
  item_desc: string;

  factory_user_vendor_selection_remark: string;

  estimated_completion_date: string; // ISO string
  completion_date: string; // ISO string

  companyVendor?: CompanyVendor;

  created_at?: string;
  updated_at?: string;
}

export default function PreProductionDetails({
  leadId,
  instanceId,
}: PreProductionDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id)
  const { data, isLoading, isError } = useOrderLoginByLead(
    vendorId,
    leadId, userId!,
    instanceId ?? undefined
  );
  console.log("Under production Data: ", data);

  const { data: ClientRequiredCompletionDate } =
    useClientRequiredCompletionDate(vendorId, leadId);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading order login data...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        Unable to fetch order login data. Please retry.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ComingSoon
        heading="Order Login Not Available"
        description="This lead does not have any order login entries yet. Please initiate the order login process to continue."
      />
    );
  }

  return (
    <div className="space-y-4 bg-[#fff] dark:bg-[#0a0a0a]">
      {/* -------- Client Required Completion Section (Exact Same UI) -------- */}
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
        {/* Animated green dot */}
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

        {/* Label + Date */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-muted-foreground tracking-wide">
            Client Required Delivery Date
          </p>

          <span className="text-sm font-semibold text-foreground">
            {ClientRequiredCompletionDate?.client_required_order_login_complition_date
              ? new Date(
                  ClientRequiredCompletionDate.client_required_order_login_complition_date,
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

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No order login details found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item: OrderLoginItem) => (
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
