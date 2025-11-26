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
  useCurrentSitePhotosAtSiteReadiness,
  useUploadCurrentSitePhotosAtSiteReadiness,
} from "@/api/installation/useSiteReadinessLeads";
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
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkSiteRedinessStage } from "@/components/utils/privileges";

interface CurrentSitePhotosReadinessSectionProps {
  leadId: number;
  accountId: number | null;
}

export default function CurrentSitePhotosReadinessSection({
  leadId,
  accountId,
}: CurrentSitePhotosReadinessSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const queryClient = useQueryClient();

  // 🔹 Fetch existing site photos
  const { data: sitePhotos, isLoading } = useCurrentSitePhotosAtSiteReadiness(
    vendorId,
    leadId
  );

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  // 🔹 Upload mutation
  const { mutateAsync: uploadPhotos, isPending } =
    useUploadCurrentSitePhotosAtSiteReadiness();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles = Array.isArray(sitePhotos) && sitePhotos.length > 0;
  const imageExtensions = ["jpg", "jpeg", "png"];
  const documentExtensions = ["pdf", "zip"];

  const images =
    sitePhotos?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    }) || [];

  const Documents =
    sitePhotos?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return documentExtensions.includes(ext || "");
    }) || [];

  // 🔹 Handle Upload
  const handleUpload = async () => {
    if (!vendorId || !userId || !leadId) {
      toast.error("Missing required IDs.");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo to upload.");
      return;
    }

    try {
      await uploadPhotos({
        vendorId,
        leadId,
        accountId: accountId || 0,
        createdBy: userId,
        files: selectedFiles,
      });

      toast.success("Current Site Photos uploaded successfully!");
      setSelectedFiles([]);

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["currentSitePhotosAtSiteReadiness", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["checkSiteReadinessCompletion", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload Current Site Photos."
      );
    }
  };

  const canDelete = userType === "admin" || userType === "super-admin";

  const canViewAndWork = canViewAndWorkSiteRedinessStage(userType, leadStatus);

  // 🧩 --- Handlers ---
  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="border h-full rounded-lg overflow-y-auto bg-background shadow-sm">
      {/* -------------------------------- HEADER -------------------------------- */}
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="space-y-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Current Site Photos (Site Readiness)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Upload and manage Current Site Photos for this lead.
          </p>
        </div>

        {hasFiles && (
          <span className="text-xs text-muted-foreground">
            {sitePhotos.length} File{sitePhotos.length > 1 && "s"}
          </span>
        )}
      </div>

      {/* -------------------------------- UPLOAD AREA -------------------------------- */}
      {canViewAndWork && (
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

      {/* -------------------------------- FILE LIST -------------------------------- */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Photos
          </h4>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading site photos...
          </div>
        ) : !hasFiles ? (
          <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No site photos uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Start by uploading Current Site photos.
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

              {Documents.map((doc: any) => (
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

      {/* -------------------------------- DELETE CONFIRMATION -------------------------------- */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
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
