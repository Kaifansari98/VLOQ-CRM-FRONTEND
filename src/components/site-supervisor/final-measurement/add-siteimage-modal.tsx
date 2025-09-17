"use client";

import BaseModal from "@/components/utils/baseModal";
import React from "react";
import { useAppSelector } from "@/redux/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useAddFinalMeasurementDoc } from "@/hooks/final-measurement/use-final-measurement";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FileUploadField } from "@/components/custom/file-upload";

// ✅ Zod Schema
const schema = z.object({
  currentSitePhotos: z
    .array(
      z
        .instanceof(File)
        .refine(
          (file) =>
            ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
          "Only JPG, JPEG, PNG allowed"
        )
    )
    .min(1, "At least one site photo is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    accountId: number;
  };
}

const AddSiteImageModal = ({ open, onOpenChange, data }: Props) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.leadId;
  const accountId = data?.accountId;

  const queryClient = useQueryClient();
  const mutation = useAddFinalMeasurementDoc();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentSitePhotos: [],
    },
  });

  // ✅ Submit Handler
  const onSubmit = (values: FormValues) => {
    if (!vendorId || !leadId || !accountId || !userId) {
      toast.error("Missing required identifiers");
      return;
    }

    mutation.mutate(
      {
        vendorId,
        leadId,
        accountId,
        createdBy: userId,
        sitePhotos: values.currentSitePhotos,
      },
      {
        onSuccess: () => {
          toast.success("Site photos uploaded successfully");
          queryClient.invalidateQueries({
            queryKey: ["finalMeasurementLead", vendorId, leadId],
          });

          form.reset({ currentSitePhotos: [] }); // 🔑 clear files
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to upload photos");
        },
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Site Photos"
      size="md"
      description="Upload current site images (JPG, JPEG, PNG only)."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Upload Field */}
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
                      accept="image/png, image/jpeg, image/jpg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default AddSiteImageModal;
