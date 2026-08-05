"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Box,
  Check,
  PanelsTopLeft,
  Pencil,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type {
  LeadSpecificationEntry,
  LightsRemark,
  SpecificationSectionRemark,
  SpecificationSectionType,
} from "@/api/designingStageQueries";
import AssignToPicker from "@/components/assign-to-picker";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  useCarcassTypes,
  useCarcasMaterials,
  useShutterMaterials,
  useShutterTypes,
  useCarcassLegs,
  useLightCarcasTypes,
  useOtherAppliances,
} from "@/hooks/useTypesMaster";
import {
  useLeadCarcassMaterialMappings,
  useLeadShutterMaterialMappings,
  useLeadHardwareMappings,
  useLeadLightCarcasUnitMappings,
  useLeadOtherAppliancesMappings,
  useUpsertLeadCarcassMaterialMapping,
  useUpsertLeadShutterMaterialMapping,
  useUpsertLeadHardwareMapping,
  useUpsertLeadLightCarcasUnitMapping,
  useUpsertLeadOtherAppliancesMapping,
  useUpdateLeadSpecificationLightsRemark,
  useUpdateLeadSpecificationSectionRemark,
  useLeadSpecifications,
} from "@/hooks/designing-stage/designing-leads-hooks";
import {
  fetchCarcassMaterialFinishes,
  fetchShutterMaterialFinishes,
  fetchSkirtingCarcassLegs,
  fetchSkirtingCarcassLegsColors,
  fetchLightCarcasUnits,
  type OtherAppliancesMasterEntry,
  OTHER_APPLIANCE_TYPES,
} from "@/api/typesMasterApi";
import { useQueries } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";

interface ViewSpecsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specification: LeadSpecificationEntry | null;
  readOnly?: boolean;
  showReviewColumns?: boolean;
  contentClassName?: string;
}

type CarcassRow = {
  localId: string;
  id?: number;
  carcass_type_id: string;
  carcas_material_id: string;
  carcass_material_finish_id: string;
};

type ShutterRow = {
  localId: string;
  id?: number;
  shutter_type_id: string;
  shutter_material_id: string;
  shutter_material_finish_id: string;
};

type HardwareRow = {
  localId: string;
  id?: number;
  carcass_legs_id: string;
  skirting_carcass_legs_id: string;
  skirting_carcass_legs_color_id: string;
  note: string;
};

type LightRow = {
  localId: string;
  id?: number;
  light_carcas_type_id: string;
  light_carcas_unit_master_id: string;
  custom_remark: string;
};

type OtherApplianceRow = {
  localId: string;
  id?: number;
  type: string;
  other_appliances_master_id: string;
  custom_remark: string;
};

type ReviewAction = "approve" | "amend" | "delete" | null;

const makeBlankCarcassRow = (): CarcassRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  carcass_type_id: "",
  carcas_material_id: "",
  carcass_material_finish_id: "",
});

const makeBlankShutterRow = (): ShutterRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  shutter_type_id: "",
  shutter_material_id: "",
  shutter_material_finish_id: "",
});

const makeBlankHardwareRow = (): HardwareRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  carcass_legs_id: "",
  skirting_carcass_legs_id: "",
  skirting_carcass_legs_color_id: "",
  note: "",
});

const makeBlankLightRow = (): LightRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  light_carcas_type_id: "",
  light_carcas_unit_master_id: "",
  custom_remark: "",
});

const makeBlankOtherApplianceRow = (type: string = ""): OtherApplianceRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  other_appliances_master_id: "",
  custom_remark: "",
});

const pickerClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-sm";
const clonedRowHighlightClass = "bg-blue-50/80 dark:bg-blue-950/20";
const newRowHighlightClass = "bg-emerald-50/80 dark:bg-emerald-950/20";
const specificationSectionOptions: SpecificationSectionRemark[] = [
  "In our scope",
  "Not in our scope",
  "Provide only grooves",
];

const renderReviewState = (active: boolean, timestamp?: string | null) => (
  <div className="flex min-w-[108px] flex-col items-center justify-center gap-1 text-center">
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
      )}
    >
      {active ? "Yes" : "No"}
    </span>
    <span className="text-[10px] text-muted-foreground">
      {timestamp ? formatDate(timestamp) : "—"}
    </span>
  </div>
);

const reviewCellButtonClass =
  "flex w-full min-w-[88px] items-center justify-center rounded-md px-2 py-2 transition-colors";

const ViewSpecsModal: React.FC<ViewSpecsModalProps> = ({
  open,
  onOpenChange,
  specification,
  readOnly = false,
  showReviewColumns = false,
  contentClassName,
}) => {
  const mappingsLocked = showReviewColumns;
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: carcassTypesData } = useCarcassTypes();
  const { data: carcasMaterialsData } = useCarcasMaterials();
  const { data: shutterTypesData } = useShutterTypes();
  const { data: shutterMaterialsData } = useShutterMaterials();
  const { data: specifications = [] } = useLeadSpecifications(
    vendorId,
    specification?.lead_id,
  );
  const { data: carcassMappingsData } = useLeadCarcassMaterialMappings(
    vendorId,
    specification?.lead_id,
    specification?.id,
  );
  const { data: shutterMappingsData } = useLeadShutterMaterialMappings(
    vendorId,
    specification?.lead_id,
    specification?.id,
  );
  const { data: carcassLegsData } = useCarcassLegs();
  const { data: hardwareMappingsData } = useLeadHardwareMappings(
    vendorId,
    specification?.lead_id,
    specification?.id,
  );
  const { data: lightCarcasTypesData } = useLightCarcasTypes();
  const { data: lightMappingsData } = useLeadLightCarcasUnitMappings(
    vendorId,
    specification?.lead_id,
    specification?.id,
  );
  const { data: otherAppliancesData } = useOtherAppliances();
  const { data: otherApplianceMappingsData } = useLeadOtherAppliancesMappings(
    vendorId,
    specification?.lead_id,
    specification?.id,
  );
  const previousSpecification = React.useMemo(() => {
    if (!specification) return null;

    const currentCreatedAt = new Date(specification.created_at).getTime();

    return specifications
      .filter((spec) => {
        if (spec.id === specification.id) return false;
        if ((spec.item_code_id ?? null) !== (specification.item_code_id ?? null)) {
          return false;
        }

        const specCreatedAt = new Date(spec.created_at).getTime();
        return (
          specCreatedAt < currentCreatedAt ||
          (specCreatedAt === currentCreatedAt && spec.id < specification.id)
        );
      })
      .sort((a, b) => {
        const timeDiff =
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.id - a.id;
      })[0] ?? null;
  }, [specification, specifications]);
  const { data: previousCarcassMappingsData } = useLeadCarcassMaterialMappings(
    vendorId,
    specification?.lead_id,
    previousSpecification?.id,
  );
  const { data: previousShutterMappingsData } = useLeadShutterMaterialMappings(
    vendorId,
    specification?.lead_id,
    previousSpecification?.id,
  );
  const { data: previousHardwareMappingsData } = useLeadHardwareMappings(
    vendorId,
    specification?.lead_id,
    previousSpecification?.id,
  );
  const { data: previousLightMappingsData } = useLeadLightCarcasUnitMappings(
    vendorId,
    specification?.lead_id,
    previousSpecification?.id,
  );
  const { data: previousOtherApplianceMappingsData } =
    useLeadOtherAppliancesMappings(
      vendorId,
      specification?.lead_id,
      previousSpecification?.id,
    );
  const upsertCarcassMapping = useUpsertLeadCarcassMaterialMapping();
  const upsertShutterMapping = useUpsertLeadShutterMaterialMapping();
  const upsertHardwareMapping = useUpsertLeadHardwareMapping();
  const upsertLightMapping = useUpsertLeadLightCarcasUnitMapping();
  const upsertOtherApplianceMapping = useUpsertLeadOtherAppliancesMapping();
  const updateLightsRemark = useUpdateLeadSpecificationLightsRemark();
  const updateSectionRemark = useUpdateLeadSpecificationSectionRemark();
  const [carcassRows, setCarcassRows] = React.useState<CarcassRow[]>([]);
  const [shutterRows, setShutterRows] = React.useState<ShutterRow[]>([]);
  const [hardwareRows, setHardwareRows] = React.useState<HardwareRow[]>([]);
  const [lightsRemark, setLightsRemark] = React.useState<LightsRemark | "">("");
  const [lightRows, setLightRows] = React.useState<LightRow[]>([]);
  const [otherApplianceRemarks, setOtherApplianceRemarks] = React.useState<
    Record<SpecificationSectionType, SpecificationSectionRemark | "">
  >({
    appliances: "",
    stone: "",
    sinks: "",
    faucets: "",
  });
  const [otherApplianceRowsByType, setOtherApplianceRowsByType] = React.useState<
    Record<string, OtherApplianceRow[]>
  >({});
  const [reviewStates, setReviewStates] = React.useState<
    Record<string, ReviewAction>
  >({});

  const carcassTypes = carcassTypesData?.data ?? [];
  const carcasMaterials = carcasMaterialsData?.data ?? [];
  const shutterTypes = shutterTypesData?.data ?? [];
  const shutterMaterials = shutterMaterialsData?.data ?? [];
  const carcassLegs = carcassLegsData?.data ?? [];
  const lightCarcasTypes = lightCarcasTypesData?.data ?? [];
  const customLightCarcasType = React.useMemo(
    () =>
      lightCarcasTypes.find(
        (type) => type.type.trim().toLowerCase() === "custom",
      ) ?? null,
    [lightCarcasTypes],
  );
  const selectableLightCarcasTypes = React.useMemo(
    () =>
      lightCarcasTypes.filter(
        (type) => type.type.trim().toLowerCase() !== "custom",
      ),
    [lightCarcasTypes],
  );
  const otherAppliancesByType = React.useMemo(() => {
    const grouped: Record<string, OtherAppliancesMasterEntry[]> = {};
    (otherAppliancesData?.data ?? []).forEach((item) => {
      (grouped[item.type] ??= []).push(item);
    });
    return grouped;
  }, [otherAppliancesData]);
  const carcassMappings = React.useMemo(
    () => carcassMappingsData ?? [],
    [carcassMappingsData],
  );
  const shutterMappings = React.useMemo(
    () => shutterMappingsData ?? [],
    [shutterMappingsData],
  );
  const hardwareMappings = React.useMemo(
    () => hardwareMappingsData ?? [],
    [hardwareMappingsData],
  );
  const lightMappings = React.useMemo(
    () => lightMappingsData ?? [],
    [lightMappingsData],
  );
  const otherApplianceMappings = React.useMemo(
    () => otherApplianceMappingsData ?? [],
    [otherApplianceMappingsData],
  );
  const previousCarcassMappings = React.useMemo(
    () => previousCarcassMappingsData ?? [],
    [previousCarcassMappingsData],
  );
  const previousShutterMappings = React.useMemo(
    () => previousShutterMappingsData ?? [],
    [previousShutterMappingsData],
  );
  const previousHardwareMappings = React.useMemo(
    () => previousHardwareMappingsData ?? [],
    [previousHardwareMappingsData],
  );
  const previousLightMappings = React.useMemo(
    () => previousLightMappingsData ?? [],
    [previousLightMappingsData],
  );
  const previousOtherApplianceMappings = React.useMemo(
    () => previousOtherApplianceMappingsData ?? [],
    [previousOtherApplianceMappingsData],
  );
  const previousOtherApplianceRowsByType = React.useMemo(() => {
    const grouped: Record<
      string,
      { other_appliances_master_id: string; custom_remark: string }[]
    > = {};

    previousOtherApplianceMappings.forEach((item) => {
      const type = item.otherAppliances?.type ?? item.other_appliance_type ?? undefined;
      if (!type) return;
      (grouped[type] ??= []).push({
        other_appliances_master_id: item.other_appliances_master_id
          ? String(item.other_appliances_master_id)
          : "",
        custom_remark: item.custom_remark ?? "",
      });
    });

    return grouped;
  }, [previousOtherApplianceMappings]);

  const getReviewStateKey = React.useCallback(
    (section: string, rowKey: string | number) => `${section}:${rowKey}`,
    [],
  );

  const setReviewAction = React.useCallback(
    (section: string, rowKey: string | number, action: Exclude<ReviewAction, null>) => {
      const reviewKey = getReviewStateKey(section, rowKey);
      setReviewStates((prev) => ({
        ...prev,
        [reviewKey]: prev[reviewKey] === action ? null : action,
      }));
    },
    [getReviewStateKey],
  );

  const getReviewAction = React.useCallback(
    (
      section: string,
      row: { id?: number; localId: string },
      fallback?: {
        is_approved?: boolean;
        is_amended?: boolean;
        is_deleted_item?: boolean;
      },
    ): ReviewAction => {
      const reviewKey = getReviewStateKey(section, row.id ?? row.localId);
      const localState = reviewStates[reviewKey];
      if (typeof localState !== "undefined") {
        return localState;
      }
      if (fallback?.is_approved) return "approve";
      if (fallback?.is_amended) return "amend";
      if (fallback?.is_deleted_item) return "delete";
      return null;
    },
    [getReviewStateKey, reviewStates],
  );

  const getReviewRowClass = React.useCallback(
    (
      section: string,
      row: { id?: number; localId: string },
      fallback?: {
        is_approved?: boolean;
        is_amended?: boolean;
        is_deleted_item?: boolean;
      },
    ) => {
      const action = getReviewAction(section, row, fallback);
      if (action === "approve") {
        return "bg-emerald-50 dark:bg-emerald-950/20";
      }
      if (action === "delete") {
        return "bg-red-50 dark:bg-red-950/20";
      }
      return "";
    },
    [getReviewAction],
  );

  const isReviewDeleted = React.useCallback(
    (
      section: string,
      row: { id?: number; localId: string },
      fallback?: {
        is_approved?: boolean;
        is_amended?: boolean;
        is_deleted_item?: boolean;
      },
    ) => getReviewAction(section, row, fallback) === "delete",
    [getReviewAction],
  );

  const renderReviewActionCells = React.useCallback(
    (
      section: string,
      row: { id?: number; localId: string },
      persistPayload:
        | {
            id: number;
            vendor_id: number;
            lead_id: number;
            specs_id: number;
            created_by: number;
            carcass_type_id: number;
            carcas_material_id: number;
            carcass_material_finish_id: number;
          }
        | {
            id: number;
            vendor_id: number;
            lead_id: number;
            specs_id: number;
            created_by: number;
            shutter_type_id: number;
            shutter_material_id: number;
            shutter_material_finish_id: number;
          }
        | {
            id: number;
            vendor_id: number;
            lead_id: number;
            specs_id: number;
            created_by: number;
            carcass_legs_id: number;
            skirting_carcass_legs_id: number;
            skirting_carcass_legs_color_id: number | null;
            note: string | null;
          }
        | {
            id: number;
            vendor_id: number;
            lead_id: number;
            specs_id: number;
            created_by: number;
            light_carcas_unit_master_id: number | null;
            custom_remark: string | null;
          }
        | {
            id: number;
            vendor_id: number;
            lead_id: number;
            specs_id: number;
            created_by: number;
            other_appliance_type: string | null;
            other_appliances_master_id: number | null;
            custom_remark: string | null;
          }
        | null,
      fallback?: {
        is_approved?: boolean;
        approved_at?: string | null;
        is_amended?: boolean;
        amended_at?: string | null;
        is_deleted_item?: boolean;
        deleted_item_at?: string | null;
      },
    ) => {
      const action = getReviewAction(section, row, fallback);
      const isPersistable = !!persistPayload;

      const handleActionClick = async (nextAction: Exclude<ReviewAction, null>) => {
        if (!isPersistable || !persistPayload) {
          toastManager.add({
            title: "Save this row first before marking review status.",
            type: "error",
          });
          return;
        }

        setReviewAction(section, row.id ?? row.localId, nextAction);

        try {
          await persistReviewAction(
            section as "carcass" | "shutter" | "hardware" | "lights" | "other",
            nextAction,
            persistPayload,
          );
        } catch (error: any) {
          setReviewStates((prev) => ({
            ...prev,
            [getReviewStateKey(section, row.id ?? row.localId)]: action,
          }));
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update review status.",
            type: "error",
          });
        }
      };

      return (
        <>
          <td className="px-4 py-3 align-top">
            <button
              type="button"
              onClick={() => void handleActionClick("approve")}
              className={cn(
                reviewCellButtonClass,
                action === "approve"
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/10 dark:text-emerald-400",
              )}
              disabled={!isPersistable}
            >
              <Check className="h-4 w-4" />
            </button>
          </td>
          <td className="px-4 py-3 align-top">
            <button
              type="button"
              onClick={() => void handleActionClick("amend")}
              className={cn(
                reviewCellButtonClass,
                action === "amend"
                  ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400",
              )}
              disabled={!isPersistable}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </td>
          <td className="px-4 py-3 align-top">
            <button
              type="button"
              onClick={() => void handleActionClick("delete")}
              className={cn(
                reviewCellButtonClass,
                action === "delete"
                  ? "bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900"
                  : "bg-red-50 text-red-600 dark:bg-red-950/10 dark:text-red-400",
              )}
              disabled={!isPersistable}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </td>
        </>
      );
    },
    [
      getReviewAction,
      getReviewStateKey,
      persistReviewAction,
      setReviewAction,
    ],
  );

  async function persistReviewAction(
    section: "carcass" | "shutter" | "hardware" | "lights" | "other",
    action: Exclude<ReviewAction, null>,
    payload:
      | {
          id: number;
          vendor_id: number;
          lead_id: number;
          specs_id: number;
          created_by: number;
          carcass_type_id: number;
          carcas_material_id: number;
          carcass_material_finish_id: number;
        }
      | {
          id: number;
          vendor_id: number;
          lead_id: number;
          specs_id: number;
          created_by: number;
          shutter_type_id: number;
          shutter_material_id: number;
          shutter_material_finish_id: number;
        }
      | {
          id: number;
          vendor_id: number;
          lead_id: number;
          specs_id: number;
          created_by: number;
          carcass_legs_id: number;
          skirting_carcass_legs_id: number;
          skirting_carcass_legs_color_id: number | null;
          note: string | null;
        }
      | {
          id: number;
          vendor_id: number;
          lead_id: number;
          specs_id: number;
          created_by: number;
          light_carcas_unit_master_id: number | null;
          custom_remark: string | null;
        }
      | {
          id: number;
          vendor_id: number;
          lead_id: number;
          specs_id: number;
          created_by: number;
          other_appliance_type: string | null;
          other_appliances_master_id: number | null;
          custom_remark: string | null;
        },
  ) {
    const reviewPayload = {
      ...payload,
      is_approved: action === "approve",
      is_amended: action === "amend",
      is_deleted_item: action === "delete",
    };

    if (section === "carcass") {
      await upsertCarcassMapping.mutateAsync(reviewPayload as any);
    } else if (section === "shutter") {
      await upsertShutterMapping.mutateAsync(reviewPayload as any);
    } else if (section === "hardware") {
      await upsertHardwareMapping.mutateAsync(reviewPayload as any);
    } else if (section === "lights") {
      await upsertLightMapping.mutateAsync(reviewPayload as any);
    } else {
      await upsertOtherApplianceMapping.mutateAsync(reviewPayload as any);
    }
  }

  React.useEffect(() => {
    if (!specification) {
      setCarcassRows([]);
      setShutterRows([]);
      setReviewStates({});
      return;
    }

    const persistedRows: CarcassRow[] = carcassMappings.map((item) => ({
      localId: `saved-${item.id}`,
      id: item.id,
      carcass_type_id: item.carcass_type_id ? String(item.carcass_type_id) : "",
      carcas_material_id: item.carcas_material_id
        ? String(item.carcas_material_id)
        : "",
      carcass_material_finish_id: item.carcass_material_finish_id
        ? String(item.carcass_material_finish_id)
        : "",
    }));

    setCarcassRows([...persistedRows, makeBlankCarcassRow()]);
  }, [carcassMappings, specification?.id]);

  React.useEffect(() => {
    if (!specification) {
      setShutterRows([]);
      return;
    }

    const persistedRows: ShutterRow[] = shutterMappings.map((item) => ({
      localId: `saved-${item.id}`,
      id: item.id,
      shutter_type_id: item.shutter_type_id ? String(item.shutter_type_id) : "",
      shutter_material_id: item.shutter_material_id
        ? String(item.shutter_material_id)
        : "",
      shutter_material_finish_id: item.shutter_material_finish_id
        ? String(item.shutter_material_finish_id)
        : "",
    }));

    setShutterRows([...persistedRows, makeBlankShutterRow()]);
  }, [shutterMappings, specification?.id]);

  React.useEffect(() => {
    if (!specification) {
      setHardwareRows([]);
      return;
    }

    const persistedRows: HardwareRow[] = hardwareMappings.map((item) => ({
      localId: `saved-${item.id}`,
      id: item.id,
      carcass_legs_id: item.carcass_legs_id ? String(item.carcass_legs_id) : "",
      skirting_carcass_legs_id: item.skirting_carcass_legs_id
        ? String(item.skirting_carcass_legs_id)
        : "",
      skirting_carcass_legs_color_id: item.skirting_carcass_legs_color_id
        ? String(item.skirting_carcass_legs_color_id)
        : "",
      note: item.note ?? "",
    }));

    setHardwareRows([...persistedRows, makeBlankHardwareRow()]);
  }, [hardwareMappings, specification?.id]);

  React.useEffect(() => {
    if (!specification) {
      setLightRows([]);
      return;
    }

    const persistedRows: LightRow[] = lightMappings.map((item) => ({
      localId: `saved-${item.id}`,
      id: item.id,
      light_carcas_type_id: item.custom_remark
        ? String(customLightCarcasType?.id ?? "")
        : item.lightCarcasUnit?.light_carcas_type_id
          ? String(item.lightCarcasUnit.light_carcas_type_id)
          : "",
      light_carcas_unit_master_id: item.light_carcas_unit_master_id
        ? String(item.light_carcas_unit_master_id)
        : "",
      custom_remark: item.custom_remark ?? "",
    }));

    setLightRows([...persistedRows, makeBlankLightRow()]);
  }, [customLightCarcasType?.id, lightMappings, specification?.id]);

  React.useEffect(() => {
    setLightsRemark(specification?.lights_remark ?? "");
  }, [specification?.id, specification?.lights_remark]);

  React.useEffect(() => {
    setOtherApplianceRemarks({
      appliances: specification?.appliances_remark ?? "",
      stone: specification?.stone_remark ?? "",
      sinks: specification?.sinks_remark ?? "",
      faucets: specification?.faucets_remark ?? "",
    });
  }, [
    specification?.appliances_remark,
    specification?.faucets_remark,
    specification?.id,
    specification?.sinks_remark,
    specification?.stone_remark,
  ]);

  React.useEffect(() => {
    if (
      lightsRemark !== "Not in our scope" ||
      !customLightCarcasType ||
      lightRows.length === 0
    ) {
      return;
    }

    setLightRows((prev) =>
      prev.map((row) =>
        row.light_carcas_type_id
          ? row
          : {
              ...row,
              light_carcas_type_id: String(customLightCarcasType.id),
            },
      ),
    );
  }, [customLightCarcasType, lightRows.length, lightsRemark]);

  React.useEffect(() => {
    if (!specification) {
      setOtherApplianceRowsByType({});
      return;
    }

    const grouped: Record<string, OtherApplianceRow[]> = {};
    OTHER_APPLIANCE_TYPES.forEach((type) => {
      const persistedRows: OtherApplianceRow[] = otherApplianceMappings
        .filter(
          (item) =>
            item.otherAppliances?.type === type ||
            item.other_appliance_type === type,
        )
        .map((item) => ({
          localId: `saved-${item.id}`,
          id: item.id,
          type,
          other_appliances_master_id: item.other_appliances_master_id
            ? String(item.other_appliances_master_id)
            : "",
          custom_remark: item.custom_remark ?? "",
        }));

      grouped[type] = [...persistedRows, makeBlankOtherApplianceRow(type)];
    });

    setOtherApplianceRowsByType(grouped);
  }, [otherApplianceMappings, otherAppliancesByType, specification?.id]);

  const finishQueries = useQueries({
    queries: carcassRows.map((row) => {
      const materialId = Number(row.carcas_material_id);
      return {
        queryKey: ["carcassMaterialFinishes", materialId],
        queryFn: () => fetchCarcassMaterialFinishes(materialId),
        enabled: materialId > 0,
      };
    }),
  });

  const shutterFinishQueries = useQueries({
    queries: shutterRows.map((row) => {
      const materialId = Number(row.shutter_material_id);
      return {
        queryKey: ["shutterMaterialFinishes", materialId],
        queryFn: () => fetchShutterMaterialFinishes(materialId),
        enabled: materialId > 0,
      };
    }),
  });

  const skirtingQueries = useQueries({
    queries: hardwareRows.map((row) => {
      const carcassLegsId = Number(row.carcass_legs_id);
      return {
        queryKey: ["skirtingCarcassLegs", carcassLegsId],
        queryFn: () => fetchSkirtingCarcassLegs(carcassLegsId),
        enabled: carcassLegsId > 0,
      };
    }),
  });

  const colorQueries = useQueries({
    queries: hardwareRows.map((row) => {
      const skirtingId = Number(row.skirting_carcass_legs_id);
      return {
        queryKey: ["skirtingCarcassLegsColors", skirtingId],
        queryFn: () => fetchSkirtingCarcassLegsColors(skirtingId),
        enabled: skirtingId > 0,
      };
    }),
  });

  const lightUnitQueries = useQueries({
    queries: lightRows.map((row) => {
      const typeId = Number(row.light_carcas_type_id);
      return {
        queryKey: ["lightCarcasUnits", typeId],
        queryFn: () => fetchLightCarcasUnits(typeId),
        enabled:
          typeId > 0 &&
          (!customLightCarcasType || typeId !== customLightCarcasType.id),
      };
    }),
  });

  const saveCarcassRowIfComplete = React.useCallback(
    async (row: CarcassRow) => {
      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !specification?.id ||
        !row.carcass_type_id ||
        !row.carcas_material_id ||
        !row.carcass_material_finish_id
      ) {
        return;
      }

      try {
        await upsertCarcassMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          specs_id: specification.id,
          carcass_type_id: Number(row.carcass_type_id),
          carcas_material_id: Number(row.carcas_material_id),
          carcass_material_finish_id: Number(row.carcass_material_finish_id),
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save carcass mapping.",
          type: "error",
        });
      }
    },
    [specification?.id, specification?.lead_id, upsertCarcassMapping, userId, vendorId],
  );

  const updateCarcassRow = React.useCallback(
    (
      localId: string,
      field: keyof Omit<CarcassRow, "localId" | "id">,
      value: string,
    ) => {
      let nextRow: CarcassRow | null = null;
      let duplicateMessage = "";

      setCarcassRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: CarcassRow = { ...row, [field]: value };
          if (field === "carcas_material_id") {
            updatedRow.carcass_material_finish_id = "";
          }

          const isComplete =
            !!updatedRow.carcass_type_id &&
            !!updatedRow.carcas_material_id &&
            !!updatedRow.carcass_material_finish_id;

          if (isComplete) {
            const isDuplicate = prev.some(
              (otherRow) =>
                otherRow.localId !== localId &&
                otherRow.carcass_type_id === updatedRow.carcass_type_id &&
                otherRow.carcas_material_id === updatedRow.carcas_material_id &&
                otherRow.carcass_material_finish_id ===
                  updatedRow.carcass_material_finish_id,
            );

            if (isDuplicate) {
              duplicateMessage =
                "This carcass type, material, and finish combination has already been added.";
              return row;
            }
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({
          title: duplicateMessage,
          type: "error",
        });
        return;
      }

      if (nextRow) {
        void saveCarcassRowIfComplete(nextRow);
      }
    },
    [saveCarcassRowIfComplete],
  );

  const saveShutterRowIfComplete = React.useCallback(
    async (row: ShutterRow) => {
      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !specification?.id ||
        !row.shutter_type_id ||
        !row.shutter_material_id ||
        !row.shutter_material_finish_id
      ) {
        return;
      }

      try {
        await upsertShutterMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          specs_id: specification.id,
          shutter_type_id: Number(row.shutter_type_id),
          shutter_material_id: Number(row.shutter_material_id),
          shutter_material_finish_id: Number(row.shutter_material_finish_id),
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save shutter mapping.",
          type: "error",
        });
      }
    },
    [specification?.id, specification?.lead_id, upsertShutterMapping, userId, vendorId],
  );

  const updateShutterRow = React.useCallback(
    (
      localId: string,
      field: keyof Omit<ShutterRow, "localId" | "id">,
      value: string,
    ) => {
      let nextRow: ShutterRow | null = null;
      let duplicateMessage = "";

      setShutterRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: ShutterRow = { ...row, [field]: value };
          if (field === "shutter_material_id") {
            updatedRow.shutter_material_finish_id = "";
          }

          const isComplete =
            !!updatedRow.shutter_type_id &&
            !!updatedRow.shutter_material_id &&
            !!updatedRow.shutter_material_finish_id;

          if (isComplete) {
            const isDuplicate = prev.some(
              (otherRow) =>
                otherRow.localId !== localId &&
                otherRow.shutter_type_id === updatedRow.shutter_type_id &&
                otherRow.shutter_material_id ===
                  updatedRow.shutter_material_id &&
                otherRow.shutter_material_finish_id ===
                  updatedRow.shutter_material_finish_id,
            );

            if (isDuplicate) {
              duplicateMessage =
                "This shutter type, material, and finish combination has already been added.";
              return row;
            }
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({
          title: duplicateMessage,
          type: "error",
        });
        return;
      }

      if (nextRow) {
        void saveShutterRowIfComplete(nextRow);
      }
    },
    [saveShutterRowIfComplete],
  );

  const saveHardwareRowIfComplete = React.useCallback(
    async (row: HardwareRow, colorOptionsCount: number) => {
      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !specification?.id ||
        !row.carcass_legs_id ||
        !row.skirting_carcass_legs_id ||
        (colorOptionsCount > 0 && !row.skirting_carcass_legs_color_id)
      ) {
        return;
      }

      try {
        await upsertHardwareMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          specs_id: specification.id,
          carcass_legs_id: Number(row.carcass_legs_id),
          skirting_carcass_legs_id: Number(row.skirting_carcass_legs_id),
          skirting_carcass_legs_color_id: row.skirting_carcass_legs_color_id
            ? Number(row.skirting_carcass_legs_color_id)
            : null,
          note: row.note || null,
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save hardware mapping.",
          type: "error",
        });
      }
    },
    [specification?.id, specification?.lead_id, upsertHardwareMapping, userId, vendorId],
  );

  const isHardwareRowDuplicate = (
    prev: HardwareRow[],
    localId: string,
    updatedRow: HardwareRow,
  ) =>
    prev.some(
      (otherRow) =>
        otherRow.localId !== localId &&
        otherRow.carcass_legs_id === updatedRow.carcass_legs_id &&
        otherRow.skirting_carcass_legs_id ===
          updatedRow.skirting_carcass_legs_id &&
        otherRow.skirting_carcass_legs_color_id ===
          updatedRow.skirting_carcass_legs_color_id,
    );

  const handleCarcassLegsChange = React.useCallback(
    (localId: string, value: string) => {
      setHardwareRows((prev) =>
        prev.map((row) =>
          row.localId === localId
            ? {
                ...row,
                carcass_legs_id: value,
                skirting_carcass_legs_id: "",
                skirting_carcass_legs_color_id: "",
                note: "",
              }
            : row,
        ),
      );
    },
    [],
  );

  const handleSkirtingChange = React.useCallback(
    async (
      localId: string,
      value: string,
      skirtingOptions: { id: number; name: string; inScope: boolean }[],
    ) => {
      const selectedSkirting = skirtingOptions.find(
        (option) => String(option.id) === value,
      );
      const autoNote =
        selectedSkirting && !selectedSkirting.inScope
          ? "Not in our scope"
          : "";

      let nextRow: HardwareRow | null = null;
      let duplicateMessage = "";

      setHardwareRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: HardwareRow = {
            ...row,
            skirting_carcass_legs_id: value,
            skirting_carcass_legs_color_id: "",
            note: autoNote,
          };

          if (isHardwareRowDuplicate(prev, localId, updatedRow)) {
            duplicateMessage =
              "This carcass legs and skirting combination has already been added.";
            return row;
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({ title: duplicateMessage, type: "error" });
        return;
      }

      if (!nextRow) return;

      if (selectedSkirting && !selectedSkirting.inScope) {
        void saveHardwareRowIfComplete(nextRow, 0);
        return;
      }

      if (value) {
        const colorsResult = await fetchSkirtingCarcassLegsColors(
          Number(value),
        );
        void saveHardwareRowIfComplete(nextRow, colorsResult.data.length);
      }
    },
    [saveHardwareRowIfComplete],
  );

  const handleColorChange = React.useCallback(
    (localId: string, value: string, colorOptionsCount: number) => {
      let nextRow: HardwareRow | null = null;
      let duplicateMessage = "";

      setHardwareRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: HardwareRow = {
            ...row,
            skirting_carcass_legs_color_id: value,
          };

          if (isHardwareRowDuplicate(prev, localId, updatedRow)) {
            duplicateMessage =
              "This carcass legs, skirting, and color combination has already been added.";
            return row;
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({ title: duplicateMessage, type: "error" });
        return;
      }

      if (nextRow) {
        void saveHardwareRowIfComplete(nextRow, colorOptionsCount);
      }
    },
    [saveHardwareRowIfComplete],
  );

  const handleNoteChange = React.useCallback((localId: string, value: string) => {
    setHardwareRows((prev) =>
      prev.map((row) =>
        row.localId === localId ? { ...row, note: value } : row,
      ),
    );
  }, []);

  const handleNoteBlur = React.useCallback(
    (row: HardwareRow, colorOptionsCount: number) => {
      void saveHardwareRowIfComplete(row, colorOptionsCount);
    },
    [saveHardwareRowIfComplete],
  );

  const saveLightRowIfComplete = React.useCallback(
    async (row: LightRow) => {
      const trimmedCustomRemark = row.custom_remark.trim();
      const isCustomRow =
        !!trimmedCustomRemark ||
        (!!customLightCarcasType &&
          Number(row.light_carcas_type_id) === customLightCarcasType.id);

      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !specification?.id ||
        (isCustomRow
          ? !trimmedCustomRemark
          : !row.light_carcas_type_id || !row.light_carcas_unit_master_id)
      ) {
        return;
      }

      try {
        await upsertLightMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          specs_id: specification.id,
          light_carcas_unit_master_id: isCustomRow
            ? null
            : Number(row.light_carcas_unit_master_id),
          custom_remark: isCustomRow ? trimmedCustomRemark : null,
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save light specification.",
          type: "error",
        });
      }
    },
    [
      customLightCarcasType,
      specification?.lead_id,
      specification?.id,
      upsertLightMapping,
      userId,
      vendorId,
    ],
  );

  const updateLightRow = React.useCallback(
    (
      localId: string,
      field: keyof Omit<LightRow, "localId" | "id">,
      value: string,
    ) => {
      let nextRow: LightRow | null = null;
      let duplicateMessage = "";

      setLightRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: LightRow = { ...row, [field]: value };
          if (field === "light_carcas_type_id") {
            updatedRow.light_carcas_unit_master_id = "";
            updatedRow.custom_remark = "";
          }

          const isCustomRow =
            !!customLightCarcasType &&
            Number(updatedRow.light_carcas_type_id) === customLightCarcasType.id;
          const isComplete = isCustomRow
            ? !!updatedRow.light_carcas_type_id &&
              !!updatedRow.custom_remark.trim()
            : !!updatedRow.light_carcas_type_id &&
              !!updatedRow.light_carcas_unit_master_id;

          if (isComplete) {
            const isDuplicate = prev.some(
              (otherRow) =>
                otherRow.localId !== localId &&
                (isCustomRow
                  ? otherRow.custom_remark.trim().toLowerCase() ===
                    updatedRow.custom_remark.trim().toLowerCase()
                  : otherRow.light_carcas_unit_master_id ===
                    updatedRow.light_carcas_unit_master_id),
            );

            if (isDuplicate) {
              duplicateMessage =
                isCustomRow
                  ? "This custom light remark has already been added."
                  : "This carcass type and remark combination has already been added.";
              return row;
            }
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({
          title: duplicateMessage,
          type: "error",
        });
        return;
      }

      if (nextRow) {
        void saveLightRowIfComplete(nextRow);
      }
    },
    [customLightCarcasType, saveLightRowIfComplete],
  );

  const handleCustomLightRemarkChange = React.useCallback(
    (localId: string, value: string) => {
      setLightRows((prev) =>
        prev.map((row) =>
          row.localId === localId
            ? {
                ...row,
                light_carcas_type_id: customLightCarcasType
                  ? String(customLightCarcasType.id)
                  : row.light_carcas_type_id,
                custom_remark: value,
              }
            : row,
        ),
      );
    },
    [customLightCarcasType],
  );

  const handleCustomLightRemarkBlur = React.useCallback(
    (localId: string, value: string) => {
      const row = lightRows.find((item) => item.localId === localId);
      if (!row) return;
      void saveLightRowIfComplete({
        ...row,
        light_carcas_type_id: customLightCarcasType
          ? String(customLightCarcasType.id)
          : row.light_carcas_type_id,
        custom_remark: value,
      });
    },
    [customLightCarcasType, lightRows, saveLightRowIfComplete],
  );

  const saveOtherApplianceRowIfComplete = React.useCallback(
    async (row: OtherApplianceRow) => {
      const trimmedCustomRemark = row.custom_remark.trim();
      const isCustomRow = !!trimmedCustomRemark;

      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !specification?.id ||
        (isCustomRow
          ? !trimmedCustomRemark
          : !row.other_appliances_master_id)
      ) {
        return;
      }

      try {
        await upsertOtherApplianceMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          specs_id: specification.id,
          other_appliance_type: row.type || null,
          other_appliances_master_id: isCustomRow
            ? null
            : Number(row.other_appliances_master_id),
          custom_remark: isCustomRow ? trimmedCustomRemark : null,
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save entry.",
          type: "error",
        });
      }
    },
    [
      specification?.lead_id,
      specification?.id,
      upsertOtherApplianceMapping,
      userId,
      vendorId,
    ],
  );

  const updateOtherApplianceRow = React.useCallback(
    (type: string, localId: string, value: string) => {
      let nextRow: OtherApplianceRow | null = null;
      let duplicateMessage = "";

      setOtherApplianceRowsByType((prev) => {
        const rowsForType = prev[type] ?? [];

        const updatedRows = rowsForType.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: OtherApplianceRow = {
            ...row,
            type,
            other_appliances_master_id: value,
            custom_remark: "",
          };

          if (value) {
            const isDuplicate = rowsForType.some(
              (otherRow) =>
                otherRow.localId !== localId &&
                otherRow.other_appliances_master_id === value,
            );

            if (isDuplicate) {
              duplicateMessage = "This article has already been added.";
              return row;
            }
          }

          nextRow = updatedRow;
          return updatedRow;
        });

        return { ...prev, [type]: updatedRows };
      });

      if (duplicateMessage) {
        toastManager.add({
          title: duplicateMessage,
          type: "error",
        });
        return;
      }

      if (nextRow) {
        void saveOtherApplianceRowIfComplete(nextRow);
      }
    },
    [saveOtherApplianceRowIfComplete],
  );

  const handleCustomOtherApplianceRemarkChange = React.useCallback(
    (type: string, localId: string, value: string) => {
      setOtherApplianceRowsByType((prev) => ({
        ...prev,
        [type]: (prev[type] ?? []).map((row) =>
          row.localId === localId
            ? {
                ...row,
                type,
                other_appliances_master_id: "",
                custom_remark: value,
              }
            : row,
        ),
      }));
    },
    [],
  );

  const handleCustomOtherApplianceRemarkBlur = React.useCallback(
    (type: string, localId: string, value: string) => {
      const row = (otherApplianceRowsByType[type] ?? []).find(
        (item) => item.localId === localId,
      );
      if (!row) return;
      void saveOtherApplianceRowIfComplete({
        ...row,
        type,
        other_appliances_master_id: "",
        custom_remark: value,
      });
    },
    [otherApplianceRowsByType, saveOtherApplianceRowIfComplete],
  );

  const handleLightsRemarkChange = React.useCallback(
    (value: LightsRemark) => {
      if (!vendorId || !specification?.lead_id || !specification?.id) return;

      const previousValue = lightsRemark;
      setLightsRemark(value);

      updateLightsRemark.mutate(
        {
          specsId: specification.id,
          lightsRemark: value,
          vendorId,
          leadId: specification.lead_id,
        },
        {
          onError: (error: any) => {
            setLightsRemark(previousValue);
            toastManager.add({
              title:
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update lights remark.",
              type: "error",
            });
          },
        },
      );
    },
    [lightsRemark, specification?.id, specification?.lead_id, updateLightsRemark, vendorId],
  );

  const handleOtherApplianceRemarkChange = React.useCallback(
    (section: SpecificationSectionType, value: SpecificationSectionRemark) => {
      if (!vendorId || !specification?.lead_id || !specification?.id) return;

      const previousValue = otherApplianceRemarks[section];
      setOtherApplianceRemarks((prev) => ({ ...prev, [section]: value }));

      updateSectionRemark.mutate(
        {
          specsId: specification.id,
          section,
          remark: value,
          vendorId,
          leadId: specification.lead_id,
        },
        {
          onError: (error: any) => {
            setOtherApplianceRemarks((prev) => ({
              ...prev,
              [section]: previousValue,
            }));
            toastManager.add({
              title:
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update section remark.",
              type: "error",
            });
          },
        },
      );
    },
    [
      otherApplianceRemarks,
      specification?.id,
      specification?.lead_id,
      updateSectionRemark,
      vendorId,
    ],
  );

  const isLightsEnabled =
    lightsRemark === "In our scope" ||
    lightsRemark === "Provide only grooves" ||
    lightsRemark === "Not in our scope";
  const isCustomLightsMode = lightsRemark === "Not in our scope";

  const isOtherApplianceSectionEnabled = React.useCallback(
    (section: SpecificationSectionType) => {
      const remark = otherApplianceRemarks[section];
      return (
        remark === "In our scope" ||
        remark === "Provide only grooves" ||
        remark === "Not in our scope"
      );
    },
    [otherApplianceRemarks],
  );

  const isCustomOtherApplianceSectionMode = React.useCallback(
    (section: SpecificationSectionType) =>
      otherApplianceRemarks[section] === "Not in our scope",
    [otherApplianceRemarks],
  );

  const getCarcassRowHighlightClass = React.useCallback(
    (row: CarcassRow, index: number) => {
      const persistedRow = row.id
        ? carcassMappings.find((item) => item.id === row.id)
        : undefined;
      const reviewClass = getReviewRowClass("carcass", row, persistedRow);
      if (reviewClass) return reviewClass;

      const hasValue =
        !!row.carcass_type_id ||
        !!row.carcas_material_id ||
        !!row.carcass_material_finish_id;
      if (!hasValue) return "";

      if (!row.id) return newRowHighlightClass;
      if (!previousSpecification) return "";

      const baseline = previousCarcassMappings[index];
      if (!baseline) return newRowHighlightClass;

      const changed =
        Number(row.carcass_type_id || 0) !== baseline.carcass_type_id ||
        Number(row.carcas_material_id || 0) !== baseline.carcas_material_id ||
        Number(row.carcass_material_finish_id || 0) !==
          baseline.carcass_material_finish_id;

      return changed ? clonedRowHighlightClass : "";
    },
    [carcassMappings, getReviewRowClass, previousCarcassMappings, previousSpecification],
  );

  const getShutterRowHighlightClass = React.useCallback(
    (row: ShutterRow, index: number) => {
      const persistedRow = row.id
        ? shutterMappings.find((item) => item.id === row.id)
        : undefined;
      const reviewClass = getReviewRowClass("shutter", row, persistedRow);
      if (reviewClass) return reviewClass;

      const hasValue =
        !!row.shutter_type_id ||
        !!row.shutter_material_id ||
        !!row.shutter_material_finish_id;
      if (!hasValue) return "";

      if (!row.id) return newRowHighlightClass;
      if (!previousSpecification) return "";

      const baseline = previousShutterMappings[index];
      if (!baseline) return newRowHighlightClass;

      const changed =
        Number(row.shutter_type_id || 0) !== baseline.shutter_type_id ||
        Number(row.shutter_material_id || 0) !== baseline.shutter_material_id ||
        Number(row.shutter_material_finish_id || 0) !==
          baseline.shutter_material_finish_id;

      return changed ? clonedRowHighlightClass : "";
    },
    [getReviewRowClass, previousShutterMappings, previousSpecification, shutterMappings],
  );

  const getHardwareRowHighlightClass = React.useCallback(
    (row: HardwareRow, index: number) => {
      const persistedRow = row.id
        ? hardwareMappings.find((item) => item.id === row.id)
        : undefined;
      const reviewClass = getReviewRowClass("hardware", row, persistedRow);
      if (reviewClass) return reviewClass;

      const hasValue =
        !!row.carcass_legs_id ||
        !!row.skirting_carcass_legs_id ||
        !!row.skirting_carcass_legs_color_id ||
        !!row.note;
      if (!hasValue) return "";

      if (!row.id) return newRowHighlightClass;
      if (!previousSpecification) return "";

      const baseline = previousHardwareMappings[index];
      if (!baseline) return newRowHighlightClass;

      const changed =
        Number(row.carcass_legs_id || 0) !== baseline.carcass_legs_id ||
        Number(row.skirting_carcass_legs_id || 0) !==
          baseline.skirting_carcass_legs_id ||
        Number(row.skirting_carcass_legs_color_id || 0) !==
          Number(baseline.skirting_carcass_legs_color_id || 0) ||
        (row.note || "") !== (baseline.note || "");

      return changed ? clonedRowHighlightClass : "";
    },
    [getReviewRowClass, hardwareMappings, previousHardwareMappings, previousSpecification],
  );

  const getLightRowHighlightClass = React.useCallback(
    (row: LightRow, index: number) => {
      const persistedRow = row.id
        ? lightMappings.find((item) => item.id === row.id)
        : undefined;
      const reviewClass = getReviewRowClass("lights", row, persistedRow);
      if (reviewClass) return reviewClass;

      const hasValue =
        !!row.light_carcas_type_id ||
        !!row.light_carcas_unit_master_id ||
        !!row.custom_remark.trim();
      if (!hasValue) return "";

      if (!row.id) return newRowHighlightClass;
      if (!previousSpecification) return "";

      const baseline = previousLightMappings[index];
      if (!baseline) return newRowHighlightClass;

      const changed =
        Number(row.light_carcas_unit_master_id || 0) !==
          Number(baseline.light_carcas_unit_master_id || 0) ||
        Number(row.light_carcas_type_id || 0) !==
          Number(
            baseline.custom_remark
              ? customLightCarcasType?.id ?? 0
              : baseline.lightCarcasUnit?.light_carcas_type_id || 0,
          ) ||
        row.custom_remark.trim() !== (baseline.custom_remark ?? "").trim();

      return changed ? clonedRowHighlightClass : "";
    },
    [
      customLightCarcasType?.id,
      getReviewRowClass,
      lightMappings,
      previousLightMappings,
      previousSpecification,
    ],
  );

  const getOtherApplianceRowHighlightClass = React.useCallback(
    (type: string, row: OtherApplianceRow, index: number) => {
      const persistedRow = row.id
        ? otherApplianceMappings.find((item) => item.id === row.id)
        : undefined;
      const reviewClass = getReviewRowClass(`other-${type}`, row, persistedRow);
      if (reviewClass) return reviewClass;

      if (!row.other_appliances_master_id && !row.custom_remark.trim()) return "";

      if (!row.id) return newRowHighlightClass;
      if (!previousSpecification) return "";

      const baseline = previousOtherApplianceRowsByType[type]?.[index];
      if (!baseline) return newRowHighlightClass;

      return row.other_appliances_master_id !== baseline.other_appliances_master_id ||
        row.custom_remark.trim() !== baseline.custom_remark.trim()
        ? clonedRowHighlightClass
        : "";
    },
    [
      getReviewRowClass,
      otherApplianceMappings,
      previousOtherApplianceRowsByType,
      previousSpecification,
    ],
  );

  const handleDialogOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isCustomLightsMode) {
        lightRows.forEach((row) => {
          if (
            row.light_carcas_type_id &&
            row.custom_remark.trim()
          ) {
            void saveLightRowIfComplete(row);
          }
        });
      }

      if (!nextOpen) {
        OTHER_APPLIANCE_TYPES.forEach((type) => {
          if (!isCustomOtherApplianceSectionMode(type.toLowerCase() as SpecificationSectionType)) {
            return;
          }

          (otherApplianceRowsByType[type] ?? []).forEach((row) => {
            if (row.custom_remark.trim()) {
              void saveOtherApplianceRowIfComplete(row);
            }
          });
        });
      }

      onOpenChange(nextOpen);
    },
    [
      isCustomLightsMode,
      isCustomOtherApplianceSectionMode,
      lightRows,
      onOpenChange,
      otherApplianceRowsByType,
      saveLightRowIfComplete,
      saveOtherApplianceRowIfComplete,
    ],
  );

  if (!specification) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={cn(
          "min-w-5xl max-h-[90vh] overflow-hidden flex flex-col",
          contentClassName,
        )}
      >
        <DialogHeader className="">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {specification.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Created on {formatDate(specification.created_at)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="carcass" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="carcass">
              <Box size={16} className="mr-1 opacity-60" />
              Carcass
            </TabsTrigger>
            <TabsTrigger value="shutter">
              <PanelsTopLeft size={16} className="mr-1 opacity-60" />
              Shutter
            </TabsTrigger>
            <TabsTrigger value="hardware">
              <Wrench size={16} className="mr-1 opacity-60" />
              Hardware
            </TabsTrigger>
            <TabsTrigger value="others">
              <Sparkles size={16} className="mr-1 opacity-60" />
              Others
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carcass" className="flex-1 overflow-y-auto">
            <div className={`rounded-xl border border-border overflow-hidden mt-3 ${readOnly ? "select-none opacity-90" : ""}`}>
              {/* <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold">Carcass Specifications</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCarcassRows((prev) => [...prev, makeBlankCarcassRow()])
                  }
                >
                  Add Row
                </Button>
              </div> */}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-center font-bold text-white">
                        Carcass Type
                      </th>
                      <th className="px-4 py-3 text-center font-bold text-white">
                        Carcass Material
                      </th>
                      <th className="px-4 py-3 text-center font-bold text-white">
                        Carcass Material Finish
                      </th>
                      {showReviewColumns && (
                        <>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Approve
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Amend
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Delete
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {carcassRows.map((row, index) => {
                      const finishOptions = finishQueries[index]?.data?.data ?? [];
                      const persistedRow = row.id
                        ? carcassMappings.find((item) => item.id === row.id)
                        : undefined;
                      const isDeletedRow = isReviewDeleted(
                        "carcass",
                        row,
                        persistedRow,
                      );

	                      return (
	                        <tr
                            key={row.localId}
                            className={cn(
                              "border-b last:border-b-0",
                              getCarcassRowHighlightClass(row, index),
                            )}
                          >
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={carcassTypes.map((type) => ({
	                                id: type.id,
	                                label: type.name,
	                              }))}
	                              value={row.carcass_type_id ? Number(row.carcass_type_id) : undefined}
	                              onChange={(value) =>
	                                updateCarcassRow(
	                                  row.localId,
	                                  "carcass_type_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search carcass type..."
	                              emptyLabel="Select carcass type"
	                              disabled={mappingsLocked}
	                              className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={carcasMaterials.map((material) => ({
	                                id: material.id,
	                                label: material.name,
	                              }))}
	                              value={
	                                row.carcas_material_id
	                                  ? Number(row.carcas_material_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateCarcassRow(
	                                  row.localId,
	                                  "carcas_material_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search carcass material..."
	                              emptyLabel="Select carcass material"
	                              disabled={mappingsLocked}
	                              className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={finishOptions.map((finish) => ({
	                                id: finish.id,
	                                label: finish.name,
	                              }))}
	                              value={
	                                row.carcass_material_finish_id
	                                  ? Number(row.carcass_material_finish_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateCarcassRow(
	                                  row.localId,
	                                  "carcass_material_finish_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              disabled={mappingsLocked || !row.carcas_material_id}
	                              placeholder={
	                                row.carcas_material_id
	                                  ? "Search carcass material finish..."
	                                  : "Select material first"
	                              }
	                              emptyLabel={
	                                row.carcas_material_id
	                                  ? "Select carcass material finish"
	                                  : "Select material first"
	                              }
	                              className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
	                            />
	                          </td>
                            {showReviewColumns &&
                              renderReviewActionCells(
                                "carcass",
                                row,
                                row.id && vendorId && userId && specification
                                  ? {
                                      id: row.id,
                                      vendor_id: vendorId,
                                      lead_id: specification.lead_id,
                                      specs_id: specification.id,
                                      created_by: userId,
                                      carcass_type_id: Number(row.carcass_type_id),
                                      carcas_material_id: Number(row.carcas_material_id),
                                      carcass_material_finish_id: Number(
                                        row.carcass_material_finish_id,
                                      ),
                                    }
                                  : null,
                                persistedRow,
                              )}
	                        </tr>
	                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="shutter" className="flex-1 overflow-y-auto">
            <div className={`rounded-xl border border-border overflow-hidden mt-3 ${readOnly ? "select-none opacity-90" : ""}`}>
              {/* <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold">Shutter Specifications</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setShutterRows((prev) => [...prev, makeBlankShutterRow()])
                  }
                >
                  Add Row
                </Button>
              </div> */}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Shutter Type
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Shutter Material
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Shutter Material Finish
                      </th>
                      {showReviewColumns && (
                        <>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Approve
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Amend
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Delete
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {shutterRows.map((row, index) => {
                      const finishOptions =
                        shutterFinishQueries[index]?.data?.data ?? [];
                      const persistedRow = row.id
                        ? shutterMappings.find((item) => item.id === row.id)
                        : undefined;
                      const isDeletedRow = isReviewDeleted(
                        "shutter",
                        row,
                        persistedRow,
                      );

	                      return (
	                        <tr
                            key={row.localId}
                            className={cn(
                              "border-b last:border-b-0",
                              getShutterRowHighlightClass(row, index),
                            )}
                          >
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={shutterTypes.map((type) => ({
	                                id: type.id,
	                                label: type.name,
	                              }))}
	                              value={row.shutter_type_id ? Number(row.shutter_type_id) : undefined}
	                              onChange={(value) =>
	                                updateShutterRow(
	                                  row.localId,
	                                  "shutter_type_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search shutter type..."
	                              emptyLabel="Select shutter type"
	                              disabled={mappingsLocked}
	                              className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={shutterMaterials.map((material) => ({
	                                id: material.id,
	                                label: material.name,
	                              }))}
	                              value={
	                                row.shutter_material_id
	                                  ? Number(row.shutter_material_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateShutterRow(
	                                  row.localId,
	                                  "shutter_material_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search shutter material..."
	                              emptyLabel="Select shutter material"
	                              disabled={mappingsLocked}
	                              className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={finishOptions.map((finish) => ({
	                                id: finish.id,
	                                label: finish.name,
	                              }))}
	                              value={
	                                row.shutter_material_finish_id
	                                  ? Number(row.shutter_material_finish_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateShutterRow(
	                                  row.localId,
	                                  "shutter_material_finish_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              disabled={mappingsLocked || !row.shutter_material_id}
	                              placeholder={
	                                row.shutter_material_id
	                                  ? "Search shutter material finish..."
	                                  : "Select material first"
	                              }
	                              emptyLabel={
	                                row.shutter_material_id
	                                  ? "Select shutter material finish"
	                                  : "Select material first"
	                              }
	                              className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
	                            />
	                          </td>
                            {showReviewColumns &&
                              renderReviewActionCells(
                                "shutter",
                                row,
                                row.id && vendorId && userId && specification
                                  ? {
                                      id: row.id,
                                      vendor_id: vendorId,
                                      lead_id: specification.lead_id,
                                      specs_id: specification.id,
                                      created_by: userId,
                                      shutter_type_id: Number(row.shutter_type_id),
                                      shutter_material_id: Number(row.shutter_material_id),
                                      shutter_material_finish_id: Number(
                                        row.shutter_material_finish_id,
                                      ),
                                    }
                                  : null,
                                persistedRow,
                              )}
	                        </tr>
	                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="hardware" className="flex-1 overflow-y-auto">
            <div className={`rounded-xl border border-border overflow-hidden mt-3 ${readOnly ? "select-none opacity-90" : ""}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Carcass Legs
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Skirting
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Colors
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Note
                      </th>
                      {showReviewColumns && (
                        <>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Approve
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Amend
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Delete
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {hardwareRows.map((row, index) => {
                      const skirtingOptions =
                        skirtingQueries[index]?.data?.data ?? [];
                      const colorOptions =
                        colorQueries[index]?.data?.data ?? [];
                      const selectedSkirting = skirtingOptions.find(
                        (option) =>
                          String(option.id) === row.skirting_carcass_legs_id,
                      );
                      const persistedRow = row.id
                        ? hardwareMappings.find((item) => item.id === row.id)
                        : undefined;
                      const isDeletedRow = isReviewDeleted(
                        "hardware",
                        row,
                        persistedRow,
                      );
                      const isOutOfScope =
                        !!selectedSkirting && !selectedSkirting.inScope;

                      return (
                        <tr
                          key={row.localId}
                          className={cn(
                            "border-b last:border-b-0",
                            getHardwareRowHighlightClass(row, index),
                          )}
                        >
                          <td className="px-4 py-3 align-top">
                            <AssignToPicker
                              data={carcassLegs.map((legs) => ({
                                id: legs.id,
                                label: legs.name,
                              }))}
                              value={
                                row.carcass_legs_id
                                  ? Number(row.carcass_legs_id)
                                  : undefined
                              }
                              onChange={(value) =>
                                handleCarcassLegsChange(
                                  row.localId,
                                  value ? String(value) : "",
                                )
                              }
                              placeholder="Search carcass legs..."
                              emptyLabel="Select carcass legs"
                              disabled={mappingsLocked}
                              className={cn(
                                pickerClassName,
                                isDeletedRow && "line-through text-red-600",
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <AssignToPicker
                              data={skirtingOptions.map((option) => ({
                                id: option.id,
                                label: option.name,
                              }))}
                              value={
                                row.skirting_carcass_legs_id
                                  ? Number(row.skirting_carcass_legs_id)
                                  : undefined
                              }
                              onChange={(value) =>
                                void handleSkirtingChange(
                                  row.localId,
                                  value ? String(value) : "",
                                  skirtingOptions,
                                )
                              }
                              disabled={mappingsLocked || !row.carcass_legs_id}
                              placeholder={
                                row.carcass_legs_id
                                  ? "Search skirting..."
                                  : "Select carcass legs first"
                              }
                              emptyLabel={
                                row.carcass_legs_id
                                  ? "Select skirting"
                                  : "Select carcass legs first"
                              }
                              className={cn(
                                pickerClassName,
                                isDeletedRow && "line-through text-red-600",
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <AssignToPicker
                              data={colorOptions.map((color) => ({
                                id: color.id,
                                label: color.color,
                              }))}
                              value={
                                row.skirting_carcass_legs_color_id
                                  ? Number(row.skirting_carcass_legs_color_id)
                                  : undefined
                              }
                              onChange={(value) =>
                                handleColorChange(
                                  row.localId,
                                  value ? String(value) : "",
                                  colorOptions.length,
                                )
                              }
                              disabled={
                                mappingsLocked ||
                                !row.skirting_carcass_legs_id ||
                                colorOptions.length === 0
                              }
                              placeholder={
                                !row.skirting_carcass_legs_id
                                  ? "Select skirting first"
                                  : colorOptions.length === 0
                                    ? "No colors available"
                                    : "Search color..."
                              }
                              emptyLabel={
                                !row.skirting_carcass_legs_id
                                  ? "Select skirting first"
                                  : colorOptions.length === 0
                                    ? "No colors available"
                                    : "Select color"
                              }
                              className={cn(
                                pickerClassName,
                                isDeletedRow && "line-through text-red-600",
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              value={isOutOfScope ? "Not in our scope" : row.note}
                              onChange={(event) =>
                                handleNoteChange(row.localId, event.target.value)
                              }
                              onBlur={() =>
                                handleNoteBlur(row, colorOptions.length)
                              }
                              readOnly={mappingsLocked || isOutOfScope}
                              disabled={mappingsLocked || isOutOfScope}
                              placeholder={
                                isOutOfScope ? "" : "Add a note (optional)"
                              }
                              className={`${pickerClassName} w-full ${
                                isOutOfScope ? "text-muted-foreground" : ""
                              } ${isDeletedRow ? "line-through text-red-600" : ""}`}
                            />
                          </td>
                          {showReviewColumns &&
                            renderReviewActionCells(
                              "hardware",
                              row,
                              row.id && vendorId && userId && specification
                                ? {
                                    id: row.id,
                                    vendor_id: vendorId,
                                    lead_id: specification.lead_id,
                                    specs_id: specification.id,
                                    created_by: userId,
                                    carcass_legs_id: Number(row.carcass_legs_id),
                                    skirting_carcass_legs_id: Number(
                                      row.skirting_carcass_legs_id,
                                    ),
                                    skirting_carcass_legs_color_id:
                                      row.skirting_carcass_legs_color_id
                                        ? Number(row.skirting_carcass_legs_color_id)
                                        : null,
                                    note: row.note || null,
                                  }
                                : null,
                              persistedRow,
                            )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="others" className="flex-1 overflow-y-auto">
            <div className={readOnly ? "select-none opacity-90" : ""}>
              <div className="flex items-center justify-between gap-3 mb-2 mt-3">
              <h3 className="text-sm font-semibold">Lights</h3>
              <Select
                value={lightsRemark || undefined}
                onValueChange={(value) =>
                  handleLightsRemarkChange(value as LightsRemark)
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select lights remark" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In our scope">In our scope</SelectItem>
                  <SelectItem value="Not in our scope">
                    Not in our scope
                  </SelectItem>
                  <SelectItem value="Provide only grooves">
                    Provide only grooves
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Carcass Type
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Remark
                      </th>
                      {showReviewColumns && (
                        <>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Approve
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Amend
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-white">
                            Delete
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lightRows.map((row, index) => {
                      const unitOptions =
                        lightUnitQueries[index]?.data?.data ?? [];
                      const lightTypeOptions =
                        isCustomLightsMode && customLightCarcasType
                          ? [
                              {
                                id: customLightCarcasType.id,
                                label: customLightCarcasType.type,
                              },
                            ]
                          : selectableLightCarcasTypes.map((type) => ({
                              id: type.id,
                              label: type.type,
                            }));
                      const persistedRow = row.id
                        ? lightMappings.find((item) => item.id === row.id)
                        : undefined;
                      const isDeletedRow = isReviewDeleted(
                        "lights",
                        row,
                        persistedRow,
                      );

                      return (
                        <tr
                          key={row.localId}
                          className={cn(
                            "border-b last:border-b-0",
                            getLightRowHighlightClass(row, index),
                          )}
                        >
                          <td className="px-4 py-3 align-top">
                            {isCustomLightsMode ? (
                              <input
                                type="text"
                                value={customLightCarcasType?.type || "Custom"}
                                readOnly
                                disabled
                                className={cn(
                                  pickerClassName,
                                  "w-full text-muted-foreground",
                                  isDeletedRow && "line-through text-red-600",
                                )}
                              />
                            ) : (
                              <AssignToPicker
                                data={lightTypeOptions}
                                value={
                                  row.light_carcas_type_id
                                    ? Number(row.light_carcas_type_id)
                                    : undefined
                                }
                                onChange={(value) =>
                                  updateLightRow(
                                    row.localId,
                                    "light_carcas_type_id",
                                    value ? String(value) : "",
                                  )
                                }
                                disabled={mappingsLocked || !isLightsEnabled}
                                placeholder={
                                  isLightsEnabled
                                    ? "Search carcass type..."
                                    : "Select lights remark first"
                                }
                                emptyLabel={
                                  isLightsEnabled
                                    ? "Select carcass type"
                                    : "Select lights remark first"
                                }
                                className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {isCustomLightsMode ? (
                              <textarea
                                value={row.custom_remark}
                                onChange={(event) =>
                                  handleCustomLightRemarkChange(
                                    row.localId,
                                    event.target.value,
                                  )
                                }
                                onBlur={(event) =>
                                  handleCustomLightRemarkBlur(
                                    row.localId,
                                    event.target.value,
                                  )
                                }
                                disabled={mappingsLocked || !isLightsEnabled}
                                placeholder={
                                  isLightsEnabled
                                    ? "Enter custom light remark"
                                    : "Select lights remark first"
                                }
                                className={cn(
                                  pickerClassName,
                                  "min-h-24 w-full resize-y py-3",
                                  isDeletedRow && "line-through text-red-600",
                                )}
                              />
                            ) : (
                              <AssignToPicker
                                data={unitOptions.map((unit) => ({
                                  id: unit.id,
                                  label: unit.type,
                                }))}
                                value={
                                  row.light_carcas_unit_master_id
                                    ? Number(row.light_carcas_unit_master_id)
                                    : undefined
                                }
                                onChange={(value) =>
                                  updateLightRow(
                                    row.localId,
                                    "light_carcas_unit_master_id",
                                    value ? String(value) : "",
                                  )
                                }
                                disabled={
                                  mappingsLocked ||
                                  !isLightsEnabled ||
                                  !row.light_carcas_type_id
                                }
                                placeholder={
                                  !isLightsEnabled
                                    ? "Select lights remark first"
                                    : row.light_carcas_type_id
                                      ? "Search remark..."
                                      : "Select carcass type first"
                                }
                                emptyLabel={
                                  !isLightsEnabled
                                    ? "Select lights remark first"
                                    : row.light_carcas_type_id
                                      ? "Select remark"
                                      : "Select carcass type first"
                                }
                                className={cn(
                                  pickerClassName,
                                  isDeletedRow && "line-through text-red-600",
                                )}
                              />
                            )}
                          </td>
                          {showReviewColumns &&
                            renderReviewActionCells(
                              "lights",
                              row,
                              row.id && vendorId && userId && specification
                                ? {
                                    id: row.id,
                                    vendor_id: vendorId,
                                    lead_id: specification.lead_id,
                                    specs_id: specification.id,
                                    created_by: userId,
                                    light_carcas_unit_master_id:
                                      row.light_carcas_unit_master_id
                                        ? Number(row.light_carcas_unit_master_id)
                                        : null,
                                    custom_remark: row.custom_remark.trim() || null,
                                  }
                                : null,
                              persistedRow,
                            )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {OTHER_APPLIANCE_TYPES.map((type) => {
              const options = otherAppliancesByType[type] ?? [];
              const rows = otherApplianceRowsByType[type] ?? [];
              const section = type.toLowerCase() as SpecificationSectionType;
              const sectionRemark = otherApplianceRemarks[section];
              const isSectionEnabled = isOtherApplianceSectionEnabled(section);
              const isCustomSectionMode =
                isCustomOtherApplianceSectionMode(section);

              return (
                <div key={type}>
                  <div className="flex items-center justify-between gap-3 mb-2 mt-6">
                    <h3 className="text-sm font-semibold">{type}</h3>
                    <Select
                      value={sectionRemark || undefined}
                      onValueChange={(value) =>
                        handleOtherApplianceRemarkChange(
                          section,
                          value as SpecificationSectionRemark,
                        )
                      }
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder={`Select ${type} remark`} />
                      </SelectTrigger>
                      <SelectContent>
                        {specificationSectionOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-700">
                          <tr className="border-b">
                            <th className="px-4 py-3 text-left font-bold text-white">
                              {isCustomSectionMode ? "Type" : "Article Code"}
                            </th>
                            <th className="px-4 py-3 text-left font-bold text-white">
                              Description
                            </th>
                            {showReviewColumns && (
                              <>
                                <th className="px-4 py-3 text-center font-bold text-white">
                                  Approve
                                </th>
                                <th className="px-4 py-3 text-center font-bold text-white">
                                  Amend
                                </th>
                                <th className="px-4 py-3 text-center font-bold text-white">
                                  Delete
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, index) => {
                            const selectedEntry = options.find(
                              (option) =>
                                String(option.id) ===
                                row.other_appliances_master_id,
                            );
                            const persistedRow = row.id
                              ? otherApplianceMappings.find((item) => item.id === row.id)
                              : undefined;
                            const isDeletedRow = isReviewDeleted(
                              `other-${type}`,
                              row,
                              persistedRow,
                            );

                            return (
                              <tr
                                key={row.localId}
                                className={cn(
                                  "border-b last:border-b-0",
                                  getOtherApplianceRowHighlightClass(
                                    type,
                                    row,
                                    index,
                                  ),
                                )}
                              >
                                <td className="px-4 py-3 align-top">
                                  {isCustomSectionMode ? (
                                    <input
                                      type="text"
                                      value="Custom"
                                      readOnly
                                      disabled
                                      className={cn(
                                        pickerClassName,
                                        "w-full text-muted-foreground",
                                        isDeletedRow && "line-through text-red-600",
                                      )}
                                    />
                                  ) : (
                                    <AssignToPicker
                                      data={options.map((option) => ({
                                        id: option.id,
                                        label: option.article_number,
                                      }))}
                                      value={
                                        row.other_appliances_master_id
                                          ? Number(row.other_appliances_master_id)
                                          : undefined
                                      }
                                      onChange={(value) =>
                                        updateOtherApplianceRow(
                                          type,
                                          row.localId,
                                          value ? String(value) : "",
                                        )
                                      }
                                      disabled={mappingsLocked || !isSectionEnabled}
                                      placeholder={
                                        isSectionEnabled
                                          ? "Search article code..."
                                          : `Select ${type} remark first`
                                      }
                                      emptyLabel={
                                        isSectionEnabled
                                          ? "Select article code"
                                          : `Select ${type} remark first`
                                      }
                                      className={cn(
                                        pickerClassName,
                                        isDeletedRow && "line-through text-red-600",
                                      )}
                                    />
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {isCustomSectionMode ? (
                                    <textarea
                                      value={row.custom_remark}
                                      onChange={(event) =>
                                        handleCustomOtherApplianceRemarkChange(
                                          type,
                                          row.localId,
                                          event.target.value,
                                        )
                                      }
                                      onBlur={(event) =>
                                        handleCustomOtherApplianceRemarkBlur(
                                          type,
                                          row.localId,
                                          event.target.value,
                                        )
                                      }
                                      disabled={mappingsLocked || !isSectionEnabled}
                                      placeholder={
                                        isSectionEnabled
                                          ? `Enter custom ${type.toLowerCase()} remark`
                                          : `Select ${type} remark first`
                                      }
                                      className={cn(
                                        pickerClassName,
                                        "min-h-24 w-full resize-y py-3",
                                        isDeletedRow && "line-through text-red-600",
                                      )}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={selectedEntry?.description ?? ""}
                                      readOnly
                                      disabled
                                      placeholder="Select article code first"
                                      className={cn(
                                        `${pickerClassName} w-full text-muted-foreground`,
                                        isDeletedRow && "line-through text-red-600",
                                      )}
                                    />
                                  )}
                                </td>
                                {showReviewColumns &&
                                  renderReviewActionCells(
                                    `other-${type}`,
                                    row,
                                    row.id && vendorId && userId && specification
                                      ? {
                                          id: row.id,
                                          vendor_id: vendorId,
                                          lead_id: specification.lead_id,
                                          specs_id: specification.id,
                                          created_by: userId,
                                          other_appliance_type: row.type || null,
                                          other_appliances_master_id:
                                            row.other_appliances_master_id
                                              ? Number(row.other_appliances_master_id)
                                              : null,
                                          custom_remark:
                                            row.custom_remark.trim() || null,
                                        }
                                      : null,
                                    persistedRow,
                                  )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ViewSpecsModal;
