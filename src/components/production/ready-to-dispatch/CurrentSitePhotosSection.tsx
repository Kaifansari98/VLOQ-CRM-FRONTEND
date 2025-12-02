"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toast } from "react-toastify";
import {
  useCurrentSitePhotos,
  useUploadCurrentSitePhotos,
} from "@/api/production/useReadyToDispatchLeads";

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

import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { canUploadReadyToDispatchDocuments } from "@/components/utils/privileges";

export default function CurrentSitePhotosSection({
  leadId,
  accountId,
}: {
  leadId: number;
  accountId: number | null;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const queryClient = useQueryClient();

  const { data: sitePhotos, isLoading } = useCurrentSitePhotos(
    vendorId,
    leadId
  );

  const { mutateAsync: uploadPhotos, isPending } = useUploadCurrentSitePhotos(
    vendorId,
    leadId
  );

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const canDelete = userType === "admin" || userType === "super-admin";
  const canUploadDocuments = canUploadReadyToDispatchDocuments(userType);

  const hasFiles = Array.isArray(sitePhotos) && sitePhotos.length > 0;

  const imageExtensions = ["jpg", "jpeg", "png"];
  const documentExtensions = ["pdf", "zip"];

  const images =
    sitePhotos?.filter((file: any) =>
      imageExtensions.includes(
        file.doc_og_name?.split(".").pop()?.toLowerCase()
      )
    ) || [];

  const documents =
    sitePhotos?.filter((file: any) =>
      documentExtensions.includes(
        file.doc_og_name?.split(".").pop()?.toLowerCase()
      )
    ) || [];

  // Upload handler
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo to upload.");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPhotos(formData);
      toast.success("Current Site Photos uploaded successfully!");
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["currentSitePhotos", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["currentSitePhotosCount", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload photos.");
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;

    deleteDocument({
      vendorId: vendorId!,
      documentId: confirmDelete,
      deleted_by: userId!,
    });

    setConfirmDelete(null);
  };

  return (
    <div className="border h-full rounded-xl overflow-y-auto bg-background">
      {/* ---------- HEADER ---------- */}
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="space-y-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Current Site Photos
            </h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Upload and manage photos for Ready-To-Dispatch stage.
          </p>
        </div>

        {hasFiles && (
          <span className="text-xs text-muted-foreground">
            {sitePhotos.length} File{sitePhotos.length > 1 && "s"}
          </span>
        )}
      </div>

      {/* ---------- UPLOAD AREA ---------- */}
      {canUploadDocuments && (
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={selectedFiles}
            onChange={setSelectedFiles}
            accept=".jpg,.jpeg,.png,.pdf,.zip"
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
                  Upload Photos
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ---------- FILE LIST ---------- */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Photos
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {sitePhotos.length} file{sitePhotos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading Current Site Photos...
          </div>
        ) : !hasFiles ? (
          <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No Current Site Photos uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Start by uploading your photos or PDF documents.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-1">
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
          </ScrollArea>
        )}
      </div>

      {/* ---------- DELETE MODAL ---------- */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected file will be removed
              permanently.
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
