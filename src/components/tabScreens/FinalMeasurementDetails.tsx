"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import {
  useAddMoreFinalMeasurementFiles,
  useAddMoreFinalMeasurementSitePhotos,
  useFinalMeasurementLeadById,
} from "@/hooks/final-measurement/use-final-measurement";
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
import { Ban, Images, FileText, Plus } from "lucide-react";
import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import Loader from "@/components/utils/loader";
import SectionHeader from "@/utils/sectionHeader";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

type Props = {
  leadId: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
const documentAccept = ".pdf";
const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const imageAccept = ".jpg,.jpeg,.png,.gif";

export default function FinalMeasurementLeadDetails({ leadId }: Props) {
  // 🧩 --- Redux User Context ---
  const vendorId = useAppSelector((state) => state.auth?.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth?.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type?.user_type
  );

  // 🧩 --- Data Hook ---
  const { data, isLoading, error } = useFinalMeasurementLeadById(
    vendorId,
    leadId
  );
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const { mutateAsync: addMoreFiles, isPending: addingFiles } =
    useAddMoreFinalMeasurementFiles();
  const { mutateAsync: addMoreSitePhotos, isPending: addingSitePhotos } =
    useAddMoreFinalMeasurementSitePhotos();
  const queryClient = useQueryClient();

  // 🧩 --- Local States ---
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [addFilesOpen, setAddFilesOpen] = useState(false);
  const [addSitePhotosOpen, setAddSitePhotosOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [sitePhotosToUpload, setSitePhotosToUpload] = useState<File[]>([]);

  // 🧩 --- Permissions ---
  const canDelete = userType === "admin" || userType === "super_admin";
  const canUpload =
    userType === "admin" ||
    userType === "super_admin" ||
    userType === "sales-executive";

  // 🧩 --- Delete Handler ---
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

  const accountId = (data as any)?.account_id;

  const handleFilesChange = (files: File[]) => {
    const validFiles = files.filter((file) =>
      documentMimeTypes.includes(file.type)
    );
    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      toast.error("Only PDF or image files are allowed.");
    }
    if (files.length > 10) {
      toast.error("You can upload up to 10 files.");
      setFilesToUpload(validFiles.slice(0, 10));
      return;
    }
    setFilesToUpload(validFiles);
  };

  const handleSitePhotosChange = (files: File[]) => {
    const validFiles = files.filter((file) =>
      imageMimeTypes.includes(file.type)
    );
    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      toast.error("Only image files are allowed.");
    }
    if (files.length > 10) {
      toast.error("You can upload up to 10 files.");
      setSitePhotosToUpload(validFiles.slice(0, 10));
      return;
    }
    setSitePhotosToUpload(validFiles);
  };

  const handleAddMoreFiles = async () => {
    if (!vendorId || !userId) {
      toast.error("Missing vendor, user information.");
      return;
    }
    if (filesToUpload.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    try {
      await addMoreFiles({
        leadId,
        vendorId,
        createdBy: userId,
        sitePhotos: filesToUpload,
      });
      toast.success("Additional files uploaded successfully.");
      setFilesToUpload([]);
      setAddFilesOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload files."
      );
    }
  };

  const handleAddMoreSitePhotos = async () => {
    if (!vendorId || !userId) {
      toast.error("Missing vendor, user information.");
      return;
    }
    if (sitePhotosToUpload.length === 0) {
      toast.error("Please select at least one site photo to upload.");
      return;
    }

    try {
      await addMoreSitePhotos({
        leadId,
        vendorId,
        createdBy: userId,
        sitePhotos: sitePhotosToUpload,
      });
      toast.success("Additional site photos uploaded successfully.");
      setSitePhotosToUpload([]);
      setAddSitePhotosOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["finalMeasurementLead", vendorId, leadId],
      });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload site photos."
      );
    }
  };

  // 🧩 --- Loading & Error States ---
  if (isLoading)
    return (
      <Loader
        fullScreen
        size={250}
        message="Loading Final Measurement Details..."
      />
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading final measurement details.
        </p>
      </div>
    );

  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No final measurement details found.</p>
      </div>
    );
  }

  // 🧩 --- Data Extraction ---
  const { sitePhotos = [], measurementDocs = [], final_desc_note } = data;

  // 🧩 --- Render ---
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="
    w-full h-full 
    py-4 space-y-4
    overflow-y-auto
    bg-[#fff] dark:bg-[#0a0a0a]
  "
    >
      {/* -------- Current Site Photos -------- */}
      <div
        className="
      bg-white dark:bg-neutral-900
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
      >
        <SectionHeader
          title="Current Site Photos"
          icon={<Images size={20} />}
        />

        <motion.div
          variants={itemVariants}
          className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sitePhotos.length > 0 ? (
              <>
                {sitePhotos.map((photo, index) => {
                  const fileName = photo.doc_og_name || "";
                  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff|heic|heif|avif|svg|jfif)$/i.test(
                    fileName
                  );

                  return isImage ? (
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
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  ) : (
                    <DocumentCard
                      key={photo.id}
                      doc={{
                        id: photo.id,
                        originalName: photo.doc_og_name,
                        signedUrl: photo.signedUrl,
                        created_at: photo.created_at,
                      }}
                      canDelete={canDelete}
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  );
                })}
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => setAddSitePhotosOpen(true)}
                    className="
                      flex flex-col items-center justify-center
                      border border-dashed border-border/70
                      rounded-xl p-6 text-center
                      bg-mutedBg/40 dark:bg-neutral-800/40
                      hover:bg-muted/40 dark:hover:bg-neutral-800/60
                      transition
                    "
                  >
                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Add more site photos
                    </p>
                    <p className="text-xs text-subtle mt-1">
                      Upload up to 10 files
                    </p>
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-14">
                <FileText size={42} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No site photos uploaded yet.
                </p>
                {canUpload && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setAddSitePhotosOpen(true)}
                  >
                    Add more site photos
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* -------- Measurement Documents -------- */}
      {measurementDocs.length > 0 && (
        <div
          className="
        bg-white dark:bg-neutral-900
        rounded-2xl 
        border border-border 
        overflow-hidden
      "
        >
          <SectionHeader
            title="Measurement Documents"
            icon={<FileText size={20} />}
          />

          <motion.div
            variants={itemVariants}
            className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {measurementDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    originalName: doc.doc_og_name,
                    created_at: doc.created_at,
                    signedUrl: doc.signedUrl,
                  }}
                  canDelete={canDelete}
                  onDelete={(id) => setConfirmDelete(id)}
                />
              ))}
              {canUpload && (
                <button
                  type="button"
                  onClick={() => setAddFilesOpen(true)}
                  className="
                    flex flex-col items-center justify-center
                    border border-dashed border-border/70
                    rounded-xl p-6 text-center
                    bg-mutedBg/40 dark:bg-neutral-800/40
                    hover:bg-muted/40 dark:hover:bg-neutral-800/60
                    transition
                  "
                >
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Add more files
                  </p>
                  <p className="text-xs text-subtle mt-1">
                    Upload up to 10 files
                  </p>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* -------- Discussion Note -------- */}
      <div
        className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl 
      border border-border
      overflow-hidden
    "
      >
        <div
          className="
        px-5 py-3 
        border-b border-border
        bg-mutedBg/50 dark:bg-neutral-900/50
      "
        >
          <h2 className="text-base font-semibold tracking-tight">
            Discussion Note
          </h2>
        </div>

        <div className="p-5">
          <div
            className="
          bg-[#fff] dark:bg-[#0a0a0a]
          border border-border
          rounded-xl
          p-4 
          text-sm leading-relaxed 
          min-h-[70px] 
        "
          >
            {final_desc_note || "No description provided."}
          </div>
        </div>
      </div>

      {/* -------- Delete Confirmation Dialog -------- */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected file will be
              permanently removed.
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

      <BaseModal
        open={addFilesOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddFilesOpen(false);
            setFilesToUpload([]);
          }
        }}
        title="Add More Final Measurement Files"
        description="Upload additional final measurement files (PDF or images, max 10)."
        size="md"
      >
        <div className="p-5 space-y-4">
          <FileUploadField
            value={filesToUpload}
            onChange={handleFilesChange}
            accept={documentAccept}
            multiple
            maxFiles={10}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddFilesOpen(false);
                setFilesToUpload([]);
              }}
              disabled={addingFiles}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddMoreFiles} disabled={addingFiles}>
              {addingFiles ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={addSitePhotosOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddSitePhotosOpen(false);
            setSitePhotosToUpload([]);
          }
        }}
        title="Add More Site Photos"
        description="Upload additional site photos (max 10)."
        size="md"
      >
        <div className="p-5 space-y-4">
          <FileUploadField
            value={sitePhotosToUpload}
            onChange={handleSitePhotosChange}
            accept={imageAccept}
            multiple
            maxFiles={10}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddSitePhotosOpen(false);
                setSitePhotosToUpload([]);
              }}
              disabled={addingSitePhotos}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddMoreSitePhotos}
              disabled={addingSitePhotos}
            >
              {addingSitePhotos ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </motion.div>
  );
}
