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
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { SinglePdfUploadField } from "@/components/utils/single-pdf-uploader";
import BaseModal from "@/components/utils/baseModal";
import { useRouter } from "next/navigation";
import CurrencyInput from "@/components/custom/CurrencyInput";
import { toastError } from "@/lib/utils";
import { useBookingDoneIsmUpload } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
    name: string;
  };
}

const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
const documentAccept = ".pdf,.png,.jpg,.jpeg,.gif";

const formSchema = z
  .object({
    current_site_photos: z.any().optional(),

    upload_pdf: z
      .instanceof(File, { message: "Please upload a document" })
      .refine((file) => documentMimeTypes.includes(file.type), {
        message: "Only PDF or image files are allowed",
      }),

    amount: z.number().optional(),
    payment_date: z.string().optional(),
    payment_image: z.any().optional(),
    payment_text: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasAmount = !!data.amount;
    const hasPaymentDate = !!data.payment_date;
    const hasPaymentText = !!data.payment_text?.trim();
    const hasPaymentImage =
      Array.isArray(data.payment_image) && data.payment_image.length > 0;

    const anyFieldFilled =
      hasAmount || hasPaymentDate || hasPaymentText || hasPaymentImage;

    if (anyFieldFilled) {
      if (!hasAmount) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Amount is required when adding payment details.",
        });
      }

      if (!hasPaymentDate) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_date"],
          message: "Payment date is required when adding payment details.",
        });
      }

      if (!hasPaymentText) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_text"],
          message:
            "Payment details text is required when adding payment details.",
        });
      }

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

const BookingDoneIsmForm: React.FC<LeadViewModalProps> = ({
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

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.id;
  const accountId = data?.accountId;

  const queryClient = useQueryClient();

  const bookingDoneIsmMutation = useBookingDoneIsmUpload();

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

  const handleSuccess = () => {
    toast.success("Booking Done ISM Upload Successfully!");
    queryClient.invalidateQueries({
      queryKey: ["leadStats", vendorId, userId],
    });
    queryClient.invalidateQueries({
      queryKey: ["universal-stage-leads"],
      exact: false,
    });
    handleReset();
    onOpenChange(false);

    router.push("/dashboard/leads/designing-stage");
  };

  const clientId = 1;

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

    bookingDoneIsmMutation.mutate(formData, {
      onSuccess: handleSuccess,
      onError: (error: unknown) => {
        toastError(error);
      },
    });
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Booking Done ISM Form "
      description="Fill the below fields to send this lead to booking done ISM form"
      size="lg"
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                      accept=".png, .jpg, .jpeg, .gif"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload photos or documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="upload_pdf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Booking Done ISM Document *
                  </FormLabel>
                  <FormControl>
                    <SinglePdfUploadField
                      value={field.value}
                      onChange={field.onChange}
                      allowedMimeTypes={documentMimeTypes}
                      accept={documentAccept}
                      title="Upload Booking Document"
                      description="PDF or image allowed. Upload one file."
                      buttonLabel="Select File"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm">
                      Booking Done ISM Payable Amount
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

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm">
                      Booking Done ISM Amount Payment Date
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
                      accept=".png, .jpg, .jpeg, .gif"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload photos or documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Payment Details Text</FormLabel>
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

            <div className="py-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" disabled={bookingDoneIsmMutation.isPending}>
                {bookingDoneIsmMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default BookingDoneIsmForm;
