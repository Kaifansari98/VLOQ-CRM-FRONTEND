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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

  // State for Add Report Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [remark, setRemark] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // State for View Documents Modal
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    data: ReportCard | null;
  }>({ open: false, data: null });

  // API hooks
  const uploadMutation = useUploadInstallationUpdate();
  const { data: reports, refetch } = useInstallationUpdates(vendorId, leadId);

  const { data: underDetails } = useUnderInstallationDetails(vendorId, leadId);

  console.log(
    "Installation Start Date :- ",
    underDetails?.actual_installation_start_date
  );
  console.log(
    "Expected End Date :- ",
    underDetails?.expected_installation_end_date
  );

  const handleAddReport = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
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
        onError: (error: any) => {
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

  const getFileIcon = (filename: string) => {
    return isImageFile(filename) ? (
      <Image className="w-5 h-5 text-blue-500" />
    ) : (
      <File className="w-5 h-5 text-orange-500" />
    );
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

  return (
    <div className="mt-10 border-t pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            Installation Day-Wise Updates
          </h3>
          <p className="text-sm text-muted-foreground">
            Track installation progress with daily updates and documentation
          </p>
        </div>

        {accessBtn && (
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Day Wise Update
          </Button>
        )}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          active:scale-[0.98]
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Day-Wise Installation Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Update Date *</label>
              <CustomeDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                restriction="installationInterval"
                intervalStartDate={underDetails?.actual_installation_start_date}
                intervalEndDate={underDetails?.expected_installation_end_date}
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
                multiple={true}
              />
            </div>
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Documents Modal (Redesigned) */}
      <Dialog
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
      >
        <DialogContent className="min-w-4xl w-full max-h-[90vh] overflow-scroll rounded-xl p-0">
          {/* Header */}
          <div className="px-6 pt-4 pb-4 border-b bg-card">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Installation Report
                </DialogTitle>

                {viewModal.data && (
                  <p className="text-sm text-muted-foreground">
                    {formatFullDate(viewModal.data.update_date)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 space-y-8">
            {/* Notes */}
            {viewModal.data?.remark && (
              <div className="bg-muted/40 border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Notes</span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed pl-7">
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
                {viewModal.data?.documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="group relative rounded-lg border border-border bg-card p-4 shadow-sm 
                         hover:shadow-md hover:border-primary/40 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="p-2 bg-muted rounded-lg">
                        {getFileIcon(doc.original_name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                          {doc.original_name}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5"
                          >
                            {getFileExtension(doc.original_name).toUpperCase()}
                          </Badge>
                          <span>
                            {new Date(doc.uploaded_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* View */}
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>

                        {/* Download */}
                        <a
                          href={doc.signed_url}
                          download={doc.original_name}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {isImageFile(doc.original_name) && (
                      <div className="mt-4 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={doc.signed_url}
                          alt={doc.original_name}
                          className="object-cover w-full h-40 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t bg-card p-4">
            <Button
              variant="outline"
              onClick={() => setViewModal({ open: false, data: null })}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
