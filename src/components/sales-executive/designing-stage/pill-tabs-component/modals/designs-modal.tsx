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
import { useSubmitDesigns } from "@/api/designingStageQueries";
import { useQueryClient } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const designsSchema = z.object({
  design_type: z.enum(["2D", "3D"]),
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
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const isAuditor = userType?.trim().toLowerCase() === "auditor";

  const queryClient = useQueryClient();
  const form = useForm<DesignsFormValues>({
    resolver: zodResolver(designsSchema),
    defaultValues: { upload_pdf: [] },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({ upload_pdf: [] });
    }
  }, [open, form]);

  const submitDesignsMutation = useSubmitDesigns();
  
  console.log("Uploading designs :- testing for dev", {
    leadId,
    accountId,
  });

  const onSubmit = async (data: DesignsFormValues) => {
    try {
      await submitDesignsMutation.mutateAsync({
        files: Array.from(data.upload_pdf),
        vendorId,
        leadId,
        userId,
        designType: data.design_type,
      });

      toastManager.add({ title: "Design files uploaded successfully!", type: "success" });

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
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
      title="Add Designs"
      description="Upload design files in supported CAD or document formats."
      size="smd"
    >
       
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
              <FormField
                control={form.control}
                name="design_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Design Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select 2D or 3D" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2D">2D Design</SelectItem>
                        <SelectItem value="3D">3D Design</SelectItem>
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
                    <FormLabel>Upload Design Files *</FormLabel>
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

                {!isAuditor && (
                  <Button type="submit" disabled={submitDesignsMutation.isPending}>
                    {submitDesignsMutation.isPending
                      ? "Uploading..."
                      : "Submit Designs"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        
    </BaseModal>
  );
};

export default DesignsModal;
