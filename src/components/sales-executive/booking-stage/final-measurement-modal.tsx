"use client";

import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import BaseModal from "@/components/utils/baseModal";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toastManager } from "@/components/ui/toast";
import { useFinalMeasurement } from "@/hooks/final-measurement/use-final-measurement";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name?: string;
    accountId: number;
  };
}

const documentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];
const documentAccept = ".pdf,.png,.jpg,.jpeg,.gif";
const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const imageAccept = ".png,.jpg,.jpeg,.gif";
const MAX_FINAL_MEASUREMENT_FILES = 20;

const formSchema = z.object({
  finalMeasurementDocs: z
    .array(z.custom<File>((file) => file instanceof File))
    .nonempty({
      message: "At least one Final Measurement Document is required",
    })
    .refine(
      (files) => files.every((file) => documentMimeTypes.includes(file.type)),
      {
        message: "Only PDF or image files are allowed",
      },
    )
    .max(MAX_FINAL_MEASUREMENT_FILES, {
      message: `You can upload up to ${MAX_FINAL_MEASUREMENT_FILES} files only`,
    }),

  currentSitePhotos: z
    .array(z.instanceof(File))
    .nonempty({ message: "At least one site photo is required" })
    .refine(
      (files) => files.every((file) => imageMimeTypes.includes(file.type)),
      { message: "Only JPG, JPEG, PNG, or GIF images are allowed" },
    )
    .max(MAX_FINAL_MEASUREMENT_FILES, {
      message: `You can upload up to ${MAX_FINAL_MEASUREMENT_FILES} files only`,
    }),

  criticalDiscussion: z.string().optional(),
});

const FinalMeasurementModal = ({
  open,
  onOpenChange,
  data,
}: LeadViewModalProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalMeasurementDocs: [],
      currentSitePhotos: [],
      criticalDiscussion: "N/A",
    },
  });

  const finalMeasurementMutation = useFinalMeasurement();

  const resetForm = React.useCallback(() => {
    form.reset({
      finalMeasurementDocs: [],
      currentSitePhotos: [],
      criticalDiscussion: "N/A",
    });
  }, [form]);

  const handleModalChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    },
    [onOpenChange, resetForm],
  );

  const handleFilesChange = React.useCallback(
    (
      fieldName: "finalMeasurementDocs" | "currentSitePhotos",
      nextFiles: File[],
      allowedTypes: string[],
    ) => {
      const validFiles = nextFiles.filter((file) => allowedTypes.includes(file.type));

      if (validFiles.length !== nextFiles.length) {
        toastManager.add({
          title:
            fieldName === "finalMeasurementDocs"
              ? "Only PDF or image files are allowed"
              : "Only JPG, JPEG, PNG, or GIF images are allowed",
          type: "error",
        });
      }

      if (validFiles.length > MAX_FINAL_MEASUREMENT_FILES) {
        toastManager.add({
          title: `You can upload up to ${MAX_FINAL_MEASUREMENT_FILES} files only`,
          type: "error",
        });
      }

      form.setValue(
        fieldName,
        validFiles.slice(0, MAX_FINAL_MEASUREMENT_FILES),
        { shouldDirty: true, shouldValidate: true },
      );
    },
    [form],
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!data) return;

    finalMeasurementMutation.mutate(
      {
        lead_id: data.id,
        account_id: data.accountId,
        vendor_id: vendorId!,
        created_by: userId!,
        critical_discussion_notes: values.criticalDiscussion,
        final_measurement_docs: values.finalMeasurementDocs,
        site_photos: values.currentSitePhotos,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Final measurement uploaded successfully!",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["universal-stage-leads"],
            exact: false,
          });

          queryClient.invalidateQueries({
            queryKey: ["allLeadDocuments"],
          });

          handleModalChange(false);

          // 👇 redirect to client documentation page
          router.push("/dashboard/project/client-documentation");
        },
        onError: (error: any) => {
          toastManager.add({
            title: error?.message || "Upload failed. Try again.",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={handleModalChange}
      title={`Final Measurement for ${data?.name || "Customer"}`}
      size="lg"
      description="Submit final measurement details with optional notes and attachments."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5  p-5">
          {/* ---- PDF Upload ---- */}
          <FormField
            control={form.control}
            name="finalMeasurementDocs"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Final Measurement Documents (max 20) *
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={(files) =>
                      handleFilesChange(
                        "finalMeasurementDocs",
                        files,
                        documentMimeTypes,
                      )
                    }
                    accept={documentAccept}
                    multiple
                    maxFiles={MAX_FINAL_MEASUREMENT_FILES}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ---- Site Photos ---- */}
          <FormField
            control={form.control}
            name="currentSitePhotos"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Current Site Photos *</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={(files) =>
                      handleFilesChange(
                        "currentSitePhotos",
                        files,
                        imageMimeTypes,
                      )
                    }
                    accept={imageAccept}
                    multiple
                    maxFiles={MAX_FINAL_MEASUREMENT_FILES}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ---- Notes ---- */}
          <FormField
            control={form.control}
            name="criticalDiscussion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Critical Discussion Notes
                </FormLabel>
                <FormControl>
                  <TextAreaInput placeholder="Enter your remarks" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ---- Buttons ---- */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Reset
            </Button>
            <Button type="submit" disabled={finalMeasurementMutation.isPending}>
              {finalMeasurementMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default FinalMeasurementModal;
