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
import { useUploadBookingDoc } from "@/hooks/booking-stage/use-booking";
import BaseModal from "@/components/utils/baseModal";

// ✅ Schema
const uploadSchema = z.object({
  final_documents: z
    .array(z.any())
    .min(1, "Final documents are required")
    .max(20, "You can upload up to 20 documents"),
});

type UploadDocFormValues = z.infer<typeof uploadSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
  accountId: number;
}

const UploadFinalDoc: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  leadId,
  accountId,
}) => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const form = useForm<UploadDocFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { final_documents: [] },
  });

  const { mutate: uploadDoc, isPending } = useUploadBookingDoc();

  const onSubmit = (values: UploadDocFormValues) => {
    if (!leadId) return;

    uploadDoc(
      {
        lead_id: leadId,
        account_id: accountId,
        vendor_id: vendorId,
        created_by: userId,
        final_documents: values.final_documents,
      },
      {
        onSuccess: () => {
          toast.success("Documents uploaded successfully ✅");
          onOpenChange(false);
          form.reset();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || "Upload failed ❌");
        },
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Booking Document"
      description="Upload final booking documents including quotations and design files."
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          <FormField
            control={form.control}
            name="final_documents"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Booking Documents (Quotations + Design) *
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".pptx,.ppt,.pdf,.jpg,.jpeg,.png,.pyo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default UploadFinalDoc;
