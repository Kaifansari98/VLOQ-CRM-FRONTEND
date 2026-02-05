"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import UploadMoreClientDocumentationModal from "./uploadmore-client-documentaition-modal";
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

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [addMoreDoc, setAddMoreDoc] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null
  );

  const { data: selectionsData } = useSelectionData(
    vendorId!,
    leadId,
    selectedInstanceId ?? undefined
  );

  const selections = {
    carcas: selectionsData?.data?.find((s: any) => s.type === "Carcas")?.desc,
    shutter: selectionsData?.data?.find((s: any) => s.type === "Shutter")?.desc,
    handles: selectionsData?.data?.find((s: any) => s.type === "Handles")?.desc,
  };

  const hasMultipleInstances = (leadDetails?.instance_count ?? 0) > 1;
  const instanceGroups = leadDetails?.documents_by_instance || [];

  React.useEffect(() => {
    if (!hasMultipleInstances || instanceGroups.length === 0) {
      setSelectedInstanceId(null);
      return;
    }
    if (
      selectedInstanceId &&
      instanceGroups.some((group) => group.instance_id === selectedInstanceId)
    ) {
      return;
    }
    const firstWithId = instanceGroups.find((group) => group.instance_id);
    setSelectedInstanceId(firstWithId?.instance_id ?? null);
  }, [hasMultipleInstances, instanceGroups, selectedInstanceId]);

  const selectedInstanceDocs = hasMultipleInstances
    ? instanceGroups.find((group) => group.instance_id === selectedInstanceId)
    : null;

  const pptDocs = hasMultipleInstances
    ? selectedInstanceDocs?.documents?.ppt || []
    : leadDetails?.documents?.ppt || [];
  const pythaDocs = hasMultipleInstances
    ? selectedInstanceDocs?.documents?.pytha || []
    : leadDetails?.documents?.pytha || [];

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

  if (isLoading)
    return (
      <Loader fullScreen size={250} message="Loading Client Documentation..." />
    );

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
      className="w-full h-full py-2 overflow-y-auto bg-[#fff] dark:bg-[#0a0a0a]"
    >
      {/* -------- Section Header: Client Documentation -------- */}

      {/* ---------------------------------------------------------- */}
      {/* -------- Design Selections -------- */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={itemVariants}
        className="
    bg-white dark:bg-neutral-900
    rounded-2xl 
    overflow-hidden
  "
      >

        {canEditSelections ? (
          <div className="p-0 bg-[#fff] dark:bg-[#0a0a0a]">
            <SelectionsTabForClientDocs
              leadId={leadId}
              accountId={accountId}
              onInstanceChange={(instance) =>
                setSelectedInstanceId(instance?.id ?? null)
              }
            />
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
        data={{
          leadId,
          accountId,
          selectedInstanceId: hasMultipleInstances ? selectedInstanceId : null,
        }}
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
