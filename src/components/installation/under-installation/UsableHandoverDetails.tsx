"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  ImageIcon,
  Download,
  Trash2,
  Save,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import TextAreaInput from "@/components/origin-text-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useGetUsableHandover,
  useUpdateUsableHandover,
  useUpdateRemarks,
} from "@/api/installation/useUnderInstallationStageLeads";
import { useDeleteDocument } from "@/api/leads";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
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
import PendingWorkDetails from "../dispatch/PendingWorkDetails";

interface UsableHandoverProps {
  vendorId: number;
  leadId: number;
  accountId: number;
}

export default function UsableHandover({
  vendorId,
  leadId,
  accountId,
}: UsableHandoverProps) {
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const queryClient = useQueryClient();

  const [pendingWorkDetails, setPendingWorkDetails] = useState("");
  const [selectedSitePhotos, setSelectedSitePhotos] = useState<File[]>([]);
  const [selectedHandoverDocs, setSelectedHandoverDocs] = useState<File[]>([]);
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);

  // Image carousel states
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  // Fetch existing data
  const { data: handoverData, isLoading } = useGetUsableHandover(
    vendorId,
    leadId
  );
  const updateMutation = useUpdateUsableHandover();
  const updateRemarksMutation = useUpdateRemarks();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const canDelete = userType === "admin" || userType === "super-admin";

  // Initialize remarks when data loads
  React.useEffect(() => {
    if (handoverData?.pending_work_details) {
      setPendingWorkDetails(handoverData.pending_work_details);
    }
  }, [handoverData]);

  const handleUploadSitePhotos = async () => {
    if (selectedSitePhotos.length === 0) {
      toast.error("Please select at least one photo to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("vendor_id", vendorId.toString());
    formData.append("lead_id", leadId.toString());
    formData.append("account_id", accountId.toString());
    formData.append("created_by", userId.toString());
    formData.append("pending_work_details", pendingWorkDetails);

    selectedSitePhotos.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Final site photos uploaded successfully!");
      setSelectedSitePhotos([]);

      queryClient.invalidateQueries({
        queryKey: ["usableHandover", vendorId, leadId],
      });
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleUploadHandoverDocs = async () => {
    if (selectedHandoverDocs.length === 0) {
      toast.error("Please select at least one document to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("vendor_id", vendorId.toString());
    formData.append("lead_id", leadId.toString());
    formData.append("account_id", accountId.toString());
    formData.append("created_by", userId.toString());
    formData.append("pending_work_details", pendingWorkDetails);

    selectedHandoverDocs.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Handover documents uploaded successfully!");
      setSelectedHandoverDocs([]);

      queryClient.invalidateQueries({
        queryKey: ["usableHandover", vendorId, leadId],
      });
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleUpdateRemarks = async () => {
    try {
      await updateRemarksMutation.mutateAsync({
        vendor_id: vendorId,
        lead_id: leadId,
        pending_work_details: pendingWorkDetails,
      });
      setIsEditingRemarks(false);
    } catch (error) {
      console.error("Error updating remarks:", error);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId,
        documentId: confirmDelete,
        deleted_by: userId,
      });
      setConfirmDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 size-5" />
        <div className="text-sm text-muted-foreground">
          Loading handover details...
        </div>
      </div>
    );
  }

  const hasSitePhotos =
    Array.isArray(handoverData?.final_site_photos) &&
    handoverData.final_site_photos.length > 0;
  const hasHandoverDocs =
    Array.isArray(handoverData?.handover_documents) &&
    handoverData.handover_documents.length > 0;

  return (
    <div className="mt-2 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Usable Handover
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload final site photos and handover documents for the installation
        </p>
      </div>

      {/* ================================
    🔹 Pending Work Component (NEW)
    ================================ */}
      <PendingWorkDetails leadId={leadId} accountId={accountId} />

      {/* Pending Work Details / Remarks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Pending Work Details / Remarks
            </CardTitle>
            {!isEditingRemarks ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingRemarks(true)}
              >
                Edit Remarks
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingWorkDetails(
                      handoverData?.pending_work_details || ""
                    );
                    setIsEditingRemarks(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateRemarks}
                  disabled={updateRemarksMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateRemarksMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TextAreaInput
            value={pendingWorkDetails || "N/A"}
            onChange={setPendingWorkDetails}
            placeholder="Enter any pending work details or remarks..."
            maxLength={2000}
            readOnly={!isEditingRemarks}
            disabled={!isEditingRemarks}
            className={isEditingRemarks ? "" : "cursor-default"}
          />
        </CardContent>
      </Card>

      {/* Final Site Photos Section */}
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Final Site Photos</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload final installation site photos
          </p>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={selectedSitePhotos}
            onChange={setSelectedSitePhotos}
            accept=".jpg,.jpeg,.png,.webp"
            multiple
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleUploadSitePhotos}
              disabled={
                updateMutation.isPending || selectedSitePhotos.length === 0
              }
              className="flex items-center gap-2"
            >
              {updateMutation.isPending ? (
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

        {/* Photos List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Uploaded Photos
            </h4>
            {hasSitePhotos && (
              <Badge variant="secondary">
                {handoverData.final_site_photos.length} photo
                {handoverData.final_site_photos.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {!hasSitePhotos ? (
            <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
              <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                No final site photos uploaded yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] mt-2 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {handoverData.final_site_photos.map(
                  (photo: any, index: number) => (
                    <ImageComponent
                      key={photo.id}
                      doc={{
                        id: photo.id,
                        doc_og_name: photo.doc_og_name,
                        signedUrl: photo.signedUrl,
                        created_at: photo.created_at,
                      }}
                      index={index}
                      canDelete={canDelete}
                      onView={(i) => {
                        setStartIndex(i);
                        setOpenCarousel(true);
                      }}
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  )
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Handover Documents Section */}
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Handover Documents</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload handover documents (PDFs, etc.)
          </p>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={selectedHandoverDocs}
            onChange={setSelectedHandoverDocs}
            accept=".pdf,.doc,.docx,.zip"
            multiple
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleUploadHandoverDocs}
              disabled={
                updateMutation.isPending || selectedHandoverDocs.length === 0
              }
              className="flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Documents
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Documents List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Uploaded Documents
            </h4>
            {hasHandoverDocs && (
              <Badge variant="secondary">
                {handoverData.handover_documents.length} document
                {handoverData.handover_documents.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {!hasHandoverDocs ? (
            <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
              <FileText className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                No handover documents uploaded yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] mt-2 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {handoverData.handover_documents.map((doc: any) => (
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
      </div>

      {/* Delete Confirmation Dialog */}
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

      {/* Image Carousel Modal */}
      {/* <ImageCarouselModal
        images={handoverData?.final_site_photos?.doc_og_name || []}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      /> */}
    </div>
  );
}
