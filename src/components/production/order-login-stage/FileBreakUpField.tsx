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
  useDeleteOrderLoginPoFile,
  useOrderLoginPoFiles,
  useUploadOrderLoginPoFiles,
} from "@/api/production/order-login";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";
import CustomeTooltip from "@/components/custom-tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useInstanceStage } from "@/hooks/designing-stage/designing-leads-hooks";
import { useSearchParams } from "next/navigation";
import { canDeletePODocument, canUploadPODocument } from "@/components/utils/privileges";
import { useAppSelector } from "@/redux/store";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useLeadById } from "@/hooks/useLeadsQueries";

export interface FileBreakUpFieldProps {
  title: string;
  users: { id: number; label: string; in_house?: boolean }[];
  value: {
    company_vendor_id: number | null;
    item_desc: string;
  };
  onVendorChange?: (vendorId: number) => void;
  onDescriptionChange?: (description: string) => void;
  disabled?: boolean;
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
  leadStage?: string;
  userRole?: string;
  disablePoDelete?: boolean;
}

const FileBreakUpField: React.FC<FileBreakUpFieldProps> = ({
  title,
  users,
  value,
  onVendorChange,
  onDescriptionChange,
  disabled = false,
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
  disablePoDelete = false,
}) => {
  const searchParams = useSearchParams();
  const instanceFromUrlRaw = searchParams.get("instance_id");
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const instanceId = Number(instanceFromUrlRaw);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [poFiles, setPoFiles] = useState<File[]>([]);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: instanceStageData } = useInstanceStage(
    vendorId,
    leadId!,
    instanceId!,
  );

  const { mutateAsync: deleteFile } = useDeleteOrderLoginPoFile(
    vendorId!,
    userId!,
  );

  const [deleting, setDeleting] = useState(false);
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

  const leadStatus = instanceStageData?.derived_stage;

  const { data: leadResponse } = useLeadById(leadId!, vendorId, userId);
  const lead = leadResponse?.data?.lead;

  const { blockedTooltip, shouldDisableBlockedActions } = useLeadAccessControl({
    leadId: leadId!,
    userType,
    lead,
  });

  const customPrivilegeCodes = useAppSelector(
    (state: any) => state.customPrivileges?.codes || []
  );
  const normalizedUserType = userType?.trim().toLowerCase();
  const canOverridePoAndVendorLocks =
    normalizedUserType === "super-admin" || normalizedUserType === "backend";
  const isPoUploadBlocked =
    shouldDisableBlockedActions && !canOverridePoAndVendorLocks;
  const isVendorChangeDisabled =
    (disabled || shouldDisableBlockedActions) && !canOverridePoAndVendorLocks;

  const canDeletePO =
    !shouldDisableBlockedActions &&
    canDeletePODocument(userType, leadStatus!, customPrivilegeCodes) &&
    !disablePoDelete;

  const canUploadPO =
    canUploadPODocument(userType, leadStatus!, customPrivilegeCodes) &&
    (canOverridePoAndVendorLocks ||
      (!shouldDisableBlockedActions && !disabled));

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  const handleVendorSelect = (id: number | null) => {
    if (id !== null && onVendorChange) {
      onVendorChange(id);
    }
  };

  const handleDescriptionChange = (val: string) => {
    if (onDescriptionChange) {
      onDescriptionChange(val);
    }
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
    orderLoginId,
  );

  console.log("ordrlogin by id fielbreadup field: ", orderLoginId);

  const hasExistingPoFiles = poFileList && poFileList.length > 0;
  const poButtonLabel = hasExistingPoFiles ? "Manage PO Files" : "Upload PO Files";
  const existingPoMessage = hasExistingPoFiles
    ? `${poFileList.length} PO file${poFileList.length > 1 ? "s" : ""} already uploaded for "${title}". You can manage or add more files for this section.`
    : "";

  // Privileged roles retain PO upload access when a lead is blocked.
  const poTooltipMessage = isPoUploadBlocked
    ? blockedTooltip
    : existingPoMessage;

  const { mutateAsync: uploadPoFiles, isPending: isUploadingPo } =
    useUploadOrderLoginPoFiles(vendorId, leadId, orderLoginId);

  const handlePoUpload = async () => {
    if (!canUsePoUpload || !canUploadPO) return;
    if (!poFiles || poFiles.length === 0) {
      toastManager.add({
        title: "Please select at least one file.",
        type: "error",
      });
      return;
    }

    try {
      const formData = new FormData();
      poFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));

      await uploadPoFiles(formData);
      toastManager.add({
        title: "PO files uploaded successfully!",
        type: "success",
      });
      setPoFiles([]);
      setPoModalOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["orderLoginPoFiles", vendorId, leadId, orderLoginId],
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload PO files.";

      toastManager.add({ title: errorMessage, type: "error" });
    }
  };

  const handleRequestDelete = (mappingId: number) => {
    setConfirmDelete(mappingId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteFile(confirmDelete);
      toastManager.add({
        title: "Document deleted successfully",
        type: "success",
      });
      setConfirmDelete(null);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete document";

      toastManager.add({ title: errorMessage, type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card flex flex-col gap-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3 bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full max-w-55 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={disabled || shouldDisableBlockedActions}
            />
          ) : (
            <p className="font-semibold text-sm flex items-center gap-2 truncate">
              <span className="truncate">{title}</span>
              {isMandatory && <span className="text-md text-red-500">*</span>}
            </p>
          )}
        </div>

        {(isTitleEditable || canDelete) && (
          <div className="flex items-center gap-1 shrink-0">

            {/* ── Edit (Pencil) ── */}
            {isTitleEditable && !isEditingTitle && (
              <CustomeTooltip
                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                truncateValue={
                  <button
                    type="button"
                    onClick={
                      shouldDisableBlockedActions
                        ? undefined
                        : () => setIsEditingTitle(true)
                    }
                    disabled={disabled || shouldDisableBlockedActions}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                    aria-label="Edit section title"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              />
            )}

            {isTitleEditable && isEditingTitle && (
              <>
                {/* ── Save (Check) ── */}
                <CustomeTooltip
                  value={shouldDisableBlockedActions ? blockedTooltip : ""}
                  truncateValue={
                    <button
                      type="button"
                      onClick={
                        shouldDisableBlockedActions
                          ? undefined
                          : handleTitleSave
                      }
                      disabled={disabled || shouldDisableBlockedActions}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                      aria-label="Save section title"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  }
                />

                {/* ── Cancel (X) ── */}
                <CustomeTooltip
                  value={shouldDisableBlockedActions ? blockedTooltip : ""}
                  truncateValue={
                    <button
                      type="button"
                      onClick={
                        shouldDisableBlockedActions
                          ? undefined
                          : handleTitleCancel
                      }
                      disabled={disabled || shouldDisableBlockedActions}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                      aria-label="Cancel title edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  }
                />
              </>
            )}

            {/* ── Delete section (Trash2) ── */}
            {canDelete && !isEditingTitle && (
              <CustomeTooltip
                value={shouldDisableBlockedActions ? blockedTooltip : ""}
                truncateValue={
                  <button
                    type="button"
                    onClick={
                      shouldDisableBlockedActions ? undefined : onDelete
                    }
                    disabled={disabled || shouldDisableBlockedActions}
                    className="p-1 text-destructive/80 hover:text-destructive disabled:cursor-not-allowed"
                    aria-label="Delete section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">

          {/* ── Vendor picker ── */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground block min-h-4">
              Vendor
            </label>
            <CustomeTooltip
              value={isVendorChangeDisabled && shouldDisableBlockedActions ? blockedTooltip : ""}
              truncateValue={
                <span className="block">
                  <AssignToPicker
                    data={users}
                    groups={shouldGroupVendors ? vendorGroups : undefined}
                    value={value.company_vendor_id ?? undefined}
                    onChange={handleVendorSelect}
                    placeholder="Search vendor..."
                    emptyLabel="Select a vendor"
                    disabled={isVendorChangeDisabled}
                  />
                </span>
              }
            />
          </div>

          {/* ── PO Files button ── */}
          {showPoUpload && value.company_vendor_id && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block min-h-4">
                PO Files
              </label>
              <CustomeTooltip
                truncateValue={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      !isPoUploadBlocked && setPoModalOpen(true)
                    }
                    disabled={!canUsePoUpload || isPoUploadBlocked}
                    className="w-full h-9"
                  >
                    {hasExistingPoFiles ? (
                      <>
                        <FolderOpen className="w-4 h-4 mr-1" />
                        {poButtonLabel}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-1" />
                        {poButtonLabel}
                      </>
                    )}
                  </Button>
                }
                contentClassName="w-[300px]"
                value={poTooltipMessage}
              />
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Description
          </label>
          <CustomeTooltip
            value={shouldDisableBlockedActions ? blockedTooltip : ""}
            truncateValue={
              <span className="block">
                <TextAreaInput
                  value={value.item_desc}
                  onChange={handleDescriptionChange}
                  placeholder={`Add notes or specs for ${title} (optional)`}
                  disabled={disabled || shouldDisableBlockedActions}
                />
              </span>
            }
          />
        </div>
      </div>

      {/* ── PO Files Modal ──────────────────────────────────────────────────── */}
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
            {canUploadPO && (
              <div className="space-y-3">
                <FileUploadField
                  value={poFiles}
                  onChange={setPoFiles}
                  accept=".png,.jpg,.jpeg,.pdf,.pyo,.pytha,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
                  multiple
                  disabled={!canUsePoUpload || isPoUploadBlocked}
                  maxFiles={10}
                />

                <div className="flex justify-end">
                  {/* ✅ Upload button in modal — CustomeTooltip when blocked */}
                  <CustomeTooltip
                    value={isPoUploadBlocked ? blockedTooltip : ""}
                    truncateValue={
                      <Button
                        size="sm"
                        onClick={
                          isPoUploadBlocked
                            ? undefined
                            : handlePoUpload
                        }
                        disabled={
                          !canUsePoUpload ||
                          isUploadingPo ||
                          poFiles.length === 0 ||
                          isPoUploadBlocked
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
                    }
                  />
                </div>
              </div>
            )}

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
                  const imageExtensions = [".jpeg", ".jpg", ".png", ".webp"];
                  const lowerCaseName = doc.doc_og_name.toLowerCase();
                  const isImage = imageExtensions.some((ext) =>
                    lowerCaseName.endsWith(ext),
                  );
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
                        canDelete={canDeletePO}
                        onDelete={() => handleRequestDelete(doc.id)}
                      />
                    );
                  } else {
                    return (
                      <DocumentCard
                        key={doc.id}
                        canDelete={canDeletePO}
                        doc={{
                          id: doc.id,
                          originalName: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        onDelete={() => handleRequestDelete(doc.id)}
                      />
                    );
                  }
                })}
              </div>
            )}
          </div>
        </BaseModal>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileBreakUpField;
