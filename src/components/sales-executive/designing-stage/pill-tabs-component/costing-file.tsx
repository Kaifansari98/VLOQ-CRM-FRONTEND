"use client";

import React, { useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { Receipt, CloudUpload } from "lucide-react";
import { useCostingFileDoc } from "@/hooks/designing-stage/designing-leads-hooks";
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
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import Loader from "@/components/utils/loader";
import { Button } from "@/components/ui/button";
import ComingSoon from "@/components/generics/ComingSoon";
import CostingFileModal from "./modals/costing-file-modal";
import ViewSpecsModal from "./modals/view-specs-modal";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const getSortedLatestFirst = <T extends { created_at?: string; id: number }>(
  docs: T[],
) =>
  [...docs].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return b.id - a.id;
  });

const CostingFileTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const { data, error, isLoading, isFetching } = useCostingFileDoc(vendorId!, leadId);
  const costingDocs = data?.data?.documents || [];
  const sortedCostingDocs = getSortedLatestFirst(costingDocs);

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<any | null>(null);

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

  const canUpload =
    !isAuditor &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.designing_stage.costing_file.upload",
        )
      : true);

  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.designing_stage.costing_file.delete",
        )
      : userType === "admin" || userType === "super-admin";

  const shouldShowLoader =
    (isLoading || isFetching) &&
    !error &&
    !data;

  if (shouldShowLoader) {
    return <Loader size={250} message="Loading Costing Files..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4">
        <div className="w-16 h-16 bg-[#fff] dark:bg-[#0a0a0a] rounded-full flex items-center justify-center mb-4">
          <Receipt size={32} className="text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Error loading costing file documents. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <section
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
      flex flex-col sm:flex-row sm:items-center justify-between items-start gap-2 sm:gap-2
      px-5 py-3
      border-b border-border
      bg-[#fff] dark:bg-[#0a0a0a]
    "
        >
          <div className="flex items-center gap-2">
            <Receipt size={20} className="shrink-0" />
            <h1 className="text-lg font-semibold tracking-tight">
              Costing File
            </h1>
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {costingDocs.length}{" "}
              {costingDocs.length === 1 ? "Document" : "Documents"}
            </span>
          </div>

          {canUpload && (
            <Button size="sm" onClick={() => setOpenUploadModal(true)}>
              <CloudUpload size={16} className="mr-1" />
              <span>Upload Costing</span>
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {sortedCostingDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedCostingDocs.map((doc: any, index: number) => {
                const ext = doc.doc_og_name?.split(".").pop()?.toLowerCase();
                const isImage = IMAGE_EXTENSIONS.includes(ext || "");

                const cardElement = isImage ? (
                  <ImageComponent
                    doc={{
                      id: doc.id,
                      doc_og_name: doc.doc_og_name,
                      created_at: doc.created_at,
                      signedUrl: doc.signedUrl,
                    }}
                    index={index}
                    canDelete={canDelete}
                    onDelete={(id) => setConfirmDelete(Number(id))}
                  />
                ) : (
                  <DocumentCard
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
                );

                const hasSpec = !!doc.specification?.name;

                return (
                  <div key={doc.id} className="relative mt-8">
                    {hasSpec && (
                      <>
                        {/* Dot on the left edge of the card */}
                        <div className="absolute top-[20px] left-[-7px] w-[14px] h-[14px] rounded-full bg-muted-foreground border-2 border-background shadow-sm z-20" />
                        
                        <svg
                          className="absolute pointer-events-none z-10"
                          style={{ left: "-20px", top: "-30px", width: "100px", height: "100px", overflow: "visible" }}
                        >
                          <path
                            d="M 20,57 L 12,57 Q 6,57 6,51 L 6,17 Q 6,9 14,9 L 44,9"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="text-muted-foreground/60"
                          />
                          {/* Arrow head pointing to spec badge */}
                          <path
                            d="M 39,6 L 44,9 L 39,12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground/60"
                          />
                        </svg>

                        {/* Specification Badge */}
                        <button
                          onClick={() => setSelectedSpec({
                            id: doc.specification.id,
                            name: doc.specification.name,
                            lead_id: Number(leadId),
                            vendor_id: Number(vendorId),
                            created_by: Number(userId),
                            created_at: new Date().toISOString(),
                            lights_remark: null,
                            item_code_id: null,
                          })}
                          type="button"
                          className="absolute -top-7 left-6 z-10 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted border border-border rounded-full shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                        >
                          {doc.specification.name}
                        </button>
                      </>
                    )}
                    {cardElement}
                  </div>
                );
              })}
            </div>
          ) : (
            <ComingSoon
              heading="No Costing Files"
              description="Costing files will appear here once they are uploaded."
            />
          )}
        </div>
      </section>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected costing file will be
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

      <CostingFileModal
        open={openUploadModal}
        onOpenChange={setOpenUploadModal}
      />

      <ViewSpecsModal
        open={!!selectedSpec}
        onOpenChange={(open) => {
          if (!open) setSelectedSpec(null);
        }}
        specification={selectedSpec}
        readOnly={true}
      />
    </div>
  );
};

export default CostingFileTab;
