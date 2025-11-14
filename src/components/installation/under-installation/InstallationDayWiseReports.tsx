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
import { Separator } from "@/components/ui/separator";
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useUploadInstallationUpdate,
  useInstallationUpdates,
} from "@/api/installation/useUnderInstallationStageLeads";
import { useAppSelector } from "@/redux/store";

interface InstallationDayWiseReportsProps {
  vendorId: number;
  leadId: number;
  accountId?: number;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  return (
    <div className="mt-10 border-t pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            Day-Wise Installation Reports
          </h3>
          <p className="text-sm text-muted-foreground">
            Track installation progress with daily updates and documentation
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Report
        </Button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports?.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-muted/50 rounded-full">
                <FileText className="w-10 h-10 opacity-50" />
              </div>
              <div>
                <p className="font-medium">No reports yet</p>
                <p className="text-xs mt-1">
                  Add your first day-wise installation report
                </p>
              </div>
            </div>
          </div>
        )}

        {reports?.map((report: ReportCard) => (
          <Card
            key={report.update_id}
            className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
            onClick={() => setViewModal({ open: true, data: report })}
          >
            <CardContent className="p-5">
              {/* Date Header with Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {formatDate(report.update_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Installation Update
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewModal({ open: true, data: report });
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* Documents Badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs font-normal">
                  <FileText className="w-3 h-3 mr-1" />
                  {report.documents.length}{" "}
                  {report.documents.length === 1 ? "file" : "files"}
                </Badge>
              </div>

              {/* Remark Preview */}
              {report.remark && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {report.remark}
                  </p>
                </div>
              )}

              {/* View Details CTA */}
              <div className="mt-4 flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-3 h-3 mr-1" />
                View details
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Report Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                restriction="pastOnly"
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

      {/* View Documents Modal - Enhanced */}
      <Dialog
        open={viewModal.open}
        onOpenChange={(open) => setViewModal({ open, data: null })}
      >
        <DialogContent className="min-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  Installation Report
                </DialogTitle>
                {viewModal.data && (
                  <p className="text-sm text-muted-foreground">
                    {formatFullDate(viewModal.data.update_date)}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="ml-4">
                {viewModal.data?.documents.length || 0} Documents
              </Badge>
            </div>
          </DialogHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Remark Section - Enhanced */}
            {viewModal.data?.remark && (
              <div className="bg-muted/30 border border-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  {viewModal.data.remark}
                </p>
              </div>
            )}

            {/* Documents Section - Enhanced Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">Attached Documents</h4>
                <Badge variant="secondary" className="text-xs">
                  {viewModal.data?.documents.length || 0} files
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {viewModal.data?.documents.map((doc, index) => (
                  <div
                    key={doc.document_id}
                    className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                  >
                    {/* Document Card */}
                    <div className="flex items-start gap-3">
                      {/* File Icon */}
                      <div className="flex-shrink-0 p-2.5 bg-muted rounded-lg">
                        {getFileIcon(doc.original_name)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate pr-8">
                          {doc.original_name}
                        </p>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {getFileExtension(doc.original_name).toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
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

                      {/* Action Buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>
                        <a
                          href={doc.signed_url}
                          download={doc.original_name}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Image Preview for image files */}
                    {isImageFile(doc.original_name) && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                          <img
                            src={doc.signed_url}
                            alt={doc.original_name}
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setViewModal({ open: false, data: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
