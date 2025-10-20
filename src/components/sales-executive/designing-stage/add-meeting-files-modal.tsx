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
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

const uploadSchema = z.object({
  files: z.array(z.any()).min(1, "Please select at least 1 file"),
});

const AddMeetingFilesModal = ({
  open,
  onOpenChange,
  meetingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: number;
}) => {
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

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
        files: values.files,
      });
      toast.success("Files added successfully!");

      queryClient.invalidateQueries({
        queryKey: ["getDesignsDoc", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["meetings", vendorId, leadId],
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload files");
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
