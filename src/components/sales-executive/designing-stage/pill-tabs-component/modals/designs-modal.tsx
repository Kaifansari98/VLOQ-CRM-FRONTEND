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
import { DocumentsUploader } from "@/components/document-upload";
import { useDetails } from "../details-context";
import { useAppSelector } from "@/redux/store";
import { useSubmitDesigns } from "@/api/designingStageQueries";
import { useQueryClient } from "@tanstack/react-query";

// ✅ Schema (can later extend with file type/size rules)
const designsSchema = z.object({
  upload_pdf: z.any().refine((files) => files && files.length > 0, {
    message: "Please upload at least one design file.",
  }),
});

type DesignsFormValues = z.infer<typeof designsSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DesignsModal: React.FC<LeadViewModalProps> = ({ open, onOpenChange }) => {
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;
  const queryClient = useQueryClient();

  const form = useForm<DesignsFormValues>({
    resolver: zodResolver(designsSchema),
    defaultValues: { upload_pdf: [] },
  });

  // ✅ Use the mutation hook
  const submitDesignsMutation = useSubmitDesigns();

  const onSubmit = async (data: DesignsFormValues) => {
    if (!data.upload_pdf || data.upload_pdf.length === 0) {
      toast.error("Please upload design files.");
      return;
    }

    if (!leadId || !accountId || !vendorId || !userId) {
      toast.error("Missing required information.");
      return;
    }

    try {
      await submitDesignsMutation.mutateAsync({
        files: Array.from(data.upload_pdf), // Convert FileList to Array
        vendorId,
        leadId,
        userId,
        accountId,
      });

      toast.success("Design files uploaded successfully!");

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      // Reset form and close modal
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error uploading designs:", error);
      toast.error(error?.message || "Failed to upload design files.");
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add Designs</DialogTitle>
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
                      <FormLabel>Design Documents</FormLabel>
                      <FormControl>
                        <DocumentsUploader
                          value={field.value}
                          onChange={field.onChange}
                          accept=".pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={submitDesignsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitDesignsMutation.isPending}
                  >
                    {submitDesignsMutation.isPending
                      ? "Uploading..."
                      : "Submit Designs"}
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

export default DesignsModal;
