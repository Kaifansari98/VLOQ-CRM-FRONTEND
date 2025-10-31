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
  File,
  RefreshCcw,
  Images,
  Receipt,
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
  // 🧩 --- External Hooks & Redux Selectors ---
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  // 🧩 --- API Queries ---
  const { data } = useSiteMeasurementLeadById(leadId);
  const { data: leadData, isLoading, error } = useLeadStatus(leadId, vendorId);

  // 🧩 --- Mutations ---
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // 🧩 --- Local State & Modal States ---
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openImageModal2, setOpenImageModal2] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  // 🧩 --- Carousel States ---
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isCarouselPaymentOpen, setIsCarouselPaymentOpen] = useState(false);
  const [initialPaymentImageIndex, setInitialPaymentImageIndex] = useState(0);

  // 🧩 --- Derived Data ---
  const accountId = leadId;
  const leadStatus = leadData?.status;

  // 🧩 --- Conditional Rendering ---
  if (isLoading) return <p>Loading lead status...</p>;
  if (error) return <p>Error fetching lead status.</p>;
  if (!data) {
    return (
      <div className="border rounded-lg p-6">
        <p>No site measurement details found.</p>
      </div>
    );
  }

  // 🧩 --- Extract Data from API Response ---
  const pdfDocs: SiteMeasurementFile[] =
    data.initial_site_measurement_documents;
  const currentSitePhotos: SiteMeasurementFile[] = data.current_site_photos;
  const paymentImages: SiteMeasurementFile[] =
    data.initial_site_measurement_payment_details;
  const payment = data.payment_info;

  // 🧩 --- Utility Functions ---
  const formatFileName = (filename: string) => {
    const maxLength = 25;
    if (filename.length <= maxLength) return filename;
    const ext = filename.split(".").pop();
    const name = filename.substring(0, filename.lastIndexOf("."));
    return `${name.substring(0, maxLength - (ext?.length ?? 0) - 4)}...${ext}`;
  };

  // 🧩 --- Event Handlers ---
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="border rounded-lg w-full h-full p-6 space-y-6 overflow-y-scroll"
    >
      {/* -------- Documents & Payment Section -------- */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Measurement Document */}
        {pdfDocs.length > 0 && (
          <motion.div variants={itemVariants} className="md:w-[40%]">
            <div className="border rounded-xl overflow-hidden h-full">
              {/* Header */}
              <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <FileText size={20} />
                  <h1 className="text-base font-semibold">
                    Measurement Document
                  </h1>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {pdfDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="hover:shadow-xl transition-shadow duration-300 rounded-lg border border-gray-100 flex flex-col justify-center p-4 text-center"
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center">
                        <FileText size={50} className="text-red-500" />
                      </div>
                      <p className="font-medium text-sm truncate max-w-[120px]">
                        {formatFileName(doc.originalName)}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.signedUrl, "_blank")}
                          className="text-xs gap-1 h-7"
                        >
                          <Eye size={12} /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = doc.signedUrl;
                            link.download = doc.originalName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="text-xs gap-1 h-7"
                        >
                          <Download size={12} /> Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Information */}
        {payment && (
          <motion.div variants={itemVariants} className="md:flex-1">
            <div className="border rounded-xl overflow-hidden h-full">
              {/* Header */}
              <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Receipt size={20} />
                  <h1 className="text-base font-semibold">
                    Payment Information
                  </h1>
                </div>

                {(userType === "admin" ||
                  userType === "super-admin" ||
                  (userType === "sales-executive" &&
                    leadStatus === "initial-site-measurement")) && (
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

              {/* Content */}
              <div className="p-4">
                <div className="space-y-4">
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
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* -------- Current Site Photos -------- */}
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Images size={20} />
            <h1 className="text-base font-semibold">Current Site Photos</h1>
          </div>

          <Button variant="outline" size="sm">
            <RefreshCcw size={15} />
            Refresh
          </Button>
        </div>

        {/* Content */}
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
                canDelete={userType === "admin" || userType === "super-admin"}
                onView={(i) => {
                  setInitialImageIndex(i);
                  setIsCarouselOpen(true);
                }}
                onDelete={(id) => setConfirmDelete(Number(id))}
              />
            ))}

            {/* Add Button */}
            <div
              onClick={() => setOpenImageModal(true)}
              className="flex items-center justify-center w-32 max-h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-600">
                <Plus size={24} className="mb-1" />
                <span className="text-xs font-medium">Add Photos</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* -------- Payment Proofs -------- */}
      {paymentImages.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          {/* Header */}
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

          {/* Content */}
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