"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import BaseModal from "@/components/utils/baseModal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TextAreaInput from "@/components/origin-text-area";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateFastProductionRequest,
  useFinalizeFastProductionRequest,
  useLeadProductStructureInstances,
  useFastProductionRequestDraft,
  useLeadById,
} from "@/hooks/useLeadsQueries";
import { LeadProductStructureInstance } from "@/api/leads";
import {
  useHandleTypes,
  useFastProductionTimelineRules,
} from "@/hooks/useTypesMaster";
import ClientDocsSelectionMultiSelect, {
  ClientDocsSelectionOption,
} from "@/components/sales-executive/designing-stage/pill-tabs-component/ClientDocsSelectionMultiSelect";
import { cn } from "@/lib/utils";

const MAX_TEXT_LENGTH = 2000;
const MAX_REMARKS_LENGTH = 1000;
const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;

const requiredTrimmedText = (label: string, maxLength = MAX_TEXT_LENGTH) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be at most ${maxLength} characters`);

const optionalTrimmedText = (label: string, maxLength = MAX_TEXT_LENGTH) =>
  z
    .string()
    .trim()
    .max(maxLength, `${label} must be at most ${maxLength} characters`)
    .optional();

const getFormSchema = (isSmallOrder: boolean) => z.object({
  carcass_finish_category: z
    .array(z.string())
    .min(1, "Carcass finish category is required"),
  carcass_finish_description: requiredTrimmedText(
    "Carcass finish description",
  ),
  shutter_finish_category: isSmallOrder 
    ? z.array(z.string()).optional() 
    : z.array(z.string()).min(1, "Shutter finish category is required"),
  shutter_finish_description: isSmallOrder 
    ? optionalTrimmedText("Shutter finish description") 
    : requiredTrimmedText("Shutter finish description"),
  handles_finish_category: isSmallOrder 
    ? z.array(z.string()).optional() 
    : z.array(z.string()).min(1, "Handles finish category is required"),
  handles_finish_description: isSmallOrder 
    ? optionalTrimmedText("Handles finish description") 
    : requiredTrimmedText("Handles finish description"),
  hardware_selection: requiredTrimmedText("Hardware selection"),
  accessory_selection: requiredTrimmedText("Accessory selection"),
  special_requirements: requiredTrimmedText(
    "Special / non-standard requirements",
  ),
  client_required_delivery_date: z
    .string()
    .trim()
    .min(1, "Client required delivery date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  remarks: optionalTrimmedText("Remarks", MAX_REMARKS_LENGTH),
  files: z
    .array(z.instanceof(File))
    .max(MAX_FILES, `You can upload a maximum of ${MAX_FILES} files`)
    .refine(
      (files) =>
        files.every((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024),
      `Each file must be smaller than ${MAX_FILE_SIZE_MB}MB`,
    )
    .optional(),
});

type FormValues = {
  carcass_finish_category: string[];
  carcass_finish_description: string;
  shutter_finish_category?: string[];
  shutter_finish_description?: string;
  handles_finish_category?: string[];
  handles_finish_description?: string;
  hardware_selection: string;
  accessory_selection: string;
  special_requirements: string;
  client_required_delivery_date: string;
  remarks?: string;
  files?: File[];
};

interface FastProductionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
}

type FastProductionTimelineRule = {
  id: number;
  vendor_id: number;
  carcass_id: number;
  shutter_id: number | null;
  kitchen_manufacturing_days_for_fast_production: number | null;
  other_manufacturing_days_for_fast_production: number | null;
  carcass: { id: number; name: string };
  shutter: {
    id: number;
    name: string;
    subTypes: Array<{ id: number; name: string }>;
  } | null;
};

const parseEntityId = (value: string, prefix: string) => {
  if (!value.startsWith(`${prefix}-`)) return null;
  const parts = value.split("-");
  const parsed = Number(parts[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasFastProductionTimeline = (rule: FastProductionTimelineRule) =>
  (rule.kitchen_manufacturing_days_for_fast_production ?? 0) > 0 ||
  (rule.other_manufacturing_days_for_fast_production ?? 0) > 0;

const isKitchenParent = (parent?: string | null) =>
  parent?.trim().toLowerCase() === "kitchen";

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getEmptyFormValues = (): FormValues => ({
  carcass_finish_category: [],
  carcass_finish_description: "",
  shutter_finish_category: [],
  shutter_finish_description: "",
  handles_finish_category: [],
  handles_finish_description: "",
  hardware_selection: "",
  accessory_selection: "",
  special_requirements: "",
  client_required_delivery_date: "",
  remarks: "",
  files: [],
});

const splitFinishValues = (value?: string | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const FastProductionRequestModal: React.FC<FastProductionRequestModalProps> = ({
  open,
  onOpenChange,
  leadId,
}) => {
  const requiredMark = <span className="text-red-500">*</span>;
  const queryClient = useQueryClient();
  const draftMutation = useCreateFastProductionRequest();
  const finalizeMutation = useFinalizeFastProductionRequest();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data: instancesResponse, isLoading: isInstancesLoading } =
    useLeadProductStructureInstances(
      leadId,
      vendorId,
  );

  const {
    data: fastProductionRulesData,
    isLoading: isFastProductionRulesLoading,
  } = useFastProductionTimelineRules();
  const { data: handleTypesData, isLoading: isHandleTypesLoading } =
    useHandleTypes();

  const fastProductionRules = React.useMemo<FastProductionTimelineRule[]>(
    () =>
      (Array.isArray(fastProductionRulesData?.data)
        ? fastProductionRulesData.data
        : []) as FastProductionTimelineRule[],
    [fastProductionRulesData?.data],
  );

  const eligibleFastProductionRules = React.useMemo(
    () => fastProductionRules.filter(hasFastProductionTimeline),
    [fastProductionRules],
  );

  const instances = React.useMemo<LeadProductStructureInstance[]>(
    () =>
      Array.isArray(instancesResponse?.data)
        ? [...instancesResponse.data].sort(
            (a, b) => a.id - b.id,
          )
        : [],
    [instancesResponse?.data],
  );

  const { data: leadData } = useLeadById(leadId, vendorId, userId);
  const lead = leadData?.data?.lead;
  const furniture_type = lead?.productMappings?.map((pm: any) => pm.productType?.type).filter(Boolean).join(", ") || "N/A";
  const isSmallOrder = furniture_type.toLowerCase().includes("small order");

  const dynamicFormSchema = React.useMemo(() => getFormSchema(isSmallOrder), [isSmallOrder]);

  const form = useForm<FormValues>({
    resolver: zodResolver(dynamicFormSchema) as any,
    mode: "onBlur",
    defaultValues: getEmptyFormValues(),
  });

  const { data: draftResponse, isLoading: isDraftLoading } =
    useFastProductionRequestDraft(vendorId, leadId);

  const [activeInstanceId, setActiveInstanceId] = React.useState<number | null>(
    null,
  );
  const [instanceDrafts, setInstanceDrafts] = React.useState<
    Record<number, FormValues>
  >({});
  const [savedInstanceIds, setSavedInstanceIds] = React.useState<number[]>([]);
  const [draftBatchId, setDraftBatchId] = React.useState<number | undefined>();
  const [isInitialized, setIsInitialized] = React.useState(false);

  const selectedCarcassValues = form.watch("carcass_finish_category") ?? [];
  const selectedShutterValues = form.watch("shutter_finish_category") ?? [];

  const selectedCarcassIds = React.useMemo(
    () =>
      selectedCarcassValues
        .map((value) => parseEntityId(value, "carcass"))
        .filter((value): value is number => value != null),
    [selectedCarcassValues],
  );

  const selectedShutterIds = React.useMemo(
    () =>
      selectedShutterValues
        .map((value) => parseEntityId(value, "shutter"))
        .filter((value): value is number => value != null),
    [selectedShutterValues],
  );

  const carcassOptions = React.useMemo<ClientDocsSelectionOption[]>(
    () => {
      const map = new Map<number, ClientDocsSelectionOption>();
      for (const rule of eligibleFastProductionRules) {
        map.set(rule.carcass.id, {
          value: `carcass-${rule.carcass.id}`,
          label: rule.carcass.name ?? "",
        });
      }
      return Array.from(map.values()).sort((a, b) =>
        (a.label ?? "").localeCompare(b.label ?? ""),
      );
    },
    [eligibleFastProductionRules],
  );

  const shutterOptions = React.useMemo<ClientDocsSelectionOption[]>(
    () => {
      const relevantRules =
        selectedCarcassIds.length > 0
          ? eligibleFastProductionRules.filter((rule) =>
              selectedCarcassIds.includes(rule.carcass_id),
            )
          : eligibleFastProductionRules;

      const options: ClientDocsSelectionOption[] = [];
      const seen = new Set<string>();

      for (const rule of relevantRules) {
        if (!rule.shutter) continue;

        const mainLabel = rule.shutter.name?.trim() || "";
        const subTypes = Array.isArray(rule.shutter.subTypes)
          ? rule.shutter.subTypes
          : [];
        const distinctSubTypes = subTypes.filter((subType) => {
          const subLabel = subType.name?.trim() || "";
          return (
            subLabel.length > 0 &&
            subLabel.toLowerCase() !== mainLabel.toLowerCase()
          );
        });

        if (distinctSubTypes.length === 0) {
          const value = `shutter-${rule.shutter.id}`;
          if (!seen.has(value)) {
            seen.add(value);
            options.push({ value, label: mainLabel });
          }
          continue;
        }

        for (const subType of distinctSubTypes) {
          const value = `shutter-${rule.shutter.id}-sub-${subType.id}`;
          if (!seen.has(value)) {
            seen.add(value);
            options.push({ value, label: subType.name ?? "" });
          }
        }
      }

      return options.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""));
    },
    [eligibleFastProductionRules, selectedCarcassIds],
  );

  const handleOptions = React.useMemo<ClientDocsSelectionOption[]>(
    () =>
      (Array.isArray(handleTypesData?.data) ? handleTypesData.data : []).map(
        (item) => ({
          value: `handle-${item.id}`,
          label: item.name ?? "",
        }),
      ),
    [handleTypesData?.data],
  );

  const carcassOptionLabelMap = React.useMemo(
    () => new Map(carcassOptions.map((option) => [option.value, option.label])),
    [carcassOptions],
  );

  const shutterOptionLabelMap = React.useMemo(
    () => new Map(shutterOptions.map((option) => [option.value, option.label])),
    [shutterOptions],
  );

  const handleOptionLabelMap = React.useMemo(
    () => new Map(handleOptions.map((option) => [option.value, option.label])),
    [handleOptions],
  );

  const isSelectionMastersLoading =
    isFastProductionRulesLoading || isHandleTypesLoading;

  const currentInstance = React.useMemo(
    () =>
      instances.find((instance) => instance.id === activeInstanceId) ?? null,
    [instances, activeInstanceId],
  );

  const cacheCurrentFormValues = React.useCallback(() => {
    if (!activeInstanceId) return;
    setInstanceDrafts((prev) => ({
      ...prev,
      [activeInstanceId]: form.getValues(),
    }));
  }, [activeInstanceId, form]);

  const resetModalState = React.useCallback(() => {
    form.reset(getEmptyFormValues());
    setActiveInstanceId(null);
    setInstanceDrafts({});
    setSavedInstanceIds([]);
    setDraftBatchId(undefined);
    setIsInitialized(false);
  }, [form]);

  const handleModalChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetModalState();
    }
    onOpenChange(nextOpen);
  };

  React.useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }

    if (
      isInitialized ||
      isInstancesLoading ||
      isSelectionMastersLoading ||
      isDraftLoading
    ) {
      return;
    }

    const draftData = draftResponse?.data;
    if (!draftData) {
      setIsInitialized(true);
      if (instances.length > 0 && activeInstanceId == null) {
        setActiveInstanceId(instances[0].id);
      }
      return;
    }

    const drafts: Record<number, FormValues> = {};
    const savedIds: number[] = [];

    if (draftData.requests) {
      for (const req of draftData.requests) {
        const carcassFinish = req.finishes?.find((f: any) => f.component === "CARCASS");
        const shutterFinish = req.finishes?.find((f: any) => f.component === "SHUTTER");
        const handleFinish = req.finishes?.find((f: any) => f.component === "HANDLE");

        const carcassLabels = splitFinishValues(carcassFinish?.finish_category);
        const shutterLabels = splitFinishValues(shutterFinish?.finish_category);
        const handleLabels = splitFinishValues(handleFinish?.finish_category);

        const carcassValues = carcassLabels.map((lbl: string) => {
          const match = carcassOptions.find(
            (opt) => opt.label.toLowerCase() === lbl.toLowerCase(),
          );
          return match ? match.value : lbl;
        });

        const shutterValues = shutterLabels.map((lbl: string) => {
          const match = shutterOptions.find(
            (opt) => opt.label.toLowerCase() === lbl.toLowerCase(),
          );
          return match ? match.value : lbl;
        });

        const handleValues = handleLabels.map((lbl: string) => {
          const match = handleOptions.find(
            (opt) => opt.label.toLowerCase() === lbl.toLowerCase(),
          );
          return match ? match.value : lbl;
        });

        let deliveryDate = "";
        if (req.client_required_delivery_date) {
          deliveryDate = formatDateInputValue(new Date(req.client_required_delivery_date));
        }

        drafts[req.instance_id] = {
          carcass_finish_category: carcassValues,
          carcass_finish_description: carcassFinish?.finish_description ?? "",
          shutter_finish_category: shutterValues,
          shutter_finish_description: shutterFinish?.finish_description ?? "",
          handles_finish_category: handleValues,
          handles_finish_description: handleFinish?.finish_description ?? "",
          hardware_selection: req.hardware_selection ?? "",
          accessory_selection: req.accessory_selection ?? "",
          special_requirements: req.special_requirements ?? "",
          client_required_delivery_date: deliveryDate,
          remarks: req.remarks ?? "",
          files: [],
        };

        savedIds.push(req.instance_id);
      }
    }

    setInstanceDrafts(drafts);
    setSavedInstanceIds(savedIds);
    setDraftBatchId(draftData.id);
    setIsInitialized(true);

    if (instances.length > 0) {
      const firstInstanceId = instances[0].id;
      setActiveInstanceId(firstInstanceId);
      form.reset(drafts[firstInstanceId] ?? getEmptyFormValues());
    }
  }, [
    open,
    draftResponse,
    isInitialized,
    isInstancesLoading,
    isSelectionMastersLoading,
    isDraftLoading,
    carcassOptions,
    shutterOptions,
    handleOptions,
    instances,
    form,
    activeInstanceId,
  ]);

  React.useEffect(() => {
    if (!open || activeInstanceId == null || !isInitialized) return;
    form.reset(instanceDrafts[activeInstanceId] ?? getEmptyFormValues());
  }, [activeInstanceId, instanceDrafts, form, open, isInitialized]);

  const applicableFastProductionRules = React.useMemo(() => {
    if (selectedCarcassIds.length === 0) return [];

    const carcassMatched = eligibleFastProductionRules.filter((rule) =>
      selectedCarcassIds.includes(rule.carcass_id),
    );

    if (selectedShutterIds.length === 0) {
      return carcassMatched;
    }

    return carcassMatched.filter(
      (rule) =>
        rule.shutter_id == null || selectedShutterIds.includes(rule.shutter_id),
    );
  }, [eligibleFastProductionRules, selectedCarcassIds, selectedShutterIds]);

  const minFastProductionDays = React.useMemo(() => {
    if (applicableFastProductionRules.length === 0) return null;
    if (!currentInstance) return null;

    const useKitchenTimeline = isKitchenParent(
      currentInstance.productStructure?.parent,
    );

    const maxDays = applicableFastProductionRules.reduce((currentMax, rule) => {
      const ruleDays = useKitchenTimeline
        ? (rule.kitchen_manufacturing_days_for_fast_production ?? 0)
        : (rule.other_manufacturing_days_for_fast_production ?? 0);
      return Math.max(currentMax, ruleDays);
    }, 0);

    return maxDays > 0 ? maxDays : null;
  }, [applicableFastProductionRules, currentInstance]);

  const clientRequiredDeliveryMinDate = React.useMemo(() => {
    if (minFastProductionDays == null) return undefined;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + minFastProductionDays + 1);
    return formatDateInputValue(date);
  }, [minFastProductionDays]);

  const clientRequiredDeliveryDisabledReason =
    selectedCarcassIds.length === 0
      ? "Select carcass first to enable delivery date."
      : !currentInstance
        ? "Select an instance first to enable delivery date."
      : minFastProductionDays == null
        ? "No fast production timeline is available for the selected carcass / shutter combination."
        : undefined;

  React.useEffect(() => {
    const currentShutterValues = form.getValues("shutter_finish_category") ?? [];
    if (currentShutterValues.length === 0) return;

    const availableShutterValues = new Set(shutterOptions.map((item) => item.value));
    const nextValues = currentShutterValues.filter((value) =>
      availableShutterValues.has(value),
    );

    if (nextValues.length !== currentShutterValues.length) {
      form.setValue("shutter_finish_category", nextValues, {
        shouldValidate: true,
      });
    }
  }, [form, shutterOptions]);

  React.useEffect(() => {
    if (
      (selectedCarcassIds.length === 0 || minFastProductionDays == null) &&
      form.getValues("client_required_delivery_date")
    ) {
      form.setValue("client_required_delivery_date", "", { shouldValidate: true });
    }
  }, [form, minFastProductionDays, selectedCarcassIds.length]);

  React.useEffect(() => {
    const currentDate = form.getValues("client_required_delivery_date");
    if (!currentDate || !clientRequiredDeliveryMinDate) return;

    if (currentDate < clientRequiredDeliveryMinDate) {
      form.setValue("client_required_delivery_date", "", {
        shouldValidate: true,
      });
    }
  }, [clientRequiredDeliveryMinDate, form]);

  const handleInstanceSelect = (instanceId: number) => {
    cacheCurrentFormValues();
    setActiveInstanceId(instanceId);
  };

  const isBusy = draftMutation.isPending || finalizeMutation.isPending;

  const onSubmit = (values: FormValues) => {
    if (!leadId || !vendorId || !userId || !currentInstance) {
      toastManager.add({
        title: "Missing lead, user, or instance information",
        type: "error",
      });
      return;
    }

    const toLabels = (
      selectedValues: string[],
      labelMap: Map<string, string>,
    ) =>
      selectedValues
        .map((selectedValue) => labelMap.get(selectedValue) ?? selectedValue)
        .filter(Boolean);

    const wasAlreadySaved = savedInstanceIds.includes(currentInstance.id);
    const nextSavedIds = wasAlreadySaved
      ? savedInstanceIds
      : [...savedInstanceIds, currentInstance.id];
    const shouldFinalize = !wasAlreadySaved && nextSavedIds.length === instances.length;

    draftMutation.mutate(
      {
        leadId,
        vendorId,
        createdBy: userId,
        instanceId: currentInstance.id,
        carcassFinishCategory: toLabels(
          values.carcass_finish_category,
          carcassOptionLabelMap,
        ),
        carcassFinishDescription: values.carcass_finish_description,
        shutterFinishCategory: toLabels(
          values.shutter_finish_category || [],
          shutterOptionLabelMap,
        ),
        shutterFinishDescription: values.shutter_finish_description || "",
        handlesFinishCategory: toLabels(
          values.handles_finish_category || [],
          handleOptionLabelMap,
        ),
        handlesFinishDescription: values.handles_finish_description || "",
        hardwareSelection: values.hardware_selection,
        accessorySelection: values.accessory_selection,
        specialRequirements: values.special_requirements,
        clientRequiredDeliveryDate: values.client_required_delivery_date,
        remarks: values.remarks,
        termsVersion: "v1",
        documents: values.files,
      },
      {
        onSuccess: (response: any) => {
          const responseData = response?.data ?? response;
          const nextBatchId = responseData?.batchId ?? draftBatchId;

          setDraftBatchId(nextBatchId);
          setSavedInstanceIds(nextSavedIds);
          setInstanceDrafts((prev) => ({
            ...prev,
            [currentInstance.id]: values,
          }));

          queryClient.invalidateQueries({
            queryKey: ["fastProductionRequestDraft", vendorId, leadId],
          });

          if (shouldFinalize) {
            finalizeMutation.mutate(
              {
                leadId,
                vendorId,
                createdBy: userId,
                batchId: nextBatchId,
              },
              {
                onSuccess: () => {
                  toastManager.add({
                    title: "Fast production request submitted for approval",
                    type: "success",
                  });

                  queryClient.invalidateQueries({ queryKey: ["lead-status", leadId] });
                  queryClient.invalidateQueries({ queryKey: ["leadLogs"] });
                  queryClient.invalidateQueries({ queryKey: ["leadStats"] });
                  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
                  if (vendorId) {
                    queryClient.invalidateQueries({
                      queryKey: ["activeLeadTasks", vendorId, leadId],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["vendorUserTasks", vendorId],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["vendorAllTasks", vendorId],
                    });
                  }

                  handleModalChange(false);
                },
                onError: (error: any) => {
                  toastManager.add({
                    title:
                      error?.response?.data?.message ||
                      error?.response?.data?.error ||
                      "Failed to finalize fast production request",
                    type: "error",
                  });
                },
              },
            );
            return;
          }

          const nextUnsavedInstance = instances.find(
            (instance) => !nextSavedIds.includes(instance.id),
          );

          toastManager.add({
            title: nextUnsavedInstance
              ? `${currentInstance.title} draft saved`
              : `${currentInstance.title} updated`,
            type: "success",
          });

          if (nextUnsavedInstance) {
            setActiveInstanceId(nextUnsavedInstance.id);
          }
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "Failed to save fast production draft",
            type: "error",
          });
        },
      },
    );
  };

  const renderFinishSection = (
    title: string,
    categoryName:
      | "carcass_finish_category"
      | "shutter_finish_category"
      | "handles_finish_category",
    descriptionName:
      | "carcass_finish_description"
      | "shutter_finish_description"
      | "handles_finish_description",
    options: ClientDocsSelectionOption[],
    placeholder: string,
    descriptionPlaceholder: string,
    className?: string,
  ) => {
    const isOptional = isSmallOrder && (categoryName === "shutter_finish_category" || categoryName === "handles_finish_category");
    
    return (
      <div className={className}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {title} {!isOptional && requiredMark}
          </h3>
        <FormField
          control={form.control}
          name={categoryName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ClientDocsSelectionMultiSelect
                  value={field.value || []}
                  onChange={field.onChange}
                  options={options}
                  placeholder={placeholder}
                  disabled={isSelectionMastersLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={descriptionName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <TextAreaInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder={descriptionPlaceholder}
                  className="h-24"
                  maxLength={1000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

  const hasMultipleInstances = instances.length > 1;
  const pendingInstanceCount = instances.filter(
    (instance) => !savedInstanceIds.includes(instance.id),
  ).length;

  return (
    <BaseModal
      open={open}
      onOpenChange={handleModalChange}
      title="Request Fast Production"
      description="Fill all mandatory details instance-wise. Approval will be sent only after the last instance is submitted."
      size="xl"
    >
      <div className="space-y-6 px-6 py-6">
        {isInstancesLoading || isDraftLoading || !isInitialized ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : instances.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No product structure instances were found for this lead.
          </div>
        ) : (
          <>
            {hasMultipleInstances ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Select Instance
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Save each instance as draft. Final approval request will be sent after the last pending instance.
                    </p>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {pendingInstanceCount} pending
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {instances.map((instance, index) => {
                    const isActive = activeInstanceId === instance.id;
                    const isSaved = savedInstanceIds.includes(instance.id);

                    return (
                      <button
                        key={instance.id}
                        type="button"
                        onClick={() => handleInstanceSelect(instance.id)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition-all",
                          isActive
                            ? "border-orange-500 bg-orange-50 shadow-sm dark:border-orange-400 dark:bg-orange-950/30"
                            : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/60 dark:hover:border-orange-500/50 dark:hover:bg-orange-950/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              Instance {index + 1}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {instance.title}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                              isSaved
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {isSaved ? "Saved" : "Pending"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-200 bg-orange-50/70 px-4 py-3 dark:border-orange-900/50 dark:bg-orange-950/20">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Instance
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {instances[0]?.title}
                </p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* {currentInstance ? (
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Editing
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {currentInstance.title}
                    </p>
                  </div>
                ) : null} */}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {renderFinishSection(
                      "Carcas",
                      "carcass_finish_category",
                      "carcass_finish_description",
                      carcassOptions,
                      "Select carcass options",
                      "Enter carcas remark...",
                    )}
                    {renderFinishSection(
                      "Handles",
                      "handles_finish_category",
                      "handles_finish_description",
                      handleOptions,
                      "Select handle options",
                      "Enter handles remark...",
                    )}
                    {renderFinishSection(
                      "Shutter",
                      "shutter_finish_category",
                      "shutter_finish_description",
                      shutterOptions,
                      "Select shutter options",
                      "Enter shutter remark...",
                      "md:col-span-2",
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="hardware_selection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Hardware Selection {requiredMark}
                      </FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter hardware selection"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessory_selection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Accessory Selection {requiredMark}
                      </FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter accessory selection"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="special_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Any Special / Non-Standard Requirements {requiredMark}
                      </FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter special / non-standard requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_required_delivery_date"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-sm">
                        Client Required Delivery Date {requiredMark}
                      </FormLabel>
                      <FormControl>
                        <CustomeDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          restriction="futureOnly"
                          minDate={clientRequiredDeliveryMinDate}
                          disabledReason={clientRequiredDeliveryDisabledReason}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="files"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Upload File</FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value ?? []}
                          onChange={field.onChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                          multiple
                          maxFiles={20}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Optional</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Remarks</FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Enter remarks"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Optional</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleModalChange(false)}
                    disabled={isBusy}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSelectionMastersLoading || isBusy || !currentInstance
                    }
                  >
                    {isBusy
                      ? finalizeMutation.isPending
                        ? "Finalizing..."
                        : "Saving..."
                      : savedInstanceIds.includes(currentInstance?.id ?? -1)
                        ? "Update Draft"
                        : pendingInstanceCount === 1
                          ? "Save & Submit Request"
                          : "Save & Continue"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </div>
    </BaseModal>
  );
};

export default FastProductionRequestModal;
