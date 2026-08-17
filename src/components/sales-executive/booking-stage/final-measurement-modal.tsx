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
import { useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";
import {
  useAddMoreFinalMeasurementFiles,
  useAddMoreFinalMeasurementSitePhotos,
} from "@/hooks/final-measurement/use-final-measurement";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useLeadById,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { Card, CardContent } from "@/components/ui/card";
import { FinalMeasurementDoc } from "@/types/final-measurement";
import {
  CheckCircle2,
  Loader2,
  Layers,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name?: string;
    accountId: number;
  };
}

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

const renameFinalMeasurementFiles = ({
  files,
  clientName,
  targetLabel,
  startIndex,
  uploadDate,
  prefix,
}: {
  files: File[];
  clientName: string;
  targetLabel: string;
  startIndex: number;
  uploadDate: string;
  prefix: "MD" | "CSP";
}) => {
  const safeClientName = sanitizeFileSegment(clientName || "Client");
  const safeTargetLabel = sanitizeFileSegment(targetLabel || "Furniture Type");

  return files.map(
    (file, index) =>
      new File(
        [file],
        `${prefix}${startIndex + index}-FM-${safeClientName}-${safeTargetLabel}-${uploadDate}${getFileExtension(
          file.name,
        )}`,
        {
          type: file.type,
          lastModified: file.lastModified,
        },
      ),
  );
};

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
  const handlesLargeScaleProjectsFromAuth = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isCustomDocNomenclatureEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_custom_doc_nomenclature_enabled === true,
  );
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const canUploadCurrentSitePhotos =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.current_site_photos.upload",
        )
      : true;

  const canUploadMeasurementDocuments =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.measurement_documents.upload",
        )
      : true;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalMeasurementDocs: [],
      currentSitePhotos: [],
      criticalDiscussion: "N/A",
    },
  });

  const finalMeasurementMutation = useFinalMeasurement();
  const addMoreFinalMeasurementDocsMutation = useAddMoreFinalMeasurementFiles();
  const addMoreFinalMeasurementSitePhotosMutation =
    useAddMoreFinalMeasurementSitePhotos();
  const leadId = data?.id;
  const { data: leadByIdResponse } = useLeadById(leadId, vendorId, userId);
  const { data: finalMeasurementDetails } = useFinalMeasurementLeadById(
    vendorId ?? 0,
    leadId ?? 0,
  );
  const leadById = leadByIdResponse?.data?.lead;
  const isCustomVendorFlow =
    isCustomVendorFlowFromAuth ||
    leadById?.createdBy?.vendor?.is_this_vendor_is_custom_usertype_only ===
      true ||
    leadById?.assignedTo?.vendor?.is_this_vendor_is_custom_usertype_only ===
      true;
  const handlesLargeScaleProjects =
    handlesLargeScaleProjectsFromAuth ||
    leadById?.createdBy?.vendor?.handlesLargeScaleProjects === true ||
    leadById?.assignedTo?.vendor?.handlesLargeScaleProjects === true;
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
  const isMultiInstanceUploadFlow =
    handlesLargeScaleProjects &&
    structureInstances.length > 1 &&
    (isCustomVendorFlow || isCustomDocNomenclatureEnabled);
  const isBoxesFlow =
    handlesLargeScaleProjects &&
    isCustomVendorFlow &&
    structureInstances.length > 0;
  const [uploadModalInstanceId, setUploadModalInstanceId] = React.useState<
    number | null
  >(null);
  const existingFinalMeasurementDocs = React.useMemo(
    () => finalMeasurementDetails?.measurementDocs ?? [],
    [finalMeasurementDetails?.measurementDocs],
  );
  const existingSitePhotos = React.useMemo(
    () => finalMeasurementDetails?.sitePhotos ?? [],
    [finalMeasurementDetails?.sitePhotos],
  );
  const [instanceUploads, setInstanceUploads] = React.useState<
    Record<number, { finalMeasurementDocs: File[]; currentSitePhotos: File[] }>
  >({});
  const [savedInstanceIds, setSavedInstanceIds] = React.useState<number[]>([]);
  const [uploadingInstanceId, setUploadingInstanceId] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    if (!isMultiInstanceUploadFlow) {
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
  }, [isMultiInstanceUploadFlow, structureInstances]);

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
    setSavedInstanceIds([]);
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
      const validFiles = nextFiles.filter((file) =>
        allowedTypes.includes(file.type),
      );

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

    if (isBoxesFlow) {
      const totalDocsUploaded = structureInstances.reduce((sum, instance) => {
        return (
          sum + getExistingFinalMeasurementDocsByInstance(instance.id).length
        );
      }, 0);

      if (totalDocsUploaded === 0) {
        toastManager.add({
          title: "At least one Final Measurement document is required",
          type: "error",
        });
        return;
      }
    } else if (isMultiInstanceUploadFlow) {
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
    } else {
      values.finalMeasurementDocs.forEach((file) => {
        flattenedFinalMeasurementDocs.push({ file, instanceId: null });
      });
      values.currentSitePhotos.forEach((file) => {
        flattenedSitePhotos.push({ file, instanceId: null });
      });

      if (flattenedFinalMeasurementDocs.length === 0) {
        form.setError("finalMeasurementDocs", {
          type: "manual",
          message: "At least one Final Measurement Document is required",
        });
        return;
      }

      if (flattenedSitePhotos.length === 0) {
        form.setError("currentSitePhotos", {
          type: "manual",
          message: "At least one site photo is required",
        });
        return;
      }
    }

    if (
      isMultiInstanceUploadFlow &&
      flattenedFinalMeasurementDocs.length === 0 &&
      flattenedSitePhotos.length === 0 &&
      !allInstancesAlreadyHaveRequiredUploads
    ) {
      // Check if at least one document exists
      const hasAnyDoc =
        existingFinalMeasurementDocs.length > 0 ||
        existingSitePhotos.length > 0;
      if (!hasAnyDoc) {
        toastManager.add({
          title:
            "Please upload at least one Final Measurement document or site photo.",
          type: "error",
        });
        return;
      }
    }

    const clientName =
      data?.name?.trim() ||
      leadById?.account?.name?.trim() ||
      [leadById?.firstname, leadById?.lastname]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Client";
    const furnitureTypeName =
      structureInstances[0]?.productType?.type?.trim() ||
      leadById?.productMappings?.[0]?.productType?.type?.trim() ||
      "Furniture Type";
    const singleInstanceTitle =
      structureInstances.length === 1
        ? structureInstances[0]?.title?.trim()
        : "";
    const uploadDate = formatFileDate(new Date());
    let measurementDocumentSequence = 0;
    let currentSitePhotoSequence = 0;

    const renamedFinalMeasurementDocs = flattenedFinalMeasurementDocs.map(
      ({ file, instanceId }) => {
        const instanceTitle = structureInstances.find(
          (instance) => instance.id === instanceId,
        )?.title;

        const renamedFile = isCustomDocNomenclatureEnabled
          ? renameFinalMeasurementFiles({
              files: [file],
              clientName,
              targetLabel:
                instanceTitle || singleInstanceTitle || furnitureTypeName,
              startIndex: measurementDocumentSequence,
              uploadDate,
              prefix: "MD",
            })[0]
          : file;

        if (isCustomDocNomenclatureEnabled) {
          measurementDocumentSequence += 1;
        }

        return renamedFile;
      },
    );

    const renamedSitePhotos = flattenedSitePhotos.map(
      ({ file, instanceId }) => {
        const instanceTitle = structureInstances.find(
          (instance) => instance.id === instanceId,
        )?.title;

        const renamedFile = isCustomDocNomenclatureEnabled
          ? renameFinalMeasurementFiles({
              files: [file],
              clientName,
              targetLabel:
                instanceTitle || singleInstanceTitle || furnitureTypeName,
              startIndex: currentSitePhotoSequence,
              uploadDate,
              prefix: "CSP",
            })[0]
          : file;

        if (isCustomDocNomenclatureEnabled) {
          currentSitePhotoSequence += 1;
        }

        return renamedFile;
      },
    );

    finalMeasurementMutation.mutate(
      {
        lead_id: data.id,
        account_id: data.accountId,
        vendor_id: vendorId!,
        created_by: userId!,
        critical_discussion_notes: values.criticalDiscussion,
        final_measurement_docs: renamedFinalMeasurementDocs,
        site_photos: renamedSitePhotos,
        final_measurement_doc_instance_ids: flattenedFinalMeasurementDocs.map(
          ({ instanceId }) => instanceId,
        ),
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
          const errorMessage =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Upload failed. Try again.";

          toastManager.add({
            title: errorMessage,
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

  const getExistingFinalMeasurementDocsByInstance = React.useCallback(
    (instanceId: number) =>
      existingFinalMeasurementDocs.filter(
        (doc: FinalMeasurementDoc) =>
          doc.product_structure_instance_id === instanceId,
      ),
    [existingFinalMeasurementDocs],
  );

  const getExistingSitePhotosByInstance = React.useCallback(
    (instanceId: number) =>
      existingSitePhotos.filter(
        (doc: FinalMeasurementDoc) =>
          doc.product_structure_instance_id === instanceId,
      ),
    [existingSitePhotos],
  );

  const handleInstanceUpload = React.useCallback(
    async (
      instance: LeadProductStructureInstance,
      type: "ALL" | "FMD" | "CSP" = "ALL",
    ) => {
      if (!leadId || !vendorId || !userId) {
        toastManager.add({
          title: "Lead or user context is missing.",
          type: "error",
        });
        return;
      }

      const uploads = instanceUploads[instance.id] ?? {
        finalMeasurementDocs: [],
        currentSitePhotos: [],
      };
      const existingDocs = getExistingFinalMeasurementDocsByInstance(
        instance.id,
      );
      const existingPhotos = getExistingSitePhotosByInstance(instance.id);

      if (type === "ALL" || type === "FMD") {
        if (
          !isCustomDocNomenclatureEnabled &&
          uploads.finalMeasurementDocs.length === 0 &&
          existingDocs.length === 0
        ) {
          toastManager.add({
            title: `Please upload Final Measurement Document for ${instance.title}.`,
            type: "error",
          });
          return;
        }
      }

      if (type === "ALL" || type === "CSP") {
        if (
          !isCustomDocNomenclatureEnabled &&
          uploads.currentSitePhotos.length === 0 &&
          existingPhotos.length === 0
        ) {
          toastManager.add({
            title: `Please upload Current Site Photos for ${instance.title}.`,
            type: "error",
          });
          return;
        }
      }

      if (type === "ALL") {
        if (
          uploads.finalMeasurementDocs.length === 0 &&
          uploads.currentSitePhotos.length === 0
        ) {
          toastManager.add({
            title: "No new files selected for this instance.",
            type: "error",
          });
          return;
        }
      } else if (type === "FMD") {
        if (uploads.finalMeasurementDocs.length === 0) {
          toastManager.add({
            title: "No new Final Measurement Documents selected.",
            type: "error",
          });
          return;
        }
      } else if (type === "CSP") {
        if (uploads.currentSitePhotos.length === 0) {
          toastManager.add({
            title: "No new Current Site Photos selected.",
            type: "error",
          });
          return;
        }
      }

      try {
        setUploadingInstanceId(instance.id);

        if (uploads.finalMeasurementDocs.length > 0) {
          await addMoreFinalMeasurementDocsMutation.mutateAsync({
            leadId,
            vendorId,
            createdBy: userId,
            productStructureInstanceId: instance.id,
            sitePhotos: uploads.finalMeasurementDocs,
          });
        }

        if (uploads.currentSitePhotos.length > 0) {
          await addMoreFinalMeasurementSitePhotosMutation.mutateAsync({
            leadId,
            vendorId,
            createdBy: userId,
            productStructureInstanceId: instance.id,
            sitePhotos: uploads.currentSitePhotos,
          });
        }

        toastManager.add({
          title: "Instance documents uploaded successfully!",
          type: "success",
        });
        setSavedInstanceIds((prev) =>
          prev.includes(instance.id) ? prev : [...prev, instance.id],
        );
        setInstanceUploads((prev) => ({
          ...prev,
          [instance.id]: {
            finalMeasurementDocs: [],
            currentSitePhotos: [],
          },
        }));
        queryClient.invalidateQueries({
          queryKey: ["finalMeasurementLead", vendorId, leadId],
        });
        queryClient.invalidateQueries({
          queryKey: ["allLeadDocuments"],
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to upload instance files.",
          type: "error",
        });
      } finally {
        setUploadingInstanceId(null);
      }
    },
    [
      addMoreFinalMeasurementDocsMutation,
      addMoreFinalMeasurementSitePhotosMutation,
      getExistingFinalMeasurementDocsByInstance,
      getExistingSitePhotosByInstance,
      instanceUploads,
      leadId,
      queryClient,
      userId,
      vendorId,
      setUploadModalInstanceId,
    ],
  );

  const allInstancesAlreadyHaveRequiredUploads = React.useMemo(() => {
    if (!isMultiInstanceUploadFlow || structureInstances.length === 0) {
      return false;
    }

    return structureInstances.every((instance) => {
      const hasExistingDocs =
        getExistingFinalMeasurementDocsByInstance(instance.id).length > 0;
      const hasExistingSitePhotos =
        getExistingSitePhotosByInstance(instance.id).length > 0;

      return hasExistingDocs && hasExistingSitePhotos;
    });
  }, [
    getExistingFinalMeasurementDocsByInstance,
    getExistingSitePhotosByInstance,
    isMultiInstanceUploadFlow,
    structureInstances,
  ]);

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={handleModalChange}
        title={`Final Measurement for ${data?.name || "Customer"}`}
        size="lg"
        description="Submit final measurement details with optional notes and attachments."
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5  p-5"
          >
            {/* Top Boxes: Product Structure Instances */}
            {isBoxesFlow && (
              <div className="space-y-3 border-b pb-5">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">
                    Product Instances ({structureInstances.length})
                  </h3>
                </div>
                {isStructureInstancesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 rounded-xl border border-muted bg-muted/20 animate-pulse"
                      />
                    ))}
                  </div>
                ) : structureInstances.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {structureInstances.map((instance) => {
                      const existingDocs =
                        getExistingFinalMeasurementDocsByInstance(instance.id);
                      const existingPhotos = getExistingSitePhotosByInstance(
                        instance.id,
                      );

                      return (
                        <div
                          key={instance.id}
                          onClick={() => setUploadModalInstanceId(instance.id)}
                          className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-muted/5 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors truncate">
                                {instance.title}
                              </h4>
                              {instance.productType?.type && (
                                <p className="text-xs font-medium text-muted-foreground truncate">
                                  {instance.productType.type}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {instance.quantity && (
                                <span className="text-[10px] font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                                  Qty: {instance.quantity}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-muted/65 pt-2">
                            <span className="text-muted-foreground font-medium">
                              Docs:{" "}
                              {existingDocs.length + existingPhotos.length}
                            </span>

                            <div className="shrink-0">
                              {existingDocs.length > 0 ||
                              existingPhotos.length > 0 ? (
                                <span className="inline-flex items-center justify-center border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white px-3.5 py-1 rounded-md text-[11px] font-semibold transition-all">
                                  View
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary px-3.5 py-1 rounded-md text-[11px] font-semibold transition-all">
                                  Upload
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground rounded-lg border border-dashed p-4 text-center">
                    No product instances found for this lead.
                  </div>
                )}
              </div>
            )}

            {handlesLargeScaleProjects &&
            (isCustomVendorFlow || isCustomDocNomenclatureEnabled) &&
            isStructureInstancesLoading ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Loading product instances...
              </div>
            ) : isBoxesFlow ? null : isMultiInstanceUploadFlow ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Instance Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload Final Measurement documents and Current Site Photos
                    for the relevant instance before submitting.
                  </p>
                </div>

                <div className="grid gap-2">
                  {structureInstances.map((instance) => {
                    const uploads = instanceUploads[instance.id] ?? {
                      finalMeasurementDocs: [],
                      currentSitePhotos: [],
                    };
                    const existingInstanceDocs =
                      getExistingFinalMeasurementDocsByInstance(instance.id);
                    const existingInstanceSitePhotos =
                      getExistingSitePhotosByInstance(instance.id);

                    return (
                      <Card
                        key={instance.id}
                        className="min-w-0 overflow-hidden"
                      >
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
                            {savedInstanceIds.includes(instance.id) && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Saved
                              </div>
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

                          {(existingInstanceDocs.length > 0 ||
                            existingInstanceSitePhotos.length > 0) && (
                            <div className="space-y-4 rounded-xl border border-dashed p-4">
                              <div>
                                <h5 className="text-sm font-semibold">
                                  Uploaded Files
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  These files are already saved for this
                                  instance.
                                </p>
                              </div>

                              {existingInstanceDocs.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Final Measurement Documents
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {existingInstanceDocs.map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="w-full sm:w-fit max-w-full min-w-0"
                                      >
                                        <DocumentCard
                                          doc={{
                                            id: doc.id,
                                            originalName: doc.doc_og_name,
                                            signedUrl: doc.signedUrl,
                                            created_at: doc.created_at,
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {existingInstanceSitePhotos.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Current Site Photos
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {existingInstanceSitePhotos.map(
                                      (doc, index) => (
                                        <div
                                          key={doc.id}
                                          className="w-full sm:w-fit max-w-full min-w-0"
                                        >
                                          <ImageComponent
                                            doc={{
                                              id: doc.id,
                                              doc_og_name: doc.doc_og_name,
                                              signedUrl: doc.signedUrl,
                                              created_at: doc.created_at,
                                            }}
                                            index={index}
                                          />
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            {isCustomDocNomenclatureEnabled ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    handleInstanceUpload(instance, "FMD")
                                  }
                                  disabled={
                                    uploadingInstanceId === instance.id &&
                                    addMoreFinalMeasurementDocsMutation.isPending
                                  }
                                >
                                  {uploadingInstanceId === instance.id &&
                                  addMoreFinalMeasurementDocsMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    "Upload Documents"
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    handleInstanceUpload(instance, "CSP")
                                  }
                                  disabled={
                                    uploadingInstanceId === instance.id &&
                                    addMoreFinalMeasurementSitePhotosMutation.isPending
                                  }
                                >
                                  {uploadingInstanceId === instance.id &&
                                  addMoreFinalMeasurementSitePhotosMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    "Upload Photos"
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  handleInstanceUpload(instance, "ALL")
                                }
                                disabled={
                                  uploadingInstanceId === instance.id &&
                                  (addMoreFinalMeasurementDocsMutation.isPending ||
                                    addMoreFinalMeasurementSitePhotosMutation.isPending)
                                }
                              >
                                {uploadingInstanceId === instance.id &&
                                (addMoreFinalMeasurementDocsMutation.isPending ||
                                  addMoreFinalMeasurementSitePhotosMutation.isPending) ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  "Upload This Instance"
                                )}
                              </Button>
                            )}
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
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button
                type="submit"
                disabled={finalMeasurementMutation.isPending}
              >
                {finalMeasurementMutation.isPending
                  ? "Submitting..."
                  : existingFinalMeasurementDocs.length > 0 ||
                      existingSitePhotos.length > 0
                    ? "Move to Client Document"
                    : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </BaseModal>

      {/* Instance Upload Modal */}
      <BaseModal
        open={!!uploadModalInstanceId}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setUploadModalInstanceId(null);
          }
        }}
        title={
          structureInstances.find((i) => i.id === uploadModalInstanceId)
            ?.title || "Upload Instance Documents"
        }
        description="Upload current site photos and Final Measurement documents for this instance."
        size="xl"
      >
        {(() => {
          const instance = structureInstances.find(
            (i) => i.id === uploadModalInstanceId,
          );
          if (!instance) return null;

          const uploads = instanceUploads[instance.id] ?? {
            finalMeasurementDocs: [],
            currentSitePhotos: [],
          };
          const existingInstanceDocs =
            getExistingFinalMeasurementDocsByInstance(instance.id);
          const existingInstanceSitePhotos = getExistingSitePhotosByInstance(
            instance.id,
          );

          return (
            <div className="p-0">
              <div className="grid md:grid-cols-2 border-b">
                {/* Left Column: Site Photos */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5w-5" />
                    <h3 className="font-semibold text-sm">Site Photos</h3>
                  </div>

                  {canUploadCurrentSitePhotos && (
                    <div className="space-y-4">
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

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setInstanceFiles(
                              instance.id,
                              "currentSitePhotos",
                              [],
                            )
                          }
                          disabled={uploads.currentSitePhotos.length === 0}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleInstanceUpload(instance, "CSP")}
                          disabled={
                            (uploadingInstanceId === instance.id &&
                              addMoreFinalMeasurementSitePhotosMutation.isPending) ||
                            uploads.currentSitePhotos.length === 0
                          }
                        >
                          {uploadingInstanceId === instance.id &&
                          addMoreFinalMeasurementSitePhotosMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {existingInstanceSitePhotos.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Saved Photos
                      </h4>
                      <div className="grid gap-3 ">
                        {existingInstanceSitePhotos.map((doc, index) => (
                          <div key={doc.id} className="w-full min-w-0">
                            <ImageComponent
                              doc={{
                                id: doc.id,
                                doc_og_name: doc.doc_og_name,
                                signedUrl: doc.signedUrl,
                                created_at: doc.created_at,
                              }}
                              index={index}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Measurement Docs */}
                <div className="p-5 space-y-2 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-semibold text-sm">
                      Final Measurement Documents
                    </h3>
                  </div>

                  {canUploadMeasurementDocuments && (
                    <div className="space-y-4">
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

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setInstanceFiles(
                              instance.id,
                              "finalMeasurementDocs",
                              [],
                            )
                          }
                          disabled={uploads.finalMeasurementDocs.length === 0}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleInstanceUpload(instance, "FMD")}
                          disabled={
                            (uploadingInstanceId === instance.id &&
                              addMoreFinalMeasurementDocsMutation.isPending) ||
                            uploads.finalMeasurementDocs.length === 0
                          }
                        >
                          {uploadingInstanceId === instance.id &&
                          addMoreFinalMeasurementDocsMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {existingInstanceDocs.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Saved Documents
                      </h4>
                      <div className="grid gap-3">
                        {existingInstanceDocs.map((doc) => (
                          <div key={doc.id} className="w-full min-w-0">
                            <DocumentCard
                              doc={{
                                id: doc.id,
                                originalName: doc.doc_og_name,
                                signedUrl: doc.signedUrl,
                                created_at: doc.created_at,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end p-4">
                <Button
                  type="button"
                  onClick={() => setUploadModalInstanceId(null)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white w-24"
                >
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </BaseModal>
    </>
  );
};

export default FinalMeasurementModal;
