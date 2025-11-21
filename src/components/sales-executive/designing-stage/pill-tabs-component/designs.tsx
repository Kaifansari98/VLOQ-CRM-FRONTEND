"use client";

import React, { useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { Palette, Ban, Images, RefreshCcw } from "lucide-react";
import {
  useLeadStatus,
  useDesignsDoc,
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

const DesigningTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // ✅ Fetch lead status
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  // ✅ Fetch design documents
  const { data, error, isLoading } = useDesignsDoc(vendorId!, leadId);
  const designDocs = data?.data?.documents || [];

  // ✅ Delete document mutation
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

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

  // ✅ Handle confirm delete
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

  // ✅ Loader (full screen)
  if (isLoading) {
    return <Loader size={250} message="Loading Design Documents..." />;
  }

  // ✅ Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4">
        <div className="w-16 h-16 bg-[#fff] dark:bg-[#0a0a0a] rounded-full flex items-center justify-center mb-4">
          <Palette size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading design documents. Please try again later.
        </p>
      </div>
    );
  }

  // ✅ Empty State
  if (!designDocs || designDocs.length === 0) {
    return (
      <ComingSoon
        heading="No Design Documents"
        description="Design files will appear here once they are uploaded."
      />
    );
  }

  // ✅ Permission Logic (same as QuotationTab)
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && leadStatus === "designing-stage");

  // ✅ Render Design Documents using DocumentCard
  return (
    <div className="">
      {/* -------- Designs Section (Matched Premium UI) -------- */}
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
              Designs
              <span className="text-xs font-medium text-muted-foreground">
                ({designDocs.length}{" "}
                {designDocs.length === 1 ? "Document" : "Documents"})
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
          {designDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {designDocs.map((doc: any) => (
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
            <div className="flex flex-col items-center justify-center py-12">
              <Images size={42} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No design documents found.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* ✅ Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected design document will be
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

export default DesigningTab;
