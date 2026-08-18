"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useEditSelectionData,
  useGetCHSManufacturingDaysByInstance,
  useGetCHSSelectionTypeMappings,
  useLeadSpecifications,
  useLeadStatus,
  useSelectionData,
  useSubmitSelection,
  useSubmitQuotation,
  useUpsertCHSSelectionTypeMapping,
  useLeadCarcassMaterialMappings,
  useLeadShutterMaterialMappings,
  useLeadHardwareMappings,
  useLeadLightCarcasUnitMappings,
  useLeadOtherAppliancesMappings,
  useDesignsDoc,
  useQuotationDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import type {
  CHSMappingItem,
  LeadSpecificationEntry,
} from "@/api/designingStageQueries";
import { useSubmitDesigns } from "@/api/designingStageQueries";
import { useAppSelector } from "@/redux/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toastManager } from "@/components/ui/toast";
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
import {
  useLeadProductStructureInstances,
  useGetFastProductionDetailsForLead,
  useLeadById,
} from "@/hooks/useLeadsQueries";
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
  PenTool,
  ScrollText,
  Upload,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteDocument } from "@/api/leads";
import {
  useCarcassTypes,
  useHandleTypes,
  useShutterTypes,
} from "@/hooks/useTypesMaster";
import ClientDocsSelectionMultiSelect, {
  ClientDocsSelectionOption,
} from "./ClientDocsSelectionMultiSelect";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import ViewSpecsModal from "./modals/view-specs-modal";

interface Props {
  leadId: number;
  accountId: number;
  onInstanceChange?: (instance: LeadProductStructureInstance | null) => void;
}

const getFormSchema = (
  isSmallOrder: boolean,
  isFastProduction: boolean,
  handlesLargeScaleProjects: boolean,
) =>
  z
    .object({
      carcas: z.array(z.string()).min(1, "Select at least one carcass type"),
      carcas_remark: z.string().optional(),
      shutter:
        isFastProduction || isSmallOrder
          ? z.array(z.string()).optional()
          : z.array(z.string()).min(1, "Select at least one shutter type"),
      shutter_remark: z.string().optional(),
      handles: z.array(z.string()).optional(),
      handles_remark: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!handlesLargeScaleProjects) {
        if (!data.carcas_remark || !data.carcas_remark.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Field is required",
            path: ["carcas_remark"],
          });
        }
        const shutterIsRequired = !(isFastProduction || isSmallOrder);
        if (
          shutterIsRequired &&
          (!data.shutter_remark || !data.shutter_remark.trim())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Field is required",
            path: ["shutter_remark"],
          });
        }
        const handlesHasSelections =
          Array.isArray(data.handles) && data.handles.length > 0;
        if (
          handlesHasSelections &&
          (!data.handles_remark || !data.handles_remark.trim())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Field is required",
            path: ["handles_remark"],
          });
        }
      }
    });

type FormValues = {
  carcas: string[];
  carcas_remark?: string;
  shutter: string[] | undefined;
  shutter_remark?: string;
  handles: string[] | undefined;
  handles_remark?: string;
};

interface UploadSectionConfig {
  id: "project" | "pytha" | "design" | "quotation";
  title: string;
  description: string;
  icon: React.ReactNode;
  accept?: string;
  docs: any[];
  canView: boolean;
  canUpload: boolean;
  canDelete: boolean;
  required?: boolean;
}

const DEFAULT_REMARK = "N/A";

const SelectionsTabForClientDocs: React.FC<Props> = ({
  leadId,
  accountId,
  onInstanceChange,
}) => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const rawUserType = useAppSelector((s) => s.auth.user?.user_type.user_type);
  const userType = rawUserType?.toLowerCase() ?? "";
  const isCustomVendorFlow = useAppSelector(
    (s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const customPrivilegeCodes = useAppSelector((s) => s.customPrivileges.codes);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const projectFilesLabel = isCustomVendorFlow
    ? "Client Documentation - Presentation Files"
    : "Client Documentation - Project Files";
  const designFilesLabel = "Client Documentation - Pytha Design Files";

  // ✅ Lead block access control
  const { shouldDisableBlockedActions, blockedTooltip } = useLeadAccessControl({
    leadId,
    userType: rawUserType,
  });

  const { mutateAsync: createSelectionAsync, isPending: isCreating } =
    useSubmitSelection();
  const { mutateAsync: editSelectionAsync, isPending: isEditing } =
    useEditSelectionData();
  const { mutateAsync: saveCHSMappings } = useUpsertCHSSelectionTypeMapping();
  const { data: chsMappingsData } = useGetCHSSelectionTypeMappings(
    vendorId,
    leadId,
  );
  const chsMappings: any[] = React.useMemo(
    () => (Array.isArray(chsMappingsData?.data) ? chsMappingsData.data : []),
    [chsMappingsData?.data],
  );
  const {
    data: selectionsData,
    isLoading,
    isError,
    refetch,
  } = useSelectionData(vendorId!, leadId!);

  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { data: specifications = [] } = useLeadSpecifications(vendorId, leadId);
  const { data: leadDataById } = useLeadById(leadId, vendorId, userId);
  const lead = leadDataById?.data?.lead;
  const furniture_type =
    lead?.productMappings
      ?.map((pm: any) => pm.productType?.type)
      .filter(Boolean)
      .join(", ") || "N/A";
  const isSmallOrder = furniture_type.toLowerCase().includes("small order");
  const isFastProduction = lead?.is_fast_production === true;
  const { data: carcassTypesData, isLoading: isCarcassTypesLoading } =
    useCarcassTypes(isFastProduction);
  const { data: shutterTypesData, isLoading: isShutterTypesLoading } =
    useShutterTypes();
  const { data: handleTypesData, isLoading: isHandleTypesLoading } =
    useHandleTypes();
  const handlesLargeScaleProjectsFromAuth = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const handlesLargeScaleProjects =
    handlesLargeScaleProjectsFromAuth ||
    lead?.createdBy?.vendor?.handlesLargeScaleProjects === true ||
    lead?.assignedTo?.vendor?.handlesLargeScaleProjects === true;
  const defaultRemark = handlesLargeScaleProjects ? DEFAULT_REMARK : "";
  const dynamicFormSchema = React.useMemo(
    () =>
      getFormSchema(isSmallOrder, isFastProduction, handlesLargeScaleProjects),
    [isSmallOrder, isFastProduction, handlesLargeScaleProjects],
  );

  const { data: fastProductionDetailsResponse } =
    useGetFastProductionDetailsForLead(vendorId, leadId, undefined, true);
  const fastProductionDetails: any = fastProductionDetailsResponse?.data;
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );
  const { data: manufacturingDaysData } = useGetCHSManufacturingDaysByInstance(
    vendorId,
    leadId,
  );
  const manufacturingDaysByInstance: {
    instance_id: number | null;
    max_days: number | null;
  }[] = React.useMemo(
    () =>
      Array.isArray(manufacturingDaysData?.data)
        ? manufacturingDaysData.data
        : [],
    [manufacturingDaysData?.data],
  );

  const getManufacturingDaysForInstance = (instanceId: number | null) =>
    manufacturingDaysByInstance.find((d) => d.instance_id === instanceId)
      ?.max_days ?? null;

  const { data: docsDetails } = useClientDocumentationDetails(
    vendorId!,
    leadId,
    userId ?? undefined,
  );
  const { mutateAsync: uploadClientDocs, isPending: isUploadingDocs } =
    useUploadClientDocumentation();
  const { mutate: moveToClientApproval, isPending: isMovingStage } =
    useMoveLeadToClientApproval();
  const { mutate: deleteDocument, isPending: deleting } =
    useDeleteDocument(leadId);

  const leadStatus = String(leadData?.status || "").toLowerCase();
  const leadStatusTag = String(
    (leadData as any)?.status_tag || "",
  ).toLowerCase();
  const isClientDocumentationStage =
    leadStatus === "client-documentation-stage" ||
    leadStatus === "client-documentation" ||
    leadStatus === "client documentation" ||
    leadStatusTag === "type 6";
  const canUpdateInput = canUpdateDessingStageSelectionInputs(
    userType,
    leadStatus,
  );
  const canViewSelectionInstances = true;
  const canEditSelectionInstances = canUpdateInput;
  const canViewProjectFiles = true;
  const canUploadProjectFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_documentation.presentation_file.upload",
        )
      : canUpdateInput;
  const canDeleteProjectFiles = canUpdateInput;
  const canViewDesignFiles = true;
  const canUploadDesignFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_documentation.design_file.upload",
        ) ||
        customPrivilegeCodes.includes(
          "project.client_documentation.pytha_file.upload",
        )
      : canUpdateInput;
  const canDeleteDesignFiles = canUpdateInput;
  const canUploadQuotationFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_documentation.quotation_file.upload",
        )
      : canUpdateInput;
  const canDeleteQuotationFiles = canUpdateInput;
  const canViewSpecifications =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_documentation.specifications.view",
        )
      : true;
  const canUploadSpecifications =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_documentation.specifications.upload",
        )
      : canUpdateInput;
  const canMoveToClientApproval = true;

  // ✅ Effective permissions — blocked lead overrides all write actions
  const effectiveCanEditSelections =
    canEditSelectionInstances && !shouldDisableBlockedActions;
  const effectiveCanUploadProjectFiles =
    canUploadProjectFiles && !shouldDisableBlockedActions;
  const effectiveCanUploadDesignFiles =
    canUploadDesignFiles && !shouldDisableBlockedActions;
  const effectiveCanDeleteProjectFiles =
    canDeleteProjectFiles && !shouldDisableBlockedActions;
  const effectiveCanDeleteDesignFiles =
    canDeleteDesignFiles && !shouldDisableBlockedActions;
  const effectiveCanUploadQuotationFiles =
    canUploadQuotationFiles && !shouldDisableBlockedActions;
  const effectiveCanDeleteQuotationFiles =
    canDeleteQuotationFiles && !shouldDisableBlockedActions;
  const effectiveCanMoveToClientApproval =
    canMoveToClientApproval && !pathname?.includes("/client-approval");

  const structureInstances: LeadProductStructureInstance[] = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );
  const displayGroups = React.useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return structureInstances.map((instance) => ({
        key: `instance-${instance.id}`,
        title: instance.title,
        subtitle: instance.productStructure?.type || "Product Structure",
        instance,
      }));
    }

    const grouped = new Map<
      string,
      {
        key: string;
        title: string;
        subtitle: string;
        instance: LeadProductStructureInstance;
      }
    >();

    structureInstances.forEach((instance) => {
      const title =
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type ||
        instance.productItemCode?.item_code ||
        instance.title ||
        "Item Group";
      const subtitle =
        instance.productItemCode?.item_code ||
        instance.productStructure?.type ||
        "Product Type";
      const key = String(
        instance.productType?.id ||
          instance.productItemCode?.productStructure?.productType?.id ||
          title,
      );

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          title,
          subtitle,
          instance,
        });
      }
    });

    return Array.from(grouped.values());
  }, [handlesLargeScaleProjects, structureInstances]);

  const carcassOptions = React.useMemo<ClientDocsSelectionOption[]>(
    () =>
      (Array.isArray(carcassTypesData?.data) ? carcassTypesData.data : []).map(
        (item) => ({
          value: `carcass-${item.id}`,
          label: item.name ?? "",
        }),
      ),
    [carcassTypesData?.data],
  );
  const availableCarcassValues = React.useMemo(
    () => new Set(carcassOptions.map((item) => item.value)),
    [carcassOptions],
  );

  const shutterOptions = React.useMemo<ClientDocsSelectionOption[]>(
    () =>
      [...(Array.isArray(shutterTypesData?.data) ? shutterTypesData.data : [])]
        .sort((a, b) => {
          const aHasDistinctSubTypes = (a.subTypes || []).some((subType) => {
            const subLabel = subType.name?.trim() || "";
            const mainLabel = a.name?.trim() || "";
            return (
              subLabel.length > 0 &&
              subLabel.toLowerCase() !== mainLabel.toLowerCase()
            );
          });
          const bHasDistinctSubTypes = (b.subTypes || []).some((subType) => {
            const subLabel = subType.name?.trim() || "";
            const mainLabel = b.name?.trim() || "";
            return (
              subLabel.length > 0 &&
              subLabel.toLowerCase() !== mainLabel.toLowerCase()
            );
          });

          if (aHasDistinctSubTypes !== bHasDistinctSubTypes) {
            return aHasDistinctSubTypes ? -1 : 1;
          }

          return (a.name || "").localeCompare(b.name || "");
        })
        .flatMap((item) => {
          const mainLabel = item.name?.trim() || "";
          const subTypes = Array.isArray(item.subTypes) ? item.subTypes : [];
          const distinctSubTypes = subTypes.filter((subType) => {
            const subLabel = subType.name?.trim() || "";
            return (
              subLabel.length > 0 &&
              subLabel.toLowerCase() !== mainLabel.toLowerCase()
            );
          });

          if (distinctSubTypes.length === 0) {
            return mainLabel
              ? [{ value: `shutter-${item.id}`, label: mainLabel }]
              : [];
          }

          return distinctSubTypes.map((subType) => ({
            value: `shutter-${item.id}-sub-${subType.id}`,
            label: subType.name ?? "",
          }));
        }),
    [shutterTypesData?.data],
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

  const isSelectionMastersLoading =
    isCarcassTypesLoading || isShutterTypesLoading || isHandleTypesLoading;

  const selectionForm = useForm<FormValues>({
    resolver: zodResolver(dynamicFormSchema) as any,
    defaultValues: {
      carcas: [],
      carcas_remark: defaultRemark,
      shutter: [],
      shutter_remark: defaultRemark,
      handles: [],
      handles_remark: defaultRemark,
    },
    mode: "onBlur",
  });

  const [activeUploadSection, setActiveUploadSection] =
    React.useState<UploadSectionConfig | null>(null);
  const [sectionSelectedFiles, setSectionSelectedFiles] = React.useState<
    File[]
  >([]);

  const [existingSelections, setExistingSelections] = React.useState<{
    carcas?: DesignSelection;
    shutter?: DesignSelection;
    handles?: DesignSelection;
  }>({});
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [activeInstance, setActiveInstance] =
    React.useState<LeadProductStructureInstance | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<null | number>(null);
  const [openConfirmMoveModal, setOpenConfirmMoveModal] = React.useState(false);
  const [selectedSpec, setSelectedSpec] =
    React.useState<LeadSpecificationEntry | null>(null);
  const activeDisplayGroup = React.useMemo(() => {
    if (!activeInstance) return null;

    if (!handlesLargeScaleProjects) {
      return {
        title: activeInstance.title,
      };
    }

    return {
      title:
        activeInstance.productType?.type ||
        activeInstance.productItemCode?.productStructure?.productType?.type ||
        activeInstance.productItemCode?.item_code ||
        activeInstance.title ||
        "Item Group",
    };
  }, [activeInstance, handlesLargeScaleProjects]);
  const itemCodeGroupMap = React.useMemo(
    () =>
      new Map<number, string>(
        structureInstances
          .filter((instance) => instance.productItemCode)
          .map((instance) => [
            instance.productItemCode!.id,
            instance.productType?.type ||
              instance.productItemCode?.productStructure?.productType?.type ||
              "Other Specifications",
          ]),
      ),
    [structureInstances],
  );
  const latestSpecificationByGroup = React.useMemo(() => {
    const groups = new Map<string, LeadSpecificationEntry>();

    for (const spec of specifications) {
      const title =
        (spec.item_code_id ? itemCodeGroupMap.get(spec.item_code_id) : null) ||
        "Other Specifications";
      const key = title.trim().toLowerCase();
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, spec);
        continue;
      }

      const existingTime = new Date(existing.created_at).getTime();
      const currentTime = new Date(spec.created_at).getTime();

      if (
        currentTime > existingTime ||
        (currentTime === existingTime && spec.id > existing.id)
      ) {
        groups.set(key, spec);
      }
    }

    return groups;
  }, [itemCodeGroupMap, specifications]);
  const largeScaleSpecificationStatus = React.useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return {
        allReviewed: true,
        missingGroups: [] as string[],
      };
    }

    const missingGroups = displayGroups
      .filter((group) => {
        const latestSpec = latestSpecificationByGroup.get(
          group.title.trim().toLowerCase(),
        );
        return !latestSpec?.is_completed;
      })
      .map((group) => group.title);

    return {
      allReviewed: missingGroups.length === 0,
      missingGroups,
    };
  }, [
    displayGroups,
    handlesLargeScaleProjects,
    latestSpecificationByGroup,
  ]);
  const activeSpecificationGroupKey = React.useMemo(() => {
    if (!handlesLargeScaleProjects || !activeInstance) return null;

    const title =
      activeInstance.productType?.type ||
      activeInstance.productItemCode?.productStructure?.productType?.type ||
      activeInstance.productItemCode?.item_code ||
      activeInstance.title ||
      "Other Specifications";

    return title.trim().toLowerCase();
  }, [activeInstance, handlesLargeScaleProjects]);
  const activeLatestSpecification = React.useMemo(() => {
    if (!activeSpecificationGroupKey) return null;
    return latestSpecificationByGroup.get(activeSpecificationGroupKey) ?? null;
  }, [activeSpecificationGroupKey, latestSpecificationByGroup]);

  const { data: activeSpecCarcassMappings } = useLeadCarcassMaterialMappings(
    vendorId,
    leadId,
    activeLatestSpecification?.id,
  );
  const { data: activeSpecShutterMappings } = useLeadShutterMaterialMappings(
    vendorId,
    leadId,
    activeLatestSpecification?.id,
  );
  const { data: activeSpecHardwareMappings } = useLeadHardwareMappings(
    vendorId,
    leadId,
    activeLatestSpecification?.id,
  );
  const { data: activeSpecLightMappings } = useLeadLightCarcasUnitMappings(
    vendorId,
    leadId,
    activeLatestSpecification?.id,
  );
  const { data: activeSpecOtherApplianceMappings } =
    useLeadOtherAppliancesMappings(
      vendorId,
      leadId,
      activeLatestSpecification?.id,
    );

  const activeSpecRequiresAdditionalUploads = React.useMemo(() => {
    if (!activeLatestSpecification?.is_completed) return false;

    const allMappings = [
      ...(activeSpecCarcassMappings ?? []),
      ...(activeSpecShutterMappings ?? []),
      ...(activeSpecHardwareMappings ?? []),
      ...(activeSpecLightMappings ?? []),
      ...(activeSpecOtherApplianceMappings ?? []),
    ];

    return allMappings.some(
      (item: any) => item.is_amended || item.is_deleted_item,
    );
  }, [
    activeLatestSpecification?.is_completed,
    activeSpecCarcassMappings,
    activeSpecShutterMappings,
    activeSpecHardwareMappings,
    activeSpecLightMappings,
    activeSpecOtherApplianceMappings,
  ]);

  const submitDesignsMutation = useSubmitDesigns();
  const uploadQuotationMutation = useSubmitQuotation();
  const { data: designDocsResponse } = useDesignsDoc(vendorId!, leadId);
  const { data: quotationDocsResponse } = useQuotationDoc(vendorId, leadId);
  const designDocs: any[] = designDocsResponse?.data?.documents ?? [];
  const quotationDocs: any[] = quotationDocsResponse?.data?.documents ?? [];

  const lastNotifiedInstanceIdRef = React.useRef<number | null | undefined>(
    undefined,
  );
  const onInstanceChangeRef = React.useRef(onInstanceChange);
  onInstanceChangeRef.current = onInstanceChange;

  useEffect(() => {
    if (!structureInstances.length) {
      if (activeInstance !== null) {
        setActiveInstance(null);
      }
      if (lastNotifiedInstanceIdRef.current !== null) {
        lastNotifiedInstanceIdRef.current = null;
        onInstanceChangeRef.current?.(null);
      }
      return;
    }

    const fallback = structureInstances[0];
    const selected =
      (activeInstance &&
        structureInstances.find((item) => item.id === activeInstance.id)) ||
      fallback;

    console.info("[SelectionsTabForClientDocs] instance sync", {
      leadId,
      activeInstanceId: activeInstance?.id ?? null,
      selectedId: selected?.id ?? null,
      instanceCount: structureInstances.length,
    });

    if (!activeInstance || activeInstance.id !== selected.id) {
      setActiveInstance(selected);
    }
    if (lastNotifiedInstanceIdRef.current !== selected.id) {
      lastNotifiedInstanceIdRef.current = selected.id;
      onInstanceChangeRef.current?.(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureInstances, activeInstance]);

  const labelToValues = (
    labelsStr: string | null | undefined,
    options: ClientDocsSelectionOption[],
  ): string[] => {
    if (!labelsStr) return [];
    const labels = labelsStr
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    return labels
      .map((lbl) => {
        const match = options.find(
          (opt) => (opt.label || "").toLowerCase() === lbl.toLowerCase(),
        );
        return match ? match.value : "";
      })
      .filter(Boolean);
  };

  const getCarcasValuesForInstance = (
    existingCarcas: DesignSelection | undefined,
    currentInstanceId: number | null,
  ) => {
    const existingCarcassValues = chsMappingToOptionValues(
      existingCarcas?.id,
      "Carcas",
    ).filter((value) => availableCarcassValues.has(value));
    let existingCarcassRemark = existingCarcas?.desc || defaultRemark;
    if (
      !handlesLargeScaleProjects &&
      existingCarcassRemark === DEFAULT_REMARK
    ) {
      existingCarcassRemark = "";
    }

    const fastProdReq = fastProductionDetails?.requests?.find(
      (r: any) => r.instance_id === currentInstanceId,
    );
    const fastProdCarcass = fastProdReq?.finishes?.find(
      (f: any) => f.component === "CARCASS",
    );

    // For fast-production leads, the request finish is the latest source of
    // truth. Do not let an older client-documentation selection override it.
    if (isFastProduction && fastProdCarcass) {
      const carcassValues = labelToValues(
        fastProdCarcass.finish_category,
        carcassOptions,
      );
      let carcassRemark = fastProdCarcass.finish_description || defaultRemark;
      if (!handlesLargeScaleProjects && carcassRemark === DEFAULT_REMARK) {
        carcassRemark = "";
      }
      return {
        value: carcassValues,
        remark: carcassRemark,
      };
    }

    return {
      value: existingCarcassValues,
      remark: existingCarcassRemark,
    };
  };

  const getShutterValuesForInstance = (
    existingShutter: DesignSelection | undefined,
    currentInstanceId: number | null,
  ) => {
    const existingShutterValues = (existingShutter as any)?.finish_category
      ? labelToValues(
          (existingShutter as any).finish_category,
          shutterOptions,
        )
      : chsMappingToOptionValues(existingShutter?.id, "Shutter");
    let existingShutterRemark = existingShutter?.desc || defaultRemark;
    if (
      !handlesLargeScaleProjects &&
      existingShutterRemark === DEFAULT_REMARK
    ) {
      existingShutterRemark = "";
    }

    const fastProdReq = fastProductionDetails?.requests?.find(
      (r: any) => r.instance_id === currentInstanceId,
    );
    const fastProdShutter = fastProdReq?.finishes?.find(
      (f: any) => f.component === "SHUTTER",
    );

    if (isFastProduction && fastProdShutter) {
      const shutterValues = labelToValues(
        fastProdShutter.finish_category,
        shutterOptions,
      );
      let shutterRemark = fastProdShutter.finish_description || defaultRemark;
      if (!handlesLargeScaleProjects && shutterRemark === DEFAULT_REMARK) {
        shutterRemark = "";
      }
      return {
        value: shutterValues,
        remark: shutterRemark,
      };
    }

    return {
      value: existingShutterValues,
      remark: existingShutterRemark,
    };
  };

  const getHandlesValuesForInstance = (
    existingHandles: DesignSelection | undefined,
    currentInstanceId: number | null,
  ) => {
    const existingHandlesValues = (existingHandles as any)?.finish_category
      ? labelToValues(
          (existingHandles as any).finish_category,
          handleOptions,
        )
      : chsMappingToOptionValues(existingHandles?.id, "Handles");
    let existingHandlesRemark = existingHandles?.desc || defaultRemark;
    if (
      !handlesLargeScaleProjects &&
      existingHandlesRemark === DEFAULT_REMARK
    ) {
      existingHandlesRemark = "";
    }

    const fastProdReq = fastProductionDetails?.requests?.find(
      (r: any) => r.instance_id === currentInstanceId,
    );
    const fastProdHandle = fastProdReq?.finishes?.find(
      (f: any) => f.component === "HANDLE",
    );

    if (isFastProduction && fastProdHandle) {
      const handleValues = labelToValues(
        fastProdHandle.finish_category,
        handleOptions,
      );
      let handleRemark = fastProdHandle.finish_description || defaultRemark;
      if (!handlesLargeScaleProjects && handleRemark === DEFAULT_REMARK) {
        handleRemark = "";
      }
      return {
        value: handleValues,
        remark: handleRemark,
      };
    }

    return {
      value: existingHandlesValues,
      remark: existingHandlesRemark,
    };
  };

  useEffect(() => {
    const currentCarcassValues = selectionForm.getValues("carcas") ?? [];
    if (currentCarcassValues.length === 0) return;

    const nextValues = currentCarcassValues.filter((value) =>
      availableCarcassValues.has(value),
    );

    if (nextValues.length !== currentCarcassValues.length) {
      selectionForm.setValue("carcas", nextValues, {
        shouldValidate: true,
      });
    }
  }, [availableCarcassValues, selectionForm]);

  useEffect(() => {
    const rows = Array.isArray(selectionsData?.data) ? selectionsData.data : [];
    const activeInstanceId = activeInstance?.id ?? null;

    let scoped = rows.filter(
      (row) => (row.product_structure_instance_id ?? null) === activeInstanceId,
    );

    if (scoped.length === 0 && activeInstanceId !== null) {
      const leadLevelSelections = rows.filter(
        (row) => (row.product_structure_instance_id ?? null) === null,
      );
      scoped = leadLevelSelections;
    }

    if (structureInstances.length === 0 && scoped.length === 0) {
      scoped = rows.filter(
        (row) => (row.product_structure_instance_id ?? null) === null,
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
      totalRows: rows.length,
      scopedCount: scoped.length,
      carcas,
      shutter,
      handles,
    });

    setExistingSelections({ carcas, shutter, handles });

    const cVal = getCarcasValuesForInstance(carcas, activeInstanceId);
    const sVal = getShutterValuesForInstance(shutter, activeInstanceId);
    const hVal = getHandlesValuesForInstance(handles, activeInstanceId);

    selectionForm.reset({
      carcas: cVal.value,
      carcas_remark: cVal.remark,
      shutter: sVal.value,
      shutter_remark: sVal.remark,
      handles: hVal.value,
      handles_remark: hVal.remark,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeInstance?.id,
    selectionsData?.data,
    chsMappings,
    fastProductionDetails,
  ]);

  useEffect(() => {
    if (!uploadModalOpen) {
      const activeInstanceId = activeInstance?.id ?? null;
      const cVal = getCarcasValuesForInstance(
        existingSelections.carcas,
        activeInstanceId,
      );
      const sVal = getShutterValuesForInstance(
        existingSelections.shutter,
        activeInstanceId,
      );
      const hVal = getHandlesValuesForInstance(
        existingSelections.handles,
        activeInstanceId,
      );

      selectionForm.reset({
        carcas: cVal.value,
        carcas_remark: cVal.remark,
        shutter: sVal.value,
        shutter_remark: sVal.remark,
        handles: hVal.value,
        handles_remark: hVal.remark,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadModalOpen, fastProductionDetails, existingSelections]);

  const chsMappingToOptionValues = (
    selectionId: number | undefined,
    type: "Carcas" | "Shutter" | "Handles",
  ): string[] => {
    if (!selectionId) return [];
    return chsMappings
      .filter((m) => m.selection_id === selectionId)
      .flatMap((item) => {
        if (type === "Carcas" && item.carcass_type_id)
          return [`carcass-${item.carcass_type_id}`];
        if (type === "Shutter" && item.shutter_type_id) {
          if (item.shutter_sub_type_id)
            return [
              `shutter-${item.shutter_type_id}-sub-${item.shutter_sub_type_id}`,
            ];
          return [`shutter-${item.shutter_type_id}`];
        }
        if (type === "Handles" && item.handle_type_id)
          return [`handle-${item.handle_type_id}`];
        return [];
      });
  };

  const normalizeValue = (_values?: string[], remark?: string) => {
    const trimmed = remark?.trim();
    if (trimmed) return trimmed;
    return handlesLargeScaleProjects ? DEFAULT_REMARK : "";
  };

  const parseOptionValueToCHSItem = (
    value: string,
    type: "Carcas" | "Shutter" | "Handles",
  ): CHSMappingItem => {
    if (type === "Carcas") {
      const match = value.match(/^carcass-(\d+)$/);
      if (match) return { carcass_type_id: Number(match[1]) };
    } else if (type === "Shutter") {
      const subMatch = value.match(/^shutter-(\d+)-sub-(\d+)$/);
      if (subMatch)
        return {
          shutter_type_id: Number(subMatch[1]),
          shutter_sub_type_id: Number(subMatch[2]),
        };
      const match = value.match(/^shutter-(\d+)$/);
      if (match) return { shutter_type_id: Number(match[1]) };
    } else if (type === "Handles") {
      const match = value.match(/^handle-(\d+)$/);
      if (match) return { handle_type_id: Number(match[1]) };
    }
    return {};
  };

  const upsertSelection = async (
    type: "Carcas" | "Shutter" | "Handles",
    descRaw?: string[],
    remark?: string,
  ): Promise<number | null> => {
    const desc = normalizeValue(descRaw, remark);
    const currentInstanceId = activeInstance?.id ?? null;

    const instanceSelections = getSelectionsByInstanceId(currentInstanceId);
    const existing =
      instanceSelections[type.toLowerCase() as keyof typeof instanceSelections];

    const isInstanceSpecific =
      existing &&
      (existing.product_structure_instance_id ?? null) === currentInstanceId;

    if (existing && isInstanceSpecific) {
      const result = await editSelectionAsync({
        selectionId: existing.id,
        payload: {
          type,
          desc,
          updated_by: userId!,
          product_structure_instance_id:
            existing.product_structure_instance_id ?? null,
        },
      });
      return (result as any)?.data?.id ?? existing.id;
    }

    const result = await createSelectionAsync({
      type,
      desc,
      vendor_id: vendorId!,
      lead_id: leadId!,
      user_id: userId!,
      account_id: accountId!,
      product_structure_instance_id: currentInstanceId,
    });
    return (result as any)?.data?.id ?? null;
  };

  const onSaveSelections = async (values: FormValues) => {
    const dirtyFields = selectionForm.formState.dirtyFields;

    if (!effectiveCanEditSelections) {
      toastManager.add({
        title: shouldDisableBlockedActions
          ? blockedTooltip ||
            "This lead is blocked. You cannot edit selections."
          : "You do not have permission to update selections.",
        type: "error",
      });
      return;
    }

    const dirty: Array<{
      type: "Carcas" | "Shutter" | "Handles";
      vals?: string[];
      remark?: string;
    }> = [];

    if (dirtyFields.carcas || dirtyFields.carcas_remark)
      dirty.push({
        type: "Carcas",
        vals: values.carcas,
        remark: values.carcas_remark,
      });
    if (dirtyFields.shutter || dirtyFields.shutter_remark)
      dirty.push({
        type: "Shutter",
        vals: values.shutter,
        remark: values.shutter_remark,
      });
    if (dirtyFields.handles || dirtyFields.handles_remark)
      dirty.push({
        type: "Handles",
        vals: values.handles,
        remark: values.handles_remark,
      });

    if (!dirty.length) {
      toastManager.add({ title: "No changes detected", type: "info" });
      return;
    }

    try {
      for (const { type, vals, remark } of dirty) {
        const selectionId = await upsertSelection(type, vals, remark);

        if (selectionId && vendorId && userId) {
          const items: CHSMappingItem[] = (vals || [])
            .map((v) => parseOptionValueToCHSItem(v, type))
            .filter((item) => Object.keys(item).length > 0);

          await saveCHSMappings({
            vendor_id: vendorId,
            lead_id: leadId,
            selection_id: selectionId,
            items,
            created_by: userId,
          });
        }
      }

      toastManager.add({ title: "Selections saved", type: "success" });
      await refetch();
      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lead-status", leadId, vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["chsSelectionMappings", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["chsManufacturingDaysByInstance", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getSelectionData", vendorId, leadId],
      });
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Some selections failed to update";

      toastManager.add({ title: errorMessage, type: "error" });
    }
  };

  const docsByInstance = React.useMemo(() => {
    const groups = docsDetails?.documents_by_instance || [];
    const map = new Map<
      number,
      { ppt: any[]; pytha: any[]; pptCount: number; pythaCount: number }
    >();
    groups.forEach((group) => {
      if (group.instance_id === null || group.instance_id === undefined) return;
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
    if (
      instanceId !== null &&
      instanceId !== undefined &&
      docsByInstance.has(instanceId)
    ) {
      const data = docsByInstance.get(instanceId)!;
      return { ppt: data.pptCount, pytha: data.pythaCount };
    }
    if (docsDetails?.documents) {
      return {
        ppt: docsDetails.documents.ppt?.length || 0,
        pytha: docsDetails.documents.pytha?.length || 0,
      };
    }
    return { ppt: 0, pytha: 0 };
  };

  const getDocs = (instanceId?: number | null) => {
    if (
      instanceId !== null &&
      instanceId !== undefined &&
      docsByInstance.has(instanceId)
    ) {
      const data = docsByInstance.get(instanceId)!;
      return data;
    }
    if (docsDetails?.documents) {
      return {
        ppt: docsDetails.documents.ppt || [],
        pytha: docsDetails.documents.pytha || [],
        pptCount: docsDetails.documents.ppt?.length || 0,
        pythaCount: docsDetails.documents.pytha?.length || 0,
      };
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
      if (
        row.type !== "Carcas" &&
        row.type !== "Shutter" &&
        row.type !== "Handles"
      )
        continue;

      const hasCHSMappings = chsMappings.some((m) => m.selection_id === row.id);
      const hasLegacyDesc = (() => {
        const upper = (row.desc || "").trim().toUpperCase();
        return (
          Boolean(upper) &&
          upper !== "NULL" &&
          upper !== "N/A" &&
          upper.startsWith("SELECTIONS:")
        );
      })();

      if (hasCHSMappings || hasLegacyDesc) {
        tracker[row.type as "Carcas" | "Shutter" | "Handles"] = true;
      }
    }

    const fastProdRequests = Array.isArray(fastProductionDetails?.requests)
      ? fastProductionDetails.requests
      : [];
    for (const req of fastProdRequests) {
      const key = req.instance_id ?? null;
      if (!grouped.has(key)) {
        grouped.set(key, { Carcas: false, Shutter: false, Handles: false });
      }
      const tracker = grouped.get(key)!;
      const hasCarcass = req.finishes?.some(
        (f: any) => f.component === "CARCASS" && f.finish_category,
      );
      const hasShutter = req.finishes?.some(
        (f: any) => f.component === "SHUTTER" && f.finish_category,
      );
      const hasHandle = req.finishes?.some(
        (f: any) => f.component === "HANDLE" && f.finish_category,
      );

      if (hasCarcass) tracker.Carcas = true;
      if (hasShutter) tracker.Shutter = true;
      if (hasHandle) tracker.Handles = true;
    }

    return grouped;
  }, [selectionsData?.data, chsMappings, fastProductionDetails]);

  const checkTrackerReady = (
    tracker:
      | { Carcas: boolean; Shutter: boolean; Handles: boolean }
      | undefined,
  ) => {
    if (!tracker) return false;
    if (isFastProduction) {
      return Boolean(tracker.Carcas);
    }
    return Boolean(tracker.Carcas && tracker.Shutter);
  };

  const allInstancesSelectionsReady =
    structureInstances.length > 1
      ? structureInstances.every((instance) => {
          const tracker = selectionsByInstance.get(instance.id);
          return checkTrackerReady(tracker);
        })
      : (() => {
          if (structureInstances.length === 0) {
            const nullBucket = selectionsByInstance.get(null);
            return checkTrackerReady(nullBucket);
          }
          const nullBucket = selectionsByInstance.get(null);
          const firstInstanceBucket = activeInstance
            ? selectionsByInstance.get(activeInstance.id)
            : undefined;
          return Boolean(
            checkTrackerReady(firstInstanceBucket) ||
            checkTrackerReady(nullBucket),
          );
        })();

  // ✅ Move to client approval is disabled if lead is blocked
  const canMoveStage =
    allInstancesDocsReady &&
    allInstancesSelectionsReady &&
    largeScaleSpecificationStatus.allReviewed &&
    !selectionForm.formState.isDirty &&
    !isMovingStage &&
    !shouldDisableBlockedActions;

  const isSingleInstance = structureInstances.length === 1;
  const isSingleDisplayGroup = displayGroups.length === 1;

  const handleOpenUploadModal = (instance: LeadProductStructureInstance) => {
    setActiveInstance(instance);
    onInstanceChange?.(instance);
    setActiveUploadSection(null);
    setSectionSelectedFiles([]);
    setUploadModalOpen(true);
  };

  const isSectionUploading =
    activeUploadSection?.id === "project" || activeUploadSection?.id === "pytha"
      ? isUploadingDocs
      : activeUploadSection?.id === "design"
        ? submitDesignsMutation.isPending
        : uploadQuotationMutation.isPending;

  const handleSectionUpload = async () => {
    if (!activeUploadSection || !vendorId || !userId || !activeInstance) {
      toastManager.add({
        title: "Missing vendorId or userId for upload",
        type: "error",
      });
      return;
    }
    if (sectionSelectedFiles.length === 0) return;

    try {
      if (activeUploadSection.id === "project" || activeUploadSection.id === "pytha") {
        await uploadClientDocs({
          leadId,
          accountId,
          vendorId,
          createdBy: userId,
          productStructureInstanceId: activeInstance.id,
          pptDocuments:
            activeUploadSection.id === "project" ? sectionSelectedFiles : [],
          pythaDocuments:
            activeUploadSection.id === "pytha" ? sectionSelectedFiles : [],
        });
        await queryClient.invalidateQueries({
          queryKey: ["clientDocumentationDetails", vendorId, leadId],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ["getSelectionData", vendorId, leadId],
        });
      } else if (activeUploadSection.id === "design") {
        await submitDesignsMutation.mutateAsync({
          files: sectionSelectedFiles,
          vendorId,
          leadId,
          userId,
          productStructureInstanceIds: [activeInstance.id],
          specificationId: activeLatestSpecification?.id ?? null,
        });
        queryClient.invalidateQueries({
          queryKey: ["getDesignsDoc", vendorId, leadId],
        });
        queryClient.invalidateQueries({
          queryKey: ["designingStageCounts", vendorId, leadId],
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          uploadQuotationMutation.mutate(
            { files: sectionSelectedFiles, vendorId, leadId, userId },
            {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            },
          );
        });
      }

      toastManager.add({ title: "Files uploaded successfully!", type: "success" });
      setSectionSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["allLeadDocuments"] });
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to upload files";

      toastManager.add({ title: errorMessage, type: "error" });
    }
  };

  const handleOpenConfirmMove = () => {
    if (shouldDisableBlockedActions) {
      toastManager.add({
        title: blockedTooltip || "This lead is blocked.",
        type: "error",
      });
      return;
    }
    if (selectionForm.formState.isDirty) {
      toastManager.add({
        title: "Please save Carcas, Shutter and Handles before moving stage",
        type: "error",
      });
      return;
    }
    setOpenConfirmMoveModal(true);
  };

  const handleMoveStage = () => {
    if (!vendorId || !userId) return;
    moveToClientApproval(
      { leadId, vendorId, updatedBy: userId },
      {
        onSuccess: () => {
          setOpenConfirmMoveModal(false);
          router.push("/dashboard/project/client-approval");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({
            queryKey: ["universal-stage-leads"],
          });
        },
        onError: () => {
          setOpenConfirmMoveModal(false);
        },
      },
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

  React.useEffect(() => {
    console.info("[SelectionsTabForClientDocs] mounted", {
      leadId,
      accountId,
      vendorId,
      userId,
      userType,
      isClientDocumentationStage,
      structureInstanceCount: structureInstances.length,
      structureInstanceIds: structureInstances.map((i) => i.id),
      isLoading,
      isError,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  React.useEffect(() => {
    if (!isError) return;
    console.error("[SelectionsTabForClientDocs] selection data fetch failed", {
      leadId,
      accountId,
      vendorId,
      userId,
    });
  }, [isError, leadId, accountId, vendorId, userId]);

  const isPending = isCreating || isEditing;

  const getSelectionsByInstanceId = (instance_id: number | null) => {
    const rows = Array.isArray(selectionsData?.data) ? selectionsData.data : [];

    let scoped = rows.filter(
      (row) => (row.product_structure_instance_id ?? null) === instance_id,
    );

    if (scoped.length === 0 && instance_id !== null) {
      const leadLevelSelections = rows.filter(
        (row) => (row.product_structure_instance_id ?? null) === null,
      );
      scoped = leadLevelSelections;
    }

    if (structureInstances.length === 0 && scoped.length === 0) {
      scoped = rows.filter(
        (row) => (row.product_structure_instance_id ?? null) === null,
      );
    }

    const byType = (type: string) =>
      scoped.find((item) => {
        if (item.type !== type) return false;
        const value = (item.desc || "").trim().toUpperCase();
        return value !== "NULL" && value !== "N/A";
      }) || scoped.find((item) => item.type === type);

    return {
      carcas: byType("Carcas"),
      shutter: byType("Shutter"),
      handles: byType("Handles"),
    };
  };

  const renderInstanceEditorContent = (instance_id: number | null) => {
    if (instance_id === null && structureInstances.length > 0) return null;

    console.log("instance _id: ", instance_id);

    return (
      <div className="flex-1 space-y-6 py-4 px-5">
        {handlesLargeScaleProjects && canViewSpecifications && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold">Latest Specification</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest specs for this item group.
                </p>
              </div>
              {activeLatestSpecification && (
                <Badge variant="outline">Latest</Badge>
              )}
            </div>

            {activeLatestSpecification ? (
              <button
                type="button"
                onClick={() => setSelectedSpec(activeLatestSpecification)}
                className="w-full rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {activeLatestSpecification.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeDisplayGroup?.title || "Item Group"}
                    </p>
                  </div>
                  <Badge variant="secondary">Open</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Specification</span>
                  <span>
                    {new Date(activeLatestSpecification.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </button>
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                <p className="text-sm font-medium">No specification found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a spec for this item group to show it here.
                </p>
              </div>
            )}
          </div>
        )}

        {!handlesLargeScaleProjects && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div>
              <h4 className="text-sm font-semibold">Design Selections</h4>
              {!effectiveCanEditSelections && (
                <Badge variant="secondary">
                  {shouldDisableBlockedActions
                    ? "Lead is blocked"
                    : "Read only"}
                </Badge>
              )}
              {(() => {
                const days = getManufacturingDaysForInstance(instance_id);
                return days != null ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      Manufacturing Timeline:
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {days} days
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                    Save Carcas &amp; Shutter selections to auto-calculate the
                    manufacturing timeline for this instance.
                  </p>
                );
              })()}
            </div>

            <div>
              {/* ✅ Save/Update button — disabled + tooltip when blocked */}
              {canEditSelectionInstances && (
                <div className="flex justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block">
                          <Button
                            type="button"
                            disabled={isPending || shouldDisableBlockedActions}
                            onClick={
                              shouldDisableBlockedActions
                                ? undefined
                                : selectionForm.handleSubmit(onSaveSelections)
                            }
                          >
                            {isPending
                              ? "Saving..."
                              : (existingSelections.carcas &&
                                    chsMappings.some(
                                      (m) =>
                                        m.selection_id ===
                                        existingSelections.carcas?.id,
                                    )) ||
                                  (existingSelections.shutter &&
                                    chsMappings.some(
                                      (m) =>
                                        m.selection_id ===
                                        existingSelections.shutter?.id,
                                    )) ||
                                  (existingSelections.handles &&
                                    chsMappings.some(
                                      (m) =>
                                        m.selection_id ===
                                        existingSelections.handles?.id,
                                    ))
                                ? "Update Design Selections"
                                : "Save Design Selections"}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {shouldDisableBlockedActions && (
                        <TooltipContent>{blockedTooltip}</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">Carcas *</FormLabel>
                      <FormControl>
                        <ClientDocsSelectionMultiSelect
                          value={field.value || []}
                          onChange={field.onChange}
                          options={carcassOptions}
                          placeholder="Select carcass options"
                          disabled={
                            isPending ||
                            !effectiveCanEditSelections ||
                            isSelectionMastersLoading
                          }
                          isError={Boolean(fieldState.error)}
                        />
                      </FormControl>
                      <FormField
                        control={selectionForm.control}
                        name="carcas_remark"
                        render={({
                          field: remarkField,
                          fieldState: remarkState,
                        }) => (
                          <FormItem className="">
                            <FormControl>
                              <TextAreaInput
                                value={remarkField.value ?? defaultRemark}
                                onChange={remarkField.onChange}
                                placeholder="Enter carcas remark..."
                                disabled={
                                  isPending || !effectiveCanEditSelections
                                }
                                className="h-24"
                                isError={Boolean(remarkState.error)}
                                errorMessage={remarkState.error?.message}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={selectionForm.control}
                  name="handles"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">Handles</FormLabel>
                      <FormControl>
                        <ClientDocsSelectionMultiSelect
                          value={field.value || []}
                          onChange={field.onChange}
                          options={handleOptions}
                          placeholder="Select handle options"
                          disabled={
                            isPending ||
                            !effectiveCanEditSelections ||
                            isSelectionMastersLoading
                          }
                          isError={Boolean(fieldState.error)}
                        />
                      </FormControl>
                      <FormField
                        control={selectionForm.control}
                        name="handles_remark"
                        render={({
                          field: remarkField,
                          fieldState: remarkState,
                        }) => (
                          <FormItem>
                            <FormControl>
                              <TextAreaInput
                                value={remarkField.value ?? defaultRemark}
                                onChange={remarkField.onChange}
                                placeholder="Enter handles remark..."
                                disabled={
                                  isPending || !effectiveCanEditSelections
                                }
                                className="h-24"
                                isError={Boolean(remarkState.error)}
                                errorMessage={remarkState.error?.message}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={selectionForm.control}
                  name="shutter"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-2 md:col-span-2">
                      <FormLabel className="font-medium">
                        Shutter {!(isFastProduction || isSmallOrder) && " *"}
                      </FormLabel>
                      <FormControl>
                        <ClientDocsSelectionMultiSelect
                          value={field.value || []}
                          onChange={field.onChange}
                          options={shutterOptions}
                          placeholder="Select shutter options"
                          disabled={
                            isPending ||
                            !effectiveCanEditSelections ||
                            isSelectionMastersLoading
                          }
                          isError={Boolean(fieldState.error)}
                        />
                      </FormControl>
                      <FormField
                        control={selectionForm.control}
                        name="shutter_remark"
                        render={({
                          field: remarkField,
                          fieldState: remarkState,
                        }) => (
                          <FormItem>
                            <FormControl>
                              <TextAreaInput
                                value={remarkField.value ?? defaultRemark}
                                onChange={remarkField.onChange}
                                placeholder="Enter shutter remark..."
                                disabled={
                                  isPending || !effectiveCanEditSelections
                                }
                                className="h-24"
                                isError={Boolean(remarkState.error)}
                                errorMessage={remarkState.error?.message}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
        )}

        {(() => {
          const docs = getDocs(instance_id);
          const instanceDesignDocs = designDocs.filter(
            (doc: any) =>
              (doc.product_structure_instance_id ?? null) === instance_id,
          );
          const instanceQuotationDocs = quotationDocs.filter(
            (doc: any) =>
              (doc.product_structure_instance_id ?? null) === instance_id,
          );

          const documentSections: UploadSectionConfig[] = [
            {
              id: "project",
              title: projectFilesLabel,
              description: isCustomVendorFlow
                ? "Presentation files shared with the client"
                : "Project files for this item group",
              icon: <FileText className="w-5 h-5" />,
              accept: ".ppt,.pptx,.pdf,.jpg,.jpeg,.png,.doc,.docx",
              docs: docs.ppt,
              canView: canViewProjectFiles,
              canUpload: effectiveCanUploadProjectFiles,
              canDelete: effectiveCanDeleteProjectFiles,
              required: true,
            },
            {
              id: "pytha",
              title: designFilesLabel,
              description: "Pytha design files for manufacturing",
              icon: <FileText className="w-5 h-5" />,
              accept: ".pdf,.zip,.pytha,.pyo",
              docs: docs.pytha,
              canView: canViewDesignFiles,
              canUpload: effectiveCanUploadDesignFiles,
              canDelete: effectiveCanDeleteDesignFiles,
              required: true,
            },
          ];

          if (activeSpecRequiresAdditionalUploads) {
            documentSections.push(
              {
                id: "design",
                title: "Design Files",
                description: "Updated design after specification review",
                icon: <PenTool className="w-5 h-5" />,
                accept:
                  ".pdf,.pyo,.pytha,.dwg,.dxf,.stl,.step,.stp,.iges,.igs,.3ds,.obj,.skp,.sldprt,.sldasm,.prt,.catpart,.catproduct,.zip",
                docs: instanceDesignDocs,
                canView: true,
                canUpload: effectiveCanUploadDesignFiles,
                canDelete: effectiveCanDeleteDesignFiles,
                required: true,
              },
              {
                id: "quotation",
                title: "Quotation",
                description: "Updated quotation after specification review",
                icon: <ScrollText className="w-5 h-5" />,
                docs: instanceQuotationDocs,
                canView: true,
                canUpload: effectiveCanUploadQuotationFiles,
                canDelete: effectiveCanDeleteQuotationFiles,
                required: true,
              },
            );
          }

          return (
            <div className="space-y-4">
              {activeSpecRequiresAdditionalUploads && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                  This specification was completed with amended or deleted
                  items — please upload the updated design and quotation
                  files below.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documentSections
                  .filter((section) => section.canView)
                  .map((section) => {
                    const count = section.docs.length;
                    const isMissingRequired =
                      !!section.required && count === 0;

                    return (
                      <Card
                        key={section.id}
                        className="h-full rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer group"
                        onClick={() => {
                          setActiveUploadSection(section);
                          setSectionSelectedFiles([]);
                        }}
                      >
                        <CardContent className="px-6 py-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-neutral-50 dark:bg-neutral-800 text-primary">
                                {section.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                  {section.title}
                                  {isMissingRequired && (
                                    <span className="text-destructive">
                                      *
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {section.description}
                                </p>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveUploadSection(section);
                                setSectionSelectedFiles([]);
                              }}
                            >
                              {count === 0
                                ? section.canUpload
                                  ? "Upload"
                                  : "View"
                                : "View"}
                            </Button>
                          </div>

                          <div className="my-4 border-t" />

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <FolderOpen className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {count} file{count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {isMissingRequired && (
                              <Badge
                                variant="outline"
                                className="border-destructive/40 text-destructive"
                              >
                                Required
                              </Badge>
                            )}
                          </div>

                          {count > 0 ? (
                            <div className="flex -space-x-2">
                              {section.docs
                                .slice(0, 4)
                                .map((doc: any, idx: number) => (
                                  <div
                                    key={doc.id}
                                    className="w-10 h-10 rounded-lg border bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                                    style={{ zIndex: 4 - idx }}
                                  >
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                ))}
                              {count > 4 && (
                                <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted-foreground">
                                  +{count - 4}
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
                    );
                  })}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderMoveToClientApprovalButton = () => {
    if (handlesLargeScaleProjects) return null;
    if (!isClientDocumentationStage || !effectiveCanMoveToClientApproval)
      return null;

    const missing: string[] = [];
    if (shouldDisableBlockedActions)
      missing.push(blockedTooltip || "Lead is blocked");
    if (!allInstancesSelectionsReady) {
      if (isFastProduction) {
        missing.push("Save Carcas for all instances");
      } else {
        missing.push("Save Carcas & Shutter for all instances");
      }
    }
    if (!allInstancesDocsReady)
      missing.push(
        "Upload Project Files & Pytha Files for all instances",
      );
    if (selectionForm.formState.isDirty)
      missing.push("Save unsaved Design Selection changes");

    const canMoveStage = missing.length === 0;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block w-full sm:w-auto">
              <Button
                onClick={handleOpenConfirmMove}
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
            </span>
          </TooltipTrigger>
          {missing.length > 0 && (
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium mb-1">
                Complete the following:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                {missing.map((item) => (
                  <li key={item} className="text-xs">
                    {item}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
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
    <div className="space-y-6 pb-6 bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      {canViewSelectionInstances && (
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Design Selections & Instance Documents
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {handlesLargeScaleProjects
                ? "Open each item group card to upload docs and save design selections"
                : "Open each product instance card to upload docs and save design selections"}
            </p>
          </div>
        </div>
      )}

      {/* Product Instances Cards */}
      {canViewSelectionInstances && displayGroups.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">
            {handlesLargeScaleProjects ? "Item Groups" : "Product Instances"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {displayGroups.map((group, index) => {
              const counts = getCounts(group.instance.id);
              const isUploaded = counts.ppt > 0 && counts.pytha > 0;
              const totalDocs = counts.ppt + counts.pytha;

              return (
                <motion.div
                  key={group.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <Card
                    className="h-full rounded-2xl border bg-white dark:bg-neutral-900 
                    hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.12)]
                    transition-all duration-200 cursor-pointer group"
                    onClick={() => handleOpenUploadModal(group.instance)}
                  >
                    <CardContent className="px-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center 
                            border bg-neutral-50 dark:bg-neutral-800 text-primary"
                          >
                            <FolderOpen className="size-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {group.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {group.subtitle}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUploadModal(group.instance);
                          }}
                        >
                          {totalDocs === 0 ? "Upload" : "View"}
                        </Button>
                      </div>

                      <div className="my-4 border-t" />

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
                            ),
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

      {canViewSelectionInstances &&
        ((handlesLargeScaleProjects && isSingleDisplayGroup) ||
          (!handlesLargeScaleProjects && isSingleInstance)) &&
        activeInstance && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">
            {activeDisplayGroup?.title || activeInstance.title}
          </h3>
          <div className="rounded-2xl border bg-white dark:bg-neutral-900">
            {renderInstanceEditorContent(activeInstance.id)}
          </div>
        </div>
      )}

      {/* ✅ Move to Client Approval — shown when handlesLargeScaleProjects is false */}
      {!handlesLargeScaleProjects &&
        isClientDocumentationStage &&
        effectiveCanMoveToClientApproval && (
          <div className="pt-2">{renderMoveToClientApprovalButton()}</div>
        )}

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && activeInstance && (
          <BaseModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            title={activeDisplayGroup?.title || activeInstance.title}
            description={
              handlesLargeScaleProjects
                ? "Upload and manage files for this Item Group"
                : "Upload and manage files for this product instance"
            }
            icon={
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="size-6" />
              </div>
            }
            size="xl"
          >
            {renderInstanceEditorContent(activeInstance.id)}
          </BaseModal>
        )}
      </AnimatePresence>

      {/* Section Upload Modal */}
      <AnimatePresence>
        {activeUploadSection && (
          <BaseModal
            open={!!activeUploadSection}
            onOpenChange={(open) => {
              if (!open) {
                setActiveUploadSection(null);
                setSectionSelectedFiles([]);
              }
            }}
            title={activeUploadSection.title}
            description={activeUploadSection.description}
            icon={
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                {activeUploadSection.icon}
              </div>
            }
            size="lg"
          >
            <div className="flex-1 space-y-6 py-4 px-5">
              {activeUploadSection.canUpload && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      Upload New Files
                    </h4>
                    {sectionSelectedFiles.length > 0 && (
                      <Badge variant="secondary">
                        {sectionSelectedFiles.length} selected
                      </Badge>
                    )}
                  </div>

                  <div
                    className={
                      shouldDisableBlockedActions
                        ? "pointer-events-none opacity-60"
                        : ""
                    }
                  >
                    <FileUploadField
                      value={sectionSelectedFiles}
                      onChange={setSectionSelectedFiles}
                      accept={activeUploadSection.accept}
                    />
                  </div>

                  {sectionSelectedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex justify-end"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button
                                onClick={handleSectionUpload}
                                disabled={
                                  isSectionUploading ||
                                  shouldDisableBlockedActions
                                }
                                className="gap-2"
                              >
                                {isSectionUploading ? (
                                  <>
                                    <Loader2 className="animate-spin w-4 h-4" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4" />
                                    Upload {sectionSelectedFiles.length} File
                                    {sectionSelectedFiles.length > 1
                                      ? "s"
                                      : ""}
                                  </>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {shouldDisableBlockedActions && (
                            <TooltipContent>{blockedTooltip}</TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </motion.div>
                  )}
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Uploaded Files</h4>
                  <Badge variant="outline">
                    {activeUploadSection.docs.length} total
                  </Badge>
                </div>

                {activeUploadSection.docs.length === 0 ? (
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
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3">
                      {(() => {
                        const { images, nonImages } = separateImageAndDocs(
                          activeUploadSection.docs,
                        );
                        return (
                          <>
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
                                    signedUrl: doc.signedUrl ?? doc.signed_url,
                                    created_at: doc.created_at,
                                  }}
                                  index={index}
                                  canDelete={activeUploadSection.canDelete}
                                  onDelete={(id) =>
                                    setConfirmDelete(Number(id))
                                  }
                                />
                              </motion.div>
                            ))}
                            {nonImages.map((doc: any, index: number) => (
                              <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  delay: (images.length + index) * 0.05,
                                }}
                              >
                                <DocumentCard
                                  doc={{
                                    id: doc.id,
                                    originalName: doc.doc_og_name,
                                    signedUrl: doc.signedUrl ?? doc.signed_url,
                                    created_at: doc.created_at,
                                  }}
                                  canDelete={activeUploadSection.canDelete}
                                  onDelete={(id) => setConfirmDelete(id)}
                                />
                              </motion.div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </BaseModal>
        )}
      </AnimatePresence>

      <ViewSpecsModal
        open={!!selectedSpec}
        onOpenChange={(open) => {
          if (!open) setSelectedSpec(null);
        }}
        specification={selectedSpec}
        readOnly={!canUploadSpecifications}
        showReviewColumns
        stackSections
        contentClassName="w-[95vw] max-w-[95vw] sm:w-[92vw] sm:max-w-[92vw] xl:max-w-[1680px]"
      />

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

      {/* Confirm Move Stage Modal */}
      <AlertDialog
        open={openConfirmMoveModal}
        onOpenChange={setOpenConfirmMoveModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Client Approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this lead to the Client Approval stage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMovingStage}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveStage}
              disabled={isMovingStage}
            >
              {isMovingStage ? "Moving..." : "Move to Client Approval"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SelectionsTabForClientDocs;
