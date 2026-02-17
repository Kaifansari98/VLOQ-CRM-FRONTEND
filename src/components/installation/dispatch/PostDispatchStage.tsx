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
  usePostDispatchDocuments,
  useUploadPostDispatchDocuments,
} from "@/api/installation/useDispatchStageLeads"; // ✅ use your Post Dispatch APIs

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
import { canViewAndWorkDispatchStage } from "@/components/utils/privileges";
interface PostDispatchStageProps {
  leadId: number;
  accountId: number | null;
}

export default function PostDispatchStage({
  leadId,
  accountId,
}: PostDispatchStageProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  // ✅ Get and Upload APIs
  const { data: postDispatchDocs, isLoading } = usePostDispatchDocuments(
    vendorId,
    leadId
  );

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { mutateAsync: uploadPostDispatchFiles, isPending } =
    useUploadPostDispatchDocuments();

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const hasFiles =
    Array.isArray(postDispatchDocs) && postDispatchDocs.length > 0;

  const imageExtensions = ["jpg", "jpeg", "png"];
  const documentExtensions = ["pdf", "docx", "doc", "zip"];

  const images =
    postDispatchDocs?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    }) || [];

  const Documents =
    postDispatchDocs?.filter((file: any) => {
      const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
      return documentExtensions.includes(ext || "");
    }) || [];

  // ✅ Upload Handler
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      await uploadPostDispatchFiles({
        vendorId: vendorId!,
        leadId: leadId!,
        payload: {
          files: selectedFiles,
          account_id: accountId,
          created_by: userId!,
        },
      });

    
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["postDispatchDocuments", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload Post Dispatch documents."
      );
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

  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "factory" && leadStatus === "dispatch-stage");

  const canViewAndWork = canViewAndWorkDispatchStage(userType, leadStatus);
  return (
    <div className="border rounded-lg  bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-muted/20 flex flex-col ">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Post Dispatch Documents</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload and manage all Post Dispatch related photos and documents.
        </p>
      </div>

      {/* Upload Section */}

      {canViewAndWork && (
        <div className="p-6 border-b space-y-4">
          <FileUploadField
            value={selectedFiles}
            onChange={setSelectedFiles}
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip"
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

      {/* Files List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-foreground">
            Uploaded Documents
          </h4>
          {hasFiles && (
            <span className="text-xs text-muted-foreground">
              {postDispatchDocs.length} file
              {postDispatchDocs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading Post Dispatch documents...
          </div>
        ) : !hasFiles ? (
          <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No Post Dispatch documents uploaded yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((doc: any, index: number) => (
              <ImageComponent
                doc={{
                  id: doc?.id,
                  doc_og_name: doc.doc_og_name,
                  signedUrl: doc.signed_url,
                  created_at: doc.created_at,
                }}
                key={index}
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
    </div>
  );
}
