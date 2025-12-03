"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { toast } from "react-toastify";
import {
  useAddPayment,
  usePaymentLogs,
} from "@/hooks/booking-stage/use-booking";
import { useAppSelector } from "@/redux/store";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "../custom/CurrencyInput";
import { formatCurrencyINR } from "@/utils/formatCurrency";
import { Label } from "../ui/label";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface ProjectFinanceSummaryProps {
  leadId: number;
  accountId: number;
}

type FormValues = {
  amount: number;
  payment_date: string; // ISO string from your CustomeDatePicker
  payment_text: string;
  payment_file: File[]; // we’ll take only [0] on submit
};

export default function ProjectFinanceSummary({
  leadId,
  accountId,
}: ProjectFinanceSummaryProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;

  // 🔹 Fetch finance info (also used to refetch after successful add)
  const { data, isLoading, refetch } = usePaymentLogs(leadId, vendorId);

  const projectFinance = data?.project_finance ?? {
    total_project_amount: 0,
    pending_amount: 0,
    booking_amount: 0,
  };

  // 🔹 Build Zod schema dynamically using current pending amount
  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .number({ message: "Amount is required" })
          .positive("Amount must be greater than 0")
          .max(
            projectFinance.pending_amount,
            `Amount cannot exceed pending amount (₹${projectFinance.pending_amount.toLocaleString()})`
          ),
        payment_date: z
          .string({ message: "Payment date is required" })
          .refine((val) => {
            // disallow future dates
            // Your picker returns a string; treat it as local date or ISO.
            const d = new Date(val);
            if (isNaN(d.getTime())) return false;
            const now = new Date();
            return d.getTime() <= now.getTime();
          }, "Payment date cannot be in the future"),
        payment_text: z
          .string({ message: "Description is required" })
          .trim()
          .min(1, "Description is required"),
        // Optional file; if present must be image and single (UI already enforces single)
        payment_file: z
          .array(z.instanceof(File))
          .max(1, "Only one file allowed")
          .refine(
            (files) =>
              files.length === 0 ||
              files.every((f) => /image\/(png|jpe?g)/i.test(f.type)),
            "Only image files are allowed (JPG/PNG)"
          ),
      }),
    [projectFinance.pending_amount]
  );

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined as unknown as number,
      payment_date: "",
      payment_text: "N/A",
      payment_file: [],
    },
  });

  const addPaymentMutation = useAddPayment();

  const onSubmit = (values: FormValues) => {
    addPaymentMutation.mutate(
      {
        lead_id: leadId,
        account_id: accountId,
        vendor_id: vendorId,
        client_id: 1, // as requested
        created_by: userId,
        amount: values.amount,
        payment_text: values.payment_text,
        payment_date: values.payment_date,
        payment_file: values.payment_file?.[0],
      },
      {
        onSuccess: () => {
          toast.success("Payment added successfully!");
          reset();
          refetch(); // refresh finance after adding payment
        },
        onError: () => {
          toast.error("Failed to add payment");
        },
      }
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
      className="h-fit rounded-lg p-4 bg-card flex flex-col gap-4 overflow-y-auto"
    >
      {/* 🔹 Project Finance Summary */}
      {/* 🔹 Project Finance Summary */}
      <Card className="p-4 shadow-sm text-center">
        <h2 className="text-lg font-semibold mb-4">Project Finance Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ✅ Total Project */}
          <div>
            <p className="text-muted-foreground text-sm">Total Project</p>
            <p className="font-bold text-lg">
              {formatCurrencyINR(projectFinance.total_project_amount)}
            </p>
          </div>

          {/* ✅ Booking Amount (only if greater than 0) */}
          {projectFinance.booking_amount > 0 && (
            <div>
              <p className="text-muted-foreground text-sm">Booking Amount</p>
              <p className="font-bold text-lg">
                {formatCurrencyINR(projectFinance.booking_amount)}
              </p>
            </div>
          )}

          {/* ✅ Pending Amount */}
          <div>
            <p className="text-muted-foreground text-sm">Pending Amount</p>
            <p className="font-bold text-lg text-red-500">
              {formatCurrencyINR(projectFinance.pending_amount)}
            </p>
          </div>
        </div>
      </Card>

      {/* 🔹 Add Additional Payment Form */}
      <Card className="p-4 shadow-sm">
        <h3 className="text-md font-semibold mb-3">Add Additional Payment</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2">Payment Amount</Label>
              <CurrencyInput
                value={watch("amount")}
                onChange={(val) =>
                  setValue("amount", val ?? 0, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder="Enter payment amount"
              />
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2">Payment Date</Label>
              <CustomeDatePicker
                value={watch("payment_date")}
                onChange={(value?: string) =>
                  setValue("payment_date", value ?? "", {
                    shouldValidate: true,
                  })
                }
                restriction="pastOnly"
              />
              {errors.payment_date && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.payment_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Payment File (optional) */}
          <div>
            <Label className="mb-2">Payment Receipt (optional)</Label>
            <FileUploadField
              value={watch("payment_file")}
              onChange={(files) =>
                setValue("payment_file", files, { shouldValidate: true })
              }
              accept=".jpg,.jpeg,.png"
              multiple={false}
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
            <TextAreaInput
              value={watch("payment_text")}
              onChange={(val) =>
                setValue("payment_text", val, { shouldValidate: true })
              }
              placeholder="Enter payment description"
            />
            {errors.payment_text && (
              <p className="text-xs text-red-500 mt-1">
                {errors.payment_text.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={addPaymentMutation.isPending || isSubmitting}
            >
              {addPaymentMutation.isPending
                ? "Submitting..."
                : "Submit Payment"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
