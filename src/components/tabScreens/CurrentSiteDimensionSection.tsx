"use client";

import React, { useState } from "react";
import { Loader2, Ruler, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import CustomeTooltip from "@/components/custom-tooltip";
import { ImageComponent } from "../utils/ImageCard";
import DocumentCard from "../utils/documentCard";
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
import {
  useDeleteDocument,
  useSiteDimensionDocuments,
  useUploadSiteDimensionDocuments,
} from "@/api/leads";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

const isImageDocument = (fileName?: string | null) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  return !!ext && IMAGE_EXTENSIONS.includes(ext);
};

interface CurrentSiteDimensionSectionProps {
  vendorId: number;
  leadId: number;
  userId: number;
  /** Same permission as uploading/deleting Current Site Photos. */
  canManage: boolean;
  shouldDisableBlockedActions: boolean;
  blockedTooltip?: string;
  /** Names the files like Site Photos do (CSD instead of CSP). */
  renameFiles: (files: File[]) => File[];
}

/** Current Site Dimension documents of a lead (large-scale vendors). */
export default function CurrentSiteDimensionSection({
  vendorId,
  leadId,
  userId,
  canManage,
  shouldDisableBlockedActions,
  blockedTooltip,
  renameFiles,
}: CurrentSiteDimensionSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: documents = [], isLoading } = useSiteDimensionDocuments(
    vendorId,
    leadId,
  );
  const { mutateAsync: uploadDocuments, isPending: uploading } =
    useUploadSiteDimensionDocuments();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const imageDocuments = documents.filter((doc: any) =>
    isImageDocument(doc.doc_og_name),
  );
  const fileDocuments = documents.filter(
    (doc: any) => !isImageDocument(doc.doc_og_name),
  );

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toastManager.add({
        title: "Please select at least one file to upload.",
        type: "error",
      });
      return;
    }
    try {
      await uploadDocuments({
        vendorId,
        leadId,
        createdBy: userId,
        files: renameFiles(selectedFiles),
      });
      setSelectedFiles([]);
      toastManager.add({
        title: "Current site dimension uploaded successfully",
        type: "success",
      });
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to upload current site dimension",
        type: "error",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteDocument({ vendorId, documentId: confirmDelete, deleted_by: userId });
    setConfirmDelete(null);
  };

  return (
    <section className="bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border shadow-soft overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex flex-col items-start">
          <h1 className="text-lg font-semibold tracking-tight">
            Current Site Dimension
          </h1>
          <p className="text-xs text-gray-500">
            Site dimension drawings and documents of this lead.
          </p>
        </div>
        {documents.length > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {documents.length} File{documents.length > 1 && "s"}
          </span>
        )}
      </div>

      {canManage && (
        <div className="p-6 border-b space-y-4">
          {shouldDisableBlockedActions ? (
            <CustomeTooltip
              value={blockedTooltip}
              truncateValue={
                <div>
                  <FileUploadField value={[]} onChange={() => {}} disabled />
                </div>
              }
            />
          ) : (
            <>
              <FileUploadField
                value={selectedFiles}
                onChange={setSelectedFiles}
                multiple
                maxFiles={40}
                maxSizeMB={400}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin size-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin mr-2 size-4" />
            Loading site dimension...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-border/60 rounded-xl bg-mutedBg/40 dark:bg-neutral-800/40">
            <Ruler className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No site dimension uploaded
            </p>
            <p className="text-xs text-subtle mt-1">
              Files will appear here once uploaded
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {imageDocuments.map((doc: any, index: number) => (
              <ImageComponent
                key={doc.id}
                doc={{
                  id: doc.id,
                  doc_og_name: doc.doc_og_name,
                  signedUrl: doc.signedUrl,
                  created_at: doc.created_at,
                }}
                index={index}
                canDelete={canManage && !shouldDisableBlockedActions}
                onDelete={(id) => setConfirmDelete(Number(id))}
              />
            ))}
            {fileDocuments.map((doc: any) => (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  originalName: doc.doc_og_name,
                  signedUrl: doc.signedUrl,
                  created_at: doc.created_at,
                }}
                canDelete={canManage && !shouldDisableBlockedActions}
                onDelete={(id) => setConfirmDelete(Number(id))}
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
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
