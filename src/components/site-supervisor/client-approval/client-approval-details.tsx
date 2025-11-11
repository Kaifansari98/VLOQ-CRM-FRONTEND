"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, FileText, Ban, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientApprovalDetails } from "@/api/client-approval";
import { useAppSelector } from "@/redux/store";
import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import Loader from "@/components/utils/loader";
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

interface Props {
  leadId: number;
}

export default function ClientApprovalDetails({ leadId }: Props) {
  // 🧩 Redux User Info
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  // 🧩 Hooks
  const { data, isLoading, isError, refetch } = useClientApprovalDetails(
    vendorId,
    leadId
  );
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // 🧩 Local State
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  // 🧩 Permissions
  const canDelete = userType === "admin" || userType === "super-admin";

  // 🧩 Handlers
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return "N/A";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN").format(numAmount);
  };

  // 🧩 Loading & Error UI
  if (isLoading)
    return (
      <Loader
        fullScreen
        size={250}
        message="Loading Client Approval Details..."
      />
    );

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Ban className="w-12 h-12 mx-auto text-destructive" />
          <p className="text-sm text-destructive font-medium">
            Failed to load client approval details.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { screenshots, paymentInfo, paymentFile } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border rounded-lg w-full h-full p-6 space-y-6 overflow-y-scroll"
    >
      {/* -------- Payment Details Section -------- */}
      {paymentInfo && (
        <div className="border rounded-xl overflow-hidden">
          {/* Header with amount + date inline */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted px-4 py-2 border-b gap-3">
            <div className="flex items-center gap-2">
              <Images size={20} />
              <h1 className="text-base font-semibold">
                Client Payment Details
              </h1>
            </div>

            <div className="flex flex-wrap gap-6 md:gap-8 items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Amount Received
                </p>
                <p className="text-lg font-semibold text-primary">
                  ₹{formatCurrency(paymentInfo.amount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Payment Date
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(paymentInfo.payment_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Content below */}
          <div className="p-4 space-y-6">
            {/* Payment Proof */}
            {paymentFile && (
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Payment Proof
                </p>
                
                  <ImageComponent
                    doc={{
                      id: paymentFile.id,
                      doc_og_name:
                        paymentFile.doc_original_name ||
                        paymentFile.doc_og_name ||
                        "Payment Proof",
                      signedUrl:
                        paymentFile.signedUrl || paymentFile.doc_sys_name,
                      created_at: paymentFile.created_at,
                    }}
                    index={0}
                    canDelete={canDelete}
                    onView={() => {
                      setInitialIndex(0);
                      setIsCarouselOpen(true);
                    }}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                
              </div>
            )}

            {/* Remark Section */}
            {paymentInfo.payment_text && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Remark
                </p>
                <div className="bg-muted border rounded-md p-3 text-sm leading-relaxed">
                  {paymentInfo.payment_text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------- Approval Screenshots Section -------- */}
      {screenshots && screenshots.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <h1 className="text-base font-semibold">
                Client Approval Screenshots
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 gap-3">
            {screenshots.map((img: any, index: number) => (
              <ImageComponent
                key={img.id}
                doc={{
                  id: img.id,
                  doc_og_name:
                    img.doc_original_name || img.doc_og_name || "Screenshot",
                  signedUrl: img.signedUrl || img.doc_sys_name,
                  created_at: img.created_at,
                }}
                index={index}
                canDelete={canDelete}
                onView={(i) => {
                  setInitialIndex(i);
                  setIsCarouselOpen(true);
                }}
                onDelete={(id) => setConfirmDelete(Number(id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* -------- Image Carousel -------- */}
      <ImageCarouselModal
        open={isCarouselOpen}
        initialIndex={initialIndex}
        onClose={() => setIsCarouselOpen(false)}
        images={
          paymentFile
            ? [
                {
                  id: paymentFile.id,
                  signed_url: paymentFile.signedUrl || paymentFile.doc_sys_name,
                  doc_og_name:
                    paymentFile.doc_original_name || paymentFile.doc_og_name,
                },
                ...screenshots.map((s: any) => ({
                  id: s.id,
                  signed_url: s.signedUrl || s.doc_sys_name,
                  doc_og_name:
                    s.doc_original_name || s.doc_og_name || "Screenshot",
                })),
              ]
            : screenshots.map((s: any) => ({
                id: s.id,
                signed_url: s.signedUrl || s.doc_sys_name,
                doc_og_name:
                  s.doc_original_name || s.doc_og_name || "Screenshot",
              }))
        }
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
  );
}
