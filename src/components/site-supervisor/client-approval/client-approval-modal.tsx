"use client";

import React from "react";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { useAppSelector } from "@/redux/store";
import { useSubmitClientApproval } from "@/api/client-approval";
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";
import { usePaymentLogs } from "@/hooks/booking-stage/use-booking";
import { formatCurrencyINR } from "@/utils/formatCurrency";
import CurrencyInput from "@/components/custom/CurrencyInput";
import BaseModal from "@/components/utils/baseModal";

interface ClientApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
  };
}

const ClientApprovalModal: React.FC<ClientApprovalModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const clientId = 1;

  const { mutate, isPending } = useSubmitClientApproval();

  const { data: paymentData } = usePaymentLogs(
    data?.id || 0,
    vendorId || 0
  );

  const projectFinance = paymentData?.project_finance ?? {
    total_project_amount: 0,
    pending_amount: 0,
    booking_amount: 0,
  };

  // ✅ Zod schema (only two required)
  const schema = z
    .object({
      approvalScreenshots: z
        .array(z.any())
        .min(1, "At least one client approval screenshot is required"),
      amount_paid: z.number().optional(),
      advance_payment_date: z.string().optional(),
      payment_files: z.array(z.any()).max(1).optional(),
      payment_text: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      const hasAmount = !!values.amount_paid && values.amount_paid > 0;
      const hasPaymentText = !!values.payment_text?.trim();
      const hasPaymentFile =
        Array.isArray(values.payment_files) && values.payment_files.length > 0;
      const hasPaymentDate = !!values.advance_payment_date;
     

      // ✅ Rule 1: Amount should not exceed pending
      if (
        hasAmount &&
        projectFinance.pending_amount !== undefined &&
        values.amount_paid! > projectFinance.pending_amount
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["amount_paid"],
          message: `Amount cannot exceed remaining pending amount (${formatCurrencyINR(
            projectFinance.pending_amount
          )}).`,
        });
      }

      // ✅ Rule 2: If any payment info is filled but amount is missing
      if (!hasAmount && (hasPaymentText || hasPaymentFile || hasPaymentDate)) {
        ctx.addIssue({
          code: "custom",
          path: ["amount_paid"],
          message: "Amount is required when entering payment details.",
        });
      }

      // ✅ Rule 3: If amount entered but other fields missing
      if (hasAmount) {
        if (!hasPaymentDate) {
          ctx.addIssue({
            code: "custom",
            path: ["advance_payment_date"],
            message: "Payment date is required when amount is entered.",
          });
        }

        if (!hasPaymentFile) {
          ctx.addIssue({
            code: "custom",
            path: ["payment_files"],
            message: "Payment proof image is required when amount is entered.",
          });
        }

        if (!hasPaymentText) {
          ctx.addIssue({
            code: "custom",
            path: ["payment_text"],
            message:
              "Transaction ID or remarks are required when amount is entered.",
          });
        }
      }
    });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      approvalScreenshots: [],
      amount_paid: 0,
      advance_payment_date: "",
      payment_files: [],
      payment_text: "",
    },
  });

  // ✅ Console the values
  console.log("Total Project Amount:", projectFinance.total_project_amount);
  console.log("Pending Amount:", projectFinance.pending_amount);

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!vendorId || !userId || !data?.id || !data?.accountId) {
      toast.error("Missing required IDs");
      return;
    }

    const formData = new FormData();
    formData.append("lead_id", String(data.id));
    formData.append("vendor_id", String(vendorId));
    formData.append("account_id", String(data.accountId));
    formData.append("client_id", String(clientId));
    formData.append("created_by", String(userId));
    if (values.advance_payment_date) {
      formData.append("advance_payment_date", values.advance_payment_date);
    }
    formData.append("amount_paid", String(values.amount_paid));
    if (values.payment_text) {
      formData.append("payment_text", values.payment_text);
    }

    values.approvalScreenshots.forEach((file: any) =>
      formData.append("approvalScreenshots", file)
    );
    values.payment_files?.forEach((file: any) =>
      formData.append("payment_files", file)
    );

    mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();

        // ✅ reload page after short delay to let toast show
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
    });
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Client Approval Form"
      description="Submit client approval screenshots and payment details."
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* Screenshots (Mandatory) */}
          <FormField
            control={form.control}
            name="approvalScreenshots"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Approval Screenshots *</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".jpg,.jpeg,.png"
                    multiple
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Amount + Date (Perfectly Aligned Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount_paid"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm">Amount Received</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Field */}
            <FormField
              control={form.control}
              name="advance_payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm">
                    Payment Date
                  </FormLabel>
                  <FormControl>
                    <CustomeDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      restriction="pastMonthOnly"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ✅ Remaining Amount (Placed Uniformly Below Both Fields) */}
          <div className="mt-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold">
                {formatCurrencyINR(projectFinance.pending_amount)}
              </span>{" "}
              is the remaining amount.
            </p>
          </div>

          {/* Payment Proof (Optional) */}
          <FormField
            control={form.control}
            name="payment_files"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Proof (Image only)</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value ?? []}
                    onChange={field.onChange}
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remarks (Optional) */}
          <FormField
            control={form.control}
            name="payment_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction ID / Remarks</FormLabel>
                <FormControl>
                  <TextAreaInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter transaction ID or remarks"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default ClientApprovalModal;
