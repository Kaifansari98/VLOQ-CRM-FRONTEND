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
import { toast } from "react-toastify";
import { DocumentsUploader } from "@/components/document-upload";
import { useAppSelector } from "@/redux/store";
import { useSubmitQuotation } from "@/hooks/designing-stage/designing-leads-hooks";

// ✅ Schema (without PDF rules)
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
      toast.error("Please upload at least one quotation file.");
      return;
    }

    data.upload_pdf.forEach((file) => {
      uploadQuotation(
        { file, vendorId, leadId, userId, accountId },
        {
          onSuccess: () => {
            toast.success(`uploaded successfully!`);
          },
          onError: (err: any) => {
            toast.error(err?.message || `Failed to upload ${file.name}`);
          },
        }
      );
    });

    onOpenChange(false);
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
