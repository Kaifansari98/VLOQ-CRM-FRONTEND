"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { PdfUploadField } from "@/components/pdf-upload-input";
import { toast } from "react-toastify";
import { DocumentsUploader } from "@/components/document-upload";
import { useAppSelector } from "@/redux/store";
import { useSubmitQuotation } from "@/hooks/designing-stage/designing-leads-hooks";

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
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const { mutate: uploadQuotation, isPending } = useSubmitQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { upload_pdf: [] },
  });

  const onSubmit = (data: QuotationFormValues) => {
    if (!data.upload_pdf || data.upload_pdf.length === 0) {
      toast.error("Please upload a quotation file.");
      return;
    }

    const file = data.upload_pdf[0]; // assuming single file
    uploadQuotation(
      { file, vendorId, leadId, userId, accountId },
      {
        onSuccess: () => {
          toast.success("Quotation uploaded successfully!");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Upload failed!");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add Quotation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 py-3"
              >
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuotationModal;
