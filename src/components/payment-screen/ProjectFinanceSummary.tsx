"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { toastManager } from "@/components/ui/toast";
import {
  useAddPayment,
  usePaymentLogs,
  useUpdateBasicAmount,
  useUpdateBookingAmount,
  useUpdateGstPercentage,
} from "@/hooks/booking-stage/use-booking";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "../custom/CurrencyInput";
import { formatCurrencyINR } from "@/utils/formatCurrency";
import { Label } from "../ui/label";
import CustomeTooltip from "@/components/custom-tooltip";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import BaseModal from "@/components/utils/baseModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const GST_OPTIONS = [0, 5, 12, 18, 28] as const;

interface ProjectFinanceSummaryProps {
  leadId: number;
  accountId: number;
  activeProductTypeId?: number | null;
  hideAddPaymentForm?: boolean;
  productTypePayment?: {
    amount: number;
    basic_amount?: number | null;
    gst_percentage?: number | null;
    gst_amount?: number | null;
    total_amount?: number | null;
  } | null;
}

type FormValues = {
  product_type_id: string;
  amount: number;
  payment_date: string;
  payment_text: string;
  payment_file: File[];
};

type BookingAmountEditValues = {
  booking_amount: number;
};

type BasicAmountEditValues = {
  basic_amount: number;
};

type GstPercentageEditValues = {
  gst_percentage: string;
};

export default function ProjectFinanceSummary({
  leadId,
  accountId,
  activeProductTypeId,
  hideAddPaymentForm = false,
  productTypePayment = null,
}: ProjectFinanceSummaryProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const handlesLargeScaleProjects = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isSuperAdmin = userType?.toLowerCase() === "super-admin";
  const isAuditor = userType?.toLowerCase() === "auditor";
  const [bookingAmountEditOpen, setBookingAmountEditOpen] = useState(false);
  const [basicAmountEditOpen, setBasicAmountEditOpen] = useState(false);
  const [gstPercentageEditOpen, setGstPercentageEditOpen] = useState(false);
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
    handlesLargeScaleProjects,
  );

  // ✅ Lead block access control
  const { blockedTooltip, shouldDisableBlockedActions } = useLeadAccessControl({
    leadId,
    userType,
  });

  const { data, isLoading, refetch } = usePaymentLogs(leadId, vendorId);

  const projectFinance = data?.project_finance;
  const paymentLogs = Array.isArray(data?.payment_logs) ? data.payment_logs : [];
  const scopedPaymentLogs = useMemo(
    () =>
      activeProductTypeId != null
        ? paymentLogs.filter((log) => log.product_type_id === activeProductTypeId)
        : paymentLogs,
    [activeProductTypeId, paymentLogs],
  );
  const scopedBookingPayment = useMemo(() => {
    if (activeProductTypeId == null) return null;

    return scopedPaymentLogs.reduce<(typeof scopedPaymentLogs)[number] | null>(
      (latest, log) => {
        if (!log.is_booking_received_amt) return latest;
        if (!latest) return log;
        return (log.id ?? 0) >= (latest.id ?? 0) ? log : latest;
      },
      null,
    );
  }, [activeProductTypeId, scopedPaymentLogs]);
  const scopedPaidAmount = useMemo(
    () =>
      scopedPaymentLogs.reduce(
        (sum, log) => sum + Number(log.amount || 0),
        0,
      ),
    [scopedPaymentLogs],
  );

  const totalProjectAmount =
    activeProductTypeId != null
      ? Number(
          productTypePayment?.total_amount ??
            scopedBookingPayment?.total_amount ??
            0,
        )
      : projectFinance?.total_project_amount ?? 0;
  const bookingAmount =
    activeProductTypeId != null
      ? Number(
          productTypePayment?.amount ?? scopedBookingPayment?.amount ?? 0,
        )
      : projectFinance?.booking_amount ?? 0;
  const pendingAmount =
    activeProductTypeId != null
      ? Math.max(totalProjectAmount - scopedPaidAmount, 0)
      : projectFinance?.pending_amount ?? 0;
  const mrpValue = projectFinance?.mrp_value ?? 0;
  const overallReceivedAmount =
    activeProductTypeId == null
      ? Math.max(totalProjectAmount - pendingAmount, 0)
      : null;
  const scopedBasicAmount =
    activeProductTypeId != null
      ? Number(productTypePayment?.basic_amount || 0)
      : null;
  const scopedGstPercentage =
    activeProductTypeId != null
      ? Number(productTypePayment?.gst_percentage || 0)
      : null;
  const scopedGstAmount =
    activeProductTypeId != null
      ? Number(productTypePayment?.gst_amount || 0)
      : null;
  const leadProductTypeOptions = useMemo(() => {
    const instances = Array.isArray(structureInstancesData?.data)
      ? structureInstancesData.data
      : [];
    const unique = new Map<number, string>();

    for (const instance of instances) {
      const productTypeId =
        instance.product_type_id ??
        instance.productType?.id ??
        instance.productItemCode?.productStructure?.productType?.id;
      const label =
        instance.productType?.type ??
        instance.productItemCode?.productStructure?.productType?.type;

      if (!productTypeId || !label || unique.has(productTypeId)) continue;
      unique.set(productTypeId, label);
    }

    return Array.from(unique.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [structureInstancesData?.data]);

  const schema = useMemo(
    () =>
      z.object({
        product_type_id:
          handlesLargeScaleProjects
            ? z.string().min(1, "Product type is required")
            : z.string().optional(),
        amount: z
          .number({ message: "Amount is required" })
          .positive("Amount must be greater than 0")
          .max(
            pendingAmount,
            `Amount cannot exceed pending amount (₹${pendingAmount.toLocaleString()})`,
          ),
        payment_date: z
          .string({ message: "Payment date is required" })
          .refine((val) => {
            const d = new Date(val);
            if (isNaN(d.getTime())) return false;
            const now = new Date();
            return d.getTime() <= now.getTime();
          }, "Payment date cannot be in the future"),
        payment_text: z
          .string({ message: "Description is required" })
          .trim()
          .min(1, "Description is required"),
        payment_file: z
          .array(z.instanceof(File))
          .max(1, "Only one file allowed")
          .refine(
            (files) =>
              files.length === 0 ||
              files.every((f) => /image\/(png|jpe?g)/i.test(f.type)),
            "Only image files are allowed (JPG/PNG)",
          ),
      }),
    [activeProductTypeId, handlesLargeScaleProjects, pendingAmount],
  );
  const paymentFormResolver = zodResolver(schema) as unknown as any;

  const maxEditableBookingAmount = bookingAmount + pendingAmount;
  const bookingAmountEditSchema = useMemo(
    () =>
      z.object({
        booking_amount: z
          .number({ message: "Booking amount is required" })
          .min(0, "Booking amount cannot be negative")
          .max(
            maxEditableBookingAmount,
            `Booking amount cannot exceed ₹${maxEditableBookingAmount.toLocaleString("en-IN")}`,
          ),
      }),
    [maxEditableBookingAmount],
  );

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: paymentFormResolver,
    defaultValues: {
      product_type_id:
        handlesLargeScaleProjects && activeProductTypeId != null
          ? String(activeProductTypeId)
          : "",
      amount: undefined as unknown as number,
      payment_date: "",
      payment_text: "N/A",
      payment_file: [],
    },
  });

  useEffect(() => {
    if (!handlesLargeScaleProjects) return;

    if (activeProductTypeId != null) {
      reset({
        product_type_id: String(activeProductTypeId),
        amount: watch("amount"),
        payment_date: watch("payment_date"),
        payment_text: watch("payment_text"),
        payment_file: watch("payment_file"),
      });
      return;
    }

    setValue("product_type_id", "", {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [
    activeProductTypeId,
    handlesLargeScaleProjects,
    reset,
    setValue,
    watch,
  ]);

  const {
    handleSubmit: handleBookingAmountEditSubmit,
    setValue: setBookingAmountEditValue,
    watch: watchBookingAmountEdit,
    reset: resetBookingAmountEdit,
    formState: {
      errors: bookingAmountEditErrors,
      isSubmitting: isBookingAmountEditSubmitting,
    },
  } = useForm<BookingAmountEditValues>({
    resolver: zodResolver(bookingAmountEditSchema),
    defaultValues: {
      booking_amount: bookingAmount,
    },
  });

  const updateBookingAmountMutation = useUpdateBookingAmount();
  const updateBasicAmountMutation = useUpdateBasicAmount();
  const updateGstPercentageMutation = useUpdateGstPercentage();

  const canEditLargeScaleBookingAmount =
    isSuperAdmin && handlesLargeScaleProjects && activeProductTypeId != null;
  const canEditLargeScaleBasicAmount =
    isSuperAdmin && handlesLargeScaleProjects && activeProductTypeId != null;

  const bookingAmountDelta = Math.max(
    0,
    Number(watchBookingAmountEdit("booking_amount") || 0) - bookingAmount,
  );
  const amountReceivedForBasicEdit =
    activeProductTypeId != null ? scopedPaidAmount : 0;
  const {
    handleSubmit: handleBasicAmountEditSubmit,
    setValue: setBasicAmountEditValue,
    watch: watchBasicAmountEdit,
    reset: resetBasicAmountEdit,
    formState: {
      errors: basicAmountEditErrors,
      isSubmitting: isBasicAmountEditSubmitting,
    },
  } = useForm<BasicAmountEditValues>({
    resolver: zodResolver(
      z.object({
        basic_amount: z
          .number({ message: "Basic amount is required" })
          .min(
            amountReceivedForBasicEdit,
            `Basic amount cannot be less than ₹${amountReceivedForBasicEdit.toLocaleString("en-IN")}`,
          ),
      }),
    ),
    defaultValues: {
      basic_amount: scopedBasicAmount ?? 0,
    },
  });
  const watchedBasicAmount = Number(watchBasicAmountEdit("basic_amount") || 0);
  const watchedBasicGstAmount =
    watchedBasicAmount * (Number(scopedGstPercentage || 0) / 100);
  const watchedBasicTotalAmount = watchedBasicAmount + watchedBasicGstAmount;
  const watchedBasicPendingAmount = Math.max(
    watchedBasicTotalAmount - amountReceivedForBasicEdit,
    0,
  );
  const {
    handleSubmit: handleGstPercentageEditSubmit,
    setValue: setGstPercentageEditValue,
    watch: watchGstPercentageEdit,
    reset: resetGstPercentageEdit,
    formState: {
      errors: gstPercentageEditErrors,
      isSubmitting: isGstPercentageEditSubmitting,
    },
  } = useForm<GstPercentageEditValues>({
    resolver: zodResolver(
      z.object({
        gst_percentage: z
          .string()
          .refine(
            (value) =>
              GST_OPTIONS.includes(Number(value) as (typeof GST_OPTIONS)[number]),
            "Select a valid GST %",
          ),
      }),
    ),
    defaultValues: {
      gst_percentage: String(scopedGstPercentage || 0),
    },
  });
  const watchedGstPercentage = Number(watchGstPercentageEdit("gst_percentage") || 0);
  const watchedGstAmount =
    Number(scopedBasicAmount || 0) * (watchedGstPercentage / 100);
  const watchedGstTotalAmount = Number(scopedBasicAmount || 0) + watchedGstAmount;
  const watchedGstPendingAmount = Math.max(
    watchedGstTotalAmount - amountReceivedForBasicEdit,
    0,
  );

  const addPaymentMutation = useAddPayment();

  const onSubmit = (values: FormValues) => {
    addPaymentMutation.mutate(
      {
        lead_id: leadId,
        account_id: accountId,
        vendor_id: vendorId,
        product_type_id:
          values.product_type_id && Number(values.product_type_id) > 0
            ? Number(values.product_type_id)
            : undefined,
        created_by: userId,
        amount: values.amount,
        payment_text: values.payment_text,
        payment_date: values.payment_date,
        payment_file: values.payment_file?.[0],
      },
      {
        onSuccess: () => {
          toastManager.add({ title: "Payment added successfully!", type: "success" });
          reset({
            product_type_id:
              handlesLargeScaleProjects && activeProductTypeId != null
                ? String(activeProductTypeId)
                : "",
            amount: undefined as unknown as number,
            payment_date: "",
            payment_text: "N/A",
            payment_file: [],
          });
          refetch();
        },
        onError: () => {
          toastManager.add({ title: "Failed to add payment", type: "error" });
        },
      },
    );
  };

  const onBookingAmountEditSubmit = (values: BookingAmountEditValues) => {
    updateBookingAmountMutation.mutate(
      {
        vendorId,
        leadId,
        bookingAmount: values.booking_amount,
        updatedBy: userId,
        productTypeId: activeProductTypeId ?? undefined,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Booking amount updated successfully!",
            type: "success",
          });
          resetBookingAmountEdit({ booking_amount: values.booking_amount });
          setBookingAmountEditOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update booking amount",
            type: "error",
          });
        },
      },
    );
  };

  const onBasicAmountEditSubmit = (values: BasicAmountEditValues) => {
    if (activeProductTypeId == null) return;

    updateBasicAmountMutation.mutate(
      {
        vendorId,
        leadId,
        basicAmount: values.basic_amount,
        updatedBy: userId,
        productTypeId: activeProductTypeId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Basic amount updated successfully!",
            type: "success",
          });
          resetBasicAmountEdit({ basic_amount: values.basic_amount });
          setBasicAmountEditOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update basic amount",
            type: "error",
          });
        },
      },
    );
  };

  const onGstPercentageEditSubmit = (values: GstPercentageEditValues) => {
    if (activeProductTypeId == null) return;

    updateGstPercentageMutation.mutate(
      {
        vendorId,
        leadId,
        gstPercentage: Number(values.gst_percentage),
        updatedBy: userId,
        productTypeId: activeProductTypeId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "GST percentage updated successfully!",
            type: "success",
          });
          resetGstPercentageEdit({ gst_percentage: values.gst_percentage });
          setGstPercentageEditOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update GST percentage",
            type: "error",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <motion.div
        variants={itemVariants}
        className="border rounded-lg p-6 shadow-sm bg-card flex justify-center items-center"
      >
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="h-fit w-full rounded-lg bg-card flex flex-col gap-4 overflow-y-auto"
    >
      {/* ── Project Finance Summary ──────────────────────────────────────────── */}
      <Card className="p-4 w-full shadow-sm text-center">
        <h2 className="text-lg font-semibold mb-4">Project Finance Summary</h2>
        <div
          className={`grid gap-4 ${
            activeProductTypeId != null
              ? "grid-cols-2 md:grid-cols-3"
              : handlesLargeScaleProjects
              ? bookingAmount > 0
                ? "grid-cols-4"
                : "grid-cols-2"
              : bookingAmount > 0
                ? "grid-cols-4"
                : "grid-cols-3"
          }`}
        >
          <div className="flex flex-col justify-between h-full">
            <p className="text-muted-foreground text-sm">Total Project</p>
            <p className="font-bold text-lg">
              {formatCurrencyINR(totalProjectAmount)}
            </p>
          </div>
          {activeProductTypeId != null && (
            <div className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground text-sm">Basic Amount</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-bold text-lg">
                  {formatCurrencyINR(scopedBasicAmount || 0)}
                </p>
                {canEditLargeScaleBasicAmount && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      resetBasicAmountEdit({
                        basic_amount: scopedBasicAmount || 0,
                      });
                      setBasicAmountEditOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
          {activeProductTypeId != null && (
            <div className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground text-sm">
                GST Amount ({scopedGstPercentage || 0}%)
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-bold text-lg">
                  {formatCurrencyINR(scopedGstAmount || 0)}
                </p>
                {canEditLargeScaleBasicAmount && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      resetGstPercentageEdit({
                        gst_percentage: String(scopedGstPercentage || 0),
                      });
                      setGstPercentageEditOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
          {!handlesLargeScaleProjects && (
            <div className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground text-sm">MRP Value</p>
              <p className="font-bold text-lg">{formatCurrencyINR(mrpValue)}</p>
            </div>
          )}
          {bookingAmount > 0 && (
            <div className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground text-sm">Booking Amount</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-bold text-lg">
                  {formatCurrencyINR(bookingAmount)}
                </p>
                {canEditLargeScaleBookingAmount && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      resetBookingAmountEdit({
                        booking_amount: bookingAmount,
                      });
                      setBookingAmountEditOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
          {activeProductTypeId == null && handlesLargeScaleProjects && (
            <div className="flex flex-col justify-between h-full">
              <p className="text-muted-foreground text-sm">Amount Received</p>
              <p className="font-bold text-lg">
                {formatCurrencyINR(overallReceivedAmount || 0)}
              </p>
            </div>
          )}
          <div className="flex flex-col justify-between h-full">
            <p className="text-muted-foreground text-sm">Pending Amount</p>
            <p className="font-bold text-lg text-red-500">
              {formatCurrencyINR(pendingAmount)}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Add Additional Payment Form ───────────────────────────────────────── */}
      {!isAuditor && !hideAddPaymentForm && (
        <Card className="p-4 shadow-sm">
          <h3 className="text-md font-semibold mb-3">Add Additional Payment</h3>

        <form
          onSubmit={
            shouldDisableBlockedActions
              ? (e) => e.preventDefault()
              : handleSubmit(onSubmit)
          }
          className="space-y-4"
        >
          {/* ✅ Blocked notice banner */}
          {shouldDisableBlockedActions && (
            <div className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
              {blockedTooltip}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {handlesLargeScaleProjects && (
              <div className="w-full">
                <Label className="mb-2">Product Type</Label>
                <CustomeTooltip
                  value={shouldDisableBlockedActions ? blockedTooltip : ""}
                  truncateValue={
                    <span className="block w-full">
                      <Select
                        value={watch("product_type_id") || ""}
                        onValueChange={(value) =>
                          setValue("product_type_id", value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        disabled={
                          shouldDisableBlockedActions || activeProductTypeId != null
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                        <SelectContent>
                          {leadProductTypeOptions.map((option) => (
                            <SelectItem
                              key={option.id}
                              value={String(option.id)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </span>
                  }
                />
                {errors.product_type_id && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.product_type_id.message}
                  </p>
                )}
              </div>
            )}
            {/* Payment Amount */}
            <div>
              <Label className="mb-2">Payment Amount</Label>
              {/* ✅ Tooltip on amount input when blocked */}
              <CustomeTooltip
                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                truncateValue={
                  <span className="block">
                    <CurrencyInput
                      value={watch("amount")}
                      onChange={(val) =>
                        setValue("amount", val ?? 0, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      placeholder="Enter payment amount"
                      disabled={shouldDisableBlockedActions}
                    />
                  </span>
                }
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <Label className="mb-2">Payment Date</Label>
              {/* ✅ Tooltip on date picker when blocked */}
              <CustomeTooltip
                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                truncateValue={
                  <span className="block">
                    <div
                      className={
                        shouldDisableBlockedActions
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }
                    >
                      <CustomeDatePicker
                        value={watch("payment_date")}
                        onChange={(value?: string) =>
                          setValue("payment_date", value ?? "", {
                            shouldValidate: true,
                          })
                        }
                        restriction="pastOnly"
                      />
                    </div>
                  </span>
                }
              />
              {errors.payment_date && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.payment_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Payment File */}
          <div>
            <Label className="mb-2">Payment Receipt (optional)</Label>
            {/* ✅ Tooltip on file upload when blocked */}
            <CustomeTooltip
              value={shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="block">
                  <FileUploadField
                    value={watch("payment_file")}
                    onChange={(files) =>
                      setValue("payment_file", files, { shouldValidate: true })
                    }
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                    disabled={shouldDisableBlockedActions}
                  />
                </span>
              }
            />
            {errors.payment_file && (
              <p className="text-xs text-red-500 mt-1">
                {errors.payment_file.message as string}
              </p>
            )}
          </div>

          {/* Payment Text */}
          <div>
            <Label className="mb-2">Payment Description</Label>
            {/* ✅ Tooltip on textarea when blocked */}
            <CustomeTooltip
              value={shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="block">
                  <TextAreaInput
                    value={watch("payment_text")}
                    onChange={(val) =>
                      setValue("payment_text", val, { shouldValidate: true })
                    }
                    placeholder="Enter payment description"
                    disabled={shouldDisableBlockedActions}
                  />
                </span>
              }
            />
            {errors.payment_text && (
              <p className="text-xs text-red-500 mt-1">
                {errors.payment_text.message}
              </p>
            )}
          </div>

          {/* ✅ Submit button — tooltip when blocked */}
          <div className="flex justify-end">
            <CustomeTooltip
              value={shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="inline-block">
                  <Button
                    type="submit"
                    disabled={
                      addPaymentMutation.isPending ||
                      isSubmitting ||
                      shouldDisableBlockedActions
                    }
                  >
                    {addPaymentMutation.isPending ? "Submitting..." : "Submit Payment"}
                  </Button>
                </span>
              }
            />
          </div>
        </form>
      </Card>
      )}

      <BaseModal
        open={bookingAmountEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetBookingAmountEdit({ booking_amount: bookingAmount });
          }
          setBookingAmountEditOpen(open);
        }}
        title="Edit Booking Amount"
        description="Updating booking amount will automatically recalculate the pending amount."
        size="md"
      >
        <form
          onSubmit={handleBookingAmountEditSubmit(onBookingAmountEditSubmit)}
          className="space-y-4 p-5"
        >
          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Booking Amount</span>
              <span className="font-medium">
                {formatCurrencyINR(bookingAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Current Pending Amount</span>
              <span className="font-medium">
                {formatCurrencyINR(pendingAmount)}
              </span>
            </div>
          </div>

          <div>
            <Label className="mb-2">Booking Amount</Label>
            <CurrencyInput
              value={watchBookingAmountEdit("booking_amount")}
              onChange={(val) =>
                setBookingAmountEditValue("booking_amount", val ?? 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder="Enter booking amount"
              disabled={updateBookingAmountMutation.isPending}
            />
            {bookingAmountEditErrors.booking_amount && (
              <p className="mt-1 text-xs text-red-500">
                {bookingAmountEditErrors.booking_amount.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Increase Applied</span>
              <span className="font-medium">
                {formatCurrencyINR(bookingAmountDelta)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Updated Pending Amount</span>
              <span className="font-medium text-red-500">
                {formatCurrencyINR(
                  Math.max(
                    0,
                    pendingAmount - bookingAmountDelta,
                  ),
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetBookingAmountEdit({ booking_amount: bookingAmount });
                setBookingAmountEditOpen(false);
              }}
              disabled={updateBookingAmountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateBookingAmountMutation.isPending ||
                isBookingAmountEditSubmitting
              }
            >
              {updateBookingAmountMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        open={basicAmountEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetBasicAmountEdit({ basic_amount: scopedBasicAmount || 0 });
          }
          setBasicAmountEditOpen(open);
        }}
        title="Edit Basic Amount"
        description="Updating basic amount will automatically recalculate GST amount, total project amount, and pending amount."
        size="md"
      >
        <form
          onSubmit={handleBasicAmountEditSubmit(onBasicAmountEditSubmit)}
          className="space-y-4 p-5"
        >
          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Basic Amount</span>
              <span className="font-medium">
                {formatCurrencyINR(scopedBasicAmount || 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Amount Received</span>
              <span className="font-medium">
                {formatCurrencyINR(amountReceivedForBasicEdit)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">
                Current GST Percentage
              </span>
              <span className="font-medium">{scopedGstPercentage || 0}%</span>
            </div>
          </div>

          <div>
            <Label className="mb-2">Basic Amount</Label>
            <CurrencyInput
              value={watchBasicAmountEdit("basic_amount")}
              onChange={(val) =>
                setBasicAmountEditValue("basic_amount", val ?? 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder="Enter basic amount"
              disabled={updateBasicAmountMutation.isPending}
            />
            {basicAmountEditErrors.basic_amount && (
              <p className="mt-1 text-xs text-red-500">
                {basicAmountEditErrors.basic_amount.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                GST Amount ({scopedGstPercentage || 0}%)
              </span>
              <span className="font-medium">
                {formatCurrencyINR(watchedBasicGstAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Updated Total Project</span>
              <span className="font-medium">
                {formatCurrencyINR(watchedBasicTotalAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Updated Pending Amount</span>
              <span className="font-medium text-red-500">
                {formatCurrencyINR(watchedBasicPendingAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetBasicAmountEdit({ basic_amount: scopedBasicAmount || 0 });
                setBasicAmountEditOpen(false);
              }}
              disabled={updateBasicAmountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateBasicAmountMutation.isPending ||
                isBasicAmountEditSubmitting
              }
            >
              {updateBasicAmountMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        open={gstPercentageEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetGstPercentageEdit({
              gst_percentage: String(scopedGstPercentage || 0),
            });
          }
          setGstPercentageEditOpen(open);
        }}
        title="Edit GST Percentage"
        description="Select GST % to recalculate the GST amount and total project amount for this product type."
        size="md"
      >
        <form
          onSubmit={handleGstPercentageEditSubmit(onGstPercentageEditSubmit)}
          className="space-y-4 p-5"
        >
          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Basic Amount</span>
              <span className="font-medium">
                {formatCurrencyINR(scopedBasicAmount || 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Amount Received</span>
              <span className="font-medium">
                {formatCurrencyINR(amountReceivedForBasicEdit)}
              </span>
            </div>
          </div>

          <div>
            <Label className="mb-2">GST %</Label>
            <Select
              value={watchGstPercentageEdit("gst_percentage")}
              onValueChange={(value) =>
                setGstPercentageEditValue("gst_percentage", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              disabled={updateGstPercentageMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select GST %" />
              </SelectTrigger>
              <SelectContent>
                {GST_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gstPercentageEditErrors.gst_percentage && (
              <p className="mt-1 text-xs text-red-500">
                {gstPercentageEditErrors.gst_percentage.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                GST Amount ({watchedGstPercentage}%)
              </span>
              <span className="font-medium">
                {formatCurrencyINR(watchedGstAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Updated Total Project</span>
              <span className="font-medium">
                {formatCurrencyINR(watchedGstTotalAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">Updated Pending Amount</span>
              <span className="font-medium text-red-500">
                {formatCurrencyINR(watchedGstPendingAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetGstPercentageEdit({
                  gst_percentage: String(scopedGstPercentage || 0),
                });
                setGstPercentageEditOpen(false);
              }}
              disabled={updateGstPercentageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateGstPercentageMutation.isPending ||
                isGstPercentageEditSubmitting
              }
            >
              {updateGstPercentageMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </BaseModal>
    </motion.div>
  );
}
