"use client";

import React from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { FileUploadField } from "../../custom/file-upload";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useAppSelector } from "@/redux/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLeadById, uploadInitialSiteMeasurement } from "@/api/leads";
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { SinglePdfUploadField } from "@/components/utils/single-pdf-uploader";
import BaseModal from "@/components/utils/baseModal";
import { useRouter } from "next/navigation";
import CurrencyInput from "@/components/custom/CurrencyInput";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
    name: string;
  };
}

const formSchema = z
  .object({
    current_site_photos: z.any().optional(),

    upload_pdf: z
      .instanceof(File, { message: "Please upload a PDF" })
      .refine((file) => file.type === "application/pdf", {
        message: "Only PDF file is allowed",
      }),

    amount: z.number().optional(),
    payment_date: z.string().optional(),
    payment_image: z.any().optional(),
    payment_text: z.string().optional(),
  })
  // ✅ Replaced .refine() with granular .superRefine()
  .superRefine((data, ctx) => {
    const hasAmount = !!data.amount;
    const hasPaymentDate = !!data.payment_date;
    const hasPaymentText = !!data.payment_text?.trim();
    const hasPaymentImage =
      Array.isArray(data.payment_image) && data.payment_image.length > 0;

    const anyFieldFilled =
      hasAmount || hasPaymentDate || hasPaymentText || hasPaymentImage;

    if (anyFieldFilled) {
      // 💰 Amount missing
      if (!hasAmount) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Amount is required when adding payment details.",
        });
      }

      // 📅 Payment date missing
      if (!hasPaymentDate) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_date"],
          message: "Payment date is required when adding payment details.",
        });
      }

      // 📝 Payment text missing
      if (!hasPaymentText) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_text"],
          message:
            "Payment details text is required when adding payment details.",
        });
      }

      // 🖼️ Payment image missing
      if (!hasPaymentImage) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_image"],
          message:
            "At least one payment image is required when adding payment details.",
        });
      }
    }
  });

const InitialSiteMeasuresMent: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_site_photos: [],
      upload_pdf: undefined,
      payment_image: [],
    },
  });

  const vendorId = useAppSelector((state: any) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state: any) => state.auth.user?.id);
  const leadId = data?.id;
  const accountId = data?.accountId;

  // const { data: accountId } = useQuery({
  //   queryKey: ["lead", leadId],
  //   queryFn: () => getLeadById(leadId!, vendorId, userId),
  //   select: (res) => {
  //     const accountId = res?.data?.lead?.account?.id ?? res?.data?.lead?.account_id;
  //     if (!accountId) {
  //       console.warn("Lead missing account data:", res?.data?.lead);
  //     }
  //     return accountId;
  //   }
  // });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: uploadInitialSiteMeasurement,
    onSuccess: () => {
      toast.success("Initial Site Measurement Upload Successfully!");
      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeads", vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["designingStageLeads", vendorId], // ✅ NEW
      });

      handleReset();
      onOpenChange(false);

      // ✅ Redirect to Designing Stage
      router.push("/dashboard/leads/designing-stage");
    },
    onError: (error: any) => {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      console.log(error.response?.data?.message);
      toast.error(backendMessage);
    },
  });

  let clientId = 1;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!leadId || !accountId) {
      toast.error("Lead or account data is missing!");
      return;
    }

    const formData = new FormData();
    formData.append("lead_id", leadId?.toString() || "");
    formData.append("account_id", accountId?.toString() || "");
    formData.append("vendor_id", vendorId?.toString() || "");
    formData.append("created_by", userId?.toString() || "");
    formData.append("client_id", clientId.toString() || "");
    formData.append("user_id", userId?.toString() || "");

    values.current_site_photos?.forEach((file: File) => {
      formData.append("current_site_photos", file);
    });

    formData.append("upload_pdf", values.upload_pdf);

    if (values.amount) {
      formData.append("amount", values.amount.toString());
    }
    if (values.payment_date) {
      formData.append("payment_date", values.payment_date);
    }
    if (values.payment_text) {
      formData.append("payment_text", values.payment_text);
    }
    values.payment_image?.forEach((file: File) => {
      formData.append("payment_image", file);
    });

    mutation.mutate(formData);
  };

  const handleReset = () => {
    form.reset({
      current_site_photos: [],
      upload_pdf: undefined,
      amount: undefined,
      payment_date: undefined,
      payment_image: [],
      payment_text: "",
    });
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Initial Site Measurement Form "
      description="Fill the below fields to send this lead to initial site measurement form"
      size="lg"
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Current Site Photos */}
            <FormField
              control={form.control}
              name="current_site_photos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Current Site Photos</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept=".png, .jpg, .jpeg"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload photos or documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload PDF */}
            <FormField
              control={form.control}
              name="upload_pdf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Initial Site Measurement Document *
                  </FormLabel>
                  <FormControl>
                    <SinglePdfUploadField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm">
                      Initial Site Measurement Payable Amount
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(val === undefined ? undefined : val)
                        }
                        placeholder="Enter payable amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm">
                      Initial Site Measurement Amount Payment Date
                    </FormLabel>
                    <FormControl>
                      <CustomeDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        restriction="pastOnly"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Image */}
            <FormField
              control={form.control}
              name="payment_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Payment Details</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      multiple={false}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload photos or documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Text */}
            <FormField
              control={form.control}
              name="payment_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Payment Details Text
                  </FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your payment details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="py-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default InitialSiteMeasuresMent;
