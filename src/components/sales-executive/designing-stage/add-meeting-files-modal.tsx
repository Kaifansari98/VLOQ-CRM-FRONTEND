"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDetails } from "./pill-tabs-component/details-context";
import { useAddMeetingDocs } from "@/hooks/designing-stage/designing-leads-hooks";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLeadById,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { DesignMeetingDocsMapping } from "@/types/designing-stage-types";

const uploadSchema = z.object({
  files: z.array(z.any()).min(1, "Please select at least 1 file"),
});

const formatFileDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sanitizeFileSegment = (value: string) =>
  value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex) : "";
};

const isImageFile = (file: File) =>
  file.type.startsWith("image/") ||
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);

const extractMaxMeetingFileIndex = (
  docs: DesignMeetingDocsMapping[],
  prefix: "DOC" | "IMG",
) => {
  const regex = new RegExp(`^${prefix}(\\d+)-Meeting-`, "i");

  return docs.reduce((maxIndex, mapping) => {
    const fileName =
      mapping.document?.doc_og_name || mapping.document?.doc_sys_name || "";
    const match = fileName.match(regex);
    if (!match) return maxIndex;

    const parsedIndex = Number(match[1]);
    return Number.isFinite(parsedIndex) ? Math.max(maxIndex, parsedIndex) : maxIndex;
  }, -1);
};

const renameMeetingFiles = ({
  files,
  clientName,
  targetLabel,
  uploadDate,
  existingDocs,
}: {
  files: File[];
  clientName: string;
  targetLabel: string;
  uploadDate: string;
  existingDocs: DesignMeetingDocsMapping[];
}) => {
  const safeClientName = sanitizeFileSegment(clientName || "Client");
  const safeTargetLabel = sanitizeFileSegment(targetLabel || "Instance");
  let imageIndex = extractMaxMeetingFileIndex(existingDocs, "IMG") + 1;
  let docIndex = extractMaxMeetingFileIndex(existingDocs, "DOC") + 1;

  return files.map((file) => {
    const prefix = isImageFile(file) ? "IMG" : "DOC";
    const fileIndex = prefix === "IMG" ? imageIndex++ : docIndex++;

    return new File(
      [file],
      `${prefix}${fileIndex}-Meeting-${safeClientName}-${safeTargetLabel}-${uploadDate}${getFileExtension(
        file.name,
      )}`,
      {
        type: file.type,
        lastModified: file.lastModified,
      },
    );
  });
};

const AddMeetingFilesModal = ({
  open,
  onOpenChange,
  meetingId,
  existingDocs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: number;
  existingDocs: DesignMeetingDocsMapping[];
}) => {
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;
  const isCustomDocNomenclatureEnabled = useAppSelector(
    (s) => s.auth.user?.vendor?.is_custom_doc_nomenclature_enabled === true,
  );
  const { data: leadById } = useLeadById(leadId, vendorId, userId);
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );
  const structureInstances: LeadProductStructureInstance[] = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );

  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: { files: [] },
  });
  const { mutateAsync, isPending } = useAddMeetingDocs();

  const onSubmit = async (values: any) => {
    try {
      await mutateAsync({
        meetingId,
        leadId,
        vendorId,
        userId,
        accountId,
        files: isCustomDocNomenclatureEnabled
          ? renameMeetingFiles({
              files: values.files,
              clientName:
                [leadById?.data?.lead?.firstname, leadById?.data?.lead?.lastname]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Client",
              targetLabel:
                structureInstances[0]?.title ||
                leadById?.data?.lead?.leadProductStructureMapping?.[0]
                  ?.productStructure?.type ||
                "Instance",
              uploadDate: formatFileDate(new Date()),
              existingDocs,
            })
          : values.files,
      });
      toastManager.add({ title: "Files added successfully!", type: "success" });

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["meetings", vendorId, leadId],
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toastManager.add({ title: error.message || "Failed to upload files", type: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add More Meeting Files</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FileUploadField
            value={form.watch("files")}
            onChange={(files) => form.setValue("files", files)}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMeetingFilesModal;
