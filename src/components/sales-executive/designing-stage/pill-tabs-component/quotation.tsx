"use client";

import React, { useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { Ban, Images, RefreshCcw } from "lucide-react";
import {
  useLeadStatus,
  useQuotationDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
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
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ComingSoon from "@/components/generics/ComingSoon";

const QuotationTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // ✅ Hooks for status & document retrieval
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { data, error, isLoading } = useQuotationDoc(vendorId, leadId);
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const designQuotationDocs = data?.data?.documents || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  // ✅ Delete confirmation handler
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

  // ✅ Show loader in full screen when loading
  if (isLoading) {
    return (
      <Loader fullScreen size={250} message="Loading Quotation Documents..." />
    );
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] bg-[#fff] dark:bg-[#0a0a0a]">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Ban size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading quotations. Please try again later.
        </p>
      </div>
    );
  }

  // ✅ Empty state
  if (!designQuotationDocs || designQuotationDocs.length === 0) {
    return (
      <ComingSoon
        heading="No Quotations Found"
        description="Quotation documents will appear here once they are added."
      />
    );
  }

  // ✅ Permission logic for delete
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && leadStatus === "designing-stage");

  return (
    <div>
      {/* -------- Quotation Section (Matched UI) -------- */}
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
          <div className="flex items-center gap-2">
            <Images size={20} />
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-1">
              Quotation
              <span className="text-xs font-medium text-muted-foreground">
                ({designQuotationDocs.length}{" "}
                {designQuotationDocs.length === 1 ? "Document" : "Documents"})
              </span>
            </h1>
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

        {/* Body */}
        <div className="p-6">
          {designQuotationDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {designQuotationDocs.map((doc: any) => (
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
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <Images size={42} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No quotation documents found.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* ✅ Delete confirmation modal */}
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
    </div>
  );
};

export default QuotationTab;
