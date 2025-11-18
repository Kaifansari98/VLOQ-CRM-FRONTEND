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
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

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
  pptDocuments: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one PPT file"),
  pythaDocuments: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one Design file"),
});

type ClientDocFormValues = z.infer<typeof clientDocSchema>;

// -------------------- Modal Component --------------------
const ClientDocumentationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const createdBy = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.id;
  const accountId = data?.accountId;

  const [files, setFiles] = useState<File[]>([]);

  const [pptFiles, setPptFiles] = useState<File[]>([]);
  const [pythaFiles, setPythaFiles] = useState<File[]>([]);

  const { mutateAsync, isPending } = useUploadClientDocumentation();

  const form = useForm<ClientDocFormValues>({
    resolver: zodResolver(clientDocSchema),
    defaultValues: {
      pptDocuments: [],
      pythaDocuments: [],
    },
  });

  // Reset form & files when modal closes or data changes
  useEffect(() => {
    if (!open) {
      form.reset({ pptDocuments: [], pythaDocuments: [] });
      setPptFiles([]);
      setPythaFiles([]);
    }
  }, [open, form]);

  // -------------------- Form Submit --------------------
  const onSubmit = async (values: ClientDocFormValues) => {
    if (!leadId || !accountId || !vendorId || !createdBy) {
      toast.error("Missing required information");
      console.log("lead id :- ", leadId);
      console.log("account id :- ", accountId);
      console.log("vendor id :- ", vendorId);
      console.log("user id :- ", createdBy);
      return;
    }

    try {
      await mutateAsync({
        leadId,
        accountId,
        vendorId,
        createdBy,
        pptDocuments: values.pptDocuments,
        pythaDocuments: values.pythaDocuments,
      });

      toast.success("Documents uploaded successfully");

      // ✅ Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["leadStats", vendorId, createdBy],
      });
      queryClient.invalidateQueries({
        queryKey: ["clientDocumentationLeads", vendorId, createdBy],
      });

      onOpenChange(false);
      form.reset({ pptDocuments: [], pythaDocuments: [] });
      setPptFiles([]);
      setPythaFiles([]);

      // ✅ Redirect
      router.push("/dashboard/project/client-approval");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload documents");
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Client Documentation  `}
      size="md"
      description="View, upload, and manage client-related documentation in one place."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pptDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Client Documentation – Project Files *
                  </FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={pptFiles}
                      onChange={(newFiles: File[]) => {
                        setPptFiles(newFiles);
                        field.onChange(newFiles);
                      }}
                      accept=".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </FormControl>
                  {/* <FormDescription className="text-xs">
                    Upload PPT or related files for client documentation.
                  </FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pythaDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Client Documentation – Design Files *
                  </FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={pythaFiles}
                      onChange={(newFiles: File[]) => {
                        setPythaFiles(newFiles);
                        field.onChange(newFiles);
                      }}
                      accept=".pdf,.zip"
                    />
                  </FormControl>
                  {/* <FormDescription className="text-xs">
                    Upload Pytha files (.pyo) for client documentation.
                  </FormDescription> */}
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
