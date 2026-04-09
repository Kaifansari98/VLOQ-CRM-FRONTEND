"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { useAppSelector } from "@/redux/store";
import { useCompleteService } from "@/api/installation/useServicingStageLeads";
import { toastManager } from "@/components/ui/toast";

interface ServicingCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
  serviceLabel?: string;
  leadId: number;
  accountId?: number;
  serviceId?: number;
}

const ServicingCompleteModal: React.FC<ServicingCompleteModalProps> = ({
  open,
  onOpenChange,
  onCompleted,
  serviceLabel,
  leadId,
  accountId,
  serviceId,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [files, setFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState("");
  const completeMutation = useCompleteService();

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setRemark("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!vendorId || !userId || !leadId || !accountId || !serviceId || !files.length) {
      return;
    }

    const formData = new FormData();
    formData.append("vendorId", String(vendorId));
    formData.append("leadId", String(leadId));
    formData.append("accountId", String(accountId));
    formData.append("serviceId", String(serviceId));
    formData.append("userId", String(userId));

    if (remark.trim()) {
      formData.append("remark", remark.trim());
    }

    files.forEach((file) => {
      formData.append("service_completion_documents", file);
    });

    completeMutation.mutate(
      {
        formData,
        vendorId,
        leadId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${serviceLabel || "Service"} completed successfully`,
            type: "success",
          });
          onOpenChange(false);
          onCompleted?.();
        },
      },
    );
  };

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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={completeMutation.isPending}
          >
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              completeMutation.isPending ||
              !files.length ||
              !vendorId ||
              !userId ||
              !leadId ||
              !accountId ||
              !serviceId
            }
          >
            {completeMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ServicingCompleteModal;
