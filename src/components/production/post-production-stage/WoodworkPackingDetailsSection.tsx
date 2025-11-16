"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  FileText,
  ExternalLink,
  Upload,
  Loader2,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
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
  useGetWoodworkPackingDetails,
  usePostProductionCompleteness,
  useUploadWoodworkPackingDetails,
} from "@/api/production/production-api";
import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkProductionStage } from "@/components/utils/privileges";

interface WoodworkPackingDetailsSectionProps {
  leadId: number;
  accountId: number | null;
}

export default function WoodworkPackingDetailsSection({
  leadId,
  accountId,
}: WoodworkPackingDetailsSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const queryClient = useQueryClient();

  const { data: packingDetails, isLoading } = useGetWoodworkPackingDetails(
    vendorId,
    leadId
  );

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { data: leadData, error } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const { mutateAsync: uploadPackingDetails, isPending } =
    useUploadWoodworkPackingDetails(vendorId, leadId);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [remark, setRemark] = useState(packingDetails?.remark || "");

  const { data: completeness, refetch: refetchCompleteness } =
    usePostProductionCompleteness(vendorId, leadId);

  console.log("Wood Wor Packing details: ", packingDetails);

  const imageExtensions = ["jpg", "jpeg", "png"];
  const documentExtensions = ["pdf", "zip"];

  const images =
    packingDetails?.data?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    }) || [];

  const Documents =
    packingDetails?.data?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return documentExtensions.includes(ext || "");
    }) || [];

  useEffect(() => {
    if (packingDetails?.remark) setRemark(packingDetails.remark);
  }, [packingDetails?.remark]);

  const hasFiles =
    Array.isArray(packingDetails?.data) && packingDetails.data.length > 0;

  // ✅ Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0 && remark.trim() === "") {
      toast.error("Please add a remark or select at least one file.");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      if (remark.trim() !== "") formData.append("remark", remark);
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPackingDetails(formData);
      toast.success("Woodwork Packing Details uploaded successfully!");

      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["woodworkPackingDetails", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["postProductionCompleteness", vendorId, leadId],
      });
      await refetchCompleteness();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload woodwork packing details."
      );
    }
  };

  const handleRemarkUpdate = async () => {
    if (!remark.trim()) {
      toast.error("Please enter a remark before saving.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("remark", remark);
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadPackingDetails(formData);
      toast.success("Remark updated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["woodworkPackingDetails", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update remark.");
    }
  };

  const canDelete = userType === "admin" || userType === "super-admin";
  const canViewAndWork = canViewAndWorkProductionStage(userType, leadStatus);

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
    <div className="border rounded-lg h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Woodwork Packing Details</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload related woodwork packing documents or remarks.
        </p>
      </div>

      {/* Upload Section */}

      <div className="p-6 border-b">
        <div
          className={`grid grid-cols-1 ${
            canViewAndWork && "md:grid-cols-2"
          }  gap-6`}
        >
          {/* File Upload Column */}
          {canViewAndWork && (
            <div>
              <FileUploadField
                value={selectedFiles}
                onChange={setSelectedFiles}
                accept=".pdf,.jpg,.jpeg,.png,.zip"
                multiple
              />
              {/* Upload Button */}
              <div className="flex justify-end mt-4">
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

          {/* Remark Column */}
          <div>
            <p className="capitalize text-sm mb-2 font-semibold">
              woodwork packing details remark
            </p>
            <TextAreaInput
              value={remark}
              onChange={setRemark}
              maxLength={500}
              placeholder="Add a remark about the woodwork packing details..."
              className="h-[130px] bg-muted/20 rounded-lg"
              disabled={!canViewAndWork}
            />
            <div className="flex justify-end mt-4">
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
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Documents
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {packingDetails.data.length} file
              {packingDetails.data.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading documents...
          </div>
        ) : !hasFiles ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No woodwork packing details uploaded yet.
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
