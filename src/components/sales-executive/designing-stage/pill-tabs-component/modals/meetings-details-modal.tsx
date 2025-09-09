"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Download, Eye, X } from "lucide-react";
import {
  DesignMeetingDocsMapping,
  Meeting,
} from "@/types/designing-stage-types";

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
  const formatDateOnly = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTimeOnly = (dateString: string): string =>
    new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const handleViewDocument = (docMapping: DesignMeetingDocsMapping) => {
    // if (!docMapping?.document?.signedUrl) return;
    // window.open(docMapping.document.signedUrl, "_blank");
  };

  // ✅ Download Document (force download trigger karega)
  const handleDownloadDocument = (docMapping: DesignMeetingDocsMapping) => {
    if (!docMapping?.document?.signedUrl) return;

    const link = document.createElement("a");
    link.href = docMapping.document.signedUrl;

    // original name use karo, fallback "document.pdf"
    link.download = docMapping.document.doc_og_name || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw]  md:max-w-3xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 sm:mx-4">
        {/* Header - Made mobile responsive */}
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Meeting Details
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-80px)] sm:max-h-[calc(85vh-120px)]">
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Meeting Overview - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Date Card */}
              <Card className="p-3 gap-0.5 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Calendar
                    size={16}
                    className="text-blue-600 dark:text-blue-400 sm:w-[18px] sm:h-[18px]"
                  />
                  <span className="font-medium text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Date
                  </span>
                </div>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatDateOnly(meeting.date)}
                </p>
              </Card>

              {/* Time Card */}
              <Card className="p-3 gap-0.5 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <Clock
                    size={16}
                    className="text-green-600 dark:text-green-400 sm:w-[18px] sm:h-[18px]"
                  />
                  <span className="font-medium text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Time
                  </span>
                </div>
                <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatTimeOnly(meeting.date)}
                </p>
              </Card>

              {/* Documents Card */}
              <Card className="p-3 gap-0.5 sm:p-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <FileText
                    size={16}
                    className="text-purple-600 dark:text-purple-400 sm:w-[18px] sm:h-[18px]"
                  />
                  <span className="font-medium text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Documents
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {meeting.designMeetingDocsMapping.length}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-1.5 py-0.5"
                  >
                    attached
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Meeting Description - Mobile optimized */}
            <Card className="p-3 gap-1 sm:p-4">
              <h3 className="font-medium text-sm sm:text-base mb-2 sm:mb-3 text-gray-900 dark:text-gray-100">
                Description
              </h3>
              <p className="text-gray-700 dark:text-gray-400 text-xs sm:text-sm leading-relaxed text-justify">
                {meeting.desc || "No description available for this meeting."}
              </p>
            </Card>

            {/* Documents Section - Mobile responsive */}
            {meeting.designMeetingDocsMapping.length > 0 && (
              <Card className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <FileText
                      size={16}
                      className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]"
                    />
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      Meeting Documents
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="dark:border-neutral-600 dark:text-gray-300 text-[10px] sm:text-xs w-fit"
                  >
                    {meeting.designMeetingDocsMapping.length} file
                    {meeting.designMeetingDocsMapping.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {meeting.designMeetingDocsMapping.map(
                    (docMapping: DesignMeetingDocsMapping, index: number) => (
                      <div
                        key={docMapping.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/70 gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 sm:p-3 bg-gray-100 dark:bg-neutral-700 rounded-md flex-shrink-0">
                            <FileText
                              size={18}
                              className="text-gray-600 dark:text-gray-300 sm:w-5 sm:h-5"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm mb-1 text-gray-900 dark:text-gray-100">
                              {docMapping.document?.doc_og_name}
                            </p>
                            {/* <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">
                              ID: {docMapping.id}
                            </p> */}
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                              Meeting attachment •{" "}
                              {formatDateOnly(meeting.date)}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons - Stacked on mobile */}
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(docMapping)}
                            className="flex items-center gap-1 sm:gap-2 dark:border-neutral-600 dark:text-gray-200 text-xs px-2 py-1 sm:px-3 sm:py-2 flex-1 sm:flex-initial"
                          >
                            <Download
                              size={12}
                              className="sm:w-[14px] sm:h-[14px]"
                            />
                            <span className="hidden xs:inline">Download</span>
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}

            {/* Empty Documents State - Mobile optimized */}
            {meeting.designMeetingDocsMapping.length === 0 && (
              <Card className="p-6 sm:p-8">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText
                      size={20}
                      className="text-gray-400 dark:text-gray-500 sm:w-6 sm:h-6"
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-2 text-sm sm:text-base">
                    No documents attached
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    This meeting doesn't have any documents attached.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingDetailsModal;
