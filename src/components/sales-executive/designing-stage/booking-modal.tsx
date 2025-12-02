"use client";

import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMoveToBookingStage,
  useSiteSupervisors,
} from "@/hooks/booking-stage/use-booking";
import { BookingPayload } from "@/api/booking";
import { toast } from "react-toastify";
import { useISMPaymentInfo } from "@/hooks/booking-stage/use-booking";
import SelectDocumentModal from "@/components/modal/select-doc-modal";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrencyINR } from "@/utils/formatCurrency";
import CurrencyInput from "@/components/custom/CurrencyInput";
import BaseModal from "@/components/utils/baseModal";

// ✅ Enhanced Zod schema with proper file validation
const bookingSchema = z
  .object({
    final_documents: z
      .array(z.any())
      .max(20, "You can upload up to 20 documents")
      .default([]),

    amount_received: z
      .number()
      .nonnegative("Amount cannot be negative")
      .default(0),

    final_booking_amount: z
      .number()
      .positive("Booking amount must be greater than 0"),

    payment_details_document: z
      .array(z.any())
      .max(20, "You can upload up to 20 documents")
      .default([]),

    payment_text: z.string().default(""),

    assign_to: z.string().min(1, "Please select an assignee"),
  })
  .superRefine((data, ctx) => {
    const hasPaymentText = !!data.payment_text.trim();
    const hasPaymentDoc =
      Array.isArray(data.payment_details_document) &&
      data.payment_details_document.length > 0;
    const hasPaymentInfo = hasPaymentText || hasPaymentDoc;

    // ✅ Rule 1
    if (data.amount_received > data.final_booking_amount) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_received"],
        message:
          "Booking Amount Received should not be greater than Total Booking Value.",
      });
    }

    // ✅ Rule 2
    if (hasPaymentInfo && data.amount_received <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_received"],
        message:
          "Booking Amount Received is required when entering payment details or uploading payment document.",
      });
    }

    // ✅ Rule 3
    if (data.amount_received > 0) {
      if (!hasPaymentText) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_text"],
          message:
            "Payment details text is required when Booking Amount Received is entered.",
        });
      }
      if (!hasPaymentDoc) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_details_document"],
          message:
            "At least one payment document is required when Booking Amount Received is entered.",
        });
      }
    }
  });

// ✅ Proper type inference from schema
type BookingFormValues = z.infer<typeof bookingSchema>;
const bookingResolver = zodResolver(bookingSchema) as unknown as any;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
  };
}

const BookingModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [openSelectDocModal, setOpenSelectDocModal] = useState(false);
  const leadId = data?.id;
  const accountId = data?.accountId;
  const clientId = 1;
  const router = useRouter();
  const queryClient = useQueryClient();

  console.log("LeadId :- ", leadId);
  const { data: ismPaymentInfo } = useISMPaymentInfo(leadId);
  console.log("PaymentInfo :- ", ismPaymentInfo);
  console.log("Amount :- ", ismPaymentInfo?.amount);

  const { data: siteSupervisors, isLoading } = useSiteSupervisors(vendorId!);
  const vendorUser = siteSupervisors?.data?.site_supervisors || [];
  const { mutate, isPending } = useMoveToBookingStage();
  const form = useForm<BookingFormValues>({
    resolver: bookingResolver,
    defaultValues: {
      final_documents: [],
      amount_received: 0,
      final_booking_amount: 0,
      payment_details_document: [],
      payment_text: "",
      assign_to: "",
    },
    mode: "onChange",
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const onSubmit: SubmitHandler<BookingFormValues> = (values) => {
    if (values.amount_received > values.final_booking_amount) {
      toast.error(
        "Booking Amount Received should not be greater than Total Booking Value"
      );
      return;
    }

    if (!leadId || !accountId || !vendorId || !userId) {
      console.error("❌ Missing IDs in booking payload");
      return;
    }

    // 🚨 check file errors
    const hasFileError =
      values.payment_details_document?.some((f: any) => f.error) ||
      values.final_documents?.some((f: any) => f.error);

    if (hasFileError) {
      toast.error("Please fix file upload errors before submitting.");
      return;
    }

    const payload: BookingPayload = {
      lead_id: leadId,
      account_id: accountId,
      vendor_id: vendorId,
      created_by: userId,
      client_id: clientId,
      bookingAmount: values.amount_received,
      bookingAmountPaymentDetailsText: values.payment_text,
      finalBookingAmount: values.final_booking_amount,
      siteSupervisorId: Number(values.assign_to),
      booking_payment_file: values.payment_details_document,
      final_documents: values.final_documents,
    };

    console.log("✅ Booking Payload:", payload);

    mutate(payload, {
      onSuccess: () => {
        toast.success("Booking saved successfully!");

        queryClient.invalidateQueries({
          queryKey: ["leadStats", vendorId, userId],
        });

        onOpenChange(false);
        form.reset();

        router.push("/dashboard/leads/booking-stage");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to save booking");
        console.error("❌ Booking error:", err);
      },
    });
  };

  const handleReset = () => {
    form.reset({
      final_documents: [],
      amount_received: 0,
      final_booking_amount: 0,
      payment_details_document: [],
      payment_text: "",
    });
  };
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Booking Form"
      description="Complete the booking details and attach all required documents."
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* File Upload Section */}

          <FormField
            control={form.control}
            name="final_documents"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex  justify-between">
                  Booking Documents (Quotations + Design) *
                  <Button
                    type="button"
                    onClick={() => setOpenSelectDocModal(true)}
                  >
                    Select Documents
                  </Button>
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".pptx.,.ppt, .pdf, .jpg, .jpeg, .png, .pyo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Amount fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="final_booking_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Total Booking Value *
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={
                          (val) => field.onChange(val ?? 0) // fallback to 0 if undefined
                        }
                        placeholder="Enter Total Booking Value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_received"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Booking Amount Received
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(val ? Number(val) : 0)
                        }
                        placeholder="Enter received amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {ismPaymentInfo?.amount && (
              <p className="text-sm">
                <span className="font-bold">
                  {formatCurrencyINR(ismPaymentInfo.amount)}
                </span>{" "}
                ISM amount has already been paid by the client.
              </p>
            )}
          </div>

          <FormField
            control={form.control}
            name="assign_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Assign Lead To Site Supervisor *
                </FormLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendorUser.map((user: any) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Payment Details fields */}
          <FormField
            control={form.control}
            name="payment_details_document"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Booking Amount Payment Details Document
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Payment Details</FormLabel>
                <FormControl>
                  <TextAreaInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter your payment details"
                  />
                </FormControl>
                <FormMessage className="-mt-7" />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-3 pt-4 ">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="rounded-md"
            >
              Reset
            </Button>
            <Button
              type="submit"
              className="rounded-md"
              disabled={isPending || form.formState.isSubmitting} // <- mutate ka pending bhi disable karega
            >
              {isPending ? "Submitting..." : "Submit Booking"}
            </Button>
          </div>
        </form>
      </Form>

      <SelectDocumentModal
        open={openSelectDocModal}
        onOpenChange={setOpenSelectDocModal}
        leadId={leadId!}
        onSelectDocs={(files) => {
          const existing = form.getValues("final_documents") || [];
          form.setValue("final_documents", [...existing, ...files], {
            shouldValidate: true,
          });
        }}
      />
    </BaseModal>
  );
};

export default BookingModal;
