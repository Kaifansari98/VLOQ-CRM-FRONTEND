"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Plus } from "lucide-react";
import {
  DesignMeetingDocsMapping,
  Meeting,
} from "@/types/designing-stage-types";
import { getFileExtension, isImageExt } from "@/components/utils/filehelper";
import BaseModal from "@/components/utils/baseModal";
import DocumentPreview from "@/components/utils/file-preview";
import ImageCarouselModal from "@/components/utils/image-carousel-modal";
import ImageCard from "@/components/utils/image-card";

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
  const [openCarouselModal, setOpenCarouselModal] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const formatDateOnly = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const meetingImages = meetings
    .filter((m) => isImageExt(getFileExtension(m.document?.doc_sys_name || "")))
    .map((m, idx) => ({
      id: idx, // unique id for carousel
      signed_url: m.document.signedUrl,
      doc_og_name: m.document?.doc_og_name,
    }));

  const docsArray = meetings
    .filter(
      (m) => !isImageExt(getFileExtension(m.document?.doc_sys_name || ""))
    )
    .map((m) => ({
      file: {
        id: m.document?.id,
        doc_sys_name: m.document?.doc_sys_name || "",
        doc_og_name: m.document?.doc_og_name,
        signed_url: m.document?.signedUrl,
      },
    }));
  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Meeting Details"
        size="lg" // sm | md | lg | xl se control kar sakte ho
      >
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Top Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Date Card */}
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Calendar
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
                <span className="font-medium text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Date
                </span>
              </div>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDateOnly(meeting.date)}
              </p>
            </Card>

            {/* Docs Count */}
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <FileText
                  size={16}
                  className="text-purple-600 dark:text-purple-400"
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

          {/* Description */}
          <Card className="p-3 sm:p-4">
            <h3 className="font-medium text-sm sm:text-base mb-2 text-gray-900 dark:text-gray-100">
              Description
            </h3>
            <p className="text-gray-700 dark:text-gray-400 text-xs sm:text-sm leading-relaxed text-justify">
              {meeting.desc || "No description available for this meeting."}
            </p>
          </Card>

          {/* Files + Images */}
          <Card className="p-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">
                Meeting Files And Images
              </h2>
              <Button
                onClick={() => console.log("Add More Files clicked")}
                className="flex items-center text-xs sm:text-sm gap-2 h-8 sm:h-9"
              >
                <Plus className="h-4 w-4" />
                Add More Files
              </Button>
            </div>

            {/* Meeting Images */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">
                Meeting Images
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {meetingImages.map((img, idx) => (
                  <ImageCard
                    key={img.id}
                    image={img}
                    size="medium"
                    onClick={() => {
                      setStartIndex(idx);
                      setOpenCarouselModal(true);
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Documents */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-3 sm:gap-4">
                {docsArray.map((doc, idx) => (
                  <DocumentPreview key={idx} file={doc.file} size="medium" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </BaseModal>

      <ImageCarouselModal
        open={openCarouselModal}
        initialIndex={startIndex}
        images={meetingImages}
        onClose={() => setOpenCarouselModal(false)}
      />
    </>
  );
};

export default MeetingDetailsModal;
