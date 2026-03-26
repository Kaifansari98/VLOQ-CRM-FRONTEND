"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import {
  usePreProductionFiles,
  useUploadPreProductionFiles,
} from "@/api/production/production-api";
import { useDeleteDocument } from "@/api/leads";
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
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import {
  useInstanceStage,
  useLeadStatus,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";

interface PreProductionFilesSectionProps {
  leadId: number;
  accountId: number | null;
  instanceId?: number | null;
}

export default function PreProductionFilesSection({
  leadId,
  accountId,
  instanceId,
}: PreProductionFilesSectionProps) {
  const searchParams = useSearchParams();
  const instanceFromUrl = searchParams.get("instance_id");
  const instanceIdFromUrl = instanceFromUrl ? Number(instanceFromUrl) : null;
  const effectiveInstanceId =
    typeof instanceId !== "undefined"
      ? instanceId
      : instanceIdFromUrl && !Number.isNaN(instanceIdFromUrl)
        ? instanceIdFromUrl
        : null;

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const queryClient = useQueryClient();

  const { data: files, isLoading } = usePreProductionFiles(
    vendorId,
    leadId,
    effectiveInstanceId ?? undefined,
  );
  const { mutateAsync: uploadFiles, isPending } = useUploadPreProductionFiles(
    vendorId,
    leadId,
    effectiveInstanceId ?? undefined,
  );

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { data } = useInstanceStage(vendorId, leadId, instanceId!);
  const leadStatusIns = data?.derived_stage;
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const hasFiles = Array.isArray(files) && files.length > 0;

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];

  const images =
    files?.filter((file: any) =>
      imageTypes.includes(file.doc_og_name?.split(".").pop()?.toLowerCase()),
    ) || [];

  const documents =
    files?.filter(
      (file: any) =>
        !imageTypes.includes(file.doc_og_name?.split(".").pop()?.toLowerCase()),
    ) || [];

  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "pre-prod" &&
      (leadStatusIns ?? leadStatus) === "production-stage");

  const canViewAndWork = canViewAndWorkProductionStage(
    userType,
    leadStatusIns ?? leadStatus,
  );

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toastManager.add({ title: "Please select at least one file to upload.", type: "error" });
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadFiles(formData);
      toastManager.add({ title: "Pre-production files uploaded successfully!", type: "success" });
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: [
          "preProductionFiles",
          vendorId,
          leadId,
          effectiveInstanceId ?? "all",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "preProductionFilesReady",
          vendorId,
          leadId,
          effectiveInstanceId ?? "all",
        ],
      });
    } catch (error: any) {
      toastManager.add({ title: error?.response?.data?.message ||
          "Failed to upload pre-production files.", type: "error" });
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      queryClient.invalidateQueries({
        queryKey: [
          "preProductionFilesReady",
          vendorId,
          leadId,
          effectiveInstanceId ?? "all",
        ],
      });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="border rounded-lg bg-background shadow-sm">
      {/* -------------------------------- HEADER -------------------------------- */}
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="space-y-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Pre-Production Files
            </h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Upload final production files before proceeding to Under Production.
          </p>
        </div>

        {hasFiles && (
          <span className="text-xs text-muted-foreground">
            {files.length} File{files.length > 1 && "s"}
          </span>
        )}
      </div>

      {/* -------------------------------- UPLOAD AREA -------------------------------- */}
      {canViewAndWork && (
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={selectedFiles}
            onChange={setSelectedFiles}
            accept=".png,.jpg,.jpeg,.pdf,.pyo,.pytha,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
            multiple
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isPending || selectedFiles.length === 0}
              className="flex items-center gap-2"
            >
              {isPending ? (
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
      )}

      {/* -------------------------------- FILE LIST -------------------------------- */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Files
          </h4>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading files...
          </div>
        ) : !hasFiles ? (
          <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No pre-production files uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Upload final production files to enable the Under Production stage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
            {images.map((doc: any, index: number) => (
              <ImageComponent
                key={doc.id}
                doc={{
                  id: doc.id,
                  doc_og_name: doc.doc_og_name,
                  signedUrl: doc.signed_url,
                  created_at: doc.created_at,
                }}
                index={index}
                canDelete={canDelete}
                onDelete={(id) => setConfirmDelete(Number(id))}
              />
            ))}

            {documents.map((doc: any) => (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  originalName: doc.doc_og_name,
                  signedUrl: doc.signed_url,
                  created_at: doc.created_at,
                }}
                canDelete={canDelete}
                onDelete={(id) => setConfirmDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* -------------------------------- DELETE CONFIRMATION -------------------------------- */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected file will be
              permanently removed from the system.
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
}
