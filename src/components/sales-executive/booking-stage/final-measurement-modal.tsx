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
import { SinglePdfUploadField } from "@/components/utils/single-pdf-uploader";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "react-toastify";
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

const formSchema = z.object({
  finalMeasurementDocs: z
    .array(z.custom<File>((file) => file instanceof File))
    .nonempty({ message: "At least one Final Measurement Document is required" })
    .refine((files) => files.every((file) => file.type === "application/pdf"), {
      message: "Only PDF files are allowed",
    })
    .max(20, { message: "You can upload up to 20 PDFs only" }),

  currentSitePhotos: z
    .array(z.instanceof(File))
    .nonempty({ message: "At least one site photo is required" })
    .refine(
      (files) =>
        files.every((file) =>
          ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
        ),
      { message: "Only JPG, JPEG, or PNG images are allowed" }
    ),

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
          toast.success("Final measurement uploaded successfully!");
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });
          form.reset();
          onOpenChange(false);

          // 👇 redirect to client documentation page
          router.push("/dashboard/project/client-documentation");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Upload failed. Try again.");
        },
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Final Measurement for ${data?.name || "Customer"}`}
      size="lg"
      description="Submit final measurement details with optional notes and attachments."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex flex-col h-full"
          >
            {/* ---- PDF Upload ---- */}
            <FormField
              control={form.control}
              name="finalMeasurementDocs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Final Measurement Documents (max 10) *
                  </FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      accept="application/pdf"
                      multiple // ✅ allow multiple PDFs
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
                  <FormLabel className="text-sm">
                    Current Site Photos *
                  </FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
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
                    <TextAreaInput
                      placeholder="Enter your remarks"
                      {...field}
                    />
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
                onClick={() =>
                  form.reset({
                    finalMeasurementDocs: [],
                    currentSitePhotos: [],
                    criticalDiscussion: "",
                  })
                }
              >
                Reset
              </Button>
              <Button type="submit" disabled={finalMeasurementMutation.isPending}>
                {finalMeasurementMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default FinalMeasurementModal;
