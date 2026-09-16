"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useParams } from "next/navigation";
import {
  usePaymentLogs,
  useUpdatePaymentLogAmount,
} from "@/hooks/booking-stage/use-booking";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import {
  ExternalLink,
  Calendar,
  User,
  FileText,
  IndianRupee,
  Clock,
  Package,
  Pencil,
} from "lucide-react";
import BaseModal from "@/components/utils/baseModal";
import CurrencyInput from "../custom/CurrencyInput";
import { Label } from "../ui/label";
import { toastManager } from "@/components/ui/toast";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PaymentLog } from "@/api/booking";

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return {
    full: `${day} ${month} ${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
};

const formatStatusType = (statusType?: string | null) => {
  if (!statusType) return null;

  const normalized = statusType.replace(/-/g, " ").trim();
  if (!normalized) return null;

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
      delay: 0.2,
    },
  },
};

const lineVariants = {
  hidden: { height: 0 },
  visible: {
    height: "100%",
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

type PaymentLogsProps = {
  leadIdProps?: number;
  activeProductTypeId?: number | null;
  productTypePaymentLog?: {
    id?: number;
    amount: number;
    total_amount?: number | null;
    payment_text?: string;
    text?: string;
    date?: string;
    file?: {
      id: number;
      originalName: string;
      signedUrl: string;
    } | null;
  } | null;
};
export default function PaymentLogs({
  leadIdProps,
  activeProductTypeId,
  productTypePaymentLog = null,
}: PaymentLogsProps) {
  const { lead } = useParams();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id) || 0;
  const userType = useAppSelector((state) => state.auth.user?.user_type?.user_type);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isSuperAdmin = userType?.toLowerCase() === "super-admin";
  const [editingLog, setEditingLog] = useState<PaymentLog | null>(null);

  // 1. URL param → 2. props → 3. null fallback
  const urlLeadId = lead ? Number(lead) : null;
  const finalLeadId = urlLeadId || leadIdProps || 0;

  // Use finalLeadId for API
  const { data, isLoading } = usePaymentLogs(finalLeadId, vendorId);
  const updatePaymentLogAmountMutation = useUpdatePaymentLogAmount();
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    finalLeadId,
    vendorId,
    handlesLargeScaleProjects,
  );

  const productTypeLabelMap = new Map<number, string>(
    (Array.isArray(structureInstancesData?.data) ? structureInstancesData.data : [])
      .map((instance: any) => {
        const productTypeId =
          instance.product_type_id ??
          instance.productType?.id ??
          instance.productItemCode?.productStructure?.productType?.id;
        const label =
          instance.productType?.type ??
          instance.productItemCode?.productStructure?.productType?.type;

        return productTypeId && label ? [productTypeId, label] : null;
      })
      .filter(Boolean) as Array<[number, string]>,
  );

  const logs = data?.payment_logs || [];
  const filteredLogs = (() => {
    if (activeProductTypeId == null) {
      return logs;
    }

    const scopedLogs = logs.filter(
      (log) => log.product_type_id === activeProductTypeId,
    );

    if (scopedLogs.length > 0) {
      return scopedLogs;
    }

    if (!productTypePaymentLog || Number(productTypePaymentLog.amount || 0) <= 0) {
      return [];
    }

    return [
      {
        id: productTypePaymentLog.id ?? -activeProductTypeId,
        amount: productTypePaymentLog.amount,
        status_id: null,
        status_type: "Booking Amount",
        product_type_id: activeProductTypeId,
        is_booking_received_amt: true,
        payment_text:
          productTypePaymentLog.payment_text ||
          productTypePaymentLog.text ||
          "",
        total_amount: productTypePaymentLog.total_amount ?? null,
        payment_date: productTypePaymentLog.date || new Date().toISOString(),
        entry_date: productTypePaymentLog.date || new Date().toISOString(),
        entered_by_id: 0,
        entered_by: "Booking Payment",
        payment_file_id: productTypePaymentLog.file?.id ?? null,
        payment_file: productTypePaymentLog.file?.signedUrl ?? null,
      },
    ];
  })();

  const visibleLogs = filteredLogs.filter((log) => Number(log.amount || 0) > 0);
  const scopedTotalProjectAmount = useMemo(() => {
    if (activeProductTypeId == null) return 0;

    const bookingLog = filteredLogs.find((log) => log.is_booking_received_amt);
    return Number(
      bookingLog?.total_amount ??
        productTypePaymentLog?.total_amount ??
        0,
    );
  }, [activeProductTypeId, filteredLogs, productTypePaymentLog?.total_amount]);
  const scopedReceivedAmount = useMemo(
    () => visibleLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0),
    [visibleLogs],
  );
  const editEnabled = isSuperAdmin && handlesLargeScaleProjects && activeProductTypeId != null;
  const maxEditableAmount =
    editingLog == null
      ? 0
      : Number(editingLog.amount || 0) +
        Math.max(scopedTotalProjectAmount - scopedReceivedAmount, 0);
  const paymentAmountEditSchema = useMemo(
    () =>
      z.object({
        amount: z
          .number({ message: "Amount is required" })
          .min(1, "Amount must be at least ₹1")
          .max(
            maxEditableAmount,
            `Amount cannot exceed ₹${maxEditableAmount.toLocaleString("en-IN")}`,
          ),
      }),
    [maxEditableAmount],
  );
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ amount: number }>({
    resolver: zodResolver(paymentAmountEditSchema),
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    if (!editingLog) return;
    reset({ amount: Number(editingLog.amount || 0) });
  }, [editingLog, reset]);

  if (!finalLeadId) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        Lead ID not available.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-2"
          />
          <p className="text-muted-foreground font-medium">
            Loading payment logs...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!visibleLogs.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <IndianRupee className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-lg">
          No payment records available.
        </p>
      </motion.div>
    );
  }

  const watchedAmount = Number(watch("amount") || 0);
  const updatedPendingAmount = Math.max(
    scopedTotalProjectAmount - (scopedReceivedAmount - Number(editingLog?.amount || 0) + watchedAmount),
    0,
  );

  const handlePaymentAmountUpdate = (values: { amount: number }) => {
    if (!editingLog || activeProductTypeId == null) return;

    updatePaymentLogAmountMutation.mutate(
      {
        vendorId,
        leadId: finalLeadId,
        paymentId: editingLog.id,
        amount: values.amount,
        updatedBy: userId,
        productTypeId: activeProductTypeId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Amount received updated successfully!",
            type: "success",
          });
          setEditingLog(null);
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update amount received",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full pl-16"
      >
        {/* Animated vertical line */}
        <motion.div
          variants={lineVariants as any}
          className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary origin-top"
          style={{ height: `calc(100% - 2rem)` }}
        />

        {visibleLogs.map((log) => {
          const formattedStatus = formatStatusType(log.status_type);

          return (
            <motion.div
              key={log.id}
              variants={itemVariants as any}
              className="relative mb-6 last:mb-0"
            >
              {/* Animated timeline dot with glow, above the line */}
              <motion.div
                variants={dotVariants as any}
                className="absolute -left-[35px] top-6 z-20" // Increased z-index
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(59, 130, 246, 0.4)",
                      "0 0 0 8px rgba(59, 130, 246, 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                  className="w-6 h-6 -mx-4 rounded-full bg-primary border-4 border-background shadow-lg"
                />
              </motion.div>

              {/* Content card with gradient border effect */}
              <motion.div
                // whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="overflow-hidden border-[1px] duration-300">
                  {/* Enhanced Header with amount */}
                  <div className="px-6 border-b flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Amount Received
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">
                            ₹{log.amount.toLocaleString("en-IN")}
                          </span>
                          {editEnabled && log.id > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingLog(log)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {formattedStatus && (
                          <p className="mt-2 text-sm font-medium text-muted-foreground">
                            {formattedStatus}
                          </p>
                        )}
                      </div>
                    </div>
                    {log.payment_file && (
                      <Button
                        variant="default"
                        size="lg"
                        onClick={() => window.open(log.payment_file!, "_blank")}
                        className="gap-2  bg-primary/90 hover:bg-primary transition-all shadow-md hover:shadow-lg"
                      >
                        <ExternalLink size={18} />
                        <h1 className="hidden md:block">View Proof</h1>
                      </Button>
                    )}
                  </div>

                  {/* Details section with icons */}
                  <div className="px-4 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Paid On
                          </p>
                          <p className="text-sm font-medium">
                            {formatDate(log.payment_date).full}
                          </p>
                          {/* <p className="text-xs text-muted-foreground">
                              {formatDate(log.payment_date).time}
                            </p> */}
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Entry Date
                          </p>
                          <p className="text-sm font-medium">
                            {formatDate(log.entry_date).full}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(log.entry_date).time}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Entered By
                          </p>
                          <p className="text-sm font-medium">
                            {log.entered_by}
                          </p>
                        </div>
                      </motion.div>

                      {handlesLargeScaleProjects && log.product_type_id && (
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Product Type
                            </p>
                            <p className="text-sm font-medium">
                              {productTypeLabelMap.get(log.product_type_id) || "N/A"}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {log.payment_text && (
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Description
                          </p>
                          <p className="text-sm font-medium leading-relaxed">
                            {log.payment_text}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      <BaseModal
        open={editingLog != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLog(null);
            reset({ amount: 0 });
          }
        }}
        title="Edit Amount Received"
        description="Update the received amount for this payment entry."
        size="md"
      >
        <form
          onSubmit={handleSubmit(handlePaymentAmountUpdate)}
          className="space-y-4 p-5"
        >
          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Amount</span>
              <span className="font-medium">
                ₹{Number(editingLog?.amount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Max Allowed</span>
              <span className="font-medium">
                ₹{maxEditableAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div>
            <Label className="mb-2">Amount Received</Label>
            <CurrencyInput
              value={watch("amount")}
              onChange={(value) =>
                setValue("amount", value ?? 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder="Enter amount received"
              disabled={updatePaymentLogAmountMutation.isPending}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product Total</span>
              <span className="font-medium">
                ₹{scopedTotalProjectAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Updated Pending Amount</span>
              <span className="font-medium text-red-500">
                ₹{updatedPendingAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingLog(null);
                reset({ amount: 0 });
              }}
              disabled={updatePaymentLogAmountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updatePaymentLogAmountMutation.isPending || isSubmitting
              }
            >
              {updatePaymentLogAmountMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </BaseModal>
    </>
  );
}
