"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Ban, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useClientApprovalDetails,
  uploadMoreClientApprovalDocs,
} from "@/api/client-approval";
import { useAppSelector } from "@/redux/store";
import { useDeleteDocument } from "@/api/leads";
import { ImageComponent } from "@/components/utils/ImageCard";
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
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useMutation } from "@tanstack/react-query";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { toast } from "react-toastify";
import { canUploadClientApproval } from "@/components/utils/privileges";

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
  const { data: leadDetails } = useLeadById(leadId, vendorId, userId);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  console.log("Client Approval Data:", data);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // 🧩 Local State
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [openUploadMore, setOpenUploadMore] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  //🧩 Permissions
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && leadStatus === "client-approval-stage");
  const canUpload = canUploadClientApproval(userType);
  const accountId =
    leadDetails?.data?.lead?.account_id ||
    leadDetails?.data?.lead?.account?.id ||
    0;

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

  const uploadMoreMutation = useMutation({
    mutationFn: () =>
      uploadMoreClientApprovalDocs({
        leadId,
        accountId,
        vendorId: vendorId!,
        createdBy: userId!,
        documents: uploadFiles,
      }),
    onSuccess: () => {
      toast.success("Screenshots uploaded successfully");
      setUploadFiles([]);
      setOpenUploadMore(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to upload screenshots"
      );
    },
  });

  const handleUploadMore = () => {
    if (!vendorId || !userId || !accountId) {
      toast.error("Missing required identifiers");
      return;
    }
    if (uploadFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    uploadMoreMutation.mutate();
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
      className="rounded-lg w-full h-full py-4 space-y-6 bg-[#fff] dark:bg-[#0a0a0a]"
    >
      {/* -------- Payment Details Section -------- */}
      {paymentInfo && (
        <div
          className="
    bg-white dark:bg-neutral-900 
    rounded-2xl border border-border 
    overflow-hidden shadow-soft
  "
        >
          {/* Header */}
          <div
            className="
      flex flex-col md:flex-row md:items-center md:justify-between 
      px-5 py-3 gap-4 
      border-b border-border 
      bg-[#fff] dark:bg-[#0a0a0a]
    "
          >
            <div className="flex items-center gap-2">
              <Images size={20} />
              <h1 className="text-lg font-semibold tracking-tight">
                Client Payment Details
              </h1>
            </div>

            <div className="flex flex-wrap gap-8 items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground tracking-wide">
                  Amount Received
                </p>
                <p className="text-lg font-semibold text-primary">
                  ₹{formatCurrency(paymentInfo.amount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground tracking-wide">
                  Payment Date
                </p>
                <p className="text-lg font-semibold">
                  {formatDate(paymentInfo.payment_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 bg-[#fff] dark:bg-[#0a0a0a]">
            {/* Payment Proof */}
            {paymentFile && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground tracking-wide">
                  Payment Proof
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                </div>
              </div>
            )}

            {/* Remark */}
            {paymentInfo.payment_text && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground tracking-wide">
                  Remark
                </p>
                <div
                  className="
            bg-[#fff] dark:bg-[#0a0a0a]
            border border-border rounded-xl 
            p-4 text-sm leading-relaxed
          "
                >
                  {paymentInfo.payment_text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------- Approval Screenshots Section -------- */}
      <div
        className="
    bg-[#fff] dark:bg-[#0a0a0a]
    rounded-2xl border border-border 
    overflow-hidden shadow-soft
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
            <h1 className="text-lg font-semibold tracking-tight">
              Client Approval Screenshots
            </h1>
          </div>

          {canUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenUploadMore(true)}
              className="
          rounded-lg border-border 
          bg-[#fff] dark:bg-[#0a0a0a]
          dark:border-neutral-700
        "
            >
              Add More Screenshots
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {screenshots && screenshots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {screenshots.map((img: any, index: any) => (
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
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Images size={42} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No approval screenshots uploaded yet.
              </p>
              {canUpload && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setOpenUploadMore(true)}
                >
                  Add More Screenshots
                </Button>
              )}
            </div>
          )}
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

      {canUpload && accountId ? (
        <BaseModal
          open={openUploadMore}
          onOpenChange={(open) => {
            if (!open) {
              setOpenUploadMore(false);
              setUploadFiles([]);
            }
          }}
          title="Add Client Approval Screenshots"
          description="Upload additional client approval screenshots."
          size="md"
        >
          <div className="p-5 space-y-4">
            <FileUploadField
              value={uploadFiles}
              onChange={setUploadFiles}
              accept="image/*,.heic,.heif,.avif,.webp,.bmp,.tif,.tiff,.svg,.jfif"
              multiple
              maxFiles={10}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenUploadMore(false);
                  setUploadFiles([]);
                }}
                disabled={uploadMoreMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUploadMore}
                disabled={uploadMoreMutation.isPending}
              >
                {uploadMoreMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </BaseModal>
      ) : null}
    </motion.div>
  );
}
