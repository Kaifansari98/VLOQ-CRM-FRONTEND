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
  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.meetings.delete")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage");
  const canEditMeetingFiles =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.meetings.edit")
      : userType === "admin" ||
        userType === "super-admin" ||
        (userType === "sales-executive" && leadStatus === "designing-stage");

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
        <div className="space-y-5 px-6 py-5">
          <div className="overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-stone-50 via-white to-zinc-50 shadow-sm">
            <div className="border-b border-border/60 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-black px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-black"
                    >
                      {meeting.meetingType?.type ?? "Meeting"} - Meeting
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      {formatDateOnly(meeting.date)}
                    </h2>
                    {formattedMeetingTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        <span>{formattedMeetingTime}</span>
                      </div>
                    )}
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      Review meeting notes, uploaded documents, and visual references in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className=" bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100">
                <MessageSquareText className="h-5 w-5 text-foreground/75" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Meeting Description
                </h3>
                <p className="text-sm text-muted-foreground">
                  Summary and discussion context captured for this meeting.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-border/70 bg-stone-50/70 p-5">
              <p className="text-sm leading-7 text-foreground/80">
                {meeting.desc || "No description available for this meeting."}
              </p>
            </div>
          </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <FileText className="h-5 w-5 text-foreground/75" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Meeting Files & Images
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Includes all files uploaded during this meeting.
                    </p>
                  </div>
                </div>
              </div>

              {canEditMeetingFiles && (
                <Button
                  onClick={() => setOpenAddFilesModal(true)}
                  className="h-10 gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  Add More Files
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-6">
              {meetingImages.length > 0 ? (
                <div className="rounded-3xl border border-border/70 bg-stone-50/60 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <FileImage className="h-4 w-4 text-foreground/75" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Meeting Images</h3>
                      <p className="text-xs text-muted-foreground">
                        Visual references shared during the meeting.
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-auto rounded-full">
                      {meetingImages.length}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-5">
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
              ) : null}

              {docsArray.length > 0 ? (
                <div className="rounded-3xl border border-border/70 bg-stone-50/60 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <FileText className="h-4 w-4 text-foreground/75" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Documents</h3>
                      <p className="text-xs text-muted-foreground">
                        PDFs and supporting files attached to this meeting.
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-auto rounded-full">
                      {docsArray.length}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-5">
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
              ) : null}

              {meetingImages.length === 0 && docsArray.length === 0 && (
                <div className="rounded-3xl border border-dashed border-border/70 bg-stone-50/60 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    No files added yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    This meeting does not have any images or documents yet.
                    {canEditMeetingFiles
                      ? " Use the add files action to attach them."
                      : ""}
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
