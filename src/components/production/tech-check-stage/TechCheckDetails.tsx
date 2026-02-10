"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import {
  FileText,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Layers3,
} from "lucide-react";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
import { useDeleteDocument } from "@/api/leads";
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
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { useSelectionData } from "@/hooks/designing-stage/designing-leads-hooks";
import SectionHeader from "@/utils/sectionHeader";

type Props = {
  leadId: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function TechCheckDetails({ leadId }: Props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)!;
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // ✅ Hooks
  const { data: clientDocs } = useClientDocumentationDetails(vendorId, leadId, userId!);
  const { data: siteMeasurement } = useSiteMeasurementLeadById(leadId);
  const { data: finalMeasurement } = useFinalMeasurementLeadById(
    vendorId,
    leadId
  );

  console.log("Client Documentation: ", clientDocs);
  const { data } = useClientRequiredCompletionDate(vendorId, leadId);

  const { data: selectionsData } = useSelectionData(vendorId!, leadId);

  const selections = {
    carcas: selectionsData?.data?.find((s: any) => s.type === "Carcas")?.desc,
    shutter: selectionsData?.data?.find((s: any) => s.type === "Shutter")?.desc,
    handles: selectionsData?.data?.find((s: any) => s.type === "Handles")?.desc,
  };

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  // filter: "ALL" | "APPROVED" | "PENDING" | "REJECTED"
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "APPROVED" | "PENDING" | "REJECTED"
  >("ALL");
  const filterDocs = (docs: any[]) => {
    if (activeFilter === "ALL") return docs;

    if (activeFilter === "PENDING") {
      return docs.filter(
        (d) =>
          !d.tech_check_status ||
          d.tech_check_status === "PENDING" ||
          d.tech_check_status === "REVISED"
      );
    }

    return docs.filter((d) => d.tech_check_status === activeFilter);
  };

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

  const filteredPptDocs = filterDocs(pptDocs);
  const filteredPythaDocs = filterDocs(pythaDocs);

  const filteredPptImages = filteredPptDocs.filter((file) =>
    imageExtensions.includes(
      file.doc_og_name?.split(".").pop()?.toLowerCase() || ""
    )
  );
  const filteredPptDocuments = filteredPptDocs.filter((file) =>
    documentExtensions.includes(
      file.doc_og_name?.split(".").pop()?.toLowerCase() || ""
    )
  );

  const filteredPythaDocuments = filteredPythaDocs.filter((file) =>
    documentExtensions.includes(
      file.doc_og_name?.split(".").pop()?.toLowerCase() || ""
    )
  );

  // Calculate stats from ALL docs (ppt + pytha)
  const approvedDocs = allDocs.filter(
    (d) => d.tech_check_status === "APPROVED"
  ).length;
  const rejectedDocs = allDocs.filter(
    (d) => d.tech_check_status === "REJECTED"
  ).length;
  const pendingDocs = allDocs.filter(
    (d) =>
      !d.tech_check_status ||
      d.tech_check_status === "PENDING" ||
      d.tech_check_status === "REVISED"
  ).length;

  // ✅ Permissions
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "tech-check" && leadStatus === "tech-check-stage");

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
      className="w-full h-full space-y-4 pb-6 bg-[#fff] dark:bg-[#0a0a0a]"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-4"
      >
        {/* -------- Client Required Completion Section -------- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="
      flex items-center gap-3 
      bg-muted/50 
      dark:bg-neutral-900/50
      border border-border 
      rounded-xl 
      px-4 py-3 
      backdrop-blur-sm
    "
        >
          {/* Animated green indicator */}
          <motion.div
            className="
        w-3 h-3 rounded-full 
        bg-green-500 
        shadow-[0_0_8px_rgba(34,197,94,0.6)]
      "
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut",
            }}
          />

          {/* Text + Date */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground tracking-wide">
              Client Required Delivery Date
            </p>

            <span className="text-sm font-semibold text-foreground">
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

      {/* -------- Header Stats (Premium CRM Style) -------- */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-1">
          {/* Total Docs */}
          <div
            onClick={() => setActiveFilter("ALL")}
            className={`
      bg-white dark:bg-neutral-900 
      rounded-xl p-4 
      border border-border 
      hover:bg-muted/60 dark:hover:bg-neutral-800/60 
      transition-all duration-200
      cursor-pointer
      ${activeFilter === "ALL" ? "ring-1 ring-blue-500" : ""}
    `}
          >
            <div className="flex items-center gap-3">
              <div
                className="
          w-10 h-10 rounded-lg 
          bg-blue-500/10 dark:bg-blue-500/20 
          flex items-center justify-center
        "
              >
                <FileText
                  className="text-blue-600 dark:text-blue-400"
                  size={20}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total Docs
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {allDocs.length}
                </p>
              </div>
            </div>
          </div>

          {/* Approved */}
          <div
            onClick={() => setActiveFilter("APPROVED")}
            className={`
      bg-white dark:bg-neutral-900 
      rounded-xl p-4 
      border border-border 
      hover:bg-muted/60 dark:hover:bg-neutral-800/60 
      transition-all duration-200
      cursor-pointer
      ${activeFilter === "APPROVED" ? "ring-1 ring-green-500" : ""}
    `}
          >
            <div className="flex items-center gap-3">
              <div
                className="
          w-10 h-10 rounded-lg 
          bg-green-500/10 dark:bg-green-500/20 
          flex items-center justify-center
        "
              >
                <CheckCircle2
                  className="text-green-600 dark:text-green-400"
                  size={20}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Approved
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {approvedDocs}
                </p>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div
            onClick={() => setActiveFilter("PENDING")}
            className={`
      bg-white dark:bg-neutral-900 
      rounded-xl p-4 
      border border-border 
      hover:bg-muted/60 dark:hover:bg-neutral-800/60 
      transition-all duration-200
      cursor-pointer
      ${activeFilter === "PENDING" ? "ring-1 ring-amber-500" : ""}
    `}
          >
            <div className="flex items-center gap-3">
              <div
                className="
          w-10 h-10 rounded-lg 
          bg-amber-500/10 dark:bg-amber-500/20 
          flex items-center justify-center
        "
              >
                <AlertCircle
                  className="text-amber-600 dark:text-amber-400"
                  size={20}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {pendingDocs}
                </p>
              </div>
            </div>
          </div>

          {/* Rejected */}
          <div
            onClick={() => setActiveFilter("REJECTED")}
            className={`
      bg-white dark:bg-neutral-900 
      rounded-xl p-4 
      border border-border 
      hover:bg-muted/60 dark:hover:bg-neutral-800/60 
      transition-all duration-200
      cursor-pointer
      ${activeFilter === "REJECTED" ? "ring-1 ring-red-500" : ""}
    `}
          >
            <div className="flex items-center gap-3">
              <div
                className="
          w-10 h-10 rounded-lg 
          bg-red-500/10 dark:bg-red-500/20 
          flex items-center justify-center
        "
              >
                <XCircle className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {rejectedDocs}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========== CLIENT DOCUMENTATION (PREMIUM) ========== */}
      <motion.div variants={itemVariants} className="space-y-4">
        {/* ---------- Main Wrapper ---------- */}
        <div
          className="
    bg-white dark:bg-neutral-900
    rounded-2xl border border-border
    overflow-hidden
  "
        >
          {/* Main Header */}
          <div
            className="
      flex items-center justify-between px-5 py-3
      border-b border-border
      bg-[#fff] dark:bg-[#0a0a0a]
    "
          >
            <div className="flex items-center gap-2">
              <Layers3 size={20} className="opacity-70" />
              <h1 className="text-lg font-semibold tracking-tight">
                Client Documentation
              </h1>
            </div>

            <p className="text-xs text-muted-foreground tracking-wide">
              {allDocs.length} {allDocs.length === 1 ? "Document" : "Documents"}
            </p>
          </div>

          <div className="p-6 space-y-8 bg-[#fff] dark:bg-[#0a0a0a]">
            {/* ========== PROJECT FILES ========== */}
            <motion.div
              variants={itemVariants}
              className="space-y-4 bg-[#fff] dark:bg-[#0a0a0a]"
            >
              <div
                className="
          flex items-center justify-between 
          px-4 py-2 border border-border rounded-xl
          bg-[#fff] dark:bg-[#0a0a0a]
        "
              >
                <div className="flex items-center gap-2">
                  <Layers3 size={18} className="opacity-70" />
                  <h2 className="text-base font-semibold tracking-tight">
                    Project Files
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({filteredPptDocs.length}{" "}
                    {filteredPptDocs.length === 1 ? "Document" : "Documents"})
                  </span>
                </div>
              </div>

              {/* Body */}
              {filteredPptDocs.length === 0 ? (
                <div
                  className="
            flex flex-col items-center justify-center 
            py-14 px-6 
            border border-dashed border-border/60 
            rounded-xl 
            bg-[#fff] dark:bg-[#0a0a0a]
          "
                >
                  <Ban size={38} className="text-muted-foreground mb-2" />
                  <h3 className="font-semibold text-sm mb-1">
                    No Project Files Found
                  </h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Files will appear here once uploaded.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Image Files */}
                  {filteredPptImages?.map((doc: any, index: number) => (
                    <ImageComponent
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        doc_og_name: doc.doc_og_name,
                        signedUrl: doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      index={index}
                      status={doc.tech_check_status ?? "PENDING"}
                      canDelete={canDelete}
                      onDelete={(id) => setConfirmDelete(Number(id))}
                    />
                  ))}

                  {/* Document Files */}
                  {filteredPptDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        originalName: doc.doc_og_name,
                        signedUrl: doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      canDelete={canDelete}
                      status={doc.tech_check_status ?? "PENDING"}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* ========== DESIGN FILES ========== */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div
                className="
          flex items-center justify-between 
          px-4 py-2 border border-border rounded-xl
          bg-[#fff] dark:bg-[#0a0a0a]
        "
              >
                <div className="flex items-center gap-2">
                  <Layers3 size={18} className="opacity-70" />
                  <h2 className="text-base font-semibold tracking-tight">
                    Design Files
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({filteredPythaDocs.length}{" "}
                    {filteredPythaDocs.length === 1 ? "Document" : "Documents"})
                  </span>
                </div>
              </div>

              {/* Body */}
              {filteredPythaDocuments.length === 0 ? (
                <div
                  className="
            flex flex-col items-center justify-center 
            py-14 px-6 
            border border-dashed border-border/60 
            rounded-xl 
            bg-mutedBg/40 dark:bg-neutral-800/40
          "
                >
                  <Ban size={38} className="text-muted-foreground mb-2" />
                  <h3 className="font-semibold text-sm mb-1">
                    No Design Files Found
                  </h3>
                  <p className="text-xs text-muted-foreground text-center">
                    Files will appear here once uploaded.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPythaDocuments.map((doc: any) => (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        originalName: doc.doc_og_name,
                        signedUrl: doc.signed_url,
                        created_at: doc.created_at,
                      }}
                      canDelete={canDelete}
                      status={doc.tech_check_status ?? "PENDING"}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {activeFilter === "ALL" && (
        <>
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
          </motion.section>

          {/* ========== INITIAL SITE MEASUREMENT (PREMIUM CRM) ========== */}
          <div
            className="
    bg-[#fff] dark:bg-[#0a0a0a]
    rounded-2xl 
    border border-border 
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
                <Camera size={20} className="opacity-80" />
                <h1 className="text-lg font-semibold tracking-tight flex items-center gap-1">
                  Initial Site Measurement
                  <span className="text-xs font-medium text-muted-foreground">
                    ({ismDocs.length}{" "}
                    {ismDocs.length === 1 ? "Document" : "Documents"})
                  </span>
                </h1>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {ismDocs.length === 0 ? (
                <div
                  className="
          flex flex-col items-center justify-center 
          py-14 px-6 
          border border-dashed border-border/60 
          rounded-xl 
          bg-mutedBg/40 dark:bg-neutral-800/40
        "
                >
                  <Ban size={38} className="text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-sm mb-1">
                    No Site Measurement Documents
                  </h3>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Uploaded documents related to initial site measurements will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          </div>

          {/* ========== FINAL MEASUREMENT (PREMIUM CRM) ========== */}
          <div
            className="
    bg-white dark:bg-neutral-900 
    rounded-2xl 
    border border-border 
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
                <Layers3 size={20} className="opacity-80" />
                <h1 className="text-lg font-semibold tracking-tight flex items-center gap-1">
                  Final Measurement Documents
                  <span className="text-xs font-medium text-muted-foreground">
                    ({finalDocs.length}{" "}
                    {finalDocs.length === 1 ? "Document" : "Documents"})
                  </span>
                </h1>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 bg-[#fff] dark:bg-[#0a0a0a]">
              {finalDocs.length === 0 ? (
                <div
                  className="
          flex flex-col items-center justify-center 
          py-14 px-6 
          border border-dashed border-border/60 
          rounded-xl 
          bg-[#fff] dark:bg-[#0a0a0a]
        "
                >
                  <Ban size={38} className="text-muted-foreground mb-3" />
                  <h3 className="font-semibold text-sm mb-1">
                    No Final Measurement Documents
                  </h3>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Once final measurement documents are uploaded, they will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          </div>
        </>
      )}

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
