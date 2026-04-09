"use client";

import React, { useMemo, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";

interface ServicingCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceLabel?: string;
}

function formatMarkedAt(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const ServicingCompleteModal: React.FC<ServicingCompleteModalProps> = ({
  open,
  onOpenChange,
  serviceLabel,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState("");

  const markedAt = useMemo(() => formatMarkedAt(new Date()), [open]);

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Complete ${serviceLabel || "Service"}`}
      description="Upload completion documents and add an optional remark for this service visit."
      size="lg"
    >
      <div className="space-y-6 p-6">

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">
              Document Upload
              <span className="ml-1 text-destructive">*</span>
            </label>
            <span className="text-xs text-muted-foreground">
              PDF, image, doc, sheet
            </span>
          </div>
          <FileUploadField
            value={files}
            onChange={setFiles}
            multiple={true}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
            maxFiles={10}
          />
          <p className="text-xs text-muted-foreground">
            Upload one or more files to complete this service.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium mb-2">Remark ( Optional )</label>
          <TextAreaInput
            value={remark}
            onChange={setRemark}
            placeholder="Add a remark if needed"
            className="min-h-28"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled>Submit</Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ServicingCompleteModal;
