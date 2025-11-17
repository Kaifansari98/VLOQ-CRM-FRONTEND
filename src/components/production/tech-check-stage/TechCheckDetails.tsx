"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import {
  FileText,
  Image as ImageIcon,
  File,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCcw,
  Ban,
  ClipboardList,
  Layers3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { useDeleteDocument } from "@/api/leads";
import { Button } from "@/components/ui/button";
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
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";
type Props = {
  leadId: number;
  accountId: number;
  name?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function TechCheckDetails({ leadId, accountId, name }: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)!;
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // ✅ Hooks
  const { data: clientDocs } = useClientDocumentationDetails(vendorId, leadId);
  const { data: siteMeasurement } = useSiteMeasurementLeadById(leadId);
  const { data: finalMeasurement } = useFinalMeasurementLeadById(
    vendorId,
    leadId
  );

  console.log("Client Documentation: ", clientDocs);
  const { data, isLoading } = useClientRequiredCompletionDate(vendorId, leadId);

  // ✅ State for image preview
  const [openCarousel, setOpenCarousel] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const pptDocs = clientDocs?.documents?.ppt ?? [];
  const pythaDocs = clientDocs?.documents?.pytha ?? [];
  const allDocs = [...pptDocs, ...pythaDocs];

  // ✅ Delete mutation
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const ismDocs = siteMeasurement?.initial_site_measurement_documents ?? [];
  const finalDocs = finalMeasurement?.measurementDocs ?? [];

  // new work for TechCheckDetails
  // For PPT array

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const documentExtensions = [
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "zip",
    "pyo",
  ];

  const pptImages = pptDocs.filter((file) => {
    const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
    return imageExtensions.includes(ext || "");
  });

  const pptDocuments = pptDocs.filter((file) => {
    const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
    return documentExtensions.includes(ext || "");
  });

  

  const pythaDocuments = pythaDocs.filter((file) => {
    const ext = file.doc_og_name?.split(".").pop()?.toLowerCase();
    return documentExtensions.includes(ext || "");
  });

  // Calculate stats from ALL docs (ppt + pytha)
  const approvedDocs = allDocs.filter(
    (d) => d.tech_check_status === "APPROVED"
  ).length;
  const rejectedDocs = allDocs.filter(
    (d) => d.tech_check_status === "REJECTED"
  ).length;
  const pendingDocs = allDocs.filter(
    (d) => !d.tech_check_status || d.tech_check_status === "PENDING"
  ).length;

  // ✅ Permissions
  const canDelete =
    userType === "admin" ||
    userType === "super-admin";

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      setConfirmDelete(null);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full space-y-8 overflow-y-scroll px-2 pb-6"
    >
      <motion.div className=" w-full flex items-center justify-start gap-2">
        {/* Animated green circle */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-full space-y-8 overflow-y-scroll"
        >
          {/* 🔹 Client Required Completion Section */}
          <motion.div
            className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ✅ Animated green status dot */}
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut",
              }}
            />

            {/* ✅ Text + Date */}
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground tracking-wide">
                Client required delivery date
              </p>
              <span className="text-sm font-medium text-foreground mt-0.5">
                {data?.client_required_order_login_complition_date
                  ? new Date(
                      data.client_required_order_login_complition_date
                    ).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not specified"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Header with Stats */}
      <motion.div variants={itemVariants} className="space-y-4 -mt-5">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Docs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allDocs.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
                <CheckCircle2 className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Approved
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {approvedDocs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 dark:bg-amber-600 flex items-center justify-center">
                <AlertCircle className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingDocs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500 dark:bg-red-600 flex items-center justify-center">
                <XCircle className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rejectedDocs}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========== CLIENT DOCUMENTATION - HORIZONTAL CARDS ========== */}
      <motion.div variants={itemVariants} className="space-y-8">
        <div className="border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <Layers3 size={20} />
              <h1 className="text-base font-semibold flex items-center gap-1">
                Client Documentation
                <span className="text-xs font-medium text-muted-foreground">
                  ({allDocs.length}{" "}
                  {allDocs.length === 1 ? "Document" : "Documents"})
                </span>
              </h1>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Client Documentation Project Files */}

            <div className="border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Layers3 size={20} />
                  <h1 className="text-base font-semibold flex items-center gap-1">
                    Project Files
                    <span className="text-xs font-medium text-muted-foreground">
                      ({pptDocs.length}{" "}
                      {pptDocs.length === 1 ? "Document" : "Documents"})
                    </span>
                  </h1>
                </div>
              </div>

              {/* Body */}
              {pptDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] px-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Ban size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    No Client Documentation Design Files
                  </h3>
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    Once Client Documentation Design Files are uploaded, they
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                  {pptImages.map((doc: any, index: number) => (
                    <ImageComponent
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        doc_og_name: doc?.doc_og_name,
                        signedUrl: doc?.signed_url,
                        created_at: doc?.created_at,
                      }}
                      index={index}
                      status={
                        doc.tech_check_status === null
                          ? "PENDING"
                          : doc.tech_check_status
                      }
                      canDelete={canDelete}
                      onView={(i) => {
                        setStartIndex(i);
                        setOpenCarousel(true);
                      }}
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  ))}
                  {pptDocuments.map((doc: any) => (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        originalName: doc.doc_og_name,
                        signedUrl: doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      canDelete={canDelete}
                      status={
                        doc.tech_check_status === null
                          ? "PENDING"
                          : doc.tech_check_status
                      }
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Client Documentation Designs Files */}
            <div className="border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Layers3 size={20} />
                  <h1 className="text-base font-semibold flex items-center gap-1">
                    Desings Files
                    <span className="text-xs font-medium text-muted-foreground">
                      ({pythaDocs.length}{" "}
                      {pythaDocs.length === 1 ? "Document" : "Documents"})
                    </span>
                  </h1>
                </div>
              </div>

              {/* Body */}
              {pythaDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] px-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Ban size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    No Client Documentation Design Files
                  </h3>
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    Once Client Documentation Design Files are uploaded, they
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                  {pythaDocuments.map((doc: any) => (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        originalName: doc.doc_og_name,
                        signedUrl: doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      canDelete={canDelete}
                      status={
                        doc.tech_check_status === null
                          ? "PENDING"
                          : doc.tech_check_status
                      }
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Initial Site Measurement */}
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Camera size={20} />
            <h1 className="text-base font-semibold flex items-center gap-1">
              Initial Site Measurement
              <span className="text-xs font-medium text-muted-foreground">
                ({ismDocs.length}{" "}
                {ismDocs.length === 1 ? "Document" : "Documents"})
              </span>
            </h1>
          </div>
        </div>

        {/* Body */}
        {ismDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Ban size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              No Site Measurement Documents
            </h3>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Uploaded documents related to initial site measurements will
              appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
            {ismDocs.map((doc: any) => (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  originalName: doc.originalName,
                  signedUrl: doc.signedUrl,
                  created_at: doc.created_at,
                }}
                canDelete={canDelete}
                status={doc.tech_check_status}
                onDelete={(id) => setConfirmDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Final Measurment */}
      <div className="border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Layers3 size={20} />
            <h1 className="text-base font-semibold flex items-center gap-1">
              Final Measurement Documents
              <span className="text-xs font-medium text-muted-foreground">
                ({finalDocs.length}{" "}
                {finalDocs.length === 1 ? "Document" : "Documents"})
              </span>
            </h1>
          </div>
        </div>

        {/* Body */}
        {finalDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] px-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Ban size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              No Final Measurement Documents
            </h3>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Once final measurement documents are uploaded, they will appear
              here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
            {finalDocs.map((doc: any) => (
              <DocumentCard
                key={doc.id}
                doc={{
                  id: doc.id,
                  originalName: doc.doc_og_name,
                  signedUrl: doc.signed_url,
                  created_at: doc.created_at,
                }}
                canDelete={canDelete}
                status={doc.tech_check_status}
                onDelete={(id) => setConfirmDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

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
      {/* Image Preview Modal */}
      <ImageCarouselModal
        images={pptImages}
        open={openCarousel}
        initialIndex={startIndex}
        onClose={() => setOpenCarousel(false)}
      />
    </motion.div>
  );
}
