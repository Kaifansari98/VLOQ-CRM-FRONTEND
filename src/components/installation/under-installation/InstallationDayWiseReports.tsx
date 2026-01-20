"use client";

import React, { useState } from "react";
import {
  Calendar,
  FileText,
  Plus,
  Eye,
  Download,
  ExternalLink,
  Image,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useUploadInstallationUpdate,
  useInstallationUpdates,
  useUnderInstallationDetails,
} from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";
import { motion } from "framer-motion";
import BaseModal from "@/components/utils/baseModal";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
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
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";

interface InstallationDayWiseReportsProps {
  vendorId: number;
  leadId: number;
  accountId?: number;
  accessBtn?: boolean;
}

interface ReportDocument {
  document_id: number;
  original_name: string;
  file_key: string;
  signed_url: string;
  uploaded_at: string;
}

interface ReportCard {
  update_id: number;
  update_date: string;
  remark: string | null;
  documents: ReportDocument[];
}

export default function InstallationDayWiseReports({
  vendorId,
  leadId,
  accountId,
  accessBtn,
}: InstallationDayWiseReportsProps) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  // State for Add Report Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [remark, setRemark] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<null | number>(null);

  // State for View Documents Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: ReportCard | null;
  }>({ open: false, data: null });

  // API hooks
  const uploadMutation = useUploadInstallationUpdate();
  const { data: reports, refetch } = useInstallationUpdates(vendorId, leadId);

  const { data: underDetails } = useUnderInstallationDetails(vendorId, leadId);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);
  const usedDates = React.useMemo(() => {
    if (!reports) return new Set<string>();
    return new Set(
      reports.map((r: any) =>
        new Date(r.update_date).toISOString().slice(0, 10)
      )
    );
  }, [reports]);

  const handleAddReport = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    // duplicate check
    if (usedDates.has(selectedDate)) {
      toast.error(
        "An update for this date already exists. Choose another date."
      );
      return;
    }
    if (files.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    uploadMutation.mutate(
      {
        vendorId,
        leadId,
        created_by: userId!,
        account_id: accountId,
        update_date: selectedDate,
        remark: remark.trim() || undefined,
        files,
      },
      {
        onSuccess: () => {
          toast.success("Day-wise report uploaded successfully");
          setIsAddModalOpen(false);
          setSelectedDate(undefined);
          setRemark("");
          setFiles([]);
          refetch();
        },
        onError: (error) => {
          toast.error(error?.message || "Failed to upload report");
        },
      }
    );
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const isImageFile = (filename: string) => {
    const ext = getFileExtension(filename);
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  };

  function formatInstallationDate(dateString: string) {
    const date = new Date(dateString);

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const fullDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${dayName}, ${fullDate}`;
  }

  const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

  const DOCUMENT_EXTENSIONS = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "txt",
    "csv",
    "zip",
    "rar",
  ];

  const getExtension = (fileName: string) =>
    fileName.split(".").pop()?.toLowerCase() ?? "";
  const imageDocuments =
    viewModal.data?.documents.filter((doc) =>
      IMAGE_EXTENSIONS.includes(getExtension(doc.original_name))
    ) ?? [];

  const otherDocuments =
    viewModal.data?.documents.filter((doc) =>
      DOCUMENT_EXTENSIONS.includes(getExtension(doc.original_name))
    ) ?? [];

  const handleConfirmDelete = () => {
    if (confirmDelete && userId) {
      deleteDocument({
        vendorId: vendorId,
        documentId: confirmDelete,
        deleted_by: userId,
      });
      setConfirmDelete(null);
    }
  };

  const canDelete =
    userType === "admin" ||
    userType === "super-admin" ||
    (userType === "site-supervisor" &&
      leadStatus === "under-installation-stage");

  return (
    <div className="mt-10 border-t pt-6">
      {/* Header */}
      <div className="flex flex-col items-start space-y-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            Installation Day-Wise Updates
          </h3>
          <p className="text-sm text-muted-foreground">
            Track installation progress with daily updates and documentation
          </p>
        </div>

        <div className="w-full sm:w-auto flex justify-end">
          {accessBtn && (
            <Button onClick={() => setIsAddModalOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              Add Day Wise Update
            </Button>
          )}
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
        {reports?.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-muted/40 rounded-2xl shadow-inner">
                <FileText className="w-10 h-10 opacity-50" />
              </div>
              <div>
                <p className="font-medium">No updates yet</p>
                <p className="text-xs mt-1">
                  Add your first day-wise installation updates
                </p>
              </div>
            </div>
          </div>
        )}

        {reports?.map((report: ReportCard, index: number) => (
          <motion.div
            key={report.update_id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Card
              className=" 
          group cursor-pointer rounded-xl bg-card border
          hover:shadow-[0_4px_18px_-2px_rgba(0,0,0,0.1)]
          hover:border-primary/40 transition-all duration-300 
          active:scale-[0.98] h-full
        "
              onClick={() => setViewModal({ open: true, data: report })}
            >
              <CardContent className="px-5 space-y-5">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {formatInstallationDate(report.update_date)}
                      </p>
                      <p className="text-xs text-muted-foreground flex gap-1 mt-1 items-center">
                        <FileText className="w-3 h-3" />
                        {report.documents.length}{" "}
                        {report.documents.length === 1
                          ? "Document"
                          : "Documents"}
                      </p>
                    </div>
                  </div>

                  {/* Open Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="
                h-8 w-8 rounded-full shadow-sm
                hover:bg-primary/10 transition-colors
              "
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewModal({ open: true, data: report });
                    }}
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Divider Line */}
                <div className="h-px bg-muted/50" />

                {/* Thumbnail Strip */}
                {report.documents.length > 0 && (
                  <div className="flex -space-x-2">
                    {report.documents
                      .slice(0, 4)
                      .map((doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="
                    w-10 h-10 rounded-lg bg-muted border shadow-sm
                    flex items-center justify-center
                  "
                          style={{ zIndex: 4 - idx }}
                        >
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}

                    {report.documents.length > 4 && (
                      <div
                        className="
                  w-10 h-10 rounded-lg flex items-center justify-center
                  bg-primary/10 text-primary font-semibold text-xs shadow-sm
                "
                      >
                        +{report.documents.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Report Modal */}
      <BaseModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Add Day-Wise Installation Report"
        description="Track installation progress with daily updates and documentation"
        size="lg"
      >
        <div className="space-y-4 py-4 px-6">
          {/* Date Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Update Date *</label>
            <CustomeDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              restriction="installationInterval"
              intervalStartDate={underDetails?.actual_installation_start_date}
              intervalEndDate={underDetails?.expected_installation_end_date}
              disabledDates={Array.from(usedDates)}
              disabledDatesReason="A report has already been uploaded for this date."
            />
          </div>

          {/* Remark */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Remark (Optional)</label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add any notes or comments about today's progress..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Upload Documents *</label>
            <FileUploadField
              value={files}
              onChange={setFiles}
              accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.avi,.mkv,.webm"
              multiple
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddReport}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Report"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
        title="Installation Report"
        description="Track installation progress with daily updates and documentation"
        size="lg"
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {viewModal.data && (
            <div>
              <h4 className="text-sm font-medium mb-2">Updated Date</h4>
              <p className="text-sm bg-muted p-2 rounded-md">
                {formatFullDate(viewModal.data.update_date)}
              </p>
            </div>
          )}

          {/* Notes */}
          {viewModal.data?.remark && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-2">Remarks</h4>
              <p className="text-sm bg-muted p-2 rounded-md">
                {viewModal.data.remark}
              </p>
            </div>
          )}

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Attached Documents</h4>
              <Badge variant="secondary" className="text-xs">
                {viewModal.data?.documents.length || 0} files
              </Badge>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 🖼 IMAGE FILES */}
              {imageDocuments.map((doc, index) => (
                <ImageComponent
                  key={doc.document_id}
                  doc={{
                    id: doc.document_id,
                    doc_og_name: doc.original_name,
                    signedUrl: doc.signed_url,
                    created_at: doc.uploaded_at,
                  }}
                  index={index}
                  canDelete={canDelete}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))}

              {/* 📄 DOCUMENT FILES */}
              {otherDocuments.map((doc) => (
                <DocumentCard
                  key={doc.document_id}
                  doc={{
                    id: doc.document_id,
                    originalName: doc.original_name,
                    signedUrl: doc.signed_url,
                    created_at: doc.uploaded_at,
                  }}
                  canDelete={canDelete}
                  onDelete={(id) => setConfirmDelete(Number(id))}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => setViewModal({ open: false, data: null })}>
              Close
            </Button>
          </div>
        </div>

        {/* Footer */}
      </BaseModal>

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
    </div>
  );
}
