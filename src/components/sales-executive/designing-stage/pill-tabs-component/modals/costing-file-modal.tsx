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
import { useSubmitCostingFile, useLeadSpecifications } from "@/hooks/designing-stage/designing-leads-hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const costingFileSchema = z.object({
  specification_id: z.string().optional(),
  upload_pdf: z
    .any()
    .refine((files) => files && files.length > 0, {
      message: "Please upload at least one costing file.",
    })
    .refine((files) => files.length <= 10, {
      message: "You can upload up to 10 files only.",
    }),
});

type CostingFileFormValues = z.infer<typeof costingFileSchema>;

interface CostingFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CostingFileModal: React.FC<CostingFileModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);

  const form = useForm<CostingFileFormValues>({
    resolver: zodResolver(costingFileSchema),
    defaultValues: { upload_pdf: [], specification_id: "" },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({ upload_pdf: [], specification_id: "" });
    }
  }, [open, form]);

  const submitCostingFileMutation = useSubmitCostingFile();

  const onSubmit = async (data: CostingFileFormValues) => {
    try {
      const specId =
        data.specification_id && data.specification_id !== "none"
          ? Number(data.specification_id)
          : null;

      await submitCostingFileMutation.mutateAsync({
        files: Array.from(data.upload_pdf),
        vendorId,
        leadId,
        userId,
        specificationId: specId,
      });

      toastManager.add({ title: "Costing file uploaded successfully!", type: "success" });

      form.reset({ upload_pdf: [], specification_id: "" });
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
      title="Upload Costing File"
      description="Upload costing files in PDF, Excel, Word, or image formats."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          <FormField
            control={form.control}
            name="specification_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specification (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select specification" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {specifications && specifications.length > 0 ? (
                      specifications.map((spec: any) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="upload_pdf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload Costing Files *</FormLabel>
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
              disabled={submitCostingFileMutation.isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitCostingFileMutation.isPending}>
              {submitCostingFileMutation.isPending
                ? "Uploading..."
                : "Upload Costing"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default CostingFileModal;
