"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Ban, Images, Plus } from "lucide-react";
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
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LeadProductStructureInstance } from "@/api/leads";

interface ClientApprovalViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  accountId: number;
  instance: LeadProductStructureInstance;
}

export const ClientApprovalViewModal: React.FC<ClientApprovalViewModalProps> = ({
  open,
  onOpenChange,
  leadId,
  accountId,
  instance,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes
  );

  const productTypeId =
    instance.product_type_id || (instance as any).product_type?.id;
  const instanceId = instance.id;

  const instanceTitle =
    (instance as any).product_type?.name ||
    instance.productType?.type ||
    instance.title ||
    "Item Group";

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useClientApprovalDetails(
    vendorId!,
    leadId,
    productTypeId
  );

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [openUploadMore, setOpenUploadMore] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Filtering docs for this productTypeId
  const screenshots = React.useMemo(() => {
    if (!data?.screenshots || !productTypeId) return [];
    return data.screenshots.filter(
      (img: any) => Number(img.product_type_id) === Number(productTypeId)
    );
  }, [data?.screenshots, productTypeId]);

  const paymentInfo = React.useMemo(() => {
    if (!data?.paymentInfo || !productTypeId) return null;
    if (Number(data.paymentInfo.product_type_id) === Number(productTypeId)) {
      return data.paymentInfo;
    }
    return null;
  }, [data?.paymentInfo, productTypeId]);

  const paymentFile = data?.paymentFile;

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument(
        {
          vendorId: vendorId!,
          documentId: confirmDelete,
          deleted_by: userId!,
        },
        {
          onSuccess: () => {
            refetch();
            queryClient.invalidateQueries({
              queryKey: ["clientApprovalDetails", vendorId, leadId],
            });
            setConfirmDelete(null);
          },
        }
      );
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
    mutationFn: async () => {
      return uploadMoreClientApprovalDocs({
        leadId,
        accountId,
        vendorId: vendorId!,
        createdBy: userId!,
        productTypeId: productTypeId,
        documents: uploadFiles,
      });
    },
    onSuccess: () => {
      toastManager.add({
        title: "Screenshots uploaded successfully",
        type: "success",
      });
      setUploadFiles([]);
      setOpenUploadMore(false);
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["clientApprovalDetails", vendorId, leadId],
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to upload screenshots",
        type: "error",
      });
    },
  });

  const handleUploadMore = () => {
    if (!vendorId || !userId || !accountId) {
      toastManager.add({
        title: "Missing required identifiers",
        type: "error",
      });
      return;
    }
    if (uploadFiles.length === 0) {
      toastManager.add({ title: "Please select at least one file", type: "error" });
      return;
    }
    uploadMoreMutation.mutate();
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Client Approval Details - ${instanceTitle}`}
      description={`View and manage approval documents for ${instanceTitle}.`}
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader size={120} message="Loading approval details..." />
          </div>
        ) : isError || !data ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-3">
              <Ban className="w-12 h-12 mx-auto text-destructive" />
              <p className="text-sm text-destructive font-medium">
                Failed to load client approval details for {instanceTitle}.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* -------- Payment Details Section -------- */}
            {paymentInfo && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border overflow-hidden shadow-soft">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between px-5 py-3 gap-4 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
                  <div className="flex items-center gap-2">
                    <Images size={20} />
                    <h3 className="text-base font-semibold tracking-tight">
                      Client Payment Details
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-8 items-center">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground tracking-wide">
                        Amount Received
                      </p>
                      <p className="text-base font-semibold text-primary">
                        ₹{formatCurrency(paymentInfo.amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground tracking-wide">
                        Payment Date
                      </p>
                      <p className="text-base font-semibold">
                        {formatDate(paymentInfo.payment_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 bg-[#fff] dark:bg-[#0a0a0a]">
                  {paymentFile && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground tracking-wide">
                        Payment Proof
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          canDelete={true}
                          onDelete={(id) => setConfirmDelete(Number(id))}
                        />
                      </div>
                    </div>
                  )}

                  {paymentInfo.payment_text && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground tracking-wide">
                        Remark
                      </p>
                      <div className="bg-[#fff] dark:bg-[#0a0a0a] border border-border rounded-xl p-4 text-sm leading-relaxed">
                        {paymentInfo.payment_text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------- Approval Screenshots Section -------- */}
            <div className="bg-[#fff] dark:bg-[#0a0a0a] rounded-2xl border border-border overflow-hidden shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 gap-4 border-b border-border bg-[#fff] dark:bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <FileText size={20} />
                  <h3 className="text-base font-semibold tracking-tight">
                    Client Approval Screenshots
                  </h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenUploadMore(true)}
                  className="rounded-lg border-border bg-[#fff] dark:bg-[#0a0a0a] dark:border-neutral-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add More Screenshots
                </Button>
              </div>

              <div className="p-6">
                {screenshots && screenshots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {screenshots.map((img: any, index: number) => (
                      <ImageComponent
                        key={img.id}
                        doc={{
                          id: img.id,
                          doc_og_name:
                            img.doc_original_name ||
                            img.doc_og_name ||
                            "Screenshot",
                          signedUrl: img.signedUrl || img.doc_sys_name,
                          created_at: img.created_at,
                        }}
                        index={index}
                        canDelete={true}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Images size={42} className="text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No approval screenshots uploaded for {instanceTitle} yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setOpenUploadMore(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add More Screenshots
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected file will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload More Modal */}
      {openUploadMore && (
        <BaseModal
          open={openUploadMore}
          onOpenChange={(open) => {
            if (!open) {
              setOpenUploadMore(false);
              setUploadFiles([]);
            }
          }}
          title={`Add Client Approval Screenshots (${instanceTitle})`}
          description={`Upload additional approval screenshots for ${instanceTitle}.`}
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
      )}
    </BaseModal>
  );
};

export default ClientApprovalViewModal;
