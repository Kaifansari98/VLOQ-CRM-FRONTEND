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
import { useSubmitCostingFile } from "@/hooks/designing-stage/designing-leads-hooks";
import { useLeadUniqueProductTypes, useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const costingFileSchema = z.object({
  product_type: z.string().optional(),
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
  const isCustomVendor = useAppSelector((s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only);
  
  const { data: uniqueProductTypes } = useLeadUniqueProductTypes(leadId, vendorId, open);
  const { data: structureInstancesData } = useLeadProductStructureInstances(leadId, vendorId, open);

  const form = useForm<CostingFileFormValues>({
    resolver: zodResolver(costingFileSchema),
    defaultValues: { upload_pdf: [], product_type: "" },
  });

  const showProductTypeSelect =
    !uniqueProductTypes?.data || uniqueProductTypes.data.length > 1;

  React.useEffect(() => {
    if (uniqueProductTypes?.data && uniqueProductTypes.data.length === 1) {
      form.setValue("product_type", uniqueProductTypes.data[0].type);
    }
  }, [uniqueProductTypes?.data, form]);

  React.useEffect(() => {
    if (!open) {
      form.reset({ upload_pdf: [], product_type: "" });
    }
  }, [open, form]);

  const submitCostingFileMutation = useSubmitCostingFile();

  const onSubmit = async (data: CostingFileFormValues) => {
    if (isCustomVendor && !data.product_type) {
      form.setError("product_type", {
        type: "manual",
        message: "Product type is required",
      });
      return;
    }

    try {
      let productStructureInstanceIds: number[] = [];

      if (data.product_type) {
        const instancesList = structureInstancesData?.data;
        if (instancesList && Array.isArray(instancesList)) {
          productStructureInstanceIds = instancesList
            .filter((inst: any) => {
              const type1 = inst.productType?.type;
              const type2 = inst.productItemCode?.productStructure?.productType?.type;
              return type1 === data.product_type || type2 === data.product_type;
            })
            .map((inst: any) => inst.id);
        }
      }

      await submitCostingFileMutation.mutateAsync({
        files: Array.from(data.upload_pdf),
        vendorId,
        leadId,
        userId,
        productStructureInstanceIds,
      });

      toastManager.add({ title: "Costing file uploaded successfully!", type: "success" });

      form.reset({ upload_pdf: [], product_type: "" });
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
          {isCustomVendor && showProductTypeSelect && (
            <FormField
              control={form.control}
              name="product_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {uniqueProductTypes?.data && uniqueProductTypes.data.length > 0 ? (
                        uniqueProductTypes.data.map((pt: any) => (
                          <SelectItem key={pt.id} value={pt.type}>
                            {pt.type}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No product types available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
