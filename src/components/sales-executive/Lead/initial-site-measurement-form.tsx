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
import { toastError } from "@/lib/utils";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { Card, CardContent } from "@/components/ui/card";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
    name: string;
  };
}

const formSchema = z
  .object({
    current_site_photos: z.any().optional(),

    upload_pdf: z.array(z.instanceof(File)).default([]),

    amount: z.number().optional(),
    payment_date: z.string().optional(),
    payment_image: z.any().optional(),
    payment_text: z.string().optional(),
  })
  // ✅ Replaced .refine() with granular .superRefine()
  .superRefine((data, ctx) => {
    const hasAmount = !!data.amount;
    const hasPaymentDate = !!data.payment_date;
    const hasPaymentText = !!data.payment_text?.trim();
    const hasPaymentImage =
      Array.isArray(data.payment_image) && data.payment_image.length > 0;

    const anyFieldFilled =
      hasAmount || hasPaymentDate || hasPaymentText || hasPaymentImage;

    if (anyFieldFilled) {
      // 💰 Amount missing
      if (!hasAmount) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Amount is required when adding payment details.",
        });
      }

      // 📅 Payment date missing
      if (!hasPaymentDate) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_date"],
          message: "Payment date is required when adding payment details.",
        });
      }

      // 📝 Payment text missing
      if (!hasPaymentText) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_text"],
          message:
            "Payment details text is required when adding payment details.",
        });
      }

      // 🖼️ Payment image missing
      if (!hasPaymentImage) {
        ctx.addIssue({
          code: "custom",
          path: ["payment_image"],
          message:
            "At least one payment image is required when adding payment details.",
        });
      }
    }
  });

type InitialSiteMeasurementFormValues = z.infer<typeof formSchema>;

const InitialSiteMeasuresMent: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const router = useRouter();

  const form = useForm<InitialSiteMeasurementFormValues>({
    resolver: zodResolver(formSchema) as unknown as any,
    defaultValues: {
      current_site_photos: [],
      upload_pdf: [],
      payment_image: [],
    },
  });

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const isCustomVendorFlowFromAuth = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const leadId = data?.id;
  const accountId = data?.accountId;
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
    Record<number, { current_site_photos: File[]; upload_pdf: File[] }>
  >({});

  React.useEffect(() => {
    if (!isMultiInstanceCustomFlow) {
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
  }, [isMultiInstanceCustomFlow, structureInstances]);

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
      handleReset();
      onOpenChange(false);

      // ✅ Redirect to Designing Stage
      router.push("/dashboard/leads/designing-stage");
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });

  const clientId = 1;

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

    if (isMultiInstanceCustomFlow) {
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

      const missingDocuments = structureInstances.filter(
        (instance) =>
          !instanceUploads[instance.id] ||
          instanceUploads[instance.id].upload_pdf.length === 0,
      );

      if (missingDocuments.length > 0) {
        toastManager.add({
          title: `Please upload Initial Site Measurement Document for ${missingDocuments[0].title}.`,
          type: "error",
        });
        return;
      }
    } else {
      values.current_site_photos?.forEach((file: File) => {
        flattenedSitePhotos.push({ file, instanceId: null });
      });

      values.upload_pdf.forEach((file: File) => {
        flattenedDocuments.push({ file, instanceId: null });
      });
    }

    if (flattenedDocuments.length === 0) {
      toastManager.add({
        title: "Please upload at least one document",
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("lead_id", leadId?.toString() || "");
    formData.append("account_id", accountId?.toString() || "");
    formData.append("vendor_id", vendorId?.toString() || "");
    formData.append("created_by", userId?.toString() || "");
    formData.append("client_id", clientId.toString() || "");
    formData.append("user_id", userId?.toString() || "");

    flattenedSitePhotos.forEach(({ file }) => {
      formData.append("current_site_photos", file);
    });
    formData.append(
      "current_site_photo_instance_ids",
      JSON.stringify(flattenedSitePhotos.map(({ instanceId }) => instanceId)),
    );

    flattenedDocuments.forEach(({ file }) => {
      formData.append("upload_pdf", file);
    });
    formData.append(
      "upload_pdf_instance_ids",
      JSON.stringify(flattenedDocuments.map(({ instanceId }) => instanceId)),
    );

    if (values.amount) {
      formData.append("amount", values.amount.toString());
    }
    if (values.payment_date) {
      formData.append("payment_date", values.payment_date);
    }
    if (values.payment_text) {
      formData.append("payment_text", values.payment_text);
    }
    values.payment_image?.forEach((file: File) => {
      formData.append("payment_image", file);
    });

    mutation.mutate(formData);

    queryClient.invalidateQueries({
      queryKey: ["allLeadDocuments"],
    });
  };

  const handleReset = () => {
    form.reset({
      current_site_photos: [],
      upload_pdf: [],
      amount: undefined,
      payment_date: undefined,
      payment_image: [],
      payment_text: "",
    });
    setInstanceUploads((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[Number(key)] = { current_site_photos: [], upload_pdf: [] };
      });
      return next;
    });
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {isCustomVendorFlow && isStructureInstancesLoading ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Loading product instances...
              </div>
            ) : isMultiInstanceCustomFlow ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Instance Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload current site photos and Initial Site Measurement
                    documents for each instance before submitting.
                  </p>
                </div>

                <div className="grid gap-2">
                  {structureInstances.map((instance) => {
                    const uploads = instanceUploads[instance.id] ?? {
                      current_site_photos: [],
                      upload_pdf: [],
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
                              <FormLabel className="text-sm">
                                Initial Site Measurement Document *
                              </FormLabel>
                              <SinglePdfUploadField
                                value={uploads.upload_pdf}
                                onChange={(files) =>
                                  setInstanceFiles(
                                    instance.id,
                                    "upload_pdf",
                                    Array.isArray(files)
                                      ? files
                                      : files
                                        ? [files]
                                        : [],
                                  )
                                }
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
                    <FormItem>
                      <FormLabel className="text-sm">Current Site Photos</FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                          accept=".png, .jpg, .jpeg, .gif"
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
                    <FormItem>
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
                  <FormItem className="w-full">
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
                  <FormItem className="w-full">
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
                <FormItem>
                  <FormLabel className="text-sm">Payment Details</FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      multiple={false}
                      accept=".png, .jpg, .jpeg, .gif"
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
                <FormItem>
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
