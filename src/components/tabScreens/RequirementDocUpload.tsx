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
  Plus,
  X,
} from "lucide-react";
import DocumentCard, { PreviewModal } from "@/components/utils/documentCard";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/utils/baseModal";
import { DocumentsUploader } from "@/components/document-upload";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [isAdding, setIsAdding] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    if (!selectedDocTypeId) {
      toastManager.add({ title: "Please select a Document Type first", type: "error" });
      return;
    }

    const file = uploadFiles[0];
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
        setIsAdding(false);
        setUploadFiles([]);
      } else {
        toastManager.add({ title: res?.message || "Failed to upload document", type: "error" });
      }
    } catch (err: any) {
      console.error("Error uploading document:", err);
      toastManager.add({ title: err?.response?.data?.message || err?.message || "Upload failed", type: "error" });
    } finally {
      setUploading(false);
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

        {/* Form controls: Progressive Disclosure Upload */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setUploadFiles([]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Document</span>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <BaseModal
        open={isAdding}
        onOpenChange={setIsAdding}
        title="Upload Requirement Document"
        description="Choose a document type and select files to upload."
        size="smd"
      >
        <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
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
                setIsAdding(false);
                setUploadFiles([]);
              }}
              disabled={uploading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !selectedDocTypeId || uploadFiles.length === 0}
              className="text-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </form>
      </BaseModal>

      {/* Uploaded Documents List */}
      {loadingDocs ? (
        <div className="flex items-center gap-2 text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 border border-dashed rounded-xl gap-2 w-full">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No documents yet</p>
          <p className="text-xs text-muted-foreground max-w-[250px]">Click "+ Add Document" to upload a new requirement file.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const docTypeObj = doc.documentType || docTypes.find((t) => t.id === doc.doc_type_id);
            const tagLabel = docTypeObj
              ? docTypeObj.type
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
