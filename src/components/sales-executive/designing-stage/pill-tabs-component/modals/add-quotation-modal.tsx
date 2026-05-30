"use client";

import React from "react";

import { useDetails } from "../details-context";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toastManager } from "@/components/ui/toast";
import { DocumentsUploader } from "@/components/document-upload";
import { useAppSelector } from "@/redux/store";
import {
  useDesignsDoc,
  useSubmitQuotation,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useQueryClient } from "@tanstack/react-query";
import BaseModal from "@/components/utils/baseModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DesignsDocument } from "@/types/designing-stage-types";

// Schema
const quotationSchema = z.object({
  upload_pdf: z
    .array(z.instanceof(File))
    .min(1, "At least one quotation file is required"),
  design_document_id: z.string().min(1, "Please select a design file"),
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
  const { leadId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;
  const { data: designDocsResponse, isLoading: isLoadingDesignDocs } =
    useDesignsDoc(vendorId, leadId);
  const designDocs: DesignsDocument[] = designDocsResponse?.data?.documents ?? [];

  const { mutate: uploadQuotation, isPending } = useSubmitQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { upload_pdf: [], design_document_id: "" },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({ upload_pdf: [], design_document_id: "" });
    }
  }, [open, form]);

  const onSubmit = (data: QuotationFormValues) => {
    if (!data.upload_pdf?.length) {
      toastManager.add({ title: "Please upload at least one quotation file.", type: "error" });
      return;
    }

    uploadQuotation(
      {
        files: data.upload_pdf,
        vendorId,
        leadId,
        userId,
        designDocumentId: Number(data.design_document_id),
      },
      {
        onSuccess: () => {
          toastManager.add({ title: `${data.upload_pdf.length} quotation${
              data.upload_pdf.length > 1 ? "s" : ""
            } uploaded successfully!`, type: "success" });
          queryClient.invalidateQueries({
            queryKey: ["designingStageCounts", vendorId, leadId],
          });
          form.reset({ upload_pdf: [], design_document_id: "" });
          onOpenChange(false);
        },
        onError: (err: any) => toastManager.add({ title: err?.message || "Upload failed", type: "error" }),
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset({ upload_pdf: [], design_document_id: "" });
        }
        onOpenChange(nextOpen);
      }}
      title="Add Quotation"
      description="Upload the official quotation document for this lead."
      size="smd"
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

          <FormField
            control={form.control}
            name="design_document_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Design File</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoadingDesignDocs || designDocs.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingDesignDocs
                            ? "Loading design files..."
                            : designDocs.length === 0
                              ? "No design files available"
                              : "Select one design file"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {designDocs.map((doc) => (
                        <SelectItem key={doc.id} value={String(doc.id)}>
                          {doc.doc_og_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription className="text-xs">
                  Select the design file this quotation belongs to.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || isLoadingDesignDocs || designDocs.length === 0}
            >
              {isPending ? "Uploading..." : "Submit Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default AddQuotationModal;
