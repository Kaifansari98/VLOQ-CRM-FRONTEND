"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDetails } from "./pill-tabs-component/details-context";
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
import { PdfUploadField } from "@/components/pdf-upload-input";
import { toast } from "react-toastify";
import { DocumentsUploader } from "@/components/document-upload";

// ✅ Schema (without PDF rules)
const quotationSchema = z.object({
  upload_pdf: z.any(),
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
  const { leadId, accountId } = useDetails();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      upload_pdf: [],
    },
  });

  const onSubmit = (data: QuotationFormValues) => {
    console.log("Submitting quotation with:", {
      leadId,
      accountId,
      file: data.upload_pdf,
    });

    toast.success("Quotation submitted successfully!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        <DialogHeader className="flex items-start justify-between border-b px-6 py-4">
          <DialogTitle className="capitalize">Add Quotation</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* PDF Upload Field */}
              <FormField
                control={form.control}
                name="upload_pdf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Quotation Fiels</FormLabel>
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
                <Button type="submit">Submit Quotation</Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuotationModal;
