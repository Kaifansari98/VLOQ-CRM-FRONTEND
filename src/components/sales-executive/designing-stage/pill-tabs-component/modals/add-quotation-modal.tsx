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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DesignsDocument } from "@/types/designing-stage-types";
import { fetchLeadB2BRequirementMappingsApi } from "@/api/typesMasterApi";
import { uploadRequirementDocumentApi } from "@/api/leadRequirementDocuments";

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

const getRevisionKey = (fileName: string, prefix: "Q" | "D" | "R") => {
  let parsedName = fileName.replace(/\.[^/.]+$/, "");
  parsedName = parsedName.replace(/^\[.*?\]\s*/, "");
  const match =
    prefix === "Q"
      ? parsedName.match(/^Q(\d+)_(.+)_\d{4}-\d{2}-\d{2}$/i)
      : parsedName.match(/^D(\d+)_(?:(2D|3D)_)?(.+)_\d{4}-\d{2}-\d{2}$/i);

  if (!match) return null;

  if (prefix === "Q") {
    return `${match[1]}-${match[2].toLowerCase()}`;
  }

  return `${match[1]}-${match[3].toLowerCase()}`;
};

const getDesignRevisionKey = (fileName: string) =>
  getRevisionKey(fileName, "D") ?? getRevisionKey(fileName, "R");

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
  const usedQuotationKeys = React.useMemo(
    () =>
      new Set(
        quotationDocs
          .map((doc) => getRevisionKey(doc.doc_og_name, "Q"))
          .filter((key): key is string => Boolean(key)),
      ),
    [quotationDocs],
  );
  const availableDesignDocs = React.useMemo(
    () =>
      designDocs.filter((doc) => {
        const designKey = getDesignRevisionKey(doc.doc_og_name);
        return !designKey || !usedQuotationKeys.has(designKey);
      }),
    [designDocs, usedQuotationKeys],
  );

  const { mutate: uploadQuotation, isPending } = useSubmitQuotation();

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { b2b_requirement_type_id: "", upload_pdf: [], design_document_id: "" },
  });

  useEffect(() => {
    if (open && vendorId && leadId) {
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
  }, [open, vendorId, leadId, form]);

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

    const b2bReqTypeId = data.b2b_requirement_type_id
      ? Number(data.b2b_requirement_type_id)
      : b2bReqTypes[0]?.id;

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
      if (availableDesignDocs.length === 0) {
        toastManager.add({
          title: "No design files available. Please upload a design file first.",
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
          {/* Requirement Type Dropdown */}
          {b2bReqTypes.length > 0 && (
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
                        availableDesignDocs.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingDesignDocs || isLoadingQuotationDocs
                              ? "Loading design files..."
                              : availableDesignDocs.length === 0
                                ? "No design files available"
                                : "Select one design file"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDesignDocs.map((doc) => (
                          <SelectItem key={doc.id} value={String(doc.id)}>
                            {doc.doc_og_name}
                          </SelectItem>
                        ))}
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
