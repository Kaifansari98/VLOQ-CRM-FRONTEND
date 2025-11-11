"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useBookingLeadById } from "@/hooks/booking-stage/use-booking";
import { useAppSelector } from "@/redux/store";
import {
  User,
  IndianRupee,
  CreditCard,
  Plus,
  Images,
  RefreshCcw,
  Ban,
} from "lucide-react";
import { DocumentBooking } from "@/types/booking-types";
import UploadFinalDoc from "./add-final-doc";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import DocumentCard from "@/components/utils/documentCard";
import { Button } from "@/components/ui/button";
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
import { ImageComponent } from "@/components/utils/ImageCard";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import Loader from "@/components/utils/loader";
import SectionHeader from "@/utils/sectionHeader";
import { canUploadOrDeleteBookingDone } from "@/components/utils/privileges";

interface Props {
  leadId: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const BookingLeadsDetails: React.FC<Props> = ({ leadId }) => {
  // 🧩 Redux state
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  // 🧩 States
  const [openFinalDocModal, setOpenFinalDocModal] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  // 🧩 API Hooks
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const {
    data: leadData,
    isLoading,
    isError,
  } = useBookingLeadById(vendorId, leadId);
  const { data, isLoading: loading } = useLeadById(leadId, vendorId, userId);
  const { data: leadStatus, error } = useLeadStatus(leadId, vendorId);

  if (isLoading || loading)
    return <Loader size={250} message="Loading Booking Lead Details..." />;

  const lead = data?.data?.lead;
  const accountId = Number(lead?.account_id);

  const finalDocs =
    leadData?.documents?.filter((doc) =>
      doc.s3Key.includes("final-documents-booking")
    ) || [];

  const bookingPaymentDocs =
    leadData?.documents?.filter((doc) =>
      doc.s3Key.includes("booking-amount-payment-details")
    ) || [];

  const status = leadStatus?.status;
  // 🧩 Permissions
  console.log("userType: ", userType);
  console.log("status: ", status);
  const canDelete = canUploadOrDeleteBookingDone(userType, status);
  console.log("CandDelete or upload: ", canDelete);

  // 🧩 Delete handler
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

  // 🧩 Error Handling
  if (isError || error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading booking details. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="border rounded-lg w-full h-full overflow-y-scroll"
      >
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* -------- Top Summary Cards -------- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Site Supervisor */}
              <Card className="py-4 relative overflow-hidden border-l-4 border-l-green-500">
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Site Supervisor</p>
                      <p className="text-lg font-bold">
                        {leadData?.supervisors?.[0]?.userName || "Not Assigned"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Amount Received */}
              <Card className="py-4 relative overflow-hidden border-l-4 border-l-blue-500">
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Booking Amount Received
                      </p>
                      <p className="text-lg font-bold">
                        ₹
                        {leadData?.payments?.[0]?.amount?.toLocaleString(
                          "en-IN"
                        ) || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Booking Value */}
              <Card className="py-4 relative overflow-hidden border-l-4 border-l-purple-500">
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Booking Value</p>
                      <p className="text-lg font-bold">
                        ₹
                        {leadData?.finalBookingAmount?.toLocaleString(
                          "en-IN"
                        ) || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* -------- Design Remarks -------- */}
            <div className="space-y-2 mb-4">
              <h1 className="text-sm font-medium">Design Remarks</h1>
              <div className="bg-muted border rounded-sm py-1 px-2 text-sm max-h-200 overflow-y-auto">
                {leadData?.payments?.[0].text || "N/A"}
              </div>
            </div>

            {/* -------- Booking Documents Section -------- */}
            <div className="space-y-4 mb-2">
              <div className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Images size={20} />
                    <h1 className="text-base font-semibold">
                      Booking Documents (Quotations + Design)
                    </h1>
                  </div>

                  <Button variant="outline" size="sm">
                    <RefreshCcw size={15} />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                  {finalDocs.map((doc: DocumentBooking) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      canDelete={canDelete}
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  ))}

                  {/* Add Button */}
                  {canDelete && (
                    <div
                      className="flex items-center justify-center min-h-[105px] w-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setOpenFinalDocModal(true)}
                    >
                      <div className="flex flex-col items-center text-gray-400">
                        <Plus size={40} />
                        <span className="text-xs mt-1">Add File</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* -------- Payment Images Section -------- */}
              <div className="border rounded-xl overflow-hidden">
                <SectionHeader
                  title="Booking Payment Proofs"
                  icon={<Images size={20} />}
                />
                <motion.div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bookingPaymentDocs.length > 0 ? (
                      bookingPaymentDocs.map((doc, index) => (
                        <ImageComponent
                          key={doc.id}
                          doc={{
                            id: doc.id,
                            doc_og_name: doc.originalName,
                            signedUrl: doc.signedUrl,
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
                      <div className="flex flex-col items-center justify-center py-8">
                        <Images
                          size={40}
                          className="text-muted-foreground mb-3"
                        />
                        <p className="text-sm text-muted-foreground">
                          No payment proofs uploaded yet.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* -------- Upload Modal -------- */}
        <UploadFinalDoc
          open={openFinalDocModal}
          onOpenChange={setOpenFinalDocModal}
          leadId={leadId}
          accountId={accountId}
        />

        {/* -------- Image Carousel -------- */}
        <ImageCarouselModal
          open={isCarouselOpen}
          initialIndex={initialImageIndex}
          onClose={() => setIsCarouselOpen(false)}
          images={bookingPaymentDocs.map((photo) => ({
            id: photo.id,
            signed_url: photo.signedUrl,
            doc_og_name: photo.originalName,
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
    </>
  );
};

export default BookingLeadsDetails;
