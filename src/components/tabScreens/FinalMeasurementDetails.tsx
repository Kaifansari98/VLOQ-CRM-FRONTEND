"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
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
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import DocumentCard from "@/components/utils/documentCard";
import Loader from "@/components/utils/loader";
import SectionHeader from "@/utils/sectionHeader";

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

  // 🧩 --- Local States ---
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  // 🧩 --- Permissions ---
  const canDelete = userType === "admin" || userType === "super_admin";

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

        <motion.div variants={itemVariants} className="p-6 bg-[#fff] dark:bg-[#0a0a0a]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sitePhotos.length > 0 ? (
              sitePhotos.map((photo, index) => (
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
                    setInitialImageIndex(i);
                    setIsCarouselOpen(true);
                  }}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-14">
                <FileText size={42} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No site photos uploaded yet.
                </p>
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

          <motion.div variants={itemVariants} className="p-6 bg-[#fff] dark:bg-[#0a0a0a]">
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

      {/* -------- Image Carousel Modal -------- */}
      <ImageCarouselModal
        open={isCarouselOpen}
        initialIndex={initialImageIndex}
        onClose={() => setIsCarouselOpen(false)}
        images={sitePhotos.map((photo) => ({
          id: photo.id,
          signed_url: photo.signedUrl,
          doc_og_name: photo.doc_og_name,
        }))}
      />

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
    </motion.div>
  );
}
