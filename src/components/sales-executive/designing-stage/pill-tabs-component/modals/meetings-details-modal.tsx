"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock3,
  FileImage,
  FileText,
  MessageSquareText,
  Paperclip,
  Plus,
  Tag,
} from "lucide-react";
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
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const [meetingDocs, setMeetingDocs] = useState(
    meeting.designMeetingDocsMapping,
  );
  const meetings = meetingDocs;

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

  const formatTimeOnly = (timeValue?: string | null) => {
    if (!timeValue) return null;

    const [hours, minutes] = timeValue.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return timeValue;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formattedMeetingTime = [meeting.meeting_start_time, meeting.meeting_end_time]
    .map((timeValue) => formatTimeOnly(timeValue))
    .filter(Boolean)
    .join(" - ");
  const totalAttachments = meetings.length;
  const detailCards = [
    formattedMeetingTime
      ? {
          key: "time",
          label: "Meeting Time",
          value: formattedMeetingTime,
          icon: Clock3,
          accent: "from-rose-50 via-white to-white",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    value: string;
    icon: typeof Calendar;
    accent: string;
  }>;

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
      (m) => !isImageExt(getFileExtension(m.document?.doc_sys_name || "")),
    )
    .map((m) => ({
      id: m.document?.id,
      originalName: m.document?.doc_og_name,
      signedUrl: m.document?.signedUrl,
      created_at: m.document?.created_at,
    }));

  React.useEffect(() => {
    if (open) {
      setMeetingDocs(meeting.designMeetingDocsMapping);
    }
  }, [open, meeting.designMeetingDocsMapping]);

  // 🧩 Permission logic
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.meetings.delete")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage");
  const canEditMeetingFiles =
    !isAuditor &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.meetings.edit")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage"));

  // 🧩 Delete confirmation
  const handleConfirmDelete = () => {
    if (!confirmDelete || !userId) return;

    deleteDocument(
      {
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      },
      {
        onSuccess: () => {
          // 🔥 SAME LOGIC AS viewModal
          setMeetingDocs((prev) =>
            prev.filter((m) => m.document?.id !== confirmDelete),
          );

          setConfirmDelete(null);
        },
      },
    );
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
        <div className="space-y-6 px-6 py-6">
          {/* Top Info Card */}
          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50/50 p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-md">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Meeting Date
                    </span>
                    <Badge variant="outline" className="rounded-full border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-600 shadow-sm">
                      {meeting.meetingType?.type ?? "Standard"}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                    {formatDateOnly(meeting.date)}
                  </h2>
                </div>
              </div>

              {formattedMeetingTime && (
                <div className="flex items-center gap-3 rounded-xl border border-neutral-200/60 bg-white px-4 py-3 shadow-sm md:self-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                      Time Slot
                    </span>
                    <span className="text-sm font-semibold text-neutral-800">
                      {formattedMeetingTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Description Section */}
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-neutral-900">
                  Notes & Discussion Summary
                </h3>
                <p className="text-xs text-neutral-400">
                  Summary and discussion context captured for this meeting.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-neutral-50/30 p-4 text-left">
              <p className="text-sm leading-7 text-neutral-700 whitespace-pre-line">
                {meeting.desc || "No description available for this meeting."}
              </p>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                  <Paperclip className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold text-neutral-900">
                    Meeting Attachments
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Access all documents and images uploaded for this meeting.
                  </p>
                </div>
              </div>

              {canEditMeetingFiles && (
                <Button
                  onClick={() => setOpenAddFilesModal(true)}
                  variant="outline"
                  className="h-9 gap-1.5 rounded-lg border-neutral-200 text-xs font-semibold shadow-sm hover:bg-neutral-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Attach Files
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-6">
              {meetingImages.length > 0 && (
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Images ({meetingImages.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {meetingImages.map((img, index) => (
                      <div key={img.id} className="w-fit max-w-full">
                        <ImageComponent
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {docsArray.length > 0 && (
                <div className="space-y-3 text-left pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Documents ({docsArray.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {docsArray.map((doc) => (
                      <div key={doc.id} className="w-fit max-w-full">
                        <DocumentCard
                          doc={{
                            id: doc.id!,
                            originalName: doc.originalName!,
                            created_at: doc.created_at,
                            signedUrl: doc.signedUrl!,
                          }}
                          canDelete={canDelete}
                          onDelete={(id) => setConfirmDelete(id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {meetingImages.length === 0 && docsArray.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-400">
                    No files or attachments have been uploaded for this meeting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseModal>

      {/* ➕ Add Files Modal */}
      <AddMeetingFilesModal
        open={openAddFilesModal}
        onOpenChange={setOpenAddFilesModal}
        meetingId={meeting.id}
        existingDocs={meetingDocs}
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
