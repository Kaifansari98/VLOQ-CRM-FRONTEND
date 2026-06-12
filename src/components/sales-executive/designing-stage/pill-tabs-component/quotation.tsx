"use client";

import React, { useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { Ban, Images, RefreshCcw, ScrollText } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ComingSoon from "@/components/generics/ComingSoon";

const getSortedLatestFirst = <T extends { created_at?: string; id: number }>(
  docs: T[],
) =>
  [...docs].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });

const QuotationTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // ✅ Hooks for status & document retrieval
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { data, error } = useQuotationDoc(vendorId, leadId);

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

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
  const designQuotationDocs = data?.data?.documents || [];
  const sortedQuotationDocs = getSortedLatestFirst(designQuotationDocs);

  // ✅ Delete confirmation handler

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
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.quotation.delete")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage");

  console.log("leads stage current: ", leadStatus);
  return (
    <div>
      {/* -------- Quotation Section (Matched UI) -------- */}
      <div
        
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
      flex flex-col sm:flex-row sm:items-center justify-between items-start gap-1 sm:gap-2
      px-5 py-3
      border-b border-border
      bg-[#fff] dark:bg-[#0a0a0a]
    "
        >
          <div className="flex items-center gap-2">
            <ScrollText size={20} className="shrink-0" />
            <h1 className="text-lg font-semibold tracking-tight">
              Quotation
            </h1>
          </div>
          <span className="text-xs font-medium text-muted-foreground shrink-0 text-right">
            {designQuotationDocs.length}{" "}
            {designQuotationDocs.length === 1 ? "Document" : "Documents"}
          </span>
        </div>

        {/* Body */}
        <div className="p-6">
          {sortedQuotationDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedQuotationDocs.map((doc: any, index: number) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    originalName: doc.doc_og_name,
                    created_at: doc.created_at,
                    signedUrl: doc.signedUrl,
                  }}
                  isLatest={index === 0}
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
      </div>

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
