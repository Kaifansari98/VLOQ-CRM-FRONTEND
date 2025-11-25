"use client";

import React from "react";

import { useDetails } from "../details-context";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { DocumentsUploader } from "@/components/document-upload";
import { useAppSelector } from "@/redux/store";
import { useSubmitQuotation } from "@/hooks/designing-stage/designing-leads-hooks";
import { useQueryClient } from "@tanstack/react-query";
import BaseModal from "@/components/utils/baseModal";

// Schema
const quotationSchema = z.object({
  upload_pdf: z
    .array(z.instanceof(File))
    .min(1, "At least one quotation file is required"),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddQuotationModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const { mutate: uploadQuotation, isPending } = useSubmitQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { upload_pdf: [] },
  });

  const onSubmit = (data: QuotationFormValues) => {
    if (!data.upload_pdf?.length) {
      toast.error("Please upload at least one quotation file.");
      return;
    }

    uploadQuotation(
      { files: data.upload_pdf, vendorId, leadId, userId, accountId },
      {
        onSuccess: () => {
          toast.success(
            `${data.upload_pdf.length} quotation${
              data.upload_pdf.length > 1 ? "s" : ""
            } uploaded successfully!`
          );
          queryClient.invalidateQueries({
            queryKey: ["designingStageCounts", vendorId, leadId],
          });
        },
        onError: (err: any) => toast.error(err?.message || "Upload failed"),
      }
    );

    onOpenChange(false);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Quotation"
      description="Upload the official quotation document for this lead."
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          <FormField
            control={form.control}
            name="upload_pdf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quotation File</FormLabel>
                <FormControl>
                  <DocumentsUploader
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Submit Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default AddQuotationModal;
