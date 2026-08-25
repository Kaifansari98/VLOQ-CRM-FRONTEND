"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ProjectFinanceSummary from "../payment-screen/ProjectFinanceSummary";
import PaymentLogs from "../payment-screen/PaymentLogs";
import BillingInformationModal from "../payment-screen/BillingInformationModal";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { cn } from "@/lib/utils";
import { useBookingLeadById } from "@/hooks/booking-stage/use-booking";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

interface PaymentInformationProps {
  accountId: number;
  leadIdProps?: number;
}

export default function PaymentInformation({
  accountId,
  leadIdProps,
}: PaymentInformationProps) {
  const { lead } = useParams();
  const leadIdNum = lead ? Number(lead) : null;
  const finalLeadId = leadIdNum || leadIdProps;
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    finalLeadId ?? undefined,
    vendorId,
    Boolean(handlesLargeScaleProjects && finalLeadId && vendorId),
  );
  const { data: bookingLeadData } = useBookingLeadById(
    vendorId ?? undefined,
    finalLeadId ?? undefined,
  );
  const productTypeTabs = useMemo(() => {
    const instances = Array.isArray(structureInstancesData?.data)
      ? structureInstancesData.data
      : [];
    const grouped = new Map<number, { productTypeId: number; label: string }>();

    for (const instance of instances) {
      const productTypeId =
        instance.product_type_id ??
        instance.productType?.id ??
        instance.productItemCode?.productStructure?.productType?.id;
      const label =
        instance.productType?.type ??
        instance.productItemCode?.productStructure?.productType?.type;

      if (!productTypeId || !label || grouped.has(productTypeId)) continue;

      grouped.set(productTypeId, {
        productTypeId,
        label,
      });
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [structureInstancesData?.data]);
  const shouldShowProductTabs =
    handlesLargeScaleProjects && productTypeTabs.length > 1;
  const [activeTab, setActiveTab] = useState<"overall" | number>("overall");

  useEffect(() => {
    setActiveTab("overall");
  }, [finalLeadId]);

  if (!finalLeadId) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Lead ID not available.
      </div>
    );
  }

  const effectiveActiveTab =
    shouldShowProductTabs &&
    activeTab !== "overall" &&
    !productTypeTabs.some((tab) => tab.productTypeId === activeTab)
      ? "overall"
      : activeTab;
  const activeProductTypeId =
    effectiveActiveTab === "overall" ? null : effectiveActiveTab;
  const paymentByProductType = useMemo(() => {
    const map = new Map<
      number,
      NonNullable<typeof bookingLeadData>["payments"][number]
    >();
    const payments = Array.isArray(bookingLeadData?.payments)
      ? bookingLeadData.payments
      : [];

    for (const payment of payments) {
      if (!payment?.product_type_id) continue;

      const existing = map.get(payment.product_type_id);
      const existingScore =
        (existing?.total_amount != null ? 10 : 0) + (existing?.id ?? 0);
      const nextScore =
        (payment.total_amount != null ? 10 : 0) + (payment.id ?? 0);

      if (!existing || nextScore >= existingScore) {
        map.set(payment.product_type_id, payment);
      }
    }

    return map;
  }, [bookingLeadData?.payments]);
  const activeProductTypePayment =
    activeProductTypeId != null
      ? paymentByProductType.get(activeProductTypeId) ?? null
      : null;
  const overallBookingAmount = useMemo(() => {
    const payments = Array.isArray(bookingLeadData?.payments)
      ? bookingLeadData.payments
      : [];

    return payments.reduce(
      (sum, payment) => sum + Number(payment?.amount || 0),
      0,
    );
  }, [bookingLeadData?.payments]);
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className={cn(!shouldShowProductTabs && "flex-1")}>
          <div className="flex space-x-6 overflow-x-auto pb-px scrollbar-none">
            {(shouldShowProductTabs
              ? [
                  { key: "overall" as const, label: "Overall Payments" },
                  ...productTypeTabs.map((tab) => ({
                    key: tab.productTypeId as number,
                    label: tab.label,
                  })),
                ]
              : [{ key: "overall" as const, label: "Overall Payments" }]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative whitespace-nowrap pb-3 text-sm font-medium transition-colors focus-visible:outline-none",
                    effectiveActiveTab === tab.key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/80",
                  )}
                >
                  <span>{tab.label}</span>
                  {effectiveActiveTab === tab.key && (
                    <motion.div
                      layoutId="payment-info-active-tab-line"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => setBillingModalOpen(true)}>
            <MapPin className="mr-2 h-4 w-4" />
            Billing Information
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="
          flex w-full gap-4
          flex-col-reverse
          md:flex-row
          items-start
        "
      >
        <div className="w-full md:flex-1">
          <PaymentLogs
            key={`payment-logs-${finalLeadId}-${activeProductTypeId ?? "overall"}`}
            leadIdProps={finalLeadId}
            activeProductTypeId={activeProductTypeId}
            productTypePaymentLog={activeProductTypePayment}
          />
        </div>

        <div className="w-full shrink-0 md:flex-1">
          <ProjectFinanceSummary
            key={`payment-summary-${finalLeadId}-${activeProductTypeId ?? "overall"}`}
            leadId={finalLeadId}
            accountId={accountId}
            activeProductTypeId={activeProductTypeId}
            overallBookingAmountOverride={overallBookingAmount}
            productTypePayment={activeProductTypePayment}
          />
        </div>
      </motion.div>

      {vendorId && (
        <BillingInformationModal
          open={billingModalOpen}
          onOpenChange={setBillingModalOpen}
          leadId={finalLeadId}
          vendorId={vendorId}
          productTypeTabs={productTypeTabs}
          activeProductTypeId={activeProductTypeId}
        />
      )}
    </div>
  );
}
