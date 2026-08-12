"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronDown,
  Paperclip,
  Check,
  Eye,
} from "lucide-react";
import DocumentCard, { PreviewModal } from "@/components/utils/documentCard";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { formatDateTime } from "../utils/privileges";
import {
  RequirementDocumentType,
  RequirementDocumentItem,
  fetchRequirementDocumentTypesApi,
  fetchRequirementDocumentsApi,
  uploadRequirementDocumentApi,
  deleteRequirementDocumentApi,
} from "@/api/leadRequirementDocuments";

interface RequirementDocUploadProps {
  leadId: number;
  vendorId: number;
  productTypeId: number;
  userId?: number;
}

export default function RequirementDocUpload({
  leadId,
  vendorId,
  productTypeId,
  userId = 1,
}: RequirementDocUploadProps) {
  const [docTypes, setDocTypes] = useState<RequirementDocumentType[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<RequirementDocumentItem[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; ext: string } | null>(null);

  // Fetch Requirement Document Types for Vendor
  const loadDocumentTypes = async () => {
    try {
      setLoadingTypes(true);
      const res = await fetchRequirementDocumentTypesApi(vendorId);
      if (res?.success && Array.isArray(res?.data)) {
        setDocTypes(res.data);
        if (res.data.length > 0 && !selectedDocTypeId) {
          setSelectedDocTypeId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load document types:", err);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Fetch Requirement Documents for this Product Type
  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetchRequirementDocumentsApi(leadId, vendorId, productTypeId);
      if (res?.success && Array.isArray(res?.data)) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error("Failed to load requirement documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (vendorId && leadId && productTypeId) {
      loadDocumentTypes();
      loadDocuments();
    }
  }, [vendorId, leadId, productTypeId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!selectedDocTypeId) {
      toastManager.add({ title: "Please select a Document Type first", type: "error" });
      return;
    }

    const file = files[0];
    try {
      setUploading(true);
      const res = await uploadRequirementDocumentApi({
        file,
        lead_id: leadId,
        vendor_id: vendorId,
        product_type_id: productTypeId,
        doc_type_id: selectedDocTypeId,
        created_by: userId,
      });

      if (res?.success) {
        toastManager.add({ title: "Document uploaded successfully!", type: "success" });
        loadDocuments();
      } else {
        toastManager.add({ title: res?.message || "Failed to upload document", type: "error" });
      }
    } catch (err: any) {
      console.error("Error uploading document:", err);
      toastManager.add({ title: err?.response?.data?.message || err?.message || "Upload failed", type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      setDeletingId(docId);
      const res = await deleteRequirementDocumentApi(docId, userId);
      if (res?.success) {
        toastManager.add({ title: "Document deleted", type: "success" });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        toastManager.add({ title: res?.message || "Failed to delete document", type: "error" });
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
      toastManager.add({ title: "Failed to delete document", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const currentType = docTypes.find((t) => t.id === selectedDocTypeId);

  return (
    <div className="mt-3 pt-3 border-t space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Paperclip className="h-4 w-4 text-primary shrink-0" />
          <span>Requirement Documents</span>
        </div>

        {/* Form controls: Document Type Dropdown + Upload Button */}
        <div className="flex items-center gap-2">
          {/* Custom Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => !prev)}
              disabled={loadingTypes || docTypes.length === 0}
              className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold shadow-2xs hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              <span>{currentType ? `${currentType.type} (${currentType.tag})` : "Select Type..."}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {openDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} />
                <div className="absolute right-0 mt-1 w-48 p-1 rounded-xl border bg-background text-foreground shadow-lg z-50 space-y-0.5 border-border">
                  {docTypes.map((t) => {
                    const isActive = selectedDocTypeId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedDocTypeId(t.id);
                          setOpenDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isActive
                            ? "bg-muted text-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.type}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            {t.tag}
                          </span>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-foreground" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg shadow-2xs cursor-pointer hover:bg-primary/90 transition-colors">
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </>
            )}
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading || !selectedDocTypeId}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {loadingDocs ? (
        <div className="flex items-center gap-2 text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-muted-foreground italic text-xs py-1 border border-dashed rounded-lg px-3 bg-muted/20">
          No documents uploaded yet for this requirement. Select a document type above and upload files (Layout, Sizes, Cutlist, Drawing).
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const docTypeObj = doc.documentType || docTypes.find((t) => t.id === doc.doc_type_id);
            const tagLabel = docTypeObj
              ? `${docTypeObj.type} (${docTypeObj.tag})`
              : "Document";

            return (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  originalName: doc.doc_og_name,
                  signedUrl: doc.signedUrl || "",
                  created_at: doc.created_at,
                }}
                tagLabel={tagLabel}
                canDelete={true}
                onDelete={() => handleDelete(doc.id)}
              />
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <PreviewModal
          url={previewDoc.url}
          fileName={previewDoc.name}
          fileExt={previewDoc.ext}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
