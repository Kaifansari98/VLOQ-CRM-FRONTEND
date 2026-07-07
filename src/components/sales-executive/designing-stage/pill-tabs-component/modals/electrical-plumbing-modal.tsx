"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
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
import { toastManager } from "@/components/ui/toast";
import { DocumentsUploader } from "@/components/document-upload";
import { useDetails } from "../details-context";
import { useAppSelector } from "@/redux/store";
import { useSubmitElectricalPlumbing } from "@/hooks/designing-stage/designing-leads-hooks";

const electricalPlumbingSchema = z.object({
  upload_pdf: z
    .any()
    .refine((files) => files && files.length > 0, {
      message: "Please upload at least one file.",
    })
    .refine((files) => files.length <= 10, {
      message: "You can upload up to 10 files only.",
    }),
});

type ElectricalPlumbingFormValues = z.infer<typeof electricalPlumbingSchema>;

interface ElectricalPlumbingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ElectricalPlumbingModal: React.FC<ElectricalPlumbingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const form = useForm<ElectricalPlumbingFormValues>({
    resolver: zodResolver(electricalPlumbingSchema),
    defaultValues: { upload_pdf: [] },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({ upload_pdf: [] });
    }
  }, [open, form]);

  const submitElectricalPlumbingMutation = useSubmitElectricalPlumbing();

  const onSubmit = async (data: ElectricalPlumbingFormValues) => {
    try {
      await submitElectricalPlumbingMutation.mutateAsync({
        files: Array.from(data.upload_pdf),
        vendorId,
        leadId,
        userId,
      });

      toastManager.add({
        title: "Electrical & Plumbing files uploaded successfully!",
        type: "success",
      });

      form.reset({ upload_pdf: [] });
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(state) => {
        if (!state) form.reset();
        onOpenChange(state);
      }}
      title="Upload Electrical & Plumbing"
      description="Upload electrical & plumbing files in PDF, Excel, Word, or image formats."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          <FormField
            control={form.control}
            name="upload_pdf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload Files *</FormLabel>
                <FormControl>
                  <DocumentsUploader
                    value={field.value}
                    onChange={field.onChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
              disabled={submitElectricalPlumbingMutation.isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitElectricalPlumbingMutation.isPending}>
              {submitElectricalPlumbingMutation.isPending
                ? "Uploading..."
                : "Upload Electrical & Plumbing"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default ElectricalPlumbingModal;
