"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Plus } from "lucide-react";
import { getFileExtension, isImageExt } from "@/components/utils/filehelper";
import BaseModal from "@/components/utils/baseModal";
import { ImageComponent } from "@/components/utils/ImageCard";
import AddMeetingFilesModal from "../../add-meeting-files-modal";
import { useAppSelector } from "@/redux/store";
import { useDetails } from "../details-context";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
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
import { Meeting } from "@/types/designing-stage-types";

interface MeetingDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting;
}

const MeetingDetailsModal = ({
  open,
  onOpenChange,
  meeting,
}: MeetingDetailProps) => {
  const meetings = meeting.designMeetingDocsMapping;
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );


  const [openAddFilesModal, setOpenAddFilesModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const formatDateOnly = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // 🧩 Images
  const meetingImages = meetings
    .filter((m) => isImageExt(getFileExtension(m.document?.doc_sys_name || "")))
    .map((m, idx) => ({
      id: m.document?.id ?? idx,
      signed_url: m.document?.signedUrl ?? "",
      doc_og_name: m.document?.doc_og_name ?? "",
      created_at: m.document?.created_at ?? "",
    }));

  // 🧩 Non-image docs
  const docsArray = meetings
    .filter(
      (m) => !isImageExt(getFileExtension(m.document?.doc_sys_name || ""))
    )
    .map((m) => ({
      id: m.document?.id,
      originalName: m.document?.doc_og_name,
      signedUrl: m.document?.signedUrl,
      created_at: m.document?.created_at,
    }));

  // 🧩 Permission logic
  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "sales-executive" && leadStatus === "designing-stage");

  // 🧩 Delete confirmation
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

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Meeting Details"
        description="View meeting records, attached assets, and submission history."
        size="lg"
      >
        <div className="px-6 py-5 space-y-4">
          {/* --- INFO CARDS WRAPPER --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* DATE CARD */}
            <div
              className="
          bg-white dark:bg-neutral-900 
          border border-border 
          rounded-2xl p-5 shadow-soft
          flex flex-col gap-3
        "
            >
              <div className="flex items-center gap-2">
                <Calendar
                  size={18}
                  className="text-gray-600 dark:text-gray-400"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Meeting Date
                </span>
              </div>

              <p className="text-base font-semibold text-heading dark:text-neutral-100">
                {formatDateOnly(meeting.date)}
              </p>
            </div>

            {/* DOCUMENT COUNT CARD */}
            <div
              className="
          bg-white dark:bg-neutral-900 
          border border-border 
          rounded-2xl p-5 shadow-soft
          flex flex-col gap-3
        "
            >
              <div className="flex items-center gap-2">
                <FileText
                  size={18}
                  className="text-gray-600 dark:text-gray-400"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Attached Documents
                </span>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-heading dark:text-neutral-100">
                  {meeting.designMeetingDocsMapping.length}
                </p>

                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  files
                </Badge>
              </div>
            </div>
          </div>

          {/* --- DESCRIPTION SECTION --- */}
          <div
            className="
        bg-white dark:bg-neutral-900 
        border border-border 
        rounded-2xl p-5 shadow-soft 
        space-y-3
      "
          >
            <h3 className="text-sm font-semibold text-heading dark:text-neutral-100">
              Meeting Description
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {meeting.desc || "No description available for this meeting."}
            </p>
          </div>

          {/* --- FILES SECTION --- */}
          <div
            className="
        bg-white dark:bg-neutral-900 
        border border-border 
        rounded-2xl p-6 shadow-soft 
        space-y-6
      "
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Meeting Files & Images
                </h2>
                <p className="text-xs text-muted-foreground">
                  Includes all files uploaded during this meeting.
                </p>
              </div>

              <Button
                onClick={() => setOpenAddFilesModal(true)}
                className="
            gap-2 rounded-lg 
            h-9 
          "
              >
                <Plus className="h-4 w-4" />
                Add More Files
              </Button>
            </div>

            {/* --- IMAGES --- */}
            {meetingImages.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Meeting Images</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2  gap-5">
                  {meetingImages.map((img, index) => (
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
                  ))}
                </div>
              </div>
            )}

            {/* --- PDF / OTHER DOCS --- */}
            {docsArray.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Documents</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                  {docsArray.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={{
                        id: doc.id!,
                        originalName: doc.originalName!,
                        created_at: doc.created_at,
                        signedUrl: doc.signedUrl!,
                      }}
                      canDelete={canDelete}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </BaseModal>

 

      {/* ➕ Add Files Modal */}
      <AddMeetingFilesModal
        open={openAddFilesModal}
        onOpenChange={setOpenAddFilesModal}
        meetingId={meeting.id}
      />

      {/* 🗑️ Delete Confirmation */}
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
    </>
  );
};

export default MeetingDetailsModal;
