"use client";

import React, { useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { useAppSelector } from "@/redux/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useUploadMoreClientDocumentation } from "@/hooks/client-documentation/use-clientdocumentation";
import { FileUploadField } from "@/components/custom/file-upload";

export const uploadMoreDocsSchema = z.object({
  documents: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one document"),
});

export type UploadMoreDocsForm = z.infer<typeof uploadMoreDocsSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    accountId: number;
  };
}

const UploadMoreClientDocumentationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.leadId ?? 0;
  const accountId = data?.accountId ?? 0;

  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<UploadMoreDocsForm>({
    resolver: zodResolver(uploadMoreDocsSchema),
    defaultValues: {
      documents: [],
    },
  });

  const { mutate: uploadDocs, isPending } = useUploadMoreClientDocumentation();

  const onSubmit = (values: UploadMoreDocsForm) => {
    if (!vendorId || !createdBy) return;

    uploadDocs(
      {
        leadId,
        accountId,
        vendorId,
        createdBy,
        documents: values.documents,
      },
      {
        onSuccess: () => {
          form.reset();
          setFiles([]);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload More Client Documentation"
      size="lg"
      description="Upload additional documents for this client."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* File Upload */}
            <FormField
              control={form.control}
              name="documents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Client Documents</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={files}
                      onChange={(newFiles: File[]) => {
                        setFiles(newFiles);
                        field.onChange(newFiles);
                      }}
                      accept=".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx,.pyo"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload photos, PDFs, or documents related to the client.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default UploadMoreClientDocumentationModal;
