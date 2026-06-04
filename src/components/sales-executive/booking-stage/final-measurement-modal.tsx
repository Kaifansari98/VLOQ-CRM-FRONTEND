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
import {
  useLeadById,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { Card, CardContent } from "@/components/ui/card";

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
  const isCustomVendorFlowFromAuth = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalMeasurementDocs: [],
      currentSitePhotos: [],
      criticalDiscussion: "N/A",
    },
  });

  const finalMeasurementMutation = useFinalMeasurement();
  const leadId = data?.id;
  const { data: leadByIdResponse } = useLeadById(leadId, vendorId, userId);
  const leadById = leadByIdResponse?.data?.lead;
  const isCustomVendorFlow =
    isCustomVendorFlowFromAuth ||
    leadById?.createdBy?.vendor?.is_this_vendor_is_custom_usertype_only === true ||
    leadById?.assignedTo?.vendor?.is_this_vendor_is_custom_usertype_only === true;
  const {
    data: structureInstancesData,
    isLoading: isStructureInstancesLoading,
  } = useLeadProductStructureInstances(leadId ?? 0, vendorId);
  const structureInstances: LeadProductStructureInstance[] = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );
  const isMultiInstanceCustomFlow =
    isCustomVendorFlow && structureInstances.length > 1;
  const [instanceUploads, setInstanceUploads] = React.useState<
    Record<
      number,
      { finalMeasurementDocs: File[]; currentSitePhotos: File[] }
    >
  >({});

  React.useEffect(() => {
    if (!isMultiInstanceCustomFlow) {
      setInstanceUploads({});
      return;
    }

    setInstanceUploads((prev) => {
      const next: Record<
        number,
        { finalMeasurementDocs: File[]; currentSitePhotos: File[] }
      > = {};

      for (const instance of structureInstances) {
        next[instance.id] = prev[instance.id] ?? {
          finalMeasurementDocs: [],
          currentSitePhotos: [],
        };
      }

      return next;
    });
  }, [isMultiInstanceCustomFlow, structureInstances]);

  const resetForm = React.useCallback(() => {
    form.reset({
      finalMeasurementDocs: [],
      currentSitePhotos: [],
      criticalDiscussion: "N/A",
    });
    setInstanceUploads((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[Number(key)] = {
          finalMeasurementDocs: [],
          currentSitePhotos: [],
        };
      });
      return next;
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

    const flattenedFinalMeasurementDocs: Array<{
      file: File;
      instanceId: number | null;
    }> = [];
    const flattenedSitePhotos: Array<{
      file: File;
      instanceId: number | null;
    }> = [];

    if (isMultiInstanceCustomFlow) {
      for (const instance of structureInstances) {
        const uploads = instanceUploads[instance.id] ?? {
          finalMeasurementDocs: [],
          currentSitePhotos: [],
        };

        uploads.finalMeasurementDocs.forEach((file) => {
          flattenedFinalMeasurementDocs.push({
            file,
            instanceId: instance.id,
          });
        });
        uploads.currentSitePhotos.forEach((file) => {
          flattenedSitePhotos.push({
            file,
            instanceId: instance.id,
          });
        });
      }

      const missingDocs = structureInstances.filter(
        (instance) =>
          !instanceUploads[instance.id] ||
          instanceUploads[instance.id].finalMeasurementDocs.length === 0,
      );
      if (missingDocs.length > 0) {
        toastManager.add({
          title: `Please upload Final Measurement Document for ${missingDocs[0].title}.`,
          type: "error",
        });
        return;
      }

      const missingSitePhotos = structureInstances.filter(
        (instance) =>
          !instanceUploads[instance.id] ||
          instanceUploads[instance.id].currentSitePhotos.length === 0,
      );
      if (missingSitePhotos.length > 0) {
        toastManager.add({
          title: `Please upload Current Site Photos for ${missingSitePhotos[0].title}.`,
          type: "error",
        });
        return;
      }
    } else {
      values.finalMeasurementDocs.forEach((file) => {
        flattenedFinalMeasurementDocs.push({ file, instanceId: null });
      });
      values.currentSitePhotos.forEach((file) => {
        flattenedSitePhotos.push({ file, instanceId: null });
      });
    }

    finalMeasurementMutation.mutate(
      {
        lead_id: data.id,
        account_id: data.accountId,
        vendor_id: vendorId!,
        created_by: userId!,
        critical_discussion_notes: values.criticalDiscussion,
        final_measurement_docs: flattenedFinalMeasurementDocs.map(
          ({ file }) => file,
        ),
        site_photos: flattenedSitePhotos.map(({ file }) => file),
        final_measurement_doc_instance_ids:
          flattenedFinalMeasurementDocs.map(({ instanceId }) => instanceId),
        site_photo_instance_ids: flattenedSitePhotos.map(
          ({ instanceId }) => instanceId,
        ),
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
          queryClient.invalidateQueries({
            queryKey: ["vendorUserTasks"],
          });
          queryClient.invalidateQueries({
            queryKey: ["vendorAllTasks"],
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

  const setInstanceFiles = React.useCallback(
    (
      instanceId: number,
      field: "finalMeasurementDocs" | "currentSitePhotos",
      files: File[],
    ) => {
      setInstanceUploads((prev) => ({
        ...prev,
        [instanceId]: {
          ...(prev[instanceId] ?? {
            finalMeasurementDocs: [],
            currentSitePhotos: [],
          }),
          [field]: files,
        },
      }));
    },
    [],
  );

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
          {isCustomVendorFlow && isStructureInstancesLoading ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Loading product instances...
            </div>
          ) : isMultiInstanceCustomFlow ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Instance Documents</h3>
                <p className="text-xs text-muted-foreground">
                  Upload Final Measurement documents and Current Site Photos
                  for each instance before submitting.
                </p>
              </div>

              <div className="grid gap-2">
                {structureInstances.map((instance) => {
                  const uploads = instanceUploads[instance.id] ?? {
                    finalMeasurementDocs: [],
                    currentSitePhotos: [],
                  };

                  return (
                    <Card key={instance.id}>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold">
                            {instance.title}
                          </h4>
                          {instance.productType?.type && (
                            <p className="text-xs text-muted-foreground">
                              {instance.productType.type}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <FormLabel className="text-sm">
                              Final Measurement Documents *
                            </FormLabel>
                            <FileUploadField
                              value={uploads.finalMeasurementDocs}
                              onChange={(files) =>
                                setInstanceFiles(
                                  instance.id,
                                  "finalMeasurementDocs",
                                  files.filter((file) =>
                                    documentMimeTypes.includes(file.type),
                                  ),
                                )
                              }
                              accept={documentAccept}
                              multiple
                              maxFiles={MAX_FINAL_MEASUREMENT_FILES}
                            />
                          </div>

                          <div className="space-y-2">
                            <FormLabel className="text-sm">
                              Current Site Photos *
                            </FormLabel>
                            <FileUploadField
                              value={uploads.currentSitePhotos}
                              onChange={(files) =>
                                setInstanceFiles(
                                  instance.id,
                                  "currentSitePhotos",
                                  files.filter((file) =>
                                    imageMimeTypes.includes(file.type),
                                  ),
                                )
                              }
                              accept={imageAccept}
                              multiple
                              maxFiles={MAX_FINAL_MEASUREMENT_FILES}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

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
