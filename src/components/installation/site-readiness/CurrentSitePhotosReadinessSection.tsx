"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  FolderOpen,
  Upload,
  FileImage,
  ExternalLink,
  Loader2,
} from "lucide-react";
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
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";

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

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
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
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          <h2 className="text-lg font-semibold">
            Current Site Photos (Site Readiness)
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload and manage current site photos.
        </p>
      </div>

      {/* Upload Section */}
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

      {/* Files List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Photos
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {sitePhotos.length} photo{sitePhotos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading current site photos...
          </div>
        ) : !hasFiles ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No photos uploaded yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] mt-2 pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {images.map((doc: any, index: number) => (
                <ImageComponent
                  doc={{
                    id: doc?.id,
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

      <ImageCarouselModal
        images={images}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </div>
  );
}
