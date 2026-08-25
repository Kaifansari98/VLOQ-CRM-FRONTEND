"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  useLeadUniqueProductTypes,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import {
  useDesignsDoc,
  useLeadSpecifications,
} from "@/hooks/designing-stage/designing-leads-hooks";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLeadB2BRequirementMappingsApi } from "@/api/typesMasterApi";
import { uploadRequirementDocumentApi } from "@/api/leadRequirementDocuments";

const designsSchema = z.object({
  b2b_requirement_type_id: z.string().optional(),
  design_type: z.enum(["2D", "3D", "2D + 3D"]).optional(),
  product_type: z.string().optional(),
  specification_id: z.string().optional(),
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
            f.name,
          ),
        ),
      {
        message: "Only PDF, ZIP or supported design formats are allowed.",
      },
    ),
});

type DesignsFormValues = z.infer<typeof designsSchema>;

interface DesignsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDefaultDesignValues = (): DesignsFormValues => ({
  b2b_requirement_type_id: "",
  design_type: undefined,
  product_type: "",
  specification_id: "",
  upload_pdf: [],
});

const DesignsModal: React.FC<DesignsModalProps> = ({ open, onOpenChange }) => {
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const isCustomVendor = useAppSelector(
    (s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const [b2bReqTypes, setB2BReqTypes] = useState<
    { id: number; typeName: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const form = useForm<DesignsFormValues>({
    resolver: zodResolver(designsSchema),
    defaultValues: getDefaultDesignValues(),
  });

  useEffect(() => {
    if (open && vendorId && leadId) {
      fetchLeadB2BRequirementMappingsApi(leadId, vendorId)
        .then((res) => {
          if (res?.success && Array.isArray(res?.data)) {
            const mapped = res.data.map((item: any) => ({
              id: item.b2b_requirement_type_id,
              typeName:
                item.b2bRequirementType?.type ||
                `Requirement #${item.b2b_requirement_type_id}`,
            }));
            setB2BReqTypes(mapped);
            if (mapped.length > 0) {
              form.setValue("b2b_requirement_type_id", String(mapped[0].id));
            }
          }
        })
        .catch((err) =>
          console.error("Error fetching B2B requirement mappings:", err),
        );
    }
  }, [open, vendorId, leadId, form]);

  React.useEffect(() => {
    if (!open) {
      form.reset(getDefaultDesignValues());
    }
  }, [open, form]);

  const submitDesignsMutation = useSubmitDesigns();

  const { data: uniqueProductTypes } = useLeadUniqueProductTypes(
    leadId,
    vendorId,
    open,
  );
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
    open,
  );
  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);
  const { data: designDocsResponse } = useDesignsDoc(vendorId, leadId);

  const productTypes = uniqueProductTypes?.data ?? [];
  const shouldRenderProductTypeField =
    isCustomVendor || handlesLargeScaleProjects;
  const showProductTypeSelect =
    shouldRenderProductTypeField && (!productTypes || productTypes.length > 1);
  const selectedProductType = form.watch("product_type");
  const structureInstances = Array.isArray(structureInstancesData?.data)
    ? structureInstancesData.data
    : [];
  const linkedSpecificationIds = useMemo(
    () =>
      new Set(
        (designDocsResponse?.data?.documents ?? [])
          .map((doc) => doc.specification?.id)
          .filter((id): id is number => typeof id === "number"),
      ),
    [designDocsResponse?.data?.documents],
  );

  const filteredSpecifications = useMemo(() => {
    if (!handlesLargeScaleProjects || !selectedProductType) {
      return [];
    }

    const normalizedProductType = selectedProductType.trim().toLowerCase();
    const eligibleItemCodeIds = new Set<number>();

    for (const instance of structureInstances) {
      const productTypeName =
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type;
      const itemCodeId = instance.productItemCode?.id;

      if (
        itemCodeId &&
        typeof productTypeName === "string" &&
        productTypeName.trim().toLowerCase() === normalizedProductType
      ) {
        eligibleItemCodeIds.add(itemCodeId);
      }
    }

    return specifications.filter((spec) => {
      if (!spec.item_code_id || linkedSpecificationIds.has(spec.id)) {
        return false;
      }

      return eligibleItemCodeIds.has(spec.item_code_id);
    });
  }, [
    handlesLargeScaleProjects,
    linkedSpecificationIds,
    selectedProductType,
    specifications,
    structureInstances,
  ]);

  React.useEffect(() => {
    if (productTypes && productTypes.length === 1) {
      form.setValue("product_type", productTypes[0].type, {
        shouldValidate: true,
      });
    }
  }, [form, productTypes]);

  React.useEffect(() => {
    form.setValue("specification_id", "");
  }, [form, selectedProductType]);

  const onSubmit = async (data: DesignsFormValues) => {
    const b2bReqTypeId = data.b2b_requirement_type_id
      ? Number(data.b2b_requirement_type_id)
      : b2bReqTypes[0]?.id;

    if (b2bReqTypeId) {
      try {
        setSubmitting(true);
        const files = Array.from(data.upload_pdf) as File[];
        for (const file of files) {
          await uploadRequirementDocumentApi({
            file,
            lead_id: leadId,
            vendor_id: vendorId,
            b2b_requirement_type_id: b2bReqTypeId,
            stage: "Designing",
            created_by: userId,
          });
        }
        toastManager.add({
          title: "Design files uploaded successfully!",
          type: "success",
        });

        queryClient.invalidateQueries({
          queryKey: ["getDesignsDoc", vendorId, leadId],
        });
        queryClient.invalidateQueries({
          queryKey: ["designingStageCounts", vendorId, leadId],
        });

        form.reset(getDefaultDesignValues());
        onOpenChange(false);
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to upload design files",
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isCustomVendor && !data.design_type) {
      form.setError("design_type", {
        type: "manual",
        message: "Design type is required",
      });
      return;
    }

    if (isCustomVendor && !data.product_type) {
      form.setError("product_type", {
        type: "manual",
        message: "Product type is required",
      });
      return;
    }

    try {
      let productStructureInstanceIds: number[] = [];
      const specificationId =
        data.specification_id && data.specification_id !== "none"
          ? Number(data.specification_id)
          : null;

      if (data.product_type) {
        if (structureInstances.length > 0) {
          productStructureInstanceIds = structureInstances
            .filter((inst: any) => {
              const type1 = inst.productType?.type;
              const type2 =
                inst.productItemCode?.productStructure?.productType?.type;
              return type1 === data.product_type || type2 === data.product_type;
            })
            .map((inst: any) => inst.id);
        }
      }

      await submitDesignsMutation.mutateAsync({
        files: Array.from(data.upload_pdf),
        vendorId,
        leadId,
        userId,
        designType: data.design_type,
        productStructureInstanceIds,
        specificationId,
      });

      toastManager.add({
        title: "Design files uploaded successfully!",
        type: "success",
      });

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });

      form.reset(getDefaultDesignValues());
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
        if (!state) form.reset(getDefaultDesignValues());
        onOpenChange(state);
      }}
      title="Add Designs"
      description="Upload design files in supported CAD or document formats."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* Requirement Type Dropdown for B2B */}
          {b2bReqTypes.length > 0 && (
            <FormField
              control={form.control}
              name="b2b_requirement_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement Type</FormLabel>
                  <Select
                    value={
                      field.value ||
                      (b2bReqTypes[0]?.id ? String(b2bReqTypes[0].id) : "")
                    }
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Requirement Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {b2bReqTypes.map((req) => (
                        <SelectItem key={req.id} value={String(req.id)}>
                          {req.typeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(isCustomVendor || shouldRenderProductTypeField) && (
            <div
              className={
                isCustomVendor && showProductTypeSelect
                  ? "grid grid-cols-2 gap-4"
                  : "grid grid-cols-1 gap-4"
              }
            >
              {isCustomVendor && (
                <FormField
                  control={form.control}
                  name="design_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Type *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors("design_type");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select design type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2D">2D Design</SelectItem>
                          <SelectItem value="3D">3D Design</SelectItem>
                          <SelectItem value="2D + 3D">
                            2D + 3D Design
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showProductTypeSelect && (
                <FormField
                  control={form.control}
                  name="product_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Product Type {isCustomVendor ? "*" : ""}
                      </FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.clearErrors("product_type");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productTypes.length > 0 ? (
                            productTypes.map((pt: any) => (
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
            </div>
          )}

          {handlesLargeScaleProjects && selectedProductType ? (
            <FormField
              control={form.control}
              name="specification_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specification (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select specification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {filteredSpecifications.map((spec) => (
                        <SelectItem key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

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
                    accept=".pdf,.zip,.pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitDesignsMutation.isPending || submitting}
            >
              {submitDesignsMutation.isPending || submitting
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
