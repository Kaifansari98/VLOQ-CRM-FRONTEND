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
  usePostProductionCompleteness,
  useQcPhotos,
  useUploadQcPhotos,
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
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";

interface PostProductionQcPhotosSectionProps {
  leadId: number;
  accountId: number | null;
}

export default function PostProductionQcPhotosSection({
  leadId,
  accountId,
}: PostProductionQcPhotosSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const queryClient = useQueryClient();

  const { data: qcPhotos, isLoading } = useQcPhotos(vendorId, leadId);
  const { mutateAsync: uploadQcFiles, isPending } = useUploadQcPhotos(
    vendorId,
    leadId
  );

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { refetch: refetchCompleteness } = usePostProductionCompleteness(
    vendorId,
    leadId
  );

  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles = Array.isArray(qcPhotos) && qcPhotos.length > 0;

  const imageTypes = ["jpg", "jpeg", "png"];
  const docTypes = ["pdf", "zip"];

  const images =
    qcPhotos?.filter((file: any) =>
      imageTypes.includes(file.doc_og_name?.split(".").pop()?.toLowerCase())
    ) || [];

  const documents =
    qcPhotos?.filter((file: any) =>
      docTypes.includes(file.doc_og_name?.split(".").pop()?.toLowerCase())
    ) || [];

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

      await uploadQcFiles(formData);
      toast.success("QC photos uploaded successfully!");
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["qcPhotos", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["postProductionCompleteness", vendorId, leadId],
      });

      await refetchCompleteness();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload QC photos."
      );
    }
  };

  const canDelete = userType === "admin" || userType === "super-admin";
  const canViewAndWork = canViewAndWorkProductionStage(userType, leadStatus);

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
            <h2 className="text-lg font-semibold tracking-tight">QC Photos</h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Upload and manage Quality Check photos for this lead.
          </p>
        </div>

        {hasFiles && (
          <span className="text-xs text-muted-foreground">
            {qcPhotos.length} File{qcPhotos.length > 1 && "s"}
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
            Loading QC photos...
          </div>
        ) : !hasFiles ? (
          <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No QC photos uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Start by uploading your QC images or PDF reports.
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
                  onView={(i) => {
                    setStartIndex(i);
                    setOpenCarousel(true);
                  }}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))}

              {documents.map((doc: any) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    originalName: doc.doc_og_name,
                    signedUrl: doc.signedUrl,
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

      {/* -------------------------------- IMAGE CAROUSEL -------------------------------- */}
      <ImageCarouselModal
        images={images}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </div>
  );
}
