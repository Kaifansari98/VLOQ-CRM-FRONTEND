"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useQuery } from "@tanstack/react-query";
import { useB2BRequirementTypes, useProductTypes } from "@/hooks/useTypesMaster";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useFranchisesByVendorId } from "@/api/franchise";
import {
  fetchRequirementDocumentsApi,
  fetchRequirementDocumentTypesApi,
  uploadRequirementDocumentApi,
  deleteRequirementDocumentApi,
  RequirementDocumentItem,
  RequirementDocumentType,
} from "@/api/leadRequirementDocuments";
import DocumentCard from "@/components/utils/documentCard";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import { Paperclip, Plus, Trash2, Package, Upload, Loader2 } from "lucide-react";
import Loader from "@/components/utils/loader";
import { DocumentsUploader } from "@/components/document-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClientReceivedFilesTab() {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Modal / Upload states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<number | "">("");
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<number | "">("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Listen to open-client-received-files-upload-modal custom event to trigger upload modal from parent tabs row
  useEffect(() => {
    const handleOpen = () => {
      setIsUploadModalOpen(true);
      setUploadFiles([]);
      setSelectedProductTypeId("");
      setSelectedDocTypeId("");
    };
    window.addEventListener("open-client-received-files-upload-modal", handleOpen);
    return () => {
      window.removeEventListener("open-client-received-files-upload-modal", handleOpen);
    };
  }, []);

  // Queries
  const { data: b2bReqTypesData, isLoading: isB2bTypesLoading } = useB2BRequirementTypes(vendorId);
  const { data: productTypes, isLoading: isProductTypesLoading } = useProductTypes();

  const { data: leadData, isLoading: isLeadLoading } = useLeadById(leadId, vendorId, userId);
  const lead = leadData?.data?.lead;

  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(vendorId, !!vendorId);
  const isB2b = useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise: any) => franchise.id === lead?.franchise_id,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, lead?.franchise_id]);

  const { data: documentsData, refetch: refetchDocuments, isLoading: isDocsLoading } = useQuery({
    queryKey: ["lead-requirement-documents", leadId, vendorId, isB2b],
    queryFn: () => fetchRequirementDocumentsApi(leadId, vendorId!, undefined, undefined, isB2b ? "Requirement" : undefined),
    enabled: !!leadId && !!vendorId && isB2b !== undefined,
  });
  const documents: RequirementDocumentItem[] = useMemo(() => documentsData?.data || [], [documentsData]);

  const { data: docTypesData, isLoading: isDocTypesLoading } = useQuery({
    queryKey: ["lead-requirement-document-types", vendorId],
    queryFn: () => fetchRequirementDocumentTypesApi(vendorId!),
    enabled: !!vendorId,
  });
  const docTypes: RequirementDocumentType[] = useMemo(() => docTypesData?.data || [], [docTypesData]);

  // Selected requirement/product types mapped for this lead
  const selectedProductTypeIds = useMemo(() => {
    if (!lead) return [];
    if (isB2b) {
      const b2bIds = (lead as any)?.leadB2BReqMappings
        ?.map((m: any) => m.b2b_requirement_type_id || m.b2bRequirementType?.id)
        ?.filter(Boolean) || [];
      const briefTypeIds = (lead as any)?.leadProcessBriefs
        ?.map((m: any) => m.b2b_requirement_type_id || m.b2bRequirementType?.id)
        ?.filter(Boolean) || [];
      return Array.from(new Set<number>([...b2bIds, ...briefTypeIds]));
    } else {
      return lead?.productMappings
        ?.map((pm: any) => pm.product_type_id || pm.productType?.id)
        ?.filter(Boolean) || [];
    }
  }, [lead, isB2b]);

  // Merge selected type IDs with any type IDs that already have documents uploaded
  const allTypeIds = useMemo(() => {
    const idsFromDocs = documents.map((d: any) => d.b2b_requirement_type_id || d.product_type_id).filter(Boolean);
    return Array.from(new Set<number>([...selectedProductTypeIds, ...(idsFromDocs as number[])]));
  }, [selectedProductTypeIds, documents]);

  // Resolve type names and match documents
  const typesWithDocs = useMemo(() => {
    const typesList = b2bReqTypesData?.data || productTypes?.data || [];
    const mapped = allTypeIds.map((typeId) => {
      const typeObj = typesList.find((t: any) => t.id === typeId);
      const name = typeObj?.type || `Type ${typeId}`;
      const typeDocs = documents.filter((d) => (d.b2b_requirement_type_id || d.product_type_id) === typeId);
      return {
        id: typeId,
        name,
        docs: typeDocs,
      };
    });
    
    // Sort: show types with more documents first
    return mapped.sort((a, b) => b.docs.length - a.docs.length);
  }, [allTypeIds, b2bReqTypesData, productTypes, documents]);

  // Delete Document Handler
  const handleDeleteDocument = async (docId: number) => {
    if (!userId) return;
    try {
      const res = await deleteRequirementDocumentApi(docId, userId);
      if (res?.success) {
        toastManager.add({ title: "Document deleted successfully", type: "success" });
        refetchDocuments();
      } else {
        toastManager.add({ title: res?.message || "Failed to delete document", type: "error" });
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
      toastManager.add({ title: "Failed to delete document", type: "error" });
    }
  };

  // Upload Document Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductTypeId) {
      toastManager.add({ title: "Please select a Requirement Type", type: "error" });
      return;
    }
    if (!selectedDocTypeId) {
      toastManager.add({ title: "Please select a Document Type", type: "error" });
      return;
    }
    if (uploadFiles.length === 0) {
      toastManager.add({ title: "Please select a file to upload", type: "error" });
      return;
    }

    try {
      setIsUploading(true);
      const uploadPromises = uploadFiles.map((file) =>
        uploadRequirementDocumentApi({
          file,
          lead_id: leadId,
          vendor_id: vendorId!,
          product_type_id: isB2b ? undefined : Number(selectedProductTypeId),
          b2b_requirement_type_id: isB2b ? Number(selectedProductTypeId) : undefined,
          doc_type_id: Number(selectedDocTypeId),
          stage: "Requirement",
          created_by: userId!,
        })
      );

      const results = await Promise.all(uploadPromises);
      const failed = results.filter((res) => !res?.success);

      if (failed.length === 0) {
        toastManager.add({ title: "All documents uploaded successfully!", type: "success" });
        setIsUploadModalOpen(false);
        setUploadFiles([]);
        setSelectedProductTypeId("");
        setSelectedDocTypeId("");
        refetchDocuments();
      } else {
        const errorMessages = failed.map((f) => f?.message || "Upload failed").join(", ");
        toastManager.add({
          title: `Upload completed: ${results.length - failed.length} succeeded, ${failed.length} failed. (${errorMessages})`,
          type: "error",
        });
        refetchDocuments();
      }
    } catch (err: any) {
      console.error("Error uploading document:", err);
      toastManager.add({
        title: err?.response?.data?.message || err?.message || "Upload failed",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const typesListForSelector = useMemo(() => {
    const list = (isB2b ? b2bReqTypesData?.data : productTypes?.data) || [];
    const sourceList = list.length > 0 ? list : (b2bReqTypesData?.data || productTypes?.data || []);

    if (selectedProductTypeIds.length > 0) {
      return sourceList.filter((t: any) => selectedProductTypeIds.includes(t.id));
    }

    return sourceList.filter((t: any) => allTypeIds.includes(t.id));
  }, [isB2b, b2bReqTypesData, productTypes, selectedProductTypeIds, allTypeIds]);

  const isLoading = isB2bTypesLoading || isProductTypesLoading || isLeadLoading || isDocsLoading || isDocTypesLoading;

  if (isLoading) {
    return <Loader size={200} message="Loading Client Received Files..." />;
  }

  return (
    <div className="space-y-6">

      {allTypeIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl bg-muted/5 border-border/70 text-center">
          <Package className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No client documents uploaded yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
            Upload client received documents by selecting a requirement type and document type.
          </p>
          <Button
            onClick={() => {
              setIsUploadModalOpen(true);
              setUploadFiles([]);
              setSelectedProductTypeId("");
              setSelectedDocTypeId("");
            }}
            size="sm"
            className="text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {typesWithDocs.map((type) => (
            <div
              key={type.id}
              className="p-5 rounded-2xl border bg-card text-card-foreground shadow-xs border-border/70 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-indigo-500 shrink-0" />
                    <h3 className="font-semibold text-sm md:text-base text-foreground">
                      {type.name}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {type.docs.length} {type.docs.length === 1 ? "File" : "Files"}
                  </span>
                </div>

                {type.docs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Package className="h-8 w-8 opacity-40 mb-2" />
                    <p className="text-xs">No client documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {type.docs.map((doc) => {
                      const docTypeObj = doc.documentType || docTypes.find((t) => t.id === doc.doc_type_id);
                      const tagLabel = docTypeObj
                        ? docTypeObj.type
                        : "Document";

                      return (
                        <div key={doc.id} className="relative">
                          <DocumentCard
                            doc={{
                              id: doc.id,
                              originalName: doc.doc_og_name,
                              signedUrl: doc.signedUrl || "",
                              created_at: doc.created_at,
                            }}
                            tagLabel={tagLabel}
                            canDelete={true}
                            onDelete={() => handleDeleteDocument(doc.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <BaseModal
        open={isUploadModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUploadFiles([]);
          }
          setIsUploadModalOpen(open);
        }}
        title="Upload Client Received File"
        description="Choose a requirement type, document type, and select files to upload."
        size="smd"
      >
        <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
          {/* Requirement Type Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Requirement Type</Label>
            <Select
              value={selectedProductTypeId ? String(selectedProductTypeId) : ""}
              onValueChange={(value) => setSelectedProductTypeId(Number(value))}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select Requirement Type..." />
              </SelectTrigger>
              <SelectContent>
                {typesListForSelector.map((t: any) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Document Type</Label>
            <Select
              value={selectedDocTypeId ? String(selectedDocTypeId) : ""}
              onValueChange={(value) => setSelectedDocTypeId(Number(value))}
              disabled={docTypes.length === 0}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select Document Type..." />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <div className="flex items-center gap-2">
                      <span>{t.type}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                        {t.tag}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Upload Files</Label>
            <DocumentsUploader
              value={uploadFiles}
              onChange={setUploadFiles}
              accept=".pdf,.jpg,.jpeg,.png,.zip"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadFiles([]);
              }}
              disabled={isUploading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !selectedProductTypeId || !selectedDocTypeId || uploadFiles.length === 0}
              className="text-xs gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}
