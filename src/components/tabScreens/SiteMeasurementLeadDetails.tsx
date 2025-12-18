"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Edit2, FileText, Plus, RefreshCcw, Receipt, Ban } from "lucide-react";
import {
  useBookingDoneIsmDetails,
  useSiteMeasurementLeadById,
} from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
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
  const { data: bookingDoneIsm } = useBookingDoneIsmDetails(
    leadId,
    vendorId
  );
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // 🧩 --- Local State ---
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openImageModal2, setOpenImageModal2] = useState(false);

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
  const bookingDoneIsmCurrentSitePhotos =
    bookingDoneIsm?.current_site_photos || [];
  const bookingDoneIsmPdfDocs = bookingDoneIsm?.pdf_documents || [];
  const bookingDoneIsmPaymentImages = bookingDoneIsm?.payment_images || [];
  const bookingDoneIsmPaymentInfo = bookingDoneIsm?.payment_info;
  const bookingDoneIsmLedgerEntry = bookingDoneIsm?.ledger_entry;
  const bookingDoneIsmUploadedAt = bookingDoneIsm?.uploaded_at;
  const hasBookingDoneIsmContent =
    bookingDoneIsmCurrentSitePhotos.length > 0 ||
    bookingDoneIsmPdfDocs.length > 0 ||
    bookingDoneIsmPaymentImages.length > 0 ||
    Boolean(bookingDoneIsmPaymentInfo) ||
    Boolean(bookingDoneIsmLedgerEntry) ||
    Boolean(bookingDoneIsmUploadedAt);

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
    bg-[#fff] dark:bg-[#0a0a0a]
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
      bg-[#fff] dark:bg-[#0a0a0a]
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
      bg-[#fff] dark:bg-[#0a0a0a]
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
        bg-[#fff] dark:bg-[#0a0a0a]
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
      bg-[#fff] dark:bg-[#0a0a0a]
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
        <motion.div
          variants={itemVariants}
          className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
        >
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
      bg-[#fff] dark:bg-[#0a0a0a] 
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
        bg-[#fff] dark:bg-[#0a0a0a]
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
          <motion.div
            variants={itemVariants}
            className="p-6 bg-[#fff] dark:bg-[#0a0a0a]"
          >
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
                />
              ))}
            </div>
          </motion.div>
        </motion.section>
      )}

      {/* -------- Booking Done ISM Uploads -------- */}
      {hasBookingDoneIsmContent && (
        <motion.section
          variants={itemVariants}
          className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl
      border border-border
      shadow-soft
      overflow-hidden
    "
        >
          <div
            className="
        flex items-center justify-between
        px-5 py-3
        border-b border-border
        bg-[#fff] dark:bg-[#0a0a0a]
      "
          >
            <div className="flex flex-col items-start">
              <h1 className="text-lg font-semibold tracking-tight">
                Booking Done ISM Uploads
              </h1>
              <p className="text-xs text-gray-500">
                Documents and photos submitted for Booking Done ISM.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {(bookingDoneIsmPaymentInfo) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bookingDoneIsmPaymentInfo && (
                  <div className="border border-border rounded-xl p-4 bg-muted/40 dark:bg-neutral-900 space-y-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={18} />
                      <h3 className="text-sm font-semibold">Payment Info</h3>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span>{bookingDoneIsmPaymentInfo.amount ?? "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Payment Date
                        </span>
                        <span>
                          {bookingDoneIsmPaymentInfo.payment_date ?? "N/A"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">
                          Description
                        </span>
                        <div className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                          {bookingDoneIsmPaymentInfo.payment_text || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {bookingDoneIsmPdfDocs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-base font-semibold">
                    ISM Documents ({bookingDoneIsmPdfDocs.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {bookingDoneIsmPdfDocs.map((doc: any) => (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        originalName: doc.originalName,
                        created_at: doc.createdAt,
                        signedUrl: doc.signedUrl,
                      }}
                      canDelete={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {bookingDoneIsmCurrentSitePhotos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-base font-semibold">
                    Current Site Photos ({bookingDoneIsmCurrentSitePhotos.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {bookingDoneIsmCurrentSitePhotos.map((doc: any, index: any) => (
                    <ImageComponent
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        doc_og_name: doc.originalName,
                        signedUrl: doc.signedUrl,
                        created_at: doc.createdAt,
                      }}
                      index={index}
                      canDelete={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {bookingDoneIsmPaymentImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-base font-semibold">
                    Payment Images ({bookingDoneIsmPaymentImages.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {bookingDoneIsmPaymentImages.map((doc: any, index: any) => (
                    <ImageComponent
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        doc_og_name: doc.originalName,
                        signedUrl: doc.signedUrl,
                        created_at: doc.createdAt,
                      }}
                      index={index}
                      canDelete={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

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
