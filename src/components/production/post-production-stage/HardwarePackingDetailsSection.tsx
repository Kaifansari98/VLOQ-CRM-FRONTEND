"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FolderOpen, Upload, Loader2, Paperclip } from "lucide-react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
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
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";

import {
  useGetHardwarePackingDetails,
  usePostProductionCompleteness,
  useUploadHardwarePackingDetails,
} from "@/api/production/production-api";
import { useDeleteDocument } from "@/api/leads";

import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";

export default function HardwarePackingDetailsSection({
  leadId,
  accountId,
}: {
  leadId: number;
  accountId: number | null;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const queryClient = useQueryClient();

  const { data: packingDetails, isLoading } = useGetHardwarePackingDetails(
    vendorId,
    leadId
  );

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const { mutateAsync: uploadPackingDetails, isPending } =
    useUploadHardwarePackingDetails(vendorId, leadId);

  const { refetch: refetchCompleteness } = usePostProductionCompleteness(
    vendorId,
    leadId
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState(packingDetails?.remark || "");
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const canViewAndWork = canViewAndWorkProductionStage(userType, leadStatus);
  const canDelete = userType === "admin" || userType === "super-admin";

  useEffect(() => {
    if (packingDetails?.remark) setRemark(packingDetails.remark);
  }, [packingDetails?.remark]);

  const hasFiles =
    Array.isArray(packingDetails?.data) && packingDetails.data.length > 0;

  const imageExt = ["jpg", "jpeg", "png"];
  const docExt = ["pdf", "zip"];

  const images =
    packingDetails?.data?.filter((file: any) =>
      imageExt.includes(file.doc_og_name?.split(".").pop()?.toLowerCase())
    ) || [];

  const Documents =
    packingDetails?.data?.filter((file: any) =>
      docExt.includes(file.doc_og_name?.split(".").pop()?.toLowerCase())
    ) || [];

  // Upload handler
  const handleUpload = async () => {
    if (selectedFiles.length === 0 && remark.trim() === "") {
      toast.error("Add a remark or upload a file.");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      if (remark.trim() !== "") formData.append("remark", remark);
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPackingDetails(formData);
      toast.success("Hardware packing details updated!");

      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["hardwarePackingDetails", vendorId, leadId],
      });

      await refetchCompleteness();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Upload failed.");
    }
  };

  const handleRemarkUpdate = async () => {
    if (!remark.trim()) {
      toast.error("Remark cannot be empty.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("remark", remark);
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPackingDetails(formData);
      toast.success("Remark updated!");

      queryClient.invalidateQueries({
        queryKey: ["hardwarePackingDetails", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update remark.");
    }
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    deleteDocument({
      vendorId: vendorId!,
      documentId: confirmDelete,
      deleted_by: userId!,
    });
    setConfirmDelete(null);
  };

  return (
    <div className="border rounded-xl bg-background shadow-sm overflow-hidden">
      {/* ---------- HEADER ---------- */}
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="space-y-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Hardware Packing Details
            </h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Upload packing documents, photos, and provide remarks.
          </p>
        </div>
      </div>

      {/* ---------- UPLOAD AREA ---------- */}
      <div className="p-6 border-b space-y-6">
        {canViewAndWork && (
          <div className="space-y-3">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".pdf,.jpg,.jpeg,.png,.zip"
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

        {/* Remark Section */}
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-tight">Remark</p>
          <TextAreaInput
            value={remark}
            onChange={setRemark}
            maxLength={500}
            placeholder="Add any notes related to hardware packing..."
            className="h-[130px] bg-muted/20 rounded-lg"
            disabled={!canViewAndWork}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleRemarkUpdate}
              disabled={!remark.trim() || !canViewAndWork}
              className="flex items-center gap-2"
            >
              <Paperclip size={16} />
              {packingDetails?.remark ? "Update Remark" : "Add Remark"}
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- FILE LIST ---------- */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold">Uploaded Documents</h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {packingDetails.data.length} file
              {packingDetails.data.length > 1 && "s"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading...
          </div>
        ) : !hasFiles ? (
          <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/40">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No hardware packing details uploaded yet.
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
                  onView={() => {
                    setStartIndex(index);
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

      {/* ---------- DELETE CONFIRMATION ---------- */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAction}
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
