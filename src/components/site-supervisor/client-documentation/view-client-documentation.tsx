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
import { useSelectionData } from "@/hooks/designing-stage/designing-leads-hooks";
import SelectionsTabForClientDocs from "@/components/sales-executive/designing-stage/pill-tabs-component/SelectionsTabForClientDocs";

type Props = {
  leadId: number;
  accountId: number;
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const DOC_EXTENSIONS = ["ppt", "pptx", "pdf", "doc", "docx"];

const getFileExtension = (filename: string): string =>
  filename?.split(".").pop()?.toLowerCase() ?? "";

export default function ClientDocumentationDetails({
  leadId,
  accountId,
}: Props) {
  // 🧩 Redux data
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const rawUserType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const userType = rawUserType?.toLowerCase() ?? "";
  const userId = useAppSelector((state) => state.auth.user?.id);


  // 🧩 API hooks
  const { data: leadDetails, isLoading } = useClientDocumentationDetails(
    vendorId!,
    leadId,
    userId!
  );

  const { data: selectionsData } = useSelectionData(vendorId!, leadId);

  const selections = {
    carcas: selectionsData?.data?.find((s: any) => s.type === "Carcas")?.desc,
    shutter: selectionsData?.data?.find((s: any) => s.type === "Shutter")?.desc,
    handles: selectionsData?.data?.find((s: any) => s.type === "Handles")?.desc,
  };

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

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
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "super admin";
  const canEditSelections =
    userType === "admin" ||
    userType === "super-admin" ||
    userType === "super admin";

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
      className="w-full h-full py-4 space-y-4 overflow-y-auto bg-[#fff] dark:bg-[#0a0a0a]"
    >
      {/* -------- Section Header: Client Documentation -------- */}
      <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between gap-2">
        {/* Left */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Client Documentation
          </h1>
          <p className="text-sm text-muted-foreground">
            All uploaded project + design files related to this lead.
          </p>
        </div>

        {/* Right */}
        {canUploadMoreClientDocumentationFiles(userType) && (
          <Button
            onClick={() => setAddMoreDoc(true)}
            className="flex items-center gap-2 rounded-lg"
          >
            <Plus size={16} />
            Add More Files
          </Button>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* -------- Client Documentation — Project Files -------- */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={itemVariants}
        className="
      bg-white dark:bg-neutral-900
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
      >
        <SectionHeader
          title="Client Documentation — Project Files"
          icon={<Images size={20} />}
          onRefresh={() => console.log("Refresh Project Files")}
        />

        <div className="p-6 space-y-0 bg-[#fff] dark:bg-[#0a0a0a]">
          {/* -------- Images -------- */}
          <div className="space-y-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {imageDocs.length > 0 && (
                imageDocs.map((img, index) => (
                  <ImageComponent
                    key={img.id}
                    doc={{
                      id: img.id,
                      doc_og_name: img.doc_og_name,
                      signedUrl: img.signed_url,
                      created_at: img.created_at,
                    }}
                    index={index}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))
              )}
            </div>
          </div>

          {/* -------- Documents -------- */}
          {documentDocs.length > 0 && (
            <div className="space-y-3 bg-[#fff] dark:bg-[#0a0a0a]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {documentDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.doc_og_name,
                      created_at: doc.created_at,
                      signedUrl: doc.signed_url,
                    }}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ---------------------------------------------------------- */}
      {/* -------- Client Documentation — Design Files -------- */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={itemVariants}
        className="
      bg-white dark:bg-neutral-900
      rounded-2xl 
      border border-border 
      overflow-hidden
    "
      >
        <SectionHeader
          title="Client Documentation — Pytha Design Files"
          icon={<FileText size={20} />}
          onRefresh={() => console.log("Refresh Design Files")}
        />

        <div className="p-6 bg-[#fff] dark:bg-[#0a0a0a]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pythaDocs.length > 0 ? (
              pythaDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    originalName: doc.doc_og_name,
                    created_at: doc.created_at,
                    signedUrl: doc.signed_url,
                  }}
                  canDelete={canDelete}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))
            ) : (
              <div className="px-4 py-10 border border-dashed border-border/60 rounded-xl bg-mutedBg/40 dark:bg-neutral-800/40 text-center">
                <FileText
                  size={40}
                  className="text-muted-foreground mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  No design files uploaded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ---------------------------------------------------------- */}
      {/* -------- Design Selections -------- */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={itemVariants}
        className="
    bg-white dark:bg-neutral-900
    rounded-2xl 
    border border-border 
    overflow-hidden
  "
      >
        <SectionHeader
          title="Design Selections"
          icon={<FileText size={20} />}
        />

        {canEditSelections ? (
          <div className="p-0 bg-[#fff] dark:bg-[#0a0a0a]">
            <SelectionsTabForClientDocs leadId={leadId} accountId={accountId} />
          </div>
        ) : (
          <div className="p-6 bg-[#fff] dark:bg-[#0a0a0a]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Carcas */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Carcas</p>
                <div className="p-3 rounded-lg border bg-mutedBg/40 dark:bg-neutral-800/40 text-sm">
                  {selections.carcas && selections.carcas !== "NULL"
                    ? selections.carcas
                    : "—"}
                </div>
              </div>

              {/* Shutter */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Shutter</p>
                <div className="p-3 rounded-lg border bg-mutedBg/40 dark:bg-neutral-800/40 text-sm">
                  {selections.shutter && selections.shutter !== "NULL"
                    ? selections.shutter
                    : "—"}
                </div>
              </div>

              {/* Handles */}
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Handles</p>
                <div className="p-3 rounded-lg border bg-mutedBg/40 dark:bg-neutral-800/40 text-sm">
                  {selections.handles && selections.handles !== "NULL"
                    ? selections.handles
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {/* -------- Modals -------- */}
      <UploadMoreClientDocumentationModal
        open={addMoreDoc}
        onOpenChange={setAddMoreDoc}
        data={{ leadId, accountId }}
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
