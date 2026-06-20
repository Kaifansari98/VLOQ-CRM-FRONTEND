"use client";

import React from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { FileUploadField } from "../../custom/file-upload";
import { Button } from "../../ui/button";
import { useAppSelector } from "@/redux/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadInitialSiteMeasurement } from "@/api/leads";
import { toastManager } from "@/components/ui/toast";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { SinglePdfUploadField } from "@/components/utils/single-pdf-uploader";
import BaseModal from "@/components/utils/baseModal";
import { useRouter } from "next/navigation";
import CurrencyInput from "@/components/custom/CurrencyInput";
import { toastError, cn } from "@/lib/utils";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSiteMeasurementLeadById } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import DocumentCard from "@/components/utils/documentCard";
import { ImageComponent } from "@/components/utils/ImageCard";
import { SiteMeasurementFile } from "@/types/site-measrument-types";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
    name: string;
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

const renameIsmFiles = ({
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
        `${prefix}${startIndex + index}-ISM-${safeClientName}-${safeTargetLabel}-${uploadDate}${getFileExtension(
          file.name,
        )}`,
        {
          type: file.type,
          lastModified: file.lastModified,
        },
      ),
  );
};

const formSchema = z
  .object({
    current_site_photos: z.any().optional(),

    upload_pdf: z.array(z.instanceof(File)).default([]),

    amount: z.number().optional(),
    payment_date: z.string().optional(),
    payment_image: z.any().optional(),
    payment_text: z.string().optional(),
  });

type InitialSiteMeasurementFormValues = z.infer<typeof formSchema>;

const InitialSiteMeasuresMent: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const router = useRouter();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const isCustomVendorFlowFromAuth = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const isCustomDocNomenclatureEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_custom_doc_nomenclature_enabled === true,
  );
  const leadId = data?.id;
  const accountId = data?.accountId;
  const { data: leadByIdResponse } = useLeadById(leadId, vendorId, userId);
  const { data: siteMeasurementDetails } = useSiteMeasurementLeadById(
    leadId ?? 0,
  );
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
  const isMultiInstanceUploadFlow =
    structureInstances.length > 1 &&
    (isCustomVendorFlow || isCustomDocNomenclatureEnabled);

  const dynamicFormSchema = React.useMemo(() => {
    return z
      .object({
        current_site_photos: z.any().optional(),
        upload_pdf: isMultiInstanceUploadFlow
          ? z.array(z.instanceof(File)).default([])
          : z.array(z.instanceof(File)).min(1, "Please upload at least one document"),
        amount: z.number().optional(),
        payment_date: z.string().optional(),
        payment_image: z.any().optional(),
        payment_text: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        const hasAmount = !!data.amount;
        const hasPaymentDate = !!data.payment_date;
        const hasPaymentText = !!data.payment_text?.trim();
        const hasPaymentImage =
          Array.isArray(data.payment_image) && data.payment_image.length > 0;

        const anyFieldFilled =
          hasAmount || hasPaymentDate || hasPaymentText || hasPaymentImage;

        if (anyFieldFilled) {
          if (!hasAmount) {
            ctx.addIssue({
              code: "custom",
              path: ["amount"],
              message: "Amount is required when adding payment details.",
            });
          }
          if (!hasPaymentDate) {
            ctx.addIssue({
              code: "custom",
              path: ["payment_date"],
              message: "Payment date is required when adding payment details.",
            });
          }
          if (!hasPaymentText) {
            ctx.addIssue({
              code: "custom",
              path: ["payment_text"],
              message: "Payment details text is required when adding payment details.",
            });
          }
          if (!hasPaymentImage) {
            ctx.addIssue({
              code: "custom",
              path: ["payment_image"],
              message: "At least one payment image is required when adding payment details.",
            });
          }
        }
      });
  }, [isMultiInstanceUploadFlow]);

  const form = useForm<InitialSiteMeasurementFormValues>({
    resolver: zodResolver(dynamicFormSchema) as unknown as any,
    defaultValues: {
      current_site_photos: [],
      upload_pdf: [],
      payment_image: [],
    },
  });
  const existingSitePhotos = React.useMemo(
    () => siteMeasurementDetails?.current_site_photos ?? [],
    [siteMeasurementDetails?.current_site_photos],
  );
  const existingMeasurementDocs = React.useMemo(
    () => siteMeasurementDetails?.initial_site_measurement_documents ?? [],
    [siteMeasurementDetails?.initial_site_measurement_documents],
  );
  const [instanceUploads, setInstanceUploads] = React.useState<
    Record<number, { current_site_photos: File[]; upload_pdf: File[] }>
  >({});
  const [savedInstanceIds, setSavedInstanceIds] = React.useState<number[]>([]);
  const [uploadingInstanceId, setUploadingInstanceId] = React.useState<
    number | null
  >(null);
  const [multiInstanceErrors, setMultiInstanceErrors] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!isMultiInstanceUploadFlow) {
      setInstanceUploads({});
      return;
    }

    setInstanceUploads((prev) => {
      const next: Record<
        number,
        { current_site_photos: File[]; upload_pdf: File[] }
      > = {};

      for (const instance of structureInstances) {
        next[instance.id] = prev[instance.id] ?? {
          current_site_photos: [],
          upload_pdf: [],
        };
      }

      return next;
    });
  }, [isMultiInstanceUploadFlow, structureInstances]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: uploadInitialSiteMeasurement,
    onSuccess: () => {
      toastManager.add({
        title: "Initial Site Measurement Upload Successfully!",
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
        queryKey: ["vendorUserTasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorAllTasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeadDetails", leadId],
      });
      handleReset();
      onOpenChange(false);

      // ✅ Redirect to Designing Stage
      router.push("/dashboard/leads/designing-stage");
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });
  const partialInstanceMutation = useMutation({
    mutationFn: uploadInitialSiteMeasurement,
    onSuccess: () => {
      toastManager.add({
        title: "Instance documents uploaded successfully!",
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
        queryKey: ["vendorUserTasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorAllTasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["allLeadDocuments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["siteMeasurementLeadDetails", leadId],
      });
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });

  const clientId = 1;

  const clientName = React.useMemo(
    () =>
      data?.name?.trim() ||
      leadById?.account?.name?.trim() ||
      [leadById?.firstname, leadById?.lastname].filter(Boolean).join(" ").trim() ||
      "Client",
    [data?.name, leadById],
  );
  const furnitureTypeName = React.useMemo(
    () =>
      structureInstances[0]?.productType?.type?.trim() ||
      leadById?.productMappings?.[0]?.productType?.type?.trim() ||
      "Furniture Type",
    [leadById, structureInstances],
  );
  const singleInstanceTitle = React.useMemo(
    () => (structureInstances.length === 1 ? structureInstances[0]?.title?.trim() : ""),
    [structureInstances],
  );

  const buildInitialSiteMeasurementPayload = React.useCallback(
    ({
      sitePhotos,
      documents,
      values,
    }: {
      sitePhotos: Array<{ file: File; instanceId: number | null }>;
      documents: Array<{ file: File; instanceId: number | null }>;
      values?: InitialSiteMeasurementFormValues;
    }) => {
      const uploadDate = formatFileDate(new Date());
      let currentSitePhotoSequence = 0;
      let measurementDocumentSequence = 0;
      const formData = new FormData();

      formData.append("lead_id", leadId?.toString() || "");
      formData.append("account_id", accountId?.toString() || "");
      formData.append("vendor_id", vendorId?.toString() || "");
      formData.append("created_by", userId?.toString() || "");
      formData.append("client_id", clientId.toString() || "");
      formData.append("user_id", userId?.toString() || "");

      sitePhotos.forEach(({ file, instanceId }) => {
        const instanceTitle = structureInstances.find(
          (instance) => instance.id === instanceId,
        )?.title;
        const renamedFile = isCustomDocNomenclatureEnabled
          ? renameIsmFiles({
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
        formData.append("current_site_photos", renamedFile);
      });
      formData.append(
        "current_site_photo_instance_ids",
        JSON.stringify(sitePhotos.map(({ instanceId }) => instanceId)),
      );

      documents.forEach(({ file, instanceId }) => {
        const instanceTitle = structureInstances.find(
          (instance) => instance.id === instanceId,
        )?.title;
        const renamedFile = isCustomDocNomenclatureEnabled
          ? renameIsmFiles({
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
        formData.append("upload_pdf", renamedFile);
      });
      formData.append(
        "upload_pdf_instance_ids",
        JSON.stringify(documents.map(({ instanceId }) => instanceId)),
      );

      if (values?.amount) {
        formData.append("amount", values.amount.toString());
      }
      if (values?.payment_date) {
        formData.append("payment_date", values.payment_date);
      }
      if (values?.payment_text) {
        formData.append("payment_text", values.payment_text);
      }
      values?.payment_image?.forEach((file: File) => {
        formData.append("payment_image", file);
      });

      return formData;
    },
    [
      accountId,
      clientId,
      clientName,
      furnitureTypeName,
      isCustomDocNomenclatureEnabled,
      leadId,
      singleInstanceTitle,
      structureInstances,
      userId,
      vendorId,
    ],
  );

  const getExistingSitePhotosByInstance = React.useCallback(
    (instanceId: number) =>
      existingSitePhotos.filter(
        (doc: SiteMeasurementFile) =>
          doc.product_structure_instance_id === instanceId,
      ),
    [existingSitePhotos],
  );

  const getExistingMeasurementDocsByInstance = React.useCallback(
    (instanceId: number) =>
      existingMeasurementDocs.filter(
        (doc: SiteMeasurementFile) =>
          doc.product_structure_instance_id === instanceId,
      ),
    [existingMeasurementDocs],
  );

  const allInstancesAlreadyHaveRequiredUploads = React.useMemo(() => {
    if (!isMultiInstanceUploadFlow || structureInstances.length === 0) {
      return false;
    }

    return structureInstances.every((instance) => {
      const hasExistingDocuments =
        getExistingMeasurementDocsByInstance(instance.id).length > 0;
      const hasSavedThisSession = savedInstanceIds.includes(instance.id);

      return hasExistingDocuments || hasSavedThisSession;
    });
  }, [
    getExistingMeasurementDocsByInstance,
    isMultiInstanceUploadFlow,
    structureInstances,
    savedInstanceIds,
  ]);

  const handleInstanceUpload = async (instance: LeadProductStructureInstance) => {
    if (!leadId || !accountId) {
      toastManager.add({
        title: "Lead or account data is missing!",
        type: "error",
      });
      return;
    }

    const uploads = instanceUploads[instance.id] ?? {
      current_site_photos: [],
      upload_pdf: [],
    };

    if (uploads.upload_pdf.length === 0) {
      toastManager.add({
        title: `Please upload Initial Site Measurement Document for ${instance.title}.`,
        type: "error",
      });
      return;
    }

    const formData = buildInitialSiteMeasurementPayload({
      sitePhotos: uploads.current_site_photos.map((file) => ({
        file,
        instanceId: instance.id,
      })),
      documents: uploads.upload_pdf.map((file) => ({
        file,
        instanceId: instance.id,
      })),
    });
    formData.append("skip_status_update", "true");

    try {
      setUploadingInstanceId(instance.id);
      await partialInstanceMutation.mutateAsync(formData);
      setSavedInstanceIds((prev) =>
        prev.includes(instance.id) ? prev : [...prev, instance.id],
      );
      setInstanceUploads((prev) => ({
        ...prev,
        [instance.id]: { current_site_photos: [], upload_pdf: [] },
      }));
    } finally {
      setUploadingInstanceId(null);
    }
  };

  const onSubmit = (values: InitialSiteMeasurementFormValues) => {
    if (!leadId || !accountId) {
      toastManager.add({
        title: "Lead or account data is missing!",
        type: "error",
      });
      return;
    }

    const flattenedSitePhotos: Array<{ file: File; instanceId: number | null }> =
      [];
    const flattenedDocuments: Array<{ file: File; instanceId: number | null }> =
      [];

    if (isMultiInstanceUploadFlow) {
      for (const instance of structureInstances) {
        const uploads = instanceUploads[instance.id] ?? {
          current_site_photos: [],
          upload_pdf: [],
        };

        uploads.current_site_photos.forEach((file) => {
          flattenedSitePhotos.push({ file, instanceId: instance.id });
        });
        uploads.upload_pdf.forEach((file) => {
          flattenedDocuments.push({ file, instanceId: instance.id });
        });
      }

      const missingRequiredUploads = structureInstances.filter((instance) => {
        const uploads = instanceUploads[instance.id] ?? {
          current_site_photos: [],
          upload_pdf: [],
        };
        const hasSavedThisSession = savedInstanceIds.includes(instance.id);
        const hasExistingSitePhotos =
          getExistingSitePhotosByInstance(instance.id).length > 0;
        const hasExistingDocuments =
          getExistingMeasurementDocsByInstance(instance.id).length > 0;
        const hasLocalSitePhotos = uploads.current_site_photos.length > 0;
        const hasLocalDocuments = uploads.upload_pdf.length > 0;

        const hasRequiredDocuments =
          hasSavedThisSession || hasExistingDocuments || hasLocalDocuments;

        return !hasRequiredDocuments;
      });

      if (missingRequiredUploads.length > 0) {
        const missingIds = missingRequiredUploads.map((i) => i.id);
        setMultiInstanceErrors(missingIds);

        const firstMissing = missingRequiredUploads[0];
        toastManager.add({
          title: `Please upload all required ISM files for ${firstMissing.title}.`,
          type: "error",
        });

        setTimeout(() => {
          const el = document.getElementById(`instance-${firstMissing.id}`);
          if (el) {
            const isHidden = el.getBoundingClientRect().height === 0;
            const targetScrollEl = isHidden ? (el.parentElement || el) : el;

            const scrollContainer = targetScrollEl.closest("[data-radix-scroll-area-viewport]") || targetScrollEl.closest("form");
            if (scrollContainer instanceof HTMLElement) {
              const containerRect = scrollContainer.getBoundingClientRect();
              const elRect = targetScrollEl.getBoundingClientRect();
              const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - (containerRect.height / 2) + (elRect.height / 2);
              scrollContainer.scrollTo({
                top: scrollOffset,
                behavior: "smooth",
              });
            } else {
              targetScrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
        }, 100);

        return;
      }
      setMultiInstanceErrors([]);
    } else {
      values.current_site_photos?.forEach((file: File) => {
        flattenedSitePhotos.push({ file, instanceId: null });
      });

      values.upload_pdf.forEach((file: File) => {
        flattenedDocuments.push({ file, instanceId: null });
      });
    }

    if (!isMultiInstanceUploadFlow && flattenedDocuments.length === 0) {
      toastManager.add({
        title: "Please upload at least one document",
        type: "error",
      });
      return;
    }

    if (
      isMultiInstanceUploadFlow &&
      flattenedDocuments.length === 0 &&
      flattenedSitePhotos.length === 0
    ) {
      if (
        isCustomVendorFlowFromAuth &&
        !allInstancesAlreadyHaveRequiredUploads
      ) {
        toastManager.add({
          title: "Please upload all required ISM files for every instance.",
          type: "error",
        });
        return;
      }

      mutation.mutate(
        buildInitialSiteMeasurementPayload({
          sitePhotos: [],
          documents: [],
          values,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ["allLeadDocuments"],
      });
      return;
    }

    const formData = buildInitialSiteMeasurementPayload({
      sitePhotos: flattenedSitePhotos,
      documents: flattenedDocuments,
      values,
    });

    mutation.mutate(formData);

    queryClient.invalidateQueries({
      queryKey: ["allLeadDocuments"],
    });
  };

  const handleReset = React.useCallback(() => {
    form.reset({
      current_site_photos: [],
      upload_pdf: [],
      amount: undefined,
      payment_date: undefined,
      payment_image: [],
      payment_text: "",
    });
    form.clearErrors();
    setInstanceUploads((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[Number(key)] = { current_site_photos: [], upload_pdf: [] };
      });
      return next;
    });
    setSavedInstanceIds([]);
  }, [form]);

  React.useEffect(() => {
    handleReset();
  }, [open, handleReset]);

  const setInstanceFiles = (
    instanceId: number,
    field: "current_site_photos" | "upload_pdf",
    files: File[],
  ) => {
    setInstanceUploads((prev) => ({
      ...prev,
      [instanceId]: {
        ...(prev[instanceId] ?? { current_site_photos: [], upload_pdf: [] }),
        [field]: files,
      },
    }));
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Initial Site Measurement Form "
      description="Fill the below fields to send this lead to initial site measurement form"
      size="lg"
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const errorKeys = Object.keys(errors);
              if (errorKeys.length > 0) {
                const firstErrorKey = errorKeys[0];
                const el = document.querySelector(`[data-name="${firstErrorKey}"]`);
                if (el) {
                  const isHidden = el.getBoundingClientRect().height === 0;
                  const targetScrollEl = isHidden ? (el.parentElement || el) : el;
                  
                  const scrollContainer = targetScrollEl.closest("[data-radix-scroll-area-viewport]") || targetScrollEl.closest("form");
                  if (scrollContainer instanceof HTMLElement) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const elRect = targetScrollEl.getBoundingClientRect();
                    const scrollOffset = elRect.top - containerRect.top + scrollContainer.scrollTop - (containerRect.height / 2) + (elRect.height / 2);
                    scrollContainer.scrollTo({
                      top: scrollOffset,
                      behavior: "smooth",
                    });
                  } else {
                    targetScrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  }

                  const focusable = el.querySelector("input, select, textarea, button");
                  if (focusable instanceof HTMLElement) {
                    focusable.focus({ preventScroll: true });
                  }
                }
              }
            })}
            className="space-y-5"
          >
            {(isCustomVendorFlow || isCustomDocNomenclatureEnabled) &&
            isStructureInstancesLoading ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Loading product instances...
              </div>
            ) : isMultiInstanceUploadFlow ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Instance Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload current site photos and Initial Site Measurement
                    documents for the relevant instance before submitting.
                  </p>
                </div>

                <div className="grid gap-2">
                  {structureInstances.map((instance) => {
                    const uploads = instanceUploads[instance.id] ?? {
                      current_site_photos: [],
                      upload_pdf: [],
                    };
                    const existingInstanceSitePhotos =
                      getExistingSitePhotosByInstance(instance.id);
                    const existingInstanceMeasurementDocs =
                      getExistingMeasurementDocsByInstance(instance.id);

                    return (
                      <Card key={instance.id} id={`instance-${instance.id}`} className="min-w-0 overflow-hidden">
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
                                Current Site Photos
                              </FormLabel>
                              <FileUploadField
                                value={uploads.current_site_photos}
                                onChange={(files) =>
                                  setInstanceFiles(
                                    instance.id,
                                    "current_site_photos",
                                    files,
                                  )
                                }
                                accept=".png, .jpg, .jpeg, .gif"
                              />
                              <FormDescription className="text-xs">
                                Upload photos for this instance.
                              </FormDescription>
                            </div>

                            <div className="space-y-2">
                              <FormLabel className={cn("text-sm", multiInstanceErrors.includes(instance.id) ? "text-destructive" : "")}>
                                Initial Site Measurement Document *
                              </FormLabel>
                              <SinglePdfUploadField
                                value={uploads.upload_pdf}
                                invalid={multiInstanceErrors.includes(instance.id)}
                                onChange={(files) => {
                                  setMultiInstanceErrors((prev) => prev.filter(id => id !== instance.id));
                                  setInstanceFiles(
                                    instance.id,
                                    "upload_pdf",
                                    Array.isArray(files)
                                      ? files
                                      : files
                                        ? [files]
                                        : [],
                                  );
                                }}
                                allowedMimeTypes={[]}
                                accept="*/*"
                                title="Upload Measurement Document"
                                description="Any file type allowed. Upload one or more files."
                                buttonLabel="Select File"
                                multiple
                                maxFiles={10}
                              />
                            </div>
                          </div>

                          {(existingInstanceSitePhotos.length > 0 ||
                            existingInstanceMeasurementDocs.length > 0) && (
                            <div className="space-y-4 rounded-xl border border-dashed p-4">
                              <div>
                                <h5 className="text-sm font-semibold">
                                  Uploaded Files
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  These files are already saved for this instance.
                                </p>
                              </div>

                              {existingInstanceSitePhotos.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Current Site Photos
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {existingInstanceSitePhotos.map((
                                      doc: SiteMeasurementFile,
                                      index: number,
                                    ) => (
                                      <div
                                        key={doc.id}
                                        className="w-full sm:w-[300px] md:w-[350px] max-w-full min-w-0"
                                      >
                                        <ImageComponent
                                          doc={{
                                            id: doc.id,
                                            doc_og_name: doc.originalName,
                                            signedUrl: doc.signedUrl,
                                            created_at: doc.uploadedAt,
                                          }}
                                          index={index}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {existingInstanceMeasurementDocs.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Initial Site Measurement Documents
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {existingInstanceMeasurementDocs.map(
                                      (doc: SiteMeasurementFile) => (
                                      <div
                                        key={doc.id}
                                        className="w-full sm:w-[300px] md:w-[350px] max-w-full"
                                      >
                                        <DocumentCard
                                          doc={{
                                            id: doc.id,
                                            originalName: doc.originalName,
                                            signedUrl: doc.signedUrl,
                                            created_at: doc.uploadedAt,
                                          }}
                                        />
                                      </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleInstanceUpload(instance)}
                              disabled={
                                partialInstanceMutation.isPending &&
                                uploadingInstanceId === instance.id
                              }
                            >
                              {partialInstanceMutation.isPending &&
                              uploadingInstanceId === instance.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                "Upload This Instance"
                              )}
                            </Button>
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
                  name="current_site_photos"
                  render={({ field }) => (
                    <FormItem data-name="current_site_photos">
                      <FormLabel className="text-sm">Current Site Photos</FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                          accept=".png, .jpg, .jpeg, .gif"
                          invalid={!!form.formState.errors.current_site_photos}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Upload photos or documents.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="upload_pdf"
                  render={({ field }) => (
                    <FormItem data-name="upload_pdf">
                      <FormLabel className="text-sm">
                        Initial Site Measurement Document *
                      </FormLabel>
                      <FormControl>
                        <SinglePdfUploadField
                          value={field.value}
                          onChange={field.onChange}
                          allowedMimeTypes={[]}
                          accept="*/*"
                          title="Upload Measurement Document"
                          description="Any file type allowed. Upload one or more files."
                          buttonLabel="Select File"
                          multiple
                          maxFiles={10}
                          invalid={!!form.formState.errors.upload_pdf}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className={cn("w-full", form.formState.errors.amount && "text-destructive [&_input]:border-destructive [&_input]:focus-visible:ring-destructive")} data-name="amount">
                    <FormLabel className="text-sm">
                      Initial Site Measurement Payable Amount
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(val === undefined ? undefined : val)
                        }
                        placeholder="Enter payable amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className={cn("w-full", form.formState.errors.payment_date && "text-destructive [&_button]:border-destructive [&_button]:focus-visible:ring-destructive")} data-name="payment_date">
                    <FormLabel className="text-sm">
                      Initial Site Measurement Amount Payment Date
                    </FormLabel>
                    <FormControl>
                      <CustomeDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        restriction="pastOnly"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Image */}
            <FormField
              control={form.control}
              name="payment_image"
              render={({ field }) => (
                <FormItem data-name="payment_image">
                  <FormLabel className="text-sm">Payment Details</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      multiple={false}
                      accept=".png, .jpg, .jpeg, .gif"
                      invalid={!!form.formState.errors.payment_image}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Upload photos or documents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Text */}
            <FormField
              control={form.control}
              name="payment_text"
              render={({ field }) => (
                <FormItem className={cn(form.formState.errors.payment_text && "text-destructive [&_textarea]:border-destructive [&_textarea]:focus-visible:ring-destructive")} data-name="payment_text">
                  <FormLabel className="text-sm">
                    Payment Details Text
                  </FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your payment details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="py-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default InitialSiteMeasuresMent;
