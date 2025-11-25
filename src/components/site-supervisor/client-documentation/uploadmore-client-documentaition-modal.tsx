"use client";

import React, { useEffect } from "react";
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
import { FileUploadField } from "@/components/custom/file-upload";
import { useUploadMoreClientDocumentation } from "@/hooks/client-documentation/use-clientdocumentation";

const uploadMoreDocsSchema = z.object({
  pptDocuments: z.array(z.instanceof(File)).default([]),
  pythaDocuments: z.array(z.instanceof(File)).default([]),
});

type UploadMoreDocsForm = z.output<typeof uploadMoreDocsSchema>;

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
  
  const form = useForm<UploadMoreDocsForm>({
    resolver: zodResolver(uploadMoreDocsSchema) as any,
    defaultValues: {
      pptDocuments: [],
      pythaDocuments: [],
    },
  });

  const { mutate: uploadDocs, isPending } = useUploadMoreClientDocumentation();

  const onSubmit = (values: UploadMoreDocsForm) => {
    if (!vendorId || !createdBy) return;

    if (
      (!values.pptDocuments || values.pptDocuments.length === 0) &&
      (!values.pythaDocuments || values.pythaDocuments.length === 0)
    ) {
      form.setError("pptDocuments", {
        type: "manual",
        message: "Please upload at least one PPT or Pytha file",
      });
      return;
    }

    uploadDocs(
      {
        leadId,
        accountId,
        vendorId,
        createdBy,
        pptDocuments: values.pptDocuments,
        pythaDocuments: values.pythaDocuments,
      },
      {
        onSuccess: () => {
          form.reset({ pptDocuments: [], pythaDocuments: [] });
          onOpenChange(false);
        },
      }
    );
  };

  useEffect(() => {
    if (!open) {
      form.reset({ pptDocuments: [], pythaDocuments: [] });
    }
  }, [open, form]);

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload More Client Documentation"
      size="lg"
      description="Upload additional PPT or Pytha files for this client."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* PPT Section */}
            <FormField
              control={form.control}
              name="pptDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">PPT Documents</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept=".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload PPT or related documents (PDF, DOC, DOCX, images).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pytha Section */}
            <FormField
              control={form.control}
              name="pythaDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Design Files</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept=".pyo,.pytha,.pdf,.zip"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload Pytha project files (.pyo).
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