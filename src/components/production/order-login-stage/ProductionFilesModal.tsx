"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useProductionFiles,
  useUploadProductionFiles,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import { FolderOpen, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
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
import DocumentCard from "@/components/utils/documentCard";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canUploadOrDeleteOrderLogin } from "@/components/utils/privileges";
import { Badge } from "@/components/ui/badge";
import { ImageComponent } from "@/components/utils/ImageCard";

interface ProductionFilesSectionProps {
  leadId: number;
  accountId: number | null;
  readOnly?: boolean;
}

export default function ProductionFilesSection({
  leadId,
  accountId,
  readOnly = false,
}: ProductionFilesSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const queryClient = useQueryClient();

  const { data: productionFiles, isLoading } = useProductionFiles(
    vendorId,
    leadId
  );
  const { mutateAsync: uploadFiles, isPending } = useUploadProductionFiles(
    vendorId,
    leadId
  );

  const leadStatus = leadData?.status;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles = Array.isArray(productionFiles) && productionFiles.length > 0;

  // ✅ Handle Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("created_by", String(userId || 0));
      if (accountId) formData.append("account_id", String(accountId));

      await uploadFiles(formData);
      toast.success("Production files uploaded successfully!");
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["productionFiles", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload files.");
    }
  };

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

  // ✅ Permission logic for delete
  console.log("UserType: ", userType);
  console.log("Lead Status", leadStatus);
  const canDelete = !readOnly && canUploadOrDeleteOrderLogin(userType, leadStatus);

  return (
    <div className="border rounded-lg bg-background shadow-sm">
      {/* -------------------------------- HEADER -------------------------------- */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b bg-muted/30 ">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Production Files
            </h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Upload and manage production files associated with this lead.
          </p>
        </div>

        {hasFiles && (
          <Badge variant="secondary" >
            {productionFiles.length} File
            {productionFiles.length > 1 && "s"}
          </Badge>
        )}
      </div>

      {/* -------------------------------- UPLOAD AREA -------------------------------- */}
      {canDelete && (
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={selectedFiles}
            onChange={setSelectedFiles}
            accept=".png,.jpg,.jpeg,.pdf,.pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip"
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

      {/* -------------------------------- FILE LIST SECTION -------------------------------- */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold tracking-tight">
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
              No production files uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Start by uploading your CAD, Pytha, or image files.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
            {productionFiles.map((doc: any) => {
              const isImage = doc.doc_og_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              if (isImage) {
                return (
                  <ImageComponent
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      doc_og_name: doc.doc_og_name,
                      signedUrl: doc.signedUrl ?? doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={canDelete}
                onDelete={(id) =>
                  setConfirmDelete(typeof id === "string" ? Number(id) : id)
                }
                  />
                );
              } else {
                return (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.doc_og_name,
                      signedUrl: doc.signedUrl ?? doc.signed_url,
                    }}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                );
              }
            })}
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
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently deleted.
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
