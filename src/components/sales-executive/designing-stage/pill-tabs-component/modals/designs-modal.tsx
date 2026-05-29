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
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { Checkbox } from "@/components/ui/checkbox";
import type { LeadProductStructureInstance } from "@/api/leads";

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
  selected_instance_ids: z.array(z.number()).optional(),
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
  const isCustomUserTypeOnlyVendor = useAppSelector(
    (s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const { data: structureInstances = [] } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  ) as { data: LeadProductStructureInstance[] | undefined };

  const queryClient = useQueryClient();
  const form = useForm<DesignsFormValues>({
    resolver: zodResolver(designsSchema),
    defaultValues: { upload_pdf: [], selected_instance_ids: [] },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset({ upload_pdf: [], selected_instance_ids: [] });
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
        productStructureInstanceIds: isCustomUserTypeOnlyVendor
          ? (data.selected_instance_ids ?? [])
          : [],
      });

      toastManager.add({ title: "Design files uploaded successfully!", type: "success" });

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });

      form.reset({ upload_pdf: [], selected_instance_ids: [] });
      onOpenChange(false);
    } catch (error: any) {
      toastManager.add({ title: error?.message || "Failed to upload design files.", type: "error" });
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

              {isCustomUserTypeOnlyVendor && (
                <FormField
                  control={form.control}
                  name="selected_instance_ids"
                  render={({ field }) => {
                    const selectedIds = field.value ?? [];
                    const allSelected =
                      structureInstances.length > 0 &&
                      selectedIds.length === structureInstances.length;

                    const toggleInstance = (instanceId: number, checked: boolean) => {
                      const nextValues = checked
                        ? [...selectedIds, instanceId]
                        : selectedIds.filter((id) => id !== instanceId);
                      field.onChange(nextValues);
                    };

                    return (
                      <FormItem>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <FormLabel>Select Product Instances</FormLabel>
                            {structureInstances.length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto px-0 text-xs"
                                onClick={() =>
                                  field.onChange(
                                    allSelected
                                      ? []
                                      : structureInstances.map(
                                          (instance: LeadProductStructureInstance) =>
                                            instance.id,
                                        ),
                                  )
                                }
                              >
                                {allSelected ? "Deselect All" : "Select All"}
                              </Button>
                            )}
                          </div>

                          {structureInstances.length > 0 ? (
                            <div className="grid gap-3">
                              {structureInstances.map((instance) => {
                                const isChecked = selectedIds.includes(instance.id);
                                return (
                                  <label
                                    key={instance.id}
                                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        toggleInstance(instance.id, checked === true)
                                      }
                                    />
                                    <div className="space-y-1 leading-tight">
                                      <div className="text-sm font-medium">
                                        {instance.title}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {instance.productStructure?.type || "Product Structure"}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                              No product instances found for this lead.
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Selected instances will be used in design file naming.
                            If none are selected, all product instances will be considered.
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

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
