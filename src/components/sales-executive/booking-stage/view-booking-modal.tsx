"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import Loader from "@/components/utils/loader";
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

  const canDelete = canUploadOrDeleteBookingDone(userType, status);

  console.log("Lead Status: ", status);

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
        className="border rounded-lg w-full h-full overflow-y-scroll bg-[#fff] dark:bg-[#0a0a0a]"
      >
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* -------- Top Summary Cards -------- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Site Supervisor */}
              <div
                className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center gap-4
    transition-all duration-200 
    hover:ring-1 hover:ring-primary/30
  "
              >
                {/* Icon Container */}
                <div
                  className="
      w-12 h-12 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a]
      text-gray-600 dark:text-gray-400
    "
                >
                  <User className="w-6 h-6" />
                </div>

                {/* Text */}
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Site Supervisor
                  </p>

                  <p className="text-xl font-semibold tracking-tight text-heading dark:text-neutral-100">
                    {leadData?.supervisors?.[0]?.userName || "Not Assigned"}
                  </p>
                </div>
              </div>

              {/* Total Booking Value */}
              <div
                className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center gap-4
    transition-all duration-200 
    hover:ring-1 hover:ring-primary/30
  "
              >
                <div
                  className="
      w-12 h-12 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a]
      text-gray-600 dark:text-gray-400
    "
                >
                  <CreditCard className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Booking Value
                  </p>

                  <p className="text-xl font-semibold tracking-tight text-heading dark:text-neutral-100">
                    ₹
                    {leadData?.finalBookingAmount?.toLocaleString("en-IN") ||
                      "0"}
                  </p>
                </div>
              </div>

              {/* Amount Received */}
              <div
                className="
    bg-white dark:bg-neutral-900
    border border-border rounded-2xl 
    p-5 flex items-center gap-4
    transition-all duration-200 
    hover:ring-1 hover:ring-primary/30
  "
              >
                <div
                  className="
      w-12 h-12 rounded-xl flex items-center justify-center
      bg-[#fff] dark:bg-[#0a0a0a]
      text-gray-600 dark:text-gray-400
    "
                >
                  <IndianRupee className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Booking Amount Received
                  </p>

                  <p className="text-xl font-semibold tracking-tight text-heading dark:text-neutral-100">
                    ₹
                    {leadData?.payments?.[0]?.amount?.toLocaleString("en-IN") ||
                      "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* -------- Design Remarks -------- */}
            <div className="space-y-3 mb-6">
              <h2 className="text-sm font-semibold tracking-tight">
                Design Remarks
              </h2>

              <div
                className="
      bg-[#fff] dark:bg-[#0a0a0a] 
      border border-border 
      rounded-xl 
      p-4 
      text-sm leading-relaxed 
      max-h-[250px] overflow-y-auto
    "
              >
                {leadData?.payments?.[0].text || "N/A"}
              </div>
            </div>

            {/* -------- Booking Documents Section -------- */}
            <div className="space-y-6 mb-6">
              {/* ----- Booking Documents Card ----- */}
              <div
                className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl 
      border border-border 
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
                    <Images size={20} className="text-muted-foreground" />
                    <h1 className="text-base font-semibold tracking-tight">
                      Booking Documents (Quotations + Design)
                    </h1>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="
          rounded-lg 
          border-border 
          hover:bg-mutedBg dark:hover:bg-neutral-800 
          transition
        "
                  >
                    <RefreshCcw size={15} />
                    Refresh
                  </Button>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finalDocs.map((doc: DocumentBooking) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        canDelete={canDelete}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    ))}

                    {/* Add File Button */}
                    {canDelete && (
                      <div
                        onClick={() => setOpenFinalDocModal(true)}
                        className="
              flex flex-col items-center justify-center 
              min-h-[120px]
              border-2 border-dashed border-border/70 
              rounded-xl 
              cursor-pointer 
              hover:bg-mutedBg/40 dark:hover:bg-neutral-800/40 
              transition-all
            "
                      >
                        <Plus
                          size={28}
                          className="text-muted-foreground mb-1"
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          Add File
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ----- Payment Proofs Card ----- */}
              <div
                className="
      bg-[#fff] dark:bg-[#0a0a0a]
      rounded-2xl 
      border border-border 
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
                    <Images size={20} className="text-muted-foreground" />
                    <h1 className="text-base font-semibold tracking-tight">
                      Booking Payment Proofs
                    </h1>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="
          rounded-lg 
          border-border 
          hover:bg-mutedBg dark:hover:bg-neutral-800 
          transition
        "
                  >
                    <RefreshCcw size={15} />
                    Refresh
                  </Button>
                </div>

                {/* Body */}
                <div className="p-5">
                  {bookingPaymentDocs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookingPaymentDocs.map((doc, index) => (
                        <ImageComponent
                          key={doc.id}
                          doc={{
                            id: doc.id,
                            doc_og_name: doc.originalName,
                            signedUrl: doc.signedUrl,
                          }}
                          index={index}
                          canDelete={canDelete}
                          onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="
            flex flex-col items-center justify-center 
            py-12 
            text-center
          "
                    >
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
