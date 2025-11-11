"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { Plus, FileText, Images } from "lucide-react";
import SectionHeader from "@/utils/sectionHeader";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import UploadMoreClientDocumentationModal from "./uploadmore-client-documentaition-modal";
import { canUploadMoreClientDocumentationFiles } from "@/components/utils/privileges";
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
import { useDeleteDocument } from "@/api/leads";

type Props = {
  leadId: number;
  accountId: number;
  name?: string;
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const DOC_EXTENSIONS = ["ppt", "pptx", "pdf", "doc", "docx"];

const getFileExtension = (filename: string): string =>
  filename?.split(".").pop()?.toLowerCase() ?? "";

export default function ClientDocumentationDetails({
  leadId,
  accountId,
  name,
}: Props) {
  // 🧩 Redux data
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // 🧩 API hooks
  const { data: leadDetails, isLoading } = useClientDocumentationDetails(
    vendorId!,
    leadId
  );

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  // 🧩 Local states
  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [addMoreDoc, setAddMoreDoc] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  if (isLoading)
    return (
      <Loader fullScreen size={250} message="Loading Client Documentation..." />
    );

  const pptDocs = leadDetails?.documents?.ppt || [];
  const pythaDocs = leadDetails?.documents?.pytha || [];

  // 🧩 File segregation logic
  const imageDocs = pptDocs.filter((doc) =>
    IMAGE_EXTENSIONS.includes(getFileExtension(doc.doc_sys_name))
  );
  const documentDocs = pptDocs.filter((doc) =>
    DOC_EXTENSIONS.includes(getFileExtension(doc.doc_sys_name))
  );

  // 🧩 Permissions
  const canDelete = userType === "admin" || userType === "super-admin";

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

  // 🧩 Animations
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="border rounded-lg w-full h-full p-6 space-y-8 overflow-y-auto"
    >
      {/* -------- Add More Button -------- */}
      <motion.div variants={itemVariants} className="flex justify-between">
        {canUploadMoreClientDocumentationFiles(userType) && (
          <Button
            onClick={() => setAddMoreDoc(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add More Files
          </Button>
        )}
      </motion.div>

      {/* -------- Client Documentation - Project Files -------- */}
      <motion.div
        variants={itemVariants}
        className="border rounded-xl overflow-hidden"
      >
        <SectionHeader
          title="Client Documentation - Project Files"
          icon={<Images size={20} />}
          onRefresh={() => console.log("Refresh Project Files")}
        />

        <div className="p-4 space-y-6">
          {/* Image Section */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Project Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageDocs.length > 0 ? (
                imageDocs.map((img, idx) => (
                  <ImageComponent
                    key={img.id}
                    doc={{
                      id: img.id,
                      doc_og_name: img.doc_og_name,
                      signedUrl: img.signed_url,
                      created_at: img.created_at,
                    }}
                    index={idx}
                    
                    
                    canDelete={canDelete}
                    onView={(i) => {
                      setStartIndex(i);
                      setOpenCarouselModal(true);
                    }}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No project images uploaded yet.
                </p>
              )}
            </div>
          </div>

          {/* Document Section */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">
              Project Documents (PPT, PDF, DOCX)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documentDocs.length > 0 ? (
                documentDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.doc_og_name,
                      signedUrl: doc.signed_url,
                      created_at: doc.created_at,
                    }}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No project documents uploaded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* -------- Client Documentation - Design Files -------- */}
      <motion.div
        variants={itemVariants}
        className="border rounded-xl overflow-hidden"
      >
        <SectionHeader
          title="Client Documentation - Design Files"
          icon={<FileText size={20} />}
          onRefresh={() => console.log("Refresh Design Files")}
        />

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pythaDocs.length > 0 ? (
              pythaDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    originalName: doc.doc_og_name,
                    signedUrl: doc.signed_url,
                    created_at: doc.created_at,
                  }}
                  canDelete={canDelete}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No design files uploaded yet.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* -------- Modals -------- */}
      <UploadMoreClientDocumentationModal
        open={addMoreDoc}
        onOpenChange={setAddMoreDoc}
        data={{ leadId, accountId }}
      />

      <ImageCarouselModal
        open={openCarouselModal}
        initialIndex={startIndex}
        onClose={() => setOpenCarouselModal(false)}
        images={imageDocs.map((photo) => ({
          id: photo.id,
          signed_url: photo.signed_url,
          doc_og_name: photo.doc_og_name,
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
    </motion.div>
  );
}
