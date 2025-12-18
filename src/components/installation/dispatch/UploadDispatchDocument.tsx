"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FolderOpen, Upload, Loader2, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BaseModal from "@/components/utils/baseModal";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { FileUploadField } from "@/components/custom/file-upload";

import {
  useDispatchDocuments,
  useUploadDispatchDocuments,
} from "@/api/installation/useDispatchStageLeads";
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

interface UploadDispatchDocumentProps {
  leadId: number;
  accountId: number;
  disabled: boolean;
}

export default function UploadDispatchDocument({
  leadId,
  accountId,
  disabled,
}: UploadDispatchDocumentProps) {
  /* -----------------------------------------------------------
     🔹 ALL HOOKS MUST STAY HERE (TOP ONLY)
  ------------------------------------------------------------ */
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((s) => s.auth.user?.id) || 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const queryClient = useQueryClient();

  const { data: docsData, isLoading } = useDispatchDocuments(vendorId, leadId);
  const docs = Array.isArray(docsData) ? docsData : [];

  const uploadDocsMutation = useUploadDispatchDocuments();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [openModal, setOpenModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  console.log("Dispatch stage disabled: ", disabled);

  /* -----------------------------------------------------------
     🔹 HELPERS (PURE FUNCTIONS)
  ------------------------------------------------------------ */
  const separateImageAndDocs = (docs: any[]) => {
    const imageExtensions = ["jpg", "jpeg", "png", "webp"];

    const images = docs.filter((d) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    });

    const nonImages = docs.filter((d) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return !imageExtensions.includes(ext || "");
    });

    return { images, nonImages };
  };

  const { images, nonImages } = separateImageAndDocs(docs);

  /* -----------------------------------------------------------
     🔹 UPLOAD FUNCTION
  ------------------------------------------------------------ */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file.");
      return;
    }

    try {
      await uploadDocsMutation.mutateAsync({
        vendorId,
        leadId,
        payload: {
          files: selectedFiles,
          account_id: accountId,
          created_by: userId,
        },
      });

      toast.success("Dispatch documents uploaded!");
      setSelectedFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["dispatchDocuments", vendorId, leadId],
      });
    } catch (error) {
      toast.error("Failed to upload files.");
    }
  };

  /* -----------------------------------------------------------
     🔹 DELETE FUNCTION
  ------------------------------------------------------------ */
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;

    deleteDocument({
      vendorId,
      documentId: confirmDelete,
      deleted_by: userId,
    });

    setConfirmDelete(null);
  };

  /* -----------------------------------------------------------
     🔹 LOADING STATE
  ------------------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 size-5" />
        <div className="text-sm text-muted-foreground">
          Loading dispatch documents...
        </div>
      </div>
    );
  }

  /* -----------------------------------------------------------
     🔹 MAIN COMPONENT
  ------------------------------------------------------------ */
  return (
    <>
      <Card className="h-full flex flex-col rounded-2xl border bg-white dark:bg-neutral-900">
        <CardContent className="h-full flex flex-col px-6 justify-between ">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-neutral-50 dark:bg-neutral-800 text-green-600">
                  <File className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-semibold text-sm">Dispatch Documents</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload and manage dispatch documents
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setOpenModal(true)}
              >
                {docs.length === 0 && disabled ? "Upload" : "View"}
              </Button>
            </div>

            <div className="my-4 border-t" />
          </div>

          {/* File Count */}
          <div>
            <div className="flex items-center gap-2 text-sm mb-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {docs.length} file{docs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Preview */}
            {docs.length > 0 ? (
              <div className="flex -space-x-2">
                {docs.slice(0, 4).map((doc: any, index: number) => (
                  <div
                    key={doc.id}
                    className="w-10 h-10 rounded-lg border bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                    style={{ zIndex: 4 - index }}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}

                {docs.length > 4 && (
                  <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs">
                    +{docs.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No files uploaded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* -----------------------------------------------------------
         🔹 MODAL
      ------------------------------------------------------------ */}
      <BaseModal
        open={openModal}
        onOpenChange={(open) => {
          setOpenModal(open);
          if (!open) setSelectedFiles([]);
        }}
        title="Dispatch Documents"
        description="Upload or view dispatch documents"
        icon={
          <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900 text-green-700">
            <File className="w-6 h-6" />
          </div>
        }
        size="lg"
      >
        <div className="space-y-6 p-4">
          {/* Upload Section */}
          <div className="space-y-4">
            {disabled && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Upload New Files</h4>

                  {selectedFiles.length > 0 && (
                    <Badge variant="secondary">
                      {selectedFiles.length} selected
                    </Badge>
                  )}
                </div>

                <FileUploadField
                  value={selectedFiles}
                  onChange={setSelectedFiles}
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                />
              </>
            )}

            {selectedFiles.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={uploadDocsMutation.isPending}
                  className="gap-2"
                >
                  {uploadDocsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {selectedFiles.length} File
                      {selectedFiles.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Existing Files */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Uploaded Files</h4>
              <Badge variant="outline">{docs.length} total</Badge>
            </div>

            {docs.length === 0 ? (
              <div className="p-12 border border-dashed rounded-lg text-center bg-muted/30">
                <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No files uploaded yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((doc: any) => (
                  <ImageComponent
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      doc_og_name: doc.doc_og_name,
                      signedUrl: doc.signedUrl ?? doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={disabled}
                    onDelete={(id) =>
                      setConfirmDelete(typeof id === "string" ? +id : id)
                    }
                  />
                ))}

                {nonImages.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.doc_og_name,
                      signedUrl: doc.signedUrl ?? doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={disabled}
                    onDelete={(id) =>
                      setConfirmDelete(typeof id === "string" ? +id : id)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </BaseModal>

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
