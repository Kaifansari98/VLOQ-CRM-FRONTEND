"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useApprovedTechCheckDocuments } from "@/api/production/order-login";
import { useDeleteDocument } from "@/api/leads";

import SectionHeader from "@/utils/sectionHeader";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { Ban } from "lucide-react";
import { getFileExtension, isImageExt } from "@/components/utils/filehelper";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ApprovedDocsSectionProps {
  leadId: number;
  instanceId?: number | null;
}

export default function ApprovedDocsSection({
  leadId,
  instanceId,
}: ApprovedDocsSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  // ✅ Fetch approved docs
  const { data, isLoading, isError } = useApprovedTechCheckDocuments(
    vendorId,
    leadId
  );
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  const getDocName = (file: any) =>
    file?.doc_og_name ||
    file?.original_name ||
    file?.doc_sys_name ||
    file?.doc_name ||
    "";

  const scopedDocs =
    instanceId != null
      ? (data || []).filter(
          (file: any) => file?.product_structure_instance_id === instanceId
        )
      : data || [];

  const { approvedImages, approvedDocuments } = useMemo(() => {
    const images: any[] = [];
    const documents: any[] = [];

    scopedDocs.forEach((file: any) => {
      const name = getDocName(file);
      const ext = getFileExtension(name);
      if (isImageExt(ext)) {
        images.push(file);
      } else {
        documents.push(file);
      }
    });

    return { approvedImages: images, approvedDocuments: documents };
  }, [scopedDocs]);

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

  const canDelete = userType === "admin" || userType === "super-admin";

  // ✅ UI States
  if (isLoading) {
    return (
      <div className="border rounded-lg bg-background p-6 flex justify-center">
        <p className="text-muted-foreground text-sm animate-pulse">
          Loading approved documents...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border rounded-lg bg-background p-6 flex justify-center">
        <p className="text-red-500 text-sm">
          Failed to load approved documents.
        </p>
      </div>
    );
  }

  const totalDocs = approvedImages.length + approvedDocuments.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-background overflow-hidden shadow-sm"
    >
      {/* 🌟 Empty State */}
      {totalDocs === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] px-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Ban size={32} className="text-muted-foreground" />
          </div>

          <h3 className="font-semibold text-lg text-foreground mb-1">
            No Approved Documents Found
          </h3>

          <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed">
            Once documents are approved, you can preview or download them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 🌟 Approved Images */}
          {approvedImages.length > 0 && (
            <div className="border rounded-xl overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
              <SectionHeader
                title="Approved Images"
                docCount={approvedImages.length}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {approvedImages.map((doc: any, index: number) => (
                  <ImageComponent
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      doc_og_name: getDocName(doc),
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    index={index}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 🌟 Approved File Documents */}
          {approvedDocuments.length > 0 && (
            <div className="border rounded-xl overflow-hidden bg-[#fff] dark:bg-[#0a0a0a]">
              <SectionHeader
                title="Approved Files"
                docCount={approvedDocuments.length}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {approvedDocuments.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: getDocName(doc),
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🌟 Delete Confirmation Modal */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently removed.
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
