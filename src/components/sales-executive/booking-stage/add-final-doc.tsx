"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useAppSelector } from "@/redux/store";
import { FileUploadField } from "@/components/custom/file-upload";

// ✅ Schema (without PDF rules)
const uploadSchema = z.object({
  final_documents: z
    .array(z.any())
    .min(1, "Final documents are required")
    .max(20, "You can upload up to 20 documents")
    .refine((files) => files.length > 0, {
      message: "At least one document is required",
    }),
});

type UploadDocFormValues = z.infer<typeof uploadSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
}

const AddQuotationModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  leadId,
}) => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const form = useForm<UploadDocFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { final_documents: [] },
  });

  const onSubmit = (data: UploadDocFormValues) => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Upload Final Document</DialogTitle>
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
                  name="final_documents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Final Documents (Quotations + Design) *
                      </FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                          accept=".pptx., .ppt, .pdf, .jpg, .jpeg, .png, .pyo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit">Upload</Button>
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
