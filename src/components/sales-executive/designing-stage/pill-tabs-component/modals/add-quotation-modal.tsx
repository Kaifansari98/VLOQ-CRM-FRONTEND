"use client";

import React, { useState, useEffect } from "react";

import { useDetails } from "../details-context";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toastManager } from "@/components/ui/toast";
import { DocumentsUploader } from "@/components/document-upload";
import { useAppSelector } from "@/redux/store";
import {
  useDesignsDoc,
  useQuotationDoc,
  useSubmitQuotation,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useQueryClient } from "@tanstack/react-query";
import BaseModal from "@/components/utils/baseModal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useProductTypes } from "@/hooks/useTypesMaster";
import { detectDesignType } from "@/components/utils/documentCard";
import { DesignsDocument } from "@/types/designing-stage-types";
import { fetchLeadB2BRequirementMappingsApi } from "@/api/typesMasterApi";
import { uploadRequirementDocumentApi } from "@/api/leadRequirementDocuments";
import {
  getDesignDocsWithoutQuotation,
  groupDesignDocsByRevision,
} from "@/lib/design-revision";

// Schema
const quotationSchema = z.object({
  b2b_requirement_type_id: z.string().optional(),
  upload_pdf: z
    .array(z.instanceof(File))
    .min(1, "At least one quotation file is required"),
  design_document_id: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddQuotationModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const { leadId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;
  const vendorCustomUserTypeMode = useAppSelector(
    (s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const [b2bReqTypes, setB2BReqTypes] = useState<{ id: number; typeName: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: designDocsResponse, isLoading: isLoadingDesignDocs } =
    useDesignsDoc(vendorId, leadId);
  const { data: quotationDocsResponse, isLoading: isLoadingQuotationDocs } =
    useQuotationDoc(vendorId, leadId);
  const designDocs: DesignsDocument[] = designDocsResponse?.data?.documents ?? [];
  const quotationDocs: DesignsDocument[] =
    quotationDocsResponse?.data?.documents ?? [];
  const availableDesignDocs = React.useMemo(
    () => getDesignDocsWithoutQuotation(designDocs, quotationDocs),
    [designDocs, quotationDocs],
  );

  const { mutate: uploadQuotation, isPending } = useSubmitQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { b2b_requirement_type_id: "", upload_pdf: [], design_document_id: "" },
  });

  useEffect(() => {
    if (open && vendorId && leadId && !handlesLargeScaleProjects) {
      fetchLeadB2BRequirementMappingsApi(leadId, vendorId)
        .then((res) => {
          if (res?.success && Array.isArray(res?.data)) {
            const mapped = res.data.map((item: any) => ({
              id: item.b2b_requirement_type_id,
              typeName: item.b2bRequirementType?.type || `Requirement #${item.b2b_requirement_type_id}`,
            }));
            setB2BReqTypes(mapped);
            if (mapped.length > 0) {
              form.setValue("b2b_requirement_type_id", String(mapped[0].id));
            }
          }
        })
        .catch((err) => console.error("Error fetching B2B requirement mappings:", err));
    }
  }, [open, vendorId, leadId, handlesLargeScaleProjects, form]);

  React.useEffect(() => {
    if (!open) {
      form.reset({ b2b_requirement_type_id: "", upload_pdf: [], design_document_id: "" });
    }
  }, [open, form]);

  React.useEffect(() => {
    const selectedDesignDocId = form.getValues("design_document_id");
    if (
      selectedDesignDocId &&
      !availableDesignDocs.some((doc) => String(doc.id) === selectedDesignDocId)
    ) {
      form.setValue("design_document_id", "");
    }
  }, [availableDesignDocs, form]);

  const onSubmit = async (data: QuotationFormValues) => {
    if (!data.upload_pdf?.length) {
      toastManager.add({ title: "Please upload at least one quotation file.", type: "error" });
      return;
    }

    const b2bReqTypeId =
      !handlesLargeScaleProjects && data.b2b_requirement_type_id
        ? Number(data.b2b_requirement_type_id)
        : !handlesLargeScaleProjects && b2bReqTypes.length > 0
        ? b2bReqTypes[0]?.id
        : null;

    if (b2bReqTypeId) {
      try {
        setSubmitting(true);
        const selectedDesignDoc = designDocs.find(
          (doc) => String(doc.id) === data.design_document_id
        );
        for (const file of data.upload_pdf) {
          await uploadRequirementDocumentApi({
            file,
            lead_id: leadId,
            vendor_id: vendorId,
            b2b_requirement_type_id: b2bReqTypeId,
            product_type_id: selectedDesignDoc?.product_type_id || undefined,
            stage: "Quotation",
            created_by: userId,
          });
        }
        toastManager.add({
          title: `${data.upload_pdf.length} quotation${
            data.upload_pdf.length > 1 ? "s" : ""
          } uploaded successfully!`,
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["getQuotationDoc", vendorId, leadId],
        });
        queryClient.invalidateQueries({
          queryKey: ["designingStageCounts", vendorId, leadId],
        });
        form.reset({ b2b_requirement_type_id: "", upload_pdf: [], design_document_id: "" });
        onOpenChange(false);
      } catch (err: any) {
        toastManager.add({
          title: err?.response?.data?.message || err?.message || "Failed to upload quotation",
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if ((vendorCustomUserTypeMode || handlesLargeScaleProjects) && !data.design_document_id) {
      if (designDocs.length === 0) {
        toastManager.add({
          title: "No design files available. Please upload a design file first.",
          type: "error",
        });
      } else if (availableDesignDocs.length === 0) {
        toastManager.add({
          title: "All designs are already linked to a quotation. Please upload a new design file.",
          type: "error",
        });
      } else {
        toastManager.add({
          title: "Please select a design file for this quotation.",
          type: "error",
        });
      }
      return;
    }

    uploadQuotation(
      {
        files: data.upload_pdf,
        vendorId,
        leadId,
        userId,
        designDocumentId: data.design_document_id
          ? Number(data.design_document_id)
          : undefined,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${data.upload_pdf.length} quotation${
              data.upload_pdf.length > 1 ? "s" : ""
            } uploaded successfully!`,
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["getQuotationDoc", vendorId, leadId],
          });
          queryClient.invalidateQueries({
            queryKey: ["designingStageCounts", vendorId, leadId],
          });
          form.reset({ upload_pdf: [], design_document_id: "" });
          onOpenChange(false);
        },
        onError: (err: any) => {
          const errorMessage =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Something went wrong";

          toastManager.add({
            title: errorMessage,
            type: "error",
          });
        },
      }
    );
  };

  const { data: productTypesData } = useProductTypes();
  const productTypes = React.useMemo(() => productTypesData?.data || [], [productTypesData]);

  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
    open && Boolean(handlesLargeScaleProjects || vendorCustomUserTypeMode)
  );
  const structureInstances: any[] = React.useMemo(
    () => (Array.isArray(structureInstancesData?.data) ? structureInstancesData.data : []),
    [structureInstancesData]
  );

  const displayDesignDocs = availableDesignDocs;

  // Group designs instance-wise (e.g. Office, Hotel, Small Order)
  const groupedDesignDocsByInstance = React.useMemo(() => {
    const productTypeMap = new Map<string, string>(
      productTypes.map((item: any) => [String(item.id), String(item.type || "").trim()])
    );

    const instanceMap = new Map<string, any>(
      structureInstances.map((item: any) => [String(item.id), item])
    );

    const instanceToProductTypeMap = new Map<string, string>(
      structureInstances
        .map((item: any) => {
          const productTypeId =
            item.product_type_id ??
            item.productType?.id ??
            item.productItemCode?.productStructure?.productType?.id;
          return productTypeId ? [String(item.id), String(productTypeId)] as const : null;
        })
        .filter(Boolean) as readonly (readonly [string, string])[]
    );

    const groups = new Map<string, { title: string; docs: DesignsDocument[] }>();

    for (const doc of displayDesignDocs) {
      let groupTitle = "";

      // 1. Try matching product_type_id
      if (doc.product_type_id && productTypeMap.has(String(doc.product_type_id))) {
        groupTitle = productTypeMap.get(String(doc.product_type_id))!;
      }

      // 2. Try matching product_structure_instance_id
      if (!groupTitle && doc.product_structure_instance_id) {
        const inst = instanceMap.get(String(doc.product_structure_instance_id));
        const resolvedTypeId = instanceToProductTypeMap.get(String(doc.product_structure_instance_id));
        groupTitle =
          inst?.productType?.type ||
          inst?.name ||
          inst?.custom_name ||
          (resolvedTypeId ? productTypeMap.get(resolvedTypeId) : "") ||
          inst?.productItemCode?.productStructure?.productType?.type ||
          "";
      }

      // 3. Fallback: Parse structure/instance name from standard filename D{rev}_(2D_|3D_)?{client}_{structure}_{date}.pdf
      if (!groupTitle && doc.doc_og_name) {
        const clean = doc.doc_og_name.replace(/\.[^/.]+$/, "").replace(/^\[.*?\]\s*/, "");
        const match = clean.match(/^D\d+_(?:(?:2D|3D)_)?([^_]+)_(.+?)_\d{4}-\d{2}-\d{2}$/i);
        if (match && match[2]) {
          groupTitle = match[2].replace(/_/g, " ").trim();
        }
      }

      if (!groupTitle) {
        groupTitle = "General Designs";
      }

      const key = groupTitle.trim().toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { title: groupTitle, docs: [] });
      }
      groups.get(key)!.docs.push(doc);
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [displayDesignDocs, productTypes, structureInstances]);

  return (
    <BaseModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset({ b2b_requirement_type_id: "", upload_pdf: [], design_document_id: "" });
        }
        onOpenChange(nextOpen);
      }}
      title="Add Quotation"
      description="Upload the official quotation document for this lead."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* Requirement Type Dropdown for B2B (only when NOT handlesLargeScaleProjects) */}
          {!handlesLargeScaleProjects && b2bReqTypes.length > 0 && (
            <FormField
              control={form.control}
              name="b2b_requirement_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement Type</FormLabel>
                  <Select
                    value={field.value || (b2bReqTypes[0]?.id ? String(b2bReqTypes[0].id) : "")}
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

          {/* Select Design File Dropdown placed at the top before Quotation File */}
          {(vendorCustomUserTypeMode || handlesLargeScaleProjects) && (
            <FormField
              control={form.control}
              name="design_document_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Design File</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={
                        isLoadingDesignDocs ||
                        isLoadingQuotationDocs ||
                        displayDesignDocs.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingDesignDocs || isLoadingQuotationDocs
                              ? "Loading design files..."
                              : displayDesignDocs.length === 0
                                ? "No design files available"
                                : "Select one design file"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {groupedDesignDocsByInstance.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No design files available
                          </SelectItem>
                        ) : (
                          groupedDesignDocsByInstance.map((group, index) => (
                            <React.Fragment key={group.title}>
                              {index > 0 && <SelectSeparator />}
                              <SelectGroup>
                                <SelectLabel className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-md my-1">
                                  <div className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold">
                                    <Building2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                                    <span>{group.title}</span>
                                  </div>
                                  <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded-full shadow-3xs">
                                    {group.docs.length} {group.docs.length === 1 ? "file" : "files"}
                                  </span>
                                </SelectLabel>
                                {group.docs.map((doc) => {
                                  const designType = detectDesignType(doc.doc_og_name);

                                  return (
                                    <SelectItem key={doc.id} value={String(doc.id)} className="pl-3 pr-8">
                                      <div className="flex items-center gap-2 max-w-full">
                                        {designType && (
                                          <span
                                            className={`shrink-0 px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold text-white leading-none ${
                                              designType === "2D"
                                                ? "bg-[#0070F3]"
                                                : designType === "3D"
                                                ? "bg-[#00A854]"
                                                : "bg-[#7928CA]"
                                            }`}
                                          >
                                            {designType}
                                          </span>
                                        )}
                                        <span className="truncate">{doc.doc_og_name}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            </React.Fragment>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Select the design file this quotation belongs to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Quotation File Uploader */}
          <FormField
            control={form.control}
            name="upload_pdf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quotation File</FormLabel>
                <FormControl>
                  <DocumentsUploader
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || submitting}
            >
              {isPending || submitting ? "Uploading..." : "Submit Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default AddQuotationModal;
