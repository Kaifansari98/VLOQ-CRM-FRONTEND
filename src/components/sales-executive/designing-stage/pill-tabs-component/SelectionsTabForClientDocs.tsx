"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useEditSelectionData,
  useLeadStatus,
  useSelectionData,
  useSubmitSelection,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useAppSelector } from "@/redux/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "react-toastify";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DesignSelection } from "@/types/designing-stage-types";
import { useQueryClient } from "@tanstack/react-query";
import { canUpdateDessingStageSelectionInputs } from "@/components/utils/privileges";
import TextAreaInput from "@/components/origin-text-area";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
import { useUploadClientDocumentation } from "@/hooks/final-measurement/use-final-measurement";
import {
  useClientDocumentationDetails,
  useMoveLeadToClientApproval,
} from "@/hooks/client-documentation/use-clientdocumentation";
import {
  CheckCircle2,
  FolderOpen,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteDocument } from "@/api/leads";

interface Props {
  leadId: number;
  accountId: number;
  onInstanceChange?: (instance: LeadProductStructureInstance | null) => void;
}

const formSchema = z
  .object({
    carcas: z.string().optional(),
    shutter: z.string().optional(),
    handles: z.string().optional(),
  });

const instanceUploadSchema = z.object({
  pptDocuments: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one Project file"),
  pythaDocuments: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one Pytha file"),
});

type FormValues = z.infer<typeof formSchema>;
type InstanceUploadValues = z.infer<typeof instanceUploadSchema>;

const SelectionsTabForClientDocs: React.FC<Props> = ({
  leadId,
  accountId,
  onInstanceChange,
}) => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const rawUserType = useAppSelector((s) => s.auth.user?.user_type.user_type);
  const userType = rawUserType?.toLowerCase() ?? "";
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createSelection, isPending: isCreating } =
    useSubmitSelection();
  const { mutate: editSelection, isPending: isEditing } =
    useEditSelectionData();
  const {
    data: selectionsData,
    isLoading,
    isError,
    refetch,
  } = useSelectionData(vendorId!, leadId!);
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId
  );
  const { data: docsDetails } = useClientDocumentationDetails(vendorId!, leadId);
  const { mutateAsync: uploadClientDocs, isPending: isUploadingDocs } =
    useUploadClientDocumentation();
  const { mutate: moveToClientApproval, isPending: isMovingStage } =
    useMoveLeadToClientApproval();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const leadStatus = String(leadData?.status || "").toLowerCase();
  const leadStatusTag = String((leadData as any)?.status_tag || "").toLowerCase();
  const isClientDocumentationStage =
    leadStatus === "client-documentation-stage" ||
    leadStatus === "client-documentation" ||
    leadStatus === "client documentation" ||
    leadStatusTag === "type 6";
  const canUpdateInput = canUpdateDessingStageSelectionInputs(
    userType,
    leadStatus
  );
  const structureInstances: LeadProductStructureInstance[] = Array.isArray(
    structureInstancesData?.data
  )
    ? structureInstancesData.data
    : [];

  const selectionForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { carcas: "", shutter: "", handles: "" },
    mode: "onBlur",
  });

  const uploadForm = useForm<InstanceUploadValues>({
    resolver: zodResolver(instanceUploadSchema),
    defaultValues: { pptDocuments: [], pythaDocuments: [] },
  });

  const [existingSelections, setExistingSelections] = React.useState<{
    carcas?: DesignSelection;
    shutter?: DesignSelection;
    handles?: DesignSelection;
  }>({});
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [activeInstance, setActiveInstance] =
    React.useState<LeadProductStructureInstance | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<null | number>(null);

  useEffect(() => {
    if (!structureInstances.length) {
      setActiveInstance(null);
      onInstanceChange?.(null);
      return;
    }

    const fallback = structureInstances[0];
    const selected =
      (activeInstance &&
        structureInstances.find((item) => item.id === activeInstance.id)) ||
      fallback;
    if (!activeInstance || activeInstance.id !== selected.id) {
      setActiveInstance(selected);
    }
    onInstanceChange?.(selected);
  }, [structureInstances, activeInstance, onInstanceChange]);

  useEffect(() => {
    const rows = Array.isArray(selectionsData?.data) ? selectionsData.data : [];
    const activeInstanceId = activeInstance?.id ?? null;
    let scoped = rows.filter(
      (row) => (row.product_structure_instance_id ?? null) === activeInstanceId
    );
    if (activeInstanceId !== null && scoped.length === 0) {
      // Fallback to lead-level selections when instance-specific rows are missing
      scoped = rows.filter(
        (row) => (row.product_structure_instance_id ?? null) === null
      );
    }

    const byType = (type: string) =>
      scoped.find((item) => {
        if (item.type !== type) return false;
        const value = (item.desc || "").trim().toUpperCase();
        return value !== "NULL" && value !== "N/A";
      }) || scoped.find((item) => item.type === type);

    const carcas = byType("Carcas");
    const shutter = byType("Shutter");
    const handles = byType("Handles");

    console.log("[Design Selections] scoped:", {
      activeInstanceId,
      carcas,
      shutter,
      handles,
    });

    setExistingSelections({ carcas, shutter, handles });
    const sanitize = (val?: string) => {
      const v = (val || "").trim().toUpperCase();
      return v && v !== "NULL" && v !== "N/A" ? val : "";
    };
    selectionForm.reset({
      carcas: sanitize(carcas?.desc),
      shutter: sanitize(shutter?.desc),
      handles: sanitize(handles?.desc),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstance?.id, selectionsData?.data]);

  useEffect(() => {
    if (!uploadModalOpen) {
      const sanitize = (val?: string) => {
        const v = (val || "").trim().toUpperCase();
        return v && v !== "NULL" && v !== "N/A" ? val : "";
      };
      selectionForm.reset({
        carcas: sanitize(existingSelections.carcas?.desc),
        shutter: sanitize(existingSelections.shutter?.desc),
        handles: sanitize(existingSelections.handles?.desc),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadModalOpen]);

  const normalizeValue = (v?: string) =>
    v?.trim() && v.trim() !== "" ? v.trim() : "N/A";

  const upsertSelection = async (
    type: "Carcas" | "Shutter" | "Handles",
    descRaw?: string
  ) => {
    const desc = normalizeValue(descRaw);
    const existing =
      existingSelections[type.toLowerCase() as keyof typeof existingSelections];

    if (existing) {
      return new Promise<void>((resolve, reject) =>
        editSelection(
          {
            selectionId: existing.id,
            payload: {
              type,
              desc,
              updated_by: userId!,
              product_structure_instance_id: activeInstance?.id ?? null,
            },
          },
          {
            onSuccess: () => resolve(),
            onError: (e: any) => reject(e),
          }
        )
      );
    }

    return new Promise<void>((resolve, reject) =>
      createSelection(
        {
          type,
          desc,
          vendor_id: vendorId!,
          lead_id: leadId!,
          user_id: userId!,
          account_id: accountId!,
          product_structure_instance_id: activeInstance?.id ?? null,
        },
        {
          onSuccess: () => resolve(),
          onError: (e: any) => reject(e),
        }
      )
    );
  };

  const onSaveSelections = async (values: FormValues) => {
    const dirtyFields = selectionForm.formState.dirtyFields;
    const promises: Promise<void>[] = [];

    if (!canUpdateInput) {
      toast.error("You do not have permission to update selections.");
      return;
    }

    if (dirtyFields.carcas)
      promises.push(upsertSelection("Carcas", values.carcas));
    if (dirtyFields.shutter)
      promises.push(upsertSelection("Shutter", values.shutter));
    if (dirtyFields.handles)
      promises.push(upsertSelection("Handles", values.handles));

    if (!promises.length) {
      toast.info("No changes detected");
      return;
    }

    try {
      await Promise.all(promises);
      toast.success("Selections saved");
      await refetch();
      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getSelectionData", vendorId, leadId],
      });
    } catch (e: any) {
      toast.error(e?.message || "Some selections failed to update");
    }
  };

  const docsByInstance = React.useMemo(() => {
    const groups = docsDetails?.documents_by_instance || [];
    const map = new Map<
      number,
      { ppt: any[]; pytha: any[]; pptCount: number; pythaCount: number }
    >();
    groups.forEach((group) => {
      if (!group.instance_id) return;
      map.set(group.instance_id, {
        ppt: group.documents?.ppt || [],
        pytha: group.documents?.pytha || [],
        pptCount: group.documents?.ppt?.length || 0,
        pythaCount: group.documents?.pytha?.length || 0,
      });
    });
    return map;
  }, [docsDetails?.documents_by_instance]);

  const getCounts = (instanceId?: number | null) => {
    if (instanceId && docsByInstance.has(instanceId)) {
      const data = docsByInstance.get(instanceId)!;
      return { ppt: data.pptCount, pytha: data.pythaCount };
    }
    return { ppt: 0, pytha: 0 };
  };

  const getDocs = (instanceId?: number | null) => {
    if (instanceId && docsByInstance.has(instanceId)) {
      return docsByInstance.get(instanceId)!;
    }
    return { ppt: [], pytha: [], pptCount: 0, pythaCount: 0 };
  };

  const allInstancesDocsReady = structureInstances.length
    ? structureInstances.every((instance) => {
        const counts = getCounts(instance.id);
        return counts.ppt > 0 && counts.pytha > 0;
      })
    : (docsDetails?.documents?.ppt?.length || 0) > 0 &&
      (docsDetails?.documents?.pytha?.length || 0) > 0;

  const selectionsByInstance = React.useMemo(() => {
    const rows = Array.isArray(selectionsData?.data) ? selectionsData.data : [];
    const grouped = new Map<
      number | null,
      { Carcas: boolean; Shutter: boolean; Handles: boolean }
    >();

    for (const row of rows) {
      const key = row.product_structure_instance_id ?? null;
      if (!grouped.has(key)) {
        grouped.set(key, { Carcas: false, Shutter: false, Handles: false });
      }
      const tracker = grouped.get(key)!;
      const value = (row.desc || "").trim();
      if (!value) continue;
      const upper = value.toUpperCase();
      if (upper === "NULL" || upper === "N/A") continue;
      if (row.type === "Carcas" || row.type === "Shutter" || row.type === "Handles") {
        tracker[row.type] = true;
      }
    }

    return grouped;
  }, [selectionsData?.data]);

  const allInstancesSelectionsReady = structureInstances.length > 1
    ? structureInstances.every((instance) => {
        const tracker = selectionsByInstance.get(instance.id);
        return Boolean(tracker?.Carcas && tracker?.Shutter && tracker?.Handles);
      })
    : (() => {
        // No instances -> validate at lead level (null bucket)
        if (structureInstances.length === 0) {
          const nullBucket = selectionsByInstance.get(null);
          return Boolean(
            nullBucket?.Carcas && nullBucket?.Shutter && nullBucket?.Handles
          );
        }
        // Single instance -> allow either null bucket or the instance bucket
        const nullBucket = selectionsByInstance.get(null);
        const firstInstanceBucket = activeInstance
          ? selectionsByInstance.get(activeInstance.id)
          : undefined;
        const tracker = nullBucket || firstInstanceBucket;
        return Boolean(tracker?.Carcas && tracker?.Shutter && tracker?.Handles);
      })();

  const canMoveStage =
    allInstancesDocsReady &&
    allInstancesSelectionsReady &&
    !selectionForm.formState.isDirty &&
    !isMovingStage;
  const isSingleInstance = structureInstances.length === 1;

  const handleOpenUploadModal = (instance: LeadProductStructureInstance) => {
    setActiveInstance(instance);
    onInstanceChange?.(instance);
    uploadForm.reset({ pptDocuments: [], pythaDocuments: [] });
    setUploadModalOpen(true);
  };

  const handleUploadForInstance = async (values: InstanceUploadValues) => {
    if (!vendorId || !userId) return;
    if (!activeInstance && structureInstances.length > 0) {
      toast.error("Please select product instance");
      return;
    }

    try {
      await uploadClientDocs({
        leadId,
        accountId,
        vendorId,
        createdBy: userId,
        productStructureInstanceId: activeInstance?.id,
        pptDocuments: values.pptDocuments,
        pythaDocuments: values.pythaDocuments,
      });
      toast.success(
        activeInstance
          ? `Files uploaded for ${activeInstance.title}`
          : "Files uploaded"
      );
      setUploadModalOpen(false);
      uploadForm.reset({ pptDocuments: [], pythaDocuments: [] });
      await queryClient.invalidateQueries({
        queryKey: ["clientDocumentationDetails", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getSelectionData", vendorId, leadId],
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to upload files");
    }
  };

  const handleMoveStage = () => {
    if (!vendorId || !userId) return;
    if (selectionForm.formState.isDirty) {
      toast.error(
        "Please save Carcas, Shutter and Handles before moving stage"
      );
      return;
    }
    moveToClientApproval(
      {
        leadId,
        vendorId,
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          router.push("/dashboard/project/client-approval");
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      deleteDocument({
        vendorId: vendorId!,
        documentId: confirmDelete,
        deleted_by: userId!,
      });
      setConfirmDelete(null);
    }
  };

  const separateImageAndDocs = (docs: any[]) => {
    const imageExtensions = ["jpg", "jpeg", "png", "webp"];
    const images = docs.filter((d: any) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return imageExtensions.includes(ext || "");
    });
    const nonImages = docs.filter((d: any) => {
      const ext = d.doc_og_name?.split(".").pop()?.toLowerCase();
      return !imageExtensions.includes(ext || "");
    });
    return { images, nonImages };
  };

  const isPending = isCreating || isEditing;

  const renderInstanceEditorContent = () => {
    if (!activeInstance) return null;

    return (
      <div className="flex-1 space-y-6 py-4 px-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <h4 className="text-sm font-semibold">Design Selections</h4>
              {!canUpdateInput && <Badge variant="secondary">Read only</Badge>}
            </div>
            <div>
              {canUpdateInput && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={selectionForm.handleSubmit(onSaveSelections)}
                  >
                    {isPending ? "Saving..." : "Save Design Selections"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Form {...selectionForm}>
            <form
              onSubmit={selectionForm.handleSubmit(onSaveSelections)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={selectionForm.control}
                  name="carcas"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">Carcas</FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Enter Carcas selection..."
                          disabled={isPending || !canUpdateInput}
                          className="h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={selectionForm.control}
                  name="shutter"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">Shutter</FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Enter Shutter details..."
                          disabled={isPending || !canUpdateInput}
                          className="h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={selectionForm.control}
                  name="handles"
                  render={({ field }) => (
                    <FormItem className="space-y-2 md:col-span-2">
                      <FormLabel className="font-medium">Handles</FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Enter Handles details..."
                          disabled={isPending || !canUpdateInput}
                          className="h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Form {...uploadForm}>
            <form
              onSubmit={uploadForm.handleSubmit(handleUploadForInstance)}
              className="flex w-full items-end gap-4 flex-col-reverse"
            >
              <div className="flex w-full justify-between items-start gap-4">
                <div className="w-full">
                  <FormField
                    control={uploadForm.control}
                    name="pptDocuments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Client Documentation - Project Files *
                        </FormLabel>
                        <FormControl>
                          <FileUploadField
                            value={field.value}
                            onChange={field.onChange}
                            accept=".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full">
                  <FormField
                    control={uploadForm.control}
                    name="pythaDocuments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Client Documentation - Pytha Design Files *
                        </FormLabel>
                        <FormControl>
                          <FileUploadField
                            value={field.value}
                            onChange={field.onChange}
                            accept=".pdf,.zip,.pytha,.pyo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="w-full flex items-center justify-between">
                <div className="flex items-center justify-between">
                  {(uploadForm.watch("pptDocuments").length > 0 ||
                    uploadForm.watch("pythaDocuments").length > 0) && (
                    <Badge variant="secondary">
                      {uploadForm.watch("pptDocuments").length +
                        uploadForm.watch("pythaDocuments").length}{" "}
                      selected
                    </Badge>
                  )}
                </div>

                {(uploadForm.watch("pptDocuments").length > 0 ||
                  uploadForm.watch("pythaDocuments").length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex justify-end"
                  >
                    <Button
                      type="submit"
                      disabled={isUploadingDocs}
                      className="gap-2"
                    >
                      {isUploadingDocs ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Click Here To Upload Files
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </form>
          </Form>
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Uploaded Files</h4>
            {(() => {
              const docs = getDocs(activeInstance.id);
              const totalDocs = docs.pptCount + docs.pythaCount;
              return <Badge variant="outline">{totalDocs} total</Badge>;
            })()}
          </div>

          {(() => {
            const docs = getDocs(activeInstance.id);
            const allDocs = [...docs.ppt, ...docs.pytha];
            const { images, nonImages } = separateImageAndDocs(allDocs);

            if (allDocs.length === 0) {
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 border border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/30"
                >
                  <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No files uploaded yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your first file to get started
                  </p>
                </motion.div>
              );
            }

            return (
              <ScrollArea className="max-h-[400px]">
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3">
                  {images.map((doc: any, index: number) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ImageComponent
                        doc={{
                          id: doc.id,
                          doc_og_name: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        index={index}
                        canDelete={canUpdateInput}
                        onDelete={(id) => setConfirmDelete(Number(id))}
                      />
                    </motion.div>
                  ))}

                  {nonImages.map((doc: any, index: number) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (images.length + index) * 0.05 }}
                    >
                      <DocumentCard
                        doc={{
                          id: doc.id,
                          originalName: doc.doc_og_name,
                          signedUrl: doc.signed_url,
                          created_at: doc.created_at,
                        }}
                        canDelete={canUpdateInput}
                        onDelete={(id) => setConfirmDelete(id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            );
          })()}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 size-5" />
        <div className="text-sm text-muted-foreground">
          Loading selections data...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-4">
        <div className="text-red-500 text-center py-8">
          <p>Error loading selections data</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 bg-[#fff] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Design Selections & Instance Documents
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Open each product instance card to upload docs and save design selections
          </p>
        </div>
      </div>

      {/* Product Instances Cards */}
      {structureInstances.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Product Instances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {structureInstances.map((instance, index) => {
              const counts = getCounts(instance.id);
              const isUploaded = counts.ppt > 0 && counts.pytha > 0;
              const totalDocs = counts.ppt + counts.pytha;

              return (
                <motion.div
                  key={instance.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <Card
                    className="h-full rounded-2xl border bg-white dark:bg-neutral-900 
                    hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)]
                    transition-all duration-200 cursor-pointer group"
                    onClick={() => handleOpenUploadModal(instance)}
                  >
                    <CardContent className="px-6">
                      {/* Top Row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center 
                            border bg-neutral-50 dark:bg-neutral-800 text-primary">
                            <FolderOpen className="size-6" />
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm">
                              {instance.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {instance.productStructure?.type ||
                                "Product Structure"}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUploadModal(instance);
                          }}
                        >
                          {totalDocs === 0 ? "Upload" : "View"}
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="my-4 border-t" />

                      {/* Metadata row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {totalDocs} file{totalDocs !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <Badge variant={isUploaded ? "default" : "secondary"}>
                          {isUploaded ? "Uploaded" : "Pending"}
                        </Badge>
                      </div>

                      {/* Bottom preview row */}
                      {totalDocs > 0 ? (
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(totalDocs, 4) }).map(
                            (_, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-lg border bg-neutral-100 dark:bg-neutral-800 
                                flex items-center justify-center"
                                style={{ zIndex: 4 - idx }}
                              >
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )
                          )}

                          {totalDocs > 4 && (
                            <div
                              className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 
                              flex items-center justify-center text-xs font-medium text-muted-foreground"
                            >
                              +{totalDocs - 4}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          No files uploaded yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {isSingleInstance && activeInstance && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{activeInstance.title}</h3>
          <div className="rounded-2xl border bg-white dark:bg-neutral-900">
            {renderInstanceEditorContent()}
          </div>
        </div>
      )}

      {/* Move to Client Approval */}
      {isClientDocumentationStage && (
        <div className="pt-2">
          <Button
            onClick={handleMoveStage}
            disabled={!canMoveStage}
            className="w-full sm:w-auto"
          >
            {isMovingStage ? (
              "Moving..."
            ) : (
              <>
                <CheckCircle2 className="size-4 mr-2" />
                Move to Client Approval
              </>
            )}
          </Button>
          {!allInstancesDocsReady && (
            <p className="text-xs text-muted-foreground mt-2">
              Upload both Project Files and Pytha Files for all product instances.
            </p>
          )}
          {!allInstancesSelectionsReady && (
            <p className="text-xs text-muted-foreground mt-1">
              Carcas, Shutter and Handles are required for each product instance.
            </p>
          )}
          {selectionForm.formState.isDirty && (
            <p className="text-xs text-muted-foreground mt-1">
              Please save selections before moving stage.
            </p>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && activeInstance && (
          <BaseModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            title={activeInstance.title}
            description="Upload and manage files for this product instance"
            icon={
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="size-6" />
              </div>
            }
            size="xl"
          >
            {renderInstanceEditorContent()}
          </BaseModal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected document will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SelectionsTabForClientDocs;
