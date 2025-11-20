"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  FileText,
  Plus,
  Download,
  Eye,
  RefreshCcw,
  Images,
  Receipt,
  Ban,
} from "lucide-react";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { SiteMeasurementFile } from "@/types/site-measrument-types";
import SiteMesurementEditModal from "../sales-executive/siteMeasurement/site-mesurement-edit-modal";
import AddCurrentSitePhotos from "../sales-executive/siteMeasurement/current-site-image-add-modal";
import AddPaymentDetailsPhotos from "../sales-executive/siteMeasurement/payment-details-image-add-modal";
import { useAppSelector } from "@/redux/store";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { ImageComponent } from "../utils/ImageCard";
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
import ImageCarouselModal from "../utils/image-carousel-modal";
import DocumentCard from "@/components/utils/documentCard";
import Loader from "@/components/utils/loader";

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

export default function SiteMeasurementLeadDetails({ leadId }: Props) {
  // 🧩 --- Redux & Auth Context ---
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  // 🧩 --- Hooks ---
  const { data } = useSiteMeasurementLeadById(leadId);
  const { data: leadData, isLoading, error } = useLeadStatus(leadId, vendorId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // 🧩 --- Local State ---
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openImageModal2, setOpenImageModal2] = useState(false);

  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isCarouselPaymentOpen, setIsCarouselPaymentOpen] = useState(false);
  const [initialPaymentImageIndex, setInitialPaymentImageIndex] = useState(0);

  // 🧩 --- Data Extraction ---
  const accountId = leadId;
  const leadStatus = leadData?.status;
  const pdfDocs: SiteMeasurementFile[] =
    data?.initial_site_measurement_documents || [];
  const currentSitePhotos: SiteMeasurementFile[] =
    data?.current_site_photos || [];
  const paymentImages: SiteMeasurementFile[] =
    data?.initial_site_measurement_payment_details || [];
  const payment = data?.payment_info;

  // 🧩 --- Permissions ---
  const canEditOrUpload =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" &&
      leadStatus === "initial-site-measurement");

  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" &&
      leadStatus === "initial-site-measurement");

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

  // 🧩 --- Loading & Error States ---
  if (isLoading)
    return (
      <Loader
        fullScreen
        size={250}
        message="Loading Site Measurement Details..."
      />
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading site measurement details.
        </p>
      </div>
    );

  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No site measurement details found.</p>
      </div>
    );
  }

  // 🧩 --- Render ---
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg w-full h-full py-4 space-y-6 overflow-y-scroll bg-[#fff] dark:bg-[#0a0a0a]"
    >
      {/* -------- Measurement Document + Payment Info Row -------- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ------- Measurement Document Card (MATCHED UI) ------- */}
        <motion.section
          variants={itemVariants}
          className="
    lg:w-[45%]
    bg-white dark:bg-neutral-900
    rounded-2xl
    border border-border
    shadow-soft
    overflow-hidden
  "
        >
          {/* Header */}
          <div
            className="
      flex items-center justify-between 
      px-5 py-3 
      border-b border-border
      bg-mutedBg/50 dark:bg-neutral-900/50
    "
          >
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-1">
                Measurement Document
                <span className="text-xs font-medium text-muted-foreground">
                  ({pdfDocs.length} {pdfDocs.length === 1 ? "File" : "Files"})
                </span>
              </h1>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {pdfDocs.length > 0 ? (
              <div className="space-y-4">
                {pdfDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.originalName,
                      created_at: doc.uploadedAt,
                      signedUrl: doc.signedUrl,
                    }}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <FileText size={42} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No measurement document found.
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ------- Payment Information Card (MATCHED UI) ------- */}
        {payment && (
          <motion.section
            variants={itemVariants}
            className="
      flex-1
      bg-white dark:bg-neutral-900
      rounded-2xl
      border border-border
      shadow-soft
      overflow-hidden
    "
          >
            {/* Header */}
            <div
              className="
        flex items-center justify-between 
        px-5 py-3 
        border-b border-border
        bg-mutedBg/50 dark:bg-neutral-900/50
      "
            >
              <div className="flex items-center gap-2">
                <Receipt size={20} />
                <h1 className="text-lg font-semibold tracking-tight">
                  Payment Information
                </h1>
              </div>

              {canEditOrUpload && (
                <Button
                  size="sm"
                  onClick={() => setOpenEditModal(true)}
                  className="gap-2"
                >
                  <Edit2 size={16} />
                  <span className="text-sm">Edit</span>
                </Button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Amount */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Amount
                </p>
                <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm">
                  {payment.amount ?? "N/A"}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Date
                </p>
                <div className="bg-muted border border-border rounded-lg px-3 py-2 text-sm">
                  {payment.payment_date ?? "N/A"}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Description
                </p>
                <div
                  className="
            bg-muted border border-border rounded-lg 
            px-3 py-2 text-sm 
            max-h-24 overflow-y-auto
          "
                >
                  {payment.payment_text || "N/A"}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* -------- Current Site Photos (MATCHING UI) -------- */}
      <motion.section
        variants={itemVariants}
        className="
    bg-white dark:bg-neutral-900 
    rounded-2xl 
    border border-border 
    shadow-soft 
    overflow-hidden
  "
      >
        {/* Header */}
        <div
          className="
      flex items-center justify-between 
      px-5 py-3 
      border-b border-border
      bg-mutedBg/50 dark:bg-neutral-900/50
    "
        >
          <div className="flex flex-col items-start">
            <h1 className="text-lg font-semibold tracking-tight">
              Current Site Photos
            </h1>
            <p className="text-xs text-gray-500">
              All the Lead Related Photos uploaded by the client or team.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="
        rounded-lg 
        border-border 
        hover:bg-mutedBg dark:hover:bg-neutral-800 
        dark:border-neutral-700
        transition
      "
          >
            <RefreshCcw size={15} />
            Refresh
          </Button>
        </div>

        {/* Body */}
        <motion.div variants={itemVariants} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentSitePhotos.map((doc, index) => (
              <ImageComponent
                key={doc.id}
                doc={{
                  id: doc.id,
                  doc_og_name: doc.originalName,
                  signedUrl: doc.signedUrl,
                  created_at: doc.uploadedAt,
                }}
                index={index}
                canDelete={canDelete}
                onView={(i) => {
                  setInitialImageIndex(i);
                  setIsCarouselOpen(true);
                }}
                onDelete={(id) => setConfirmDelete(Number(id))}
              />
            ))}

            {/* Add button card */}
            {canEditOrUpload && (
              <div
                onClick={() => setOpenImageModal(true)}
                className="
            flex flex-col items-center justify-center 
            h-28 
            border-2 border-dashed border-border 
            rounded-xl cursor-pointer 
            hover:bg-mutedBg dark:hover:bg-neutral-800 
            transition-all duration-200
          "
              >
                <Plus size={26} className="text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  Add Photos
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.section>

      {/* -------- Payment Proofs (MATCHING UI) -------- */}
      {paymentImages.length > 0 && (
        <motion.section
          variants={itemVariants}
          className="
      bg-white dark:bg-neutral-900 
      rounded-2xl 
      border border-border 
      shadow-soft 
      overflow-hidden
    "
        >
          {/* Header */}
          <div
            className="
        flex items-center justify-between 
        px-5 py-3 
        border-b border-border
        bg-mutedBg/50 dark:bg-neutral-900/50
      "
          >
            <div className="flex flex-col items-start">
              <h1 className="text-lg font-semibold tracking-tight">
                Payment Proofs
              </h1>
              <p className="text-xs text-gray-500">
                Uploaded payment transaction receipts & confirmation photos.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="
          rounded-lg 
          border-border 
          hover:bg-mutedBg dark:hover:bg-neutral-800 
          dark:border-neutral-700
          transition
        "
            >
              <RefreshCcw size={15} />
              Refresh
            </Button>
          </div>

          {/* Body */}
          <motion.div variants={itemVariants} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paymentImages.map((doc, index) => (
                <ImageComponent
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    doc_og_name: doc.originalName,
                    signedUrl: doc.signedUrl,
                    created_at: doc.uploadedAt,
                  }}
                  index={index}
                  canDelete={false}
                  onView={(i) => {
                    setInitialPaymentImageIndex(i);
                    setIsCarouselPaymentOpen(true);
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.section>
      )}

      {/* -------- Image Carousels -------- */}
      <ImageCarouselModal
        open={isCarouselOpen}
        initialIndex={initialImageIndex}
        onClose={() => setIsCarouselOpen(false)}
        images={currentSitePhotos.map((photo) => ({
          id: photo.id,
          signed_url: photo.signedUrl,
          doc_og_name: photo.originalName,
        }))}
      />

      <ImageCarouselModal
        open={isCarouselPaymentOpen}
        initialIndex={initialPaymentImageIndex}
        onClose={() => setIsCarouselPaymentOpen(false)}
        images={paymentImages.map((photo) => ({
          id: photo.id,
          signed_url: photo.signedUrl,
          doc_og_name: photo.originalName,
        }))}
      />

      {/* -------- Modals -------- */}
      <SiteMesurementEditModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        data={{
          accountId: accountId,
          id: leadId,
          paymentInfo: payment,
        }}
      />
      <AddCurrentSitePhotos
        open={openImageModal}
        onOpenChange={setOpenImageModal}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
      />
      <AddPaymentDetailsPhotos
        open={openImageModal2}
        onOpenChange={setOpenImageModal2}
        data={{
          accountId,
          id: leadId,
          paymentId: payment?.id ?? null,
        }}
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
    </motion.div>
  );
}
