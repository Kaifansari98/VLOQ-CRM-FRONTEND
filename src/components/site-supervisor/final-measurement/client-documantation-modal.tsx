"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { useAppSelector } from "@/redux/store";
import { FileUploadField } from "@/components/custom/file-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useUploadClientDocumentation } from "@/hooks/final-measurement/use-final-measurement";
import { uploadClientDocPayload } from "@/api/final-measurement";

// -------------------- Props --------------------
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

// -------------------- Form Validation Schema --------------------
const clientDocSchema = z.object({
  documents: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one document"),
});

type ClientDocFormValues = z.infer<typeof clientDocSchema>;

// -------------------- Modal Component --------------------
const ClientDocumentationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.id;
  const accountId = data?.accountId;

  const [files, setFiles] = useState<File[]>([]);

  const { mutateAsync, isPending } = useUploadClientDocumentation();

  const form = useForm<ClientDocFormValues>({
    resolver: zodResolver(clientDocSchema),
    defaultValues: {
      documents: [],
    },
  });

  // Reset form & files when modal closes or data changes
  useEffect(() => {
    if (!open) {
      form.reset({ documents: [] });
      setFiles([]);
    }
  }, [open, form]);

  // -------------------- Form Submit --------------------
  const onSubmit = async (values: ClientDocFormValues) => {
    if (!leadId || !accountId || !vendorId || !createdBy) {
      toast.error("Missing required information");
      return;
    }

    try {
      await mutateAsync({
        leadId,
        accountId,
        vendorId,
        createdBy,
        documents: values.documents,
      } as uploadClientDocPayload);

      toast.success("Documents uploaded successfully");
      onOpenChange(false);
      form.reset({ documents: [] });
      setFiles([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload documents");
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Client Documentation for ${data?.name || "Customer"}`}
      size="lg"
      description="View, upload, and manage client-related documentation in one place."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
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
        </Form>
      </div>
    </BaseModal>
  );
};

export default ClientDocumentationModal;
