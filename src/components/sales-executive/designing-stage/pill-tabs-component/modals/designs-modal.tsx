"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";// adjust path
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
import { DocumentsUploader } from "@/components/document-upload";
import { useDetails } from "../details-context";
import { useAppSelector } from "@/redux/store";
import { useSubmitDesigns } from "@/api/designingStageQueries";
import { useQueryClient } from "@tanstack/react-query";

const designsSchema = z.object({
  upload_pdf: z
    .any()
    .refine((files) => files && files.length > 0, {
      message: "Please upload at least one design file.",
    })
    .refine((files) => files.length <= 10, {
      message: "You can upload up to 10 files only.",
    })
    .refine(
      (files: File[]) =>
        files.every((f) =>
          /\.(pdf|zip|pyo|pytha|dwg|dxf|stl|step|stp|iges|igs|3ds|obj|skp|sldprt|sldasm|prt|catpart|catproduct)$/i.test(
            f.name
          )
        ),
      {
        message: "Only PDF, ZIP or supported design formats are allowed.",
      }
    ),
});

type DesignsFormValues = z.infer<typeof designsSchema>;

interface DesignsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DesignsModal: React.FC<DesignsModalProps> = ({ open, onOpenChange }) => {
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const queryClient = useQueryClient();
  const form = useForm<DesignsFormValues>({
    resolver: zodResolver(designsSchema),
    defaultValues: { upload_pdf: [] },
  });

  const submitDesignsMutation = useSubmitDesigns();

  const onSubmit = async (data: DesignsFormValues) => {
    try {
      await submitDesignsMutation.mutateAsync({
        files: Array.from(data.upload_pdf),
        vendorId,
        leadId,
        userId,
        accountId,
      });

      toast.success("Design files uploaded successfully!");

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload design files.");
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(state) => {
        if (!state) form.reset();
        onOpenChange(state);
      }}
      title="Add Designs"
      description="Upload design files in supported CAD or document formats."
      size="lg"
    >
       
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
              <FormField
                control={form.control}
                name="upload_pdf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Design Files</FormLabel>
                    <FormControl>
                      <DocumentsUploader
                        value={field.value}
                        onChange={field.onChange}
                        accept=".pdf,.pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
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
                  disabled={submitDesignsMutation.isPending}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={submitDesignsMutation.isPending}>
                  {submitDesignsMutation.isPending
                    ? "Uploading..."
                    : "Submit Designs"}
                </Button>
              </div>
            </form>
          </Form>
        
    </BaseModal>
  );
};

export default DesignsModal;
