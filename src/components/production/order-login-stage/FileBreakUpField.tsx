"use client";

import React, { useEffect, useState } from "react";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";
import {
  Check,
  Pencil,
  Trash2,
  X,
  FolderOpen,
  Upload,
  Loader2,
} from "lucide-react";
import {
  useOrderLoginPoFiles,
  useUploadOrderLoginPoFiles,
} from "@/api/production/order-login";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";

interface FileBreakUpFieldProps {
  title: string;
  users: { id: number; label: string; in_house?: boolean }[];
  isMandatory?: boolean;
  isTitleEditable?: boolean;
  canDelete?: boolean;
  onTitleSave?: (nextTitle: string) => Promise<boolean | void> | boolean | void;
  onDelete?: () => void;
  vendorId?: number;
  leadId?: number;
  orderLoginId?: number;
  userId?: number;
  showPoUpload?: boolean;
  value: {
    company_vendor_id: number | null;
    item_desc: string;
  };
  onChange: (
    title: string,
    field: keyof FileBreakUpFieldProps["value"],
    val: any
  ) => void;
  disable?: boolean;
}

const FileBreakUpField: React.FC<FileBreakUpFieldProps> = ({
  title,
  users,
  isMandatory = false,
  isTitleEditable = false,
  canDelete = false,
  onTitleSave,
  onDelete,
  vendorId,
  leadId,
  orderLoginId,
  userId,
  showPoUpload = false,
  value,
  onChange,
  disable,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [poFiles, setPoFiles] = useState<File[]>([]);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const inHouseVendors = users.filter((user) => user.in_house);
  const companyVendors = users.filter((user) => !user.in_house);
  const vendorGroups = [
    ...(inHouseVendors.length > 0
      ? [{ label: "In House", items: inHouseVendors }]
      : []),
    ...(companyVendors.length > 0
      ? [{ label: "Company Vendors", items: companyVendors }]
      : []),
  ];
  const shouldGroupVendors = inHouseVendors.length > 0;

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  // ✅ Simplified handler — no validation
  const handleFieldChange = (
    field: keyof FileBreakUpFieldProps["value"],
    val: any
  ) => {
    onChange(title, field, val);
  };

  const handleTitleCancel = () => {
    setTitleDraft(title);
    setIsEditingTitle(false);
  };

  const handleTitleSave = async () => {
    if (!onTitleSave) return;
    try {
      const result = await onTitleSave(titleDraft);
      if (result !== false) {
        setIsEditingTitle(false);
      }
    } catch (err) {
      console.error("Failed to update title", err);
    }
  };

  const canUsePoUpload =
    showPoUpload && !!vendorId && !!leadId && !!orderLoginId && !!userId;

  const { data: poFileList = [] } = useOrderLoginPoFiles(
    vendorId,
    leadId,
    orderLoginId
  );
  const { mutateAsync: uploadPoFiles, isPending: isUploadingPo } =
    useUploadOrderLoginPoFiles(vendorId, leadId, orderLoginId);

  const handlePoUpload = async () => {
    if (!canUsePoUpload) return;
    if (!poFiles || poFiles.length === 0) {
      toast.error("Please select at least one file.");
      return;
    }

    try {
      const formData = new FormData();
      poFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));

      await uploadPoFiles(formData);
      toast.success("PO files uploaded successfully!");
      setPoFiles([]);
      queryClient.invalidateQueries({
        queryKey: ["orderLoginPoFiles", vendorId, leadId, orderLoginId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload PO files.");
    }
  };

  return (
    <div className="rounded-xl border bg-card flex flex-col gap-4">
      {/* 🔹 Header */}
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3 bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full max-w-[220px] border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={disable}
            />
          ) : (
            <p className="font-semibold text-sm flex items-center gap-2 truncate">
              <span className="truncate">{title}</span>
              {isMandatory && (
                <span className="text-md text-red-500">
                  *
                </span>
              )}
            </p>
          )}
        </div>

        {(isTitleEditable || canDelete) && (
          <div className="flex items-center gap-1 shrink-0">
            {isTitleEditable && !isEditingTitle && (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                disabled={disable}
                className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                aria-label="Edit section title"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {isTitleEditable && isEditingTitle && (
              <>
                <button
                  type="button"
                  onClick={handleTitleSave}
                  disabled={disable}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                  aria-label="Save section title"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleTitleCancel}
                  disabled={disable}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                  aria-label="Cancel title edit"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            {canDelete && !isEditingTitle && (
              <button
                type="button"
                onClick={onDelete}
                disabled={disable}
                className="p-1 text-destructive/80 hover:text-destructive disabled:cursor-not-allowed"
                aria-label="Delete section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 🔹 Body */}
      <div className="px-4 pb-4 space-y-3">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground block min-h-[16px]">
              Vendor
            </label>
            <AssignToPicker
              data={users}
              groups={shouldGroupVendors ? vendorGroups : undefined}
              value={value.company_vendor_id ?? undefined}
              onChange={(id) => handleFieldChange("company_vendor_id", id)}
              placeholder="Search vendor..."
              emptyLabel="Select a vendor"
              disabled={disable}
            />
          </div>

          {showPoUpload && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block min-h-[16px]">
                PO Files
              </label>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setPoModalOpen(true)}
                disabled={!canUsePoUpload || disable}
                className="w-full h-9"
              >
                Manage PO Files
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Description
          </label>
          <TextAreaInput
            value={value.item_desc}
            onChange={(val) => handleFieldChange("item_desc", val)}
            placeholder={`Add notes or specs for ${title} (optional)`}
            disabled={disable}
          />
        </div>

      </div>
      {showPoUpload && (
        <BaseModal
          open={poModalOpen}
          onOpenChange={setPoModalOpen}
          title={`${title} — PO Files`}
          description="Upload and manage purchase order files for this section."
          size="lg"
          icon={<FolderOpen className="w-4 h-4 text-primary" />}
        >
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <FileUploadField
                value={poFiles}
                onChange={setPoFiles}
                accept=".pdf,.pyo,.pytha,.dwg,.dxf,.zip,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tif,.tiff"
                multiple
                disabled={!canUsePoUpload || disable}
                maxFiles={10}
              />
  
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handlePoUpload}
                  disabled={
                    !canUsePoUpload ||
                    disable ||
                    isUploadingPo ||
                    poFiles.length === 0
                  }
                  className="flex items-center gap-2"
                >
                  {isUploadingPo ? (
                    <>
                      <Loader2 className="animate-spin size-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </div>
  
            {poFileList.length === 0 ? (
              <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
                <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No PO files uploaded yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload purchase order files for this section.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 p-1">
                {poFileList.map((doc: any) => {
                  const imageExtensions = [
                    ".jpeg",
                    ".jpg",
                    ".png",
                    ".webp",
                  ];
                  const lowerCaseName = doc.doc_og_name.toLowerCase();
                  const isImage = imageExtensions.some(ext => lowerCaseName.endsWith(ext));
                  if (isImage) {
                    return (
                      <ImageComponent
                        key={doc.id}
                        doc={{
                          id: doc.id,
                          doc_og_name: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                      />
                    );
                  } else {
                    return (
                      <DocumentCard
                        key={doc.id}
                        doc={{
                          id: doc.id,
                          originalName: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                      />
                    );
                  }
                })}
              </div>
            )} 
          </div>
        </BaseModal>
      )}
    </div>

  );
};

export default FileBreakUpField;
