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
      className="border rounded-lg w-full h-full p-6 space-y-6 overflow-y-scroll mb-6"
    >
      {/* -------- Measurement Document + Payment Info Row -------- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Measurement Document (PDF) */}
        <div className="lg:w-[45%] border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <h1 className="text-base font-semibold flex items-center gap-1">
                Measurement Document
                <span className="text-xs font-medium text-muted-foreground">
                  ({pdfDocs.length} {pdfDocs.length === 1 ? "File" : "Files"})
                </span>
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {pdfDocs.length > 0 ? (
              pdfDocs.map((doc) => (
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
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText size={40} className="text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No measurement document found.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {payment && (
          <motion.div
            variants={itemVariants}
            className="flex-1 border rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <Receipt size={20} />
                <h1 className="text-base font-semibold">Payment Information</h1>
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

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Amount</p>
                <div className="bg-muted border rounded-sm p-2 text-sm">
                  {payment.amount ?? "N/A"}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Date</p>
                <div className="bg-muted border rounded-sm p-2 text-sm">
                  {payment.payment_date ?? "N/A"}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Description</p>
                <div className="bg-muted border rounded-sm p-2 text-sm overflow-y-scroll max-h-24">
                  {payment.payment_text || "N/A"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* -------- Current Site Photos -------- */}
      <div className="border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Images size={20} />
            <h1 className="text-base font-semibold">Current Site Photos</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCcw size={15} />
            Refresh
          </Button>
        </div>

        <motion.div variants={itemVariants} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

            {canEditOrUpload && (
              <div
                onClick={() => setOpenImageModal(true)}
                className="flex items-center justify-center w-32 max-h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
              >
                <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-600">
                  <Plus size={24} className="mb-1" />
                  <span className="text-xs font-medium">Add Photos</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* -------- Payment Proofs -------- */}
      {paymentImages.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <Images size={20} />
              <h1 className="text-base font-semibold">Payment Proofs</h1>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCcw size={15} />
              Refresh
            </Button>
          </div>

          <motion.div variants={itemVariants} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        </div>
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
