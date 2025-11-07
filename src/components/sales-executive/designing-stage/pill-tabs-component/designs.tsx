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
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
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
      <div className="flex flex-col items-center justify-center h-[80vh] px-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Palette size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No Design Documents</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Design files will appear here once they are uploaded.
        </p>
      </div>
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
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Images size={20} />
            <h1 className="text-base font-semibold flex items-center gap-1">
              Designs
              <span className="text-xs font-medium text-muted-foreground">
                ({designDocs.length}{" "}
                {designDocs.length === 1 ? "Document" : "Documents"})
              </span>
            </h1>
          </div>

          <Button variant="outline" size="sm">
            <RefreshCcw size={15} />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4  gap-3">
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
      </div>

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
