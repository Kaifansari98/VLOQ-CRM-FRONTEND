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
  useHeadSiteSupervisors,
  useSiteSupervisors,
} from "@/hooks/booking-stage/use-booking";
import { BookingPayload, assignTaskBooking } from "@/api/booking";
import { createLeadChatRoom } from "@/api/lead-chats";
import { toastManager } from "@/components/ui/toast";
import { useISMPaymentInfo } from "@/hooks/booking-stage/use-booking";
import SelectDocumentModal from "@/components/modal/select-doc-modal";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrencyINR } from "@/utils/formatCurrency";
import CurrencyInput from "@/components/custom/CurrencyInput";
import BaseModal from "@/components/utils/baseModal";
import {
  useHeadSiteSupervisorFranchiseMapping,
  useFranchisesByVendorId,
} from "@/api/franchise";
import AssignToPicker from "@/components/assign-to-picker";

// ✅ Enhanced Zod schema with proper file validation
const bookingSchema = z
  .object({
    final_documents: z
      .array(z.any())
      .max(20, "You can upload up to 20 documents")
      .default([]),

    mrp_value: z.number().positive("MRP value must be greater than 0"),

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

    assign_to: z.string().optional(),
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
          "Booking Advance Received should not be greater than Total Booking Value.",
      });
    }

    // ✅ Rule 2
    if (hasPaymentInfo && data.amount_received <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_received"],
        message:
          "Booking Advance Received is required when entering payment details or uploading payment document.",
      });
    }

    // ✅ Rule 3
    if (data.amount_received > 0) {
      if (!hasPaymentText) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_text"],
          message:
            "Payment details text is required when Booking Advance Received is entered.",
        });
      }
      if (!hasPaymentDoc) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_details_document"],
          message:
            "At least one payment document is required when Booking Advance Received is entered.",
        });
      }
    }

    // ✅ Rule: Total Booking Value cannot be greater than MRP Value
    if (data.final_booking_amount > data.mrp_value) {
      ctx.addIssue({
        code: "custom",
        path: ["final_booking_amount"],
        message: "Total Booking Value cannot be greater than MRP Value.",
      });
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
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) => state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only
  );
  const [openSelectDocModal, setOpenSelectDocModal] = useState(false);
  const leadId = data?.id;
  const accountId = data?.accountId;
  const router = useRouter();
  const queryClient = useQueryClient();

  console.log("LeadId :- ", leadId);
  const { data: ismPaymentInfo } = useISMPaymentInfo(leadId);
  console.log("PaymentInfo :- ", ismPaymentInfo);
  console.log("Amount :- ", ismPaymentInfo?.amount);

  const { data: headSiteSupervisors, isLoading: loadingHead } =
    useHeadSiteSupervisors(vendorId!);
  const { data: siteSupervisors, isLoading: loadingSite } =
    useSiteSupervisors(vendorId!);

  const headUsers = headSiteSupervisors?.data?.head_site_supervisors || [];
  const siteUsers = siteSupervisors?.data?.site_supervisors || [];

  const vendorUser = React.useMemo(() => {
    const merged = [...headUsers, ...siteUsers];
    return merged.filter(
      (user: any, index: number, array: any[]) =>
        array.findIndex((candidate: any) => candidate.id === user.id) === index
    );
  }, [headUsers, siteUsers]);

  const isLoading = loadingHead || loadingSite;
  const hasMultipleSupervisors = vendorUser.length > 1;
  const { data: headSupervisorMapping } =
    useHeadSiteSupervisorFranchiseMapping(
      vendorId,
      franchiseId ?? undefined,
      hasMultipleSupervisors
    );
  const { data: franchises = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId
  );
  const headOfficeFranchiseId = React.useMemo(
    () => franchises.find((f) => f.is_head_office)?.id,
    [franchises]
  );
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
      mrp_value: 0,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (!open) return;
    if (vendorCustomUserTypeMode === true) return;
    if (!vendorUser.length) {
      // console.log(
      //   "[BookingModal] auto-select failed: no head site supervisors available"
      // );
      return;
    }

    // 3. Auto-select logic if we have multiple site supervisors but only one mapped for the franchise
    let selected: any = vendorUser.length === 1 ? vendorUser[0] : undefined;

    if (!selected && hasMultipleSupervisors) {
      let mappedUserId = null;
      if (Array.isArray(headSupervisorMapping) && headSupervisorMapping.length === 1) {
        mappedUserId = headSupervisorMapping[0]?.id;
      } else if (headSupervisorMapping && !Array.isArray(headSupervisorMapping)) {
        mappedUserId = headSupervisorMapping.user_id;
      }

      if (mappedUserId) {
        selected = vendorUser.find((user: any) => user.id === mappedUserId);
      }
    }

    if (!selected && hasMultipleSupervisors && headOfficeFranchiseId) {
      selected = vendorUser.find(
        (user: any) => user.franchise_id === headOfficeFranchiseId
      );
    }

    if (!selected) {
      selected = vendorUser[0];
    }

    if (!selected) {
      // console.log(
      //   "[BookingModal] auto-select failed: no matching head site supervisor"
      // );
      return;
    }

    form.setValue("assign_to", String(selected.id), {
      shouldValidate: true,
    });
    // console.log(
    //   "[BookingModal] auto-selected head site supervisor",
    //   selected.user_name
    // );
  }, [
    open,
    form,
    vendorUser,
    hasMultipleSupervisors,
    headSupervisorMapping,
    headOfficeFranchiseId,
  ]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const onSubmit: SubmitHandler<BookingFormValues> = (values) => {
    if (vendorCustomUserTypeMode !== true && (!values.assign_to || values.assign_to.trim() === "")) {
      form.setError("assign_to", { type: "manual", message: "Site supervisor is required." });
      return;
    }

    if (values.amount_received > values.final_booking_amount) {
      toastManager.add({ title: "Booking Advance Received should not be greater than Total Booking Value", type: "error" });
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
      toastManager.add({ title: "Please fix file upload errors before submitting.", type: "error" });
      return;
    }

    if (values.final_booking_amount > values.mrp_value) {
      toastManager.add({ title: "Total Booking Value cannot be greater than MRP Value", type: "error" });
      return;
    }

    const payload: BookingPayload = {
      lead_id: leadId,
      account_id: accountId,
      vendor_id: vendorId,
      created_by: userId,
      bookingAmount: values.amount_received,
      bookingAmountPaymentDetailsText: values.payment_text,
      finalBookingAmount: values.final_booking_amount,
      mrpValue: values.mrp_value, // ➕ ADD
      booking_payment_file: values.payment_details_document,
      final_documents: values.final_documents,
    };

    if (
      vendorCustomUserTypeMode !== true &&
      values.assign_to &&
      values.assign_to.trim() !== ""
    ) {
      payload.siteSupervisorId = Number(values.assign_to);
    }

    console.log("✅ Booking Payload:", payload);

    mutate(payload, {
      onSuccess: () => {
        toastManager.add({ title: "Booking saved successfully!", type: "success" });

        // Add head site supervisor to lead chatroom
        createLeadChatRoom(leadId, userId!).catch(() => {
          // best-effort — don't block on chat member sync failure
        });

        // Auto-create task for head site supervisor
        if (values.assign_to) {
          const today = new Date().toISOString().split("T")[0];
          assignTaskBooking(leadId, {
            task_type: "Assign a Site Supervisor",
            due_date: today,
            user_id: Number(values.assign_to),
            created_by: userId!,
          }).catch(() => {
            // best-effort — don't block on task creation failure
          });
        }

        queryClient.invalidateQueries({
          queryKey: ["leadStats", vendorId, userId],
        });

        queryClient.invalidateQueries({
          queryKey: ["universal-stage-leads"],
          exact: false,
        });


        onOpenChange(false);
        form.reset();

        router.push("/dashboard/leads/booking-stage");
      },
      onError: (err: any) => {
        const errorMessage =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong";

        toastManager.add({
          title: errorMessage,
          type: "error",
        });
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



  console.log("vendorCustomUserTypeMode..........", vendorCustomUserTypeMode)
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Booking Form"
      description="Complete the booking details and attach all required documents."
      size="lg"
    > 
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            const errorKeys = Object.keys(errors);
            if (errorKeys.length > 0) {
              const firstErrorKey = errorKeys[0];
              const el = document.querySelector(`[data-name="${firstErrorKey}"]`);
              if (el) {
                const isHidden = el.getBoundingClientRect().height === 0;
                const targetScrollEl = isHidden ? (el.parentElement || el) : el;
                targetScrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
                const focusable = el.querySelector("input, select, textarea, button");
                if (focusable instanceof HTMLElement) {
                  focusable.focus({ preventScroll: true });
                }
              }
            }
          })}
          className="space-y-6 p-5"
        >
          {/* File Upload Section */}

          <FormField
            control={form.control}
            name="final_documents"
            render={({ field }) => (
              <FormItem data-name="final_documents">
                <FormLabel className="text-sm flex  justify-between">
                  Booking Documents (Quotations + Design) *
                  {vendorCustomUserTypeMode !== true && (
                    <Button
                      type="button"
                      onClick={() => setOpenSelectDocModal(true)}
                    >
                      Select Documents
                    </Button>
                  )}
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".pptx.,.ppt, .pdf, .jpg, .jpeg, .png, .pyo"
                    isUploadDeniedAndSelectEnabled={
                      vendorCustomUserTypeMode === true
                    }
                    onSelectEnabledClick={() => setOpenSelectDocModal(true)}
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
                name="mrp_value"
                render={({ field }) => (
                  <FormItem data-name="mrp_value">
                    <FormLabel className="text-sm">MRP Value *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val ?? 0)}
                        placeholder="Enter MRP Value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="final_booking_amount"
                render={({ field }) => (
                  <FormItem data-name="final_booking_amount">
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
                  <FormItem data-name="amount_received">
                    <FormLabel className="text-sm">
                      Booking Advance Received
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

              {vendorCustomUserTypeMode !== true && hasMultipleSupervisors && (
                <FormField
                  control={form.control}
                  name="assign_to"
                  render={({ field }) => (
                    <FormItem data-name="assign_to">
                      <FormLabel className="text-sm">Assign Head Site Supervisor *</FormLabel>
                      <AssignToPicker
                        data={vendorUser.map((u: any) => ({ id: u.id, label: u.user_name }))}
                        value={field.value ? Number(field.value) : undefined}
                        onChange={(val) => field.onChange(val ? String(val) : "")}
                        placeholder="Search site supervisor..."
                        emptyLabel="Select an option"
                        className="h-9"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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

          {/* Payment Details fields */}
          <FormField
            control={form.control}
            name="payment_details_document"
            render={({ field }) => (
              <FormItem data-name="payment_details_document">
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
              <FormItem data-name="payment_text">
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
          const nextFiles =
            vendorCustomUserTypeMode === true
              ? files
              : [...(form.getValues("final_documents") || []), ...files];

          form.setValue("final_documents", nextFiles, {
            shouldValidate: true,
          });
        }}
      />
    </BaseModal>
  );
};

export default BookingModal;
