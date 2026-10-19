"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCutlistHeaderMappings } from "@/api/cutlist-headers";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadField } from "../custom/file-upload";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  FolderPlus,
  Download,
  Info,
  ArrowRight,
  Search,
  UserRound,
  CheckCircle2,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Upload,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

import {
  useCreateTrackTraceProject,
  useSearchTrackTraceLeads,
  useTrackTraceVendorConfig,
  useTrackTraceProject,
  useUpdateTrackTraceProject,
  useDownloadMultiLocationTemplate,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";

import { TrackTraceLeadOption, PackingType } from "@/types/track-trace";

const boxInfoFieldSchema = z.object({
  id: z.number().optional(),

  field_label: z
    .string()
    .min(1, "Field name is required")
    .max(50, "Field name must not exceed 50 characters"),

  field_type: z
    .enum([
      "TEXT",
      "NUMBER",
      "DATE",
      "TEXTAREA",
    ])
    .default("TEXT"),

  is_required: z
    .boolean()
    .default(false),

  sort_order: z
    .number()
    .optional(),

  active: z
    .boolean()
    .default(true),
});

const getProjectFormSchema = (mode: "create" | "edit" = "create") =>
  z
    .object({
      projectName: z
        .string()
        .trim()
        .min(1, "Project name is required")
        .min(3, "Project name must be at least 3 characters")
        .max(100, "Project name must not exceed 100 characters"),

      lead_id: z.number().nullable().optional(),

      order_no: z.string().optional(),
      client_name: z.string().optional(),
      client_address: z.string().optional(),
      client_contact_no: z.string().optional(),
      packing_type: z.enum(PackingType),
      is_multi_location: z.boolean().default(false),

      no_of_boxes: z.coerce
        .number()
        .int("No of boxes must be an integer")
        .min(0, "No of boxes cannot be negative")
        .default(0),

      box_info_fields: z.array(boxInfoFieldSchema).default([]),

      file: z
        .array(z.instanceof(File))
        .max(1, "Only one file is allowed")
        .optional()
        .default([])
        .refine(
          (files) => {
            if (files.length === 0) return true;

            const file = files[0];

            return (
              file.type ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
              file.type === "application/vnd.ms-excel" ||
              file.name.toLowerCase().endsWith(".xlsx") ||
              file.name.toLowerCase().endsWith(".xls")
            );
          },
          {
            message: "Only Excel files (.xlsx, .xls) are allowed",
          }
        ),
    })
    .superRefine((data, ctx) => {
      if (!data.lead_id) {
        if (!data.order_no || !data.order_no.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Order number is required",
            path: ["order_no"],
          });
        }

        if (!data.client_name || !data.client_name.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Client name is required",
            path: ["client_name"],
          });
        }

        if (!data.client_contact_no || !data.client_contact_no.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Client contact number is required",
            path: ["client_contact_no"],
          });
        }

        if (!data.client_address || !data.client_address.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Client address is required",
            path: ["client_address"],
          });
        }
      }

      if (mode === "create" && (!data.file || data.file.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Excel file is required",
          path: ["file"],
        });
      }
    });

const projectFormSchema = getProjectFormSchema("create");

type ProjectFormInput = z.input<typeof projectFormSchema>;
type ProjectFormData = z.output<typeof projectFormSchema>;

type TrackTraceProjectFormProps = {
  mode: "create" | "edit";
  uniqueProjectId?: string;
};

type ExtendedLeadOption = TrackTraceLeadOption & {
  lastname?: string | null;
  site_address?: string | null;
};

type BoxRemovalOption = {
  id: number;
  box_name: string;
  sequence_no: number;
  box_status?: string | null;
  item_count: number;
  can_remove: boolean;
};

const normalizeExcelHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const normalizePackingType = (value: unknown): PackingType => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === PackingType.CUSTOM_GROUP ||
    normalized === "CUSTOM_PACKING_GROUP"
  ) {
    return PackingType.CUSTOM_GROUP;
  }

  if (normalized === PackingType.GROUPWISE || normalized === "GROUP_WISE") {
    return PackingType.GROUPWISE;
  }

  return PackingType.DEFAULT;
};

const validateCustomPackingGroupWorkbook = async (
  file: File,
  vendorId: number,
): Promise<string | null> => {
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(await file.arrayBuffer());

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return "Excel sheet not found";
    }

    const { mappings, fields } = await getCutlistHeaderMappings(vendorId);
    const customPackingGroupField = fields.find((field) => field.field_key === "custom_packing_group");
    let customPackingGroupColumn = 0;

    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
      const header = normalizeExcelHeader(cell.text);
      const mapping = mappings.find((entry) => normalizeExcelHeader(entry.source_header) === header);
      if (mapping ? mapping.rule_field_id === customPackingGroupField?.id : header === "custom packing group") {
        customPackingGroupColumn = column;
      }
    });

    if (customPackingGroupColumn === 0) {
      return 'The "Custom Packing Group" column is required when Packing Type is Custom Packing Group';
    }

    const rowsMissingCustomPackingGroup: number[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      let hasRowData = false;

      row.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.text.trim()) {
          hasRowData = true;
        }
      });

      if (
        hasRowData &&
        !row.getCell(customPackingGroupColumn).text.trim()
      ) {
        rowsMissingCustomPackingGroup.push(rowNumber);
      }
    });

    if (rowsMissingCustomPackingGroup.length > 0) {
      const displayedRows = rowsMissingCustomPackingGroup.slice(0, 10);
      const remainingRows =
        rowsMissingCustomPackingGroup.length - displayedRows.length;

      return `Custom Packing Group is required in Excel row${
        rowsMissingCustomPackingGroup.length > 1 ? "s" : ""
      } ${displayedRows.join(", ")}${
        remainingRows > 0 ? ` and ${remainingRows} more` : ""
      }`;
    }

    return null;
  } catch {
    return "Unable to read the Excel file. Upload a valid .xlsx workbook";
  }
};

type CutlistPreviewField = {
  key: string;
  label: string;
  required: boolean;
  present: boolean;
  missingRows: number[];
};

type CutlistPreview = {
  fileName: string;
  rowCount: number;
  fields: CutlistPreviewField[];
  rows: Array<{ row: number; values: Record<string, string>; missing: string[]; duplicates: string[] }>;
  rowErrors: Array<{ row: number; missing: string[]; duplicates: string[] }>;
  uniqueCodeMode: "all-filled" | "all-blank" | "mixed";
  parseError?: string;
};

const buildCutlistPreview = async (
  file: File,
  vendorId: number,
  packingType: PackingType = PackingType.DEFAULT
): Promise<CutlistPreview> => {
  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return {
        fileName: file.name,
        rowCount: 0,
        fields: [],
        rows: [],
        rowErrors: [],
        uniqueCodeMode: "all-blank",
        parseError: "Excel sheet not found.",
      };
    }

    const isCustomGroup = packingType === PackingType.CUSTOM_GROUP;

    const { mappings, fields: configuredFields } =
      await getCutlistHeaderMappings(vendorId);
    const mappedHeaders = new Map(
      mappings.map((mapping) => [
        normalizeExcelHeader(mapping.source_header),
        configuredFields.find((field) => field.id === mapping.rule_field_id)
          ?.field_key,
      ])
    );

    const excelHeaders: Array<{ column: number; header: string; normalized: string }> = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
      const header = cell.text.trim();
      const normalized = normalizeExcelHeader(header);
      if (header) {
        excelHeaders.push({ column, header, normalized });
      }
    });

    const getColumnForAliases = (
      fieldKey: string,
      aliases: readonly string[]
    ): number => {
      const mappedEntry = excelHeaders.find(
        (h) => mappedHeaders.get(h.normalized) === fieldKey
      );
      if (mappedEntry) return mappedEntry.column;

      const aliasNormalized = [fieldKey, ...aliases].map(normalizeExcelHeader);
      const aliasEntry = excelHeaders.find((h) =>
        aliasNormalized.includes(h.normalized)
      );
      return aliasEntry ? aliasEntry.column : 0;
    };

    const KNOWN_FIELDS_DEF = [
      {
        key: "group_name",
        label: "Group Name",
        aliases: ["group name", "group"],
        required: true,
        alwaysInclude: true,
      },
      {
        key: "category_name",
        label: "Category Name",
        aliases: ["category name", "category"],
        required: true,
        alwaysInclude: true,
      },
      {
        key: "material_details",
        label: "Article Code",
        aliases: ["article code", "material details", "articlecode"],
        required: true,
        alwaysInclude: true,
      },
      {
        key: "item_name",
        label: "Item Name",
        aliases: ["item name", "name", "description"],
        required: true,
        alwaysInclude: true,
      },
      {
        key: "qty",
        label: "Quantity",
        aliases: ["qty", "quantity"],
        required: true,
        alwaysInclude: true,
      },
      {
        key: "length",
        label: "Length",
        aliases: ["length", "l1"],
        required: false,
        alwaysInclude: true,
      },
      {
        key: "width",
        label: "Width",
        aliases: ["width", "l2"],
        required: false,
        alwaysInclude: true,
      },
      {
        key: "thickness",
        label: "Thickness",
        aliases: ["thickness", "l3"],
        required: false,
        alwaysInclude: true,
      },
      {
        key: "unique_code",
        label: "Unique Code",
        aliases: ["unique code", "barcode1", "barcode 1", "unique code 1"],
        required: true,
        alwaysInclude: true,
      },
      {
        key: "elf",
        label: "EL1 / ELF",
        aliases: ["el1", "elf", "el 1", "elf1"],
        required: false,
      },
      {
        key: "elb",
        label: "EL2 / ELB",
        aliases: ["el2", "elb", "el 2", "elb2"],
        required: false,
      },
      {
        key: "esl",
        label: "SL1 / ESL",
        aliases: ["sl1", "esl", "sl 1", "esl1"],
        required: false,
      },
      {
        key: "esr",
        label: "SL2 / ESR",
        aliases: ["sl2", "esr", "sl 2", "esr2"],
        required: false,
      },
      {
        key: "sl3",
        label: "SL3",
        aliases: ["sl3", "sl 3"],
        required: false,
      },
      {
        key: "weight",
        label: "Weight",
        aliases: ["weight", "wt", "wt.", "weight kg", "weight (kg)", "total weight", "totalweight"],
        required: false,
      },
      {
        key: "custom_packing_group",
        label: "Custom Packing Group",
        aliases: ["custom packing group", "custom_packing_group", "custom packing", "packing group"],
        required: isCustomGroup,
        alwaysInclude: isCustomGroup,
      },
    ];

    const matchedColumnNumbers = new Set<number>();

    const matchedKnownFields = KNOWN_FIELDS_DEF.map((def) => {
      const column = getColumnForAliases(def.key, def.aliases);
      if (column > 0) matchedColumnNumbers.add(column);
      return {
        key: def.key,
        label: def.label,
        required: def.required,
        alwaysInclude: Boolean(def.alwaysInclude),
        column,
      };
    });

    const extraPresentFields = excelHeaders
      .filter((h) => !matchedColumnNumbers.has(h.column))
      .map((h) => ({
        key: `extra_${h.column}_${h.normalized.replace(/[^a-z0-9]+/g, "_")}`,
        label: h.header,
        required: false,
        alwaysInclude: false,
        column: h.column,
      }));

    const activePreviewFields = [
      ...matchedKnownFields.filter((f) => f.alwaysInclude || f.column > 0),
      ...extraPresentFields,
    ];

    const dataRows: Array<{ row: number; values: Record<string, string> }> = [];
    let dataRowIndex = 1;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const values: Record<string, string> = {};
      let hasData = false;
      activePreviewFields.forEach((field) => {
        const value = field.column ? row.getCell(field.column).text.trim() : "";
        values[field.key] = value;
        if (value) hasData = true;
      });
      if (hasData) dataRows.push({ row: dataRowIndex++, values });
    });

    const isFieldMissingOrInvalid = (fieldKey: string, val?: string) => {
      if (!val) return true;
      if (fieldKey === "qty") {
        const num = Number(val);
        return isNaN(num) || num <= 0;
      }
      return false;
    };

    const uniqueCodeValues = dataRows.map((row) => Boolean(row.values.unique_code));
    const hasUniqueCode = uniqueCodeValues.some(Boolean);
    const hasBlankUniqueCode = uniqueCodeValues.some((value) => !value);
    const uniqueCodeMode =
      hasUniqueCode && hasBlankUniqueCode
        ? "mixed"
        : hasUniqueCode
          ? "all-filled"
          : "all-blank";

    const fields = activePreviewFields.map((field) => {
      const isUniqueCodeAllBlank =
        field.key === "unique_code" && uniqueCodeMode === "all-blank";
      const isPresent = field.column > 0 || isUniqueCodeAllBlank;
      const missingRows = dataRows
        .filter(
          (row) =>
            field.required &&
            !isUniqueCodeAllBlank &&
            isFieldMissingOrInvalid(field.key, row.values[field.key])
        )
        .map((row) => row.row);

      return {
        key: field.key,
        label: field.label,
        required: field.required,
        present: isPresent,
        missingRows,
      };
    });

    const codeCounts = new Map<string, number>();
    dataRows.forEach((row) => {
      if (row.values.unique_code) {
        codeCounts.set(
          row.values.unique_code,
          (codeCounts.get(row.values.unique_code) ?? 0) + 1
        );
      }
    });

    const rows = dataRows.map((row) => {
      const missing = fields
        .filter(
          (field) =>
            field.required &&
            !(field.key === "unique_code" && uniqueCodeMode === "all-blank") &&
            isFieldMissingOrInvalid(field.key, row.values[field.key])
        )
        .map((field) => {
          if (field.key === "qty" && row.values.qty && (Number(row.values.qty) <= 0 || isNaN(Number(row.values.qty)))) {
            return "Quantity cannot be 0";
          }
          return field.label;
        });
      const duplicates =
        row.values.unique_code &&
        (codeCounts.get(row.values.unique_code) ?? 0) > 1
          ? ["Unique Code"]
          : [];
      return { ...row, missing, duplicates };
    });

    const rowErrors = rows
      .filter((row) => row.missing.length > 0 || row.duplicates.length > 0)
      .map(({ row, missing, duplicates }) => ({ row, missing, duplicates }));

    return {
      fileName: file.name,
      rowCount: dataRows.length,
      fields,
      rows,
      rowErrors,
      uniqueCodeMode,
    };
  } catch {
    return {
      fileName: file.name,
      rowCount: 0,
      fields: [],
      rows: [],
      rowErrors: [],
      uniqueCodeMode: "all-blank",
      parseError: "Unable to read the Excel file.",
    };
  }
};

function LeadSearchBox({
  vendorId,
  value,
  selectedLeadFromProject,
  onChange,
  onClear,
  disabled,
}: {
  vendorId?: number;
  value?: number | null;
  selectedLeadFromProject?: ExtendedLeadOption | null;
  onChange: (leadId: number, lead: ExtendedLeadOption) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ExtendedLeadOption | null>(
    selectedLeadFromProject || null
  );

  const { data = [], isFetching } = useSearchTrackTraceLeads(
    vendorId,
    search,
    open
  );

  useEffect(() => {
    if (selectedLeadFromProject) {
      setSelectedLead(selectedLeadFromProject);
    }
  }, [selectedLeadFromProject]);

  useEffect(() => {
    if (!value) {
      setSelectedLead(null);
    }
  }, [value]);

  const leadLabel = useMemo(() => {
    if (!selectedLead) return "";

    const fullName = [selectedLead.firstname, selectedLead.lastname]
      .filter(Boolean)
      .join(" ");

    return [fullName, selectedLead.lead_code, selectedLead.contact_no]
      .filter(Boolean)
      .join(" · ");
  }, [selectedLead]);

  const handleClear = () => {
    setSearch("");
    setOpen(false);
    setSelectedLead(null);
    onClear();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <Input
          value={open ? search : leadLabel}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          placeholder="Search lead by client, project, phone or email..."
          className="h-10 pl-9 pr-10"
        />

        {(search || selectedLead) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>



      {open && !disabled && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border bg-background p-2 shadow-xl">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 size={15} className="animate-spin" />
              Searching leads...
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <UserRound size={26} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-xs">Try another name, phone or project.</p>
            </div>
          ) : (
            data.map((rawLead) => {
              const lead = rawLead as ExtendedLeadOption;
              const active = Number(value) === Number(lead.id);

              const fullName = [lead.firstname, lead.lastname]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={lead.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();

                    setSelectedLead(lead);
                    setSearch("");
                    setOpen(false);

                    onChange(lead.id, lead);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40"
                      : "hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      active
                        ? "bg-indigo-600 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {active ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <UserRound size={16} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {fullName || lead.firstname || "Unnamed Client"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[lead.lead_code, lead.contact_no, lead.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {lead.site_address && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {lead.site_address}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackTraceProjectForm({
  mode,
  uniqueProjectId,
}: TrackTraceProjectFormProps) {
  const router = useRouter();

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);

  const { mutate: createProject, isPending: isCreating } =
    useCreateTrackTraceProject();

  const { mutate: updateProject, isPending: isUpdating } =
    useUpdateTrackTraceProject();

  const {
    mutate: downloadMultiLocationTemplate,
    isPending: isDownloadingMultiLocationTemplate,
  } = useDownloadMultiLocationTemplate();

  const { data: vendorConfig, isLoading: configLoading } =
    useTrackTraceVendorConfig(vendorId);

  const {
    data: projectData,
    isLoading: projectLoading,
    isError: projectError,
  } = useTrackTraceProject(mode === "edit" ? uniqueProjectId : undefined);

  const isPending = isCreating || isUpdating;
  const isCrmEnabled = !!vendorConfig?.is_crm_enabled;

  const [selectedLeadFromProject, setSelectedLeadFromProject] =
    useState<ExtendedLeadOption | null>(null);

  const [boxRemovalDialogOpen, setBoxRemovalDialogOpen] = useState(false);
  const [boxRemovalOptions, setBoxRemovalOptions] = useState<BoxRemovalOption[]>([]);
  const [boxRemovalRequiredCount, setBoxRemovalRequiredCount] = useState(0);
  const [selectedRemoveBoxIds, setSelectedRemoveBoxIds] = useState<number[]>([]);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<any | null>(null);
  const [isValidatingExcel, setIsValidatingExcel] = useState(false);
  const [isPreviewingCutlist, setIsPreviewingCutlist] = useState(false);
  const [cutlistPreview, setCutlistPreview] = useState<CutlistPreview | null>(null);
  const [cutlistPreviewOpen, setCutlistPreviewOpen] = useState(false);
  const excelValidationId = useRef(0);

  const form = useForm<ProjectFormInput, unknown, ProjectFormData>({
    resolver: zodResolver(getProjectFormSchema(mode)),
    defaultValues: {
      projectName: "",
      lead_id: null,
      order_no: "",
      client_name: "",
      client_address: "",
      client_contact_no: "",
      packing_type: PackingType.DEFAULT,
      is_multi_location: false,
      no_of_boxes: 0,
      box_info_fields: [],
      file: [],
    },
  });
  const resetProjectForm = form.reset;

  const {
    fields: boxInfoFields,
    append: appendBoxInfoField,
    remove: removeBoxInfoField,
  } = useFieldArray({
    control: form.control,
    name: "box_info_fields",
  });

  const selectedLeadId = form.watch("lead_id");
  const isLeadSelected = !!selectedLeadId;
  const selectedPackingType = form.watch("packing_type");
  const selectedNoOfBoxes = Number(form.watch("no_of_boxes") || 0);
  const isMultiLocation = form.watch("is_multi_location");
  const persistedProject = (projectData as any)?.data ?? projectData;
  const isMultiLocationSaved = Boolean(persistedProject?.is_multi_location);
  const isCustomGroupPacking =
    selectedPackingType === PackingType.CUSTOM_GROUP;
  const isDefaultPacking = selectedPackingType === PackingType.DEFAULT;
  const isGroupwiseWithConfiguredBoxes =
    selectedPackingType === PackingType.GROUPWISE && selectedNoOfBoxes > 0;
  const showNoOfBoxes = !isCustomGroupPacking;
  const showMultiLocation = !isGroupwiseWithConfiguredBoxes;

  const watchedProjectName = form.watch("projectName");
  const watchedOrderNo = form.watch("order_no");
  const watchedClientName = form.watch("client_name");
  const watchedClientContactNo = form.watch("client_contact_no");
  const watchedClientAddress = form.watch("client_address");

  const missingProjectDetails = useMemo(() => {
    const missing: string[] = [];
    if (!watchedProjectName?.trim() || watchedProjectName.trim().length < 3) {
      missing.push("Project Name");
    }
    if (!selectedLeadId) {
      if (!watchedOrderNo?.trim()) missing.push("Order No");
      if (!watchedClientName?.trim()) missing.push("Client Name");
      if (!watchedClientContactNo?.trim()) missing.push("Client Contact No");
      if (!watchedClientAddress?.trim()) missing.push("Client Address");
    }
    return missing;
  }, [
    watchedProjectName,
    selectedLeadId,
    watchedOrderNo,
    watchedClientName,
    watchedClientContactNo,
    watchedClientAddress,
  ]);

  const isFormComplete = missingProjectDetails.length === 0;

  useEffect(() => {
    if (isCustomGroupPacking && selectedNoOfBoxes !== 0) {
      form.setValue("no_of_boxes", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (
      (isDefaultPacking || isGroupwiseWithConfiguredBoxes) &&
      isMultiLocation
    ) {
      form.setValue("is_multi_location", false, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    form,
    isCustomGroupPacking,
    isDefaultPacking,
    isGroupwiseWithConfiguredBoxes,
    isMultiLocation,
    selectedNoOfBoxes,
  ]);

  const validateUploadedExcel = async (
    files: File[],
    packingType: PackingType
  ) => {
    const validationId = ++excelValidationId.current;
    const file = files[0];

    if (!file || packingType !== PackingType.CUSTOM_GROUP) {
      if (form.getFieldState("file").error?.type === "custom_packing_group") {
        form.clearErrors("file");
      }

      setIsValidatingExcel(false);
      return true;
    }

    setIsValidatingExcel(true);
    const errorMessage = vendorId
      ? await validateCustomPackingGroupWorkbook(file, vendorId)
      : "Vendor is required to validate the Excel file.";

    if (validationId !== excelValidationId.current) {
      return false;
    }

    setIsValidatingExcel(false);

    if (errorMessage) {
      form.setError("file", {
        type: "custom_packing_group",
        message: errorMessage,
      });
      toastManager.add({ title: errorMessage, type: "error" });
      return false;
    }

    if (form.getFieldState("file").error?.type === "custom_packing_group") {
      form.clearErrors("file");
    }

    return true;
  };

  const previewCutlistFile = async (files: File[]) => {
    const file = files[0];
    setCutlistPreview(null);
    if (!file) return;

    setIsPreviewingCutlist(true);
    const packingType = form.getValues("packing_type");
    const preview = vendorId
      ? await buildCutlistPreview(file, Number(vendorId), packingType)
      : { fileName: file.name, rowCount: 0, fields: [], rows: [], rowErrors: [], uniqueCodeMode: "all-blank" as const, parseError: "Vendor information not found." };
    setCutlistPreview(preview);
    setIsPreviewingCutlist(false);
    setCutlistPreviewOpen(true);
  };

  const cutlistPreviewHasErrors = Boolean(
    cutlistPreview?.parseError ||
      cutlistPreview?.rowCount === 0 ||
      cutlistPreview?.rowErrors.length ||
      cutlistPreview?.uniqueCodeMode === "mixed" ||
      cutlistPreview?.fields.some((field) => field.required && !field.present)
  );
  const previewRows = cutlistPreview?.rows ?? [];
  const previewInvalidRows = previewRows.filter((row) => row.missing.length > 0 || row.duplicates.length > 0);
  const previewDuplicateRows = previewRows.filter((row) => row.duplicates.length > 0);
  const previewPassedRows = previewRows.length - previewInvalidRows.length;
  const previewCompleteRows = previewPassedRows;

  useEffect(() => {
    if (mode !== "edit" || !projectData) return;

    const projectResponse = projectData as any;
    const project = projectResponse?.data ?? projectResponse;
    const persistedPackingType =
      project.packing_type ?? project.packingType ?? project.project_type;
    const normalizedPackingType = normalizePackingType(persistedPackingType);

    resetProjectForm({
      projectName: project.project_name || "",
      lead_id: project.lead_id || null,
      order_no: project.order_no || "",
      client_name: project.client_name || "",
      client_address: project.client_address || "",
      client_contact_no: project.client_contact_no || "",

      packing_type: normalizedPackingType,
      is_multi_location: Boolean(project.is_multi_location),

      no_of_boxes:
        Number(project.no_of_boxes || 0),

      box_info_fields:
        project.box_info_fields?.map(
          (
            item: any,
            index: number
          ) => ({
            id: Number(item.id),

            field_label:
              item.field_label ||
              "",

            field_type:
              item.field_type ||
              "TEXT",

            is_required:
              Boolean(
                item.is_required
              ),

            sort_order:
              item.sort_order ||
              index + 1,

            active:
              item.active ??
              true,
          })
        ) || [],

      file: [],
    });

    if (project.lead) {
      setSelectedLeadFromProject(project.lead as ExtendedLeadOption);
    }
  }, [mode, projectData, resetProjectForm]);

  const handleDownloadTemplate = () => {
    try {
      const link = document.createElement("a");
      link.href = `/TrackTrace_Project_Template.xlsx?v=${Date.now()}`;
      link.download = "TrackTrace_Project_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastManager.add({
        title: "Template downloaded successfully",
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Failed to download template",
        type: "error",
      });
    }
  };

  const handleDownloadMultiLocationTemplate = () => {
    if (!uniqueProjectId || !vendorId) {
      toastManager.add({
        title: "Project or vendor information not found",
        type: "error",
      });
      return;
    }

    downloadMultiLocationTemplate(
      {
        uniqueProjectId,
        vendorId: Number(vendorId),
      },
      {
        onSuccess: ({ blob, fileName }) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);

          toastManager.add({
            title: "Multi Location Excel downloaded successfully",
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Failed to download Multi Location Excel",
            type: "error",
          });
        },
      }
    );
  };

  const clearLeadSelection = () => {
    setSelectedLeadFromProject(null);

    form.setValue("lead_id", null);
    form.setValue("order_no", "");
    form.setValue("client_name", "");
    form.setValue("client_address", "");
    form.setValue("client_contact_no", "");
  };

  const fillLeadDetails = (leadId: number, lead: ExtendedLeadOption) => {
    const fullName = [lead.firstname, lead.lastname].filter(Boolean).join(" ");

    form.setValue("lead_id", leadId);
    form.setValue("order_no", lead.lead_code || "");
    form.setValue("client_name", fullName || lead.firstname || "");
    form.setValue("client_contact_no", lead.contact_no || "");
    form.setValue("client_address", lead.site_address || "");
  };

  const validateManualFields = (data: ProjectFormData) => {
    if (data.lead_id) return true;

    if (!data.order_no?.trim()) {
      toastManager.add({
        title: "Order number is required",
        type: "error",
      });
      return false;
    }

    if (!data.client_name?.trim()) {
      toastManager.add({
        title: "Client name is required",
        type: "error",
      });
      return false;
    }

    if (!data.client_address?.trim()) {
      toastManager.add({
        title: "Client address is required",
        type: "error",
      });
      return false;
    }

    if (!data.client_contact_no?.trim()) {
      toastManager.add({
        title: "Client contact number is required",
        type: "error",
      });
      return false;
    }

    return true;
  };


  const openBoxRemovalSelection = (
    response: any,
    attemptedPayload: any
  ) => {
    const selectionData =
      response?.data?.requires_box_removal_selection
        ? response.data
        : response?.response?.data?.data?.requires_box_removal_selection
          ? response.response.data.data
          : response?.data?.data?.requires_box_removal_selection
            ? response.data.data
            : null;

    if (!selectionData) {
      return false;
    }

    const boxes = Array.isArray(selectionData.boxes)
      ? selectionData.boxes
      : [];

    setPendingUpdatePayload(attemptedPayload);
    setBoxRemovalOptions(boxes);
    setBoxRemovalRequiredCount(Number(selectionData.remove_count || 0));
    setSelectedRemoveBoxIds([]);
    setBoxRemovalDialogOpen(true);

    toastManager.add({
      title:
        response?.message ||
        response?.response?.data?.message ||
        "Select empty boxes to remove",
      type: "error",
    });

    return true;
  };

  const submitProjectUpdate = (payload: any) => {
    if (!uniqueProjectId) {
      toastManager.add({
        title: "Project ID not found",
        type: "error",
      });

      return;
    }

    updateProject(
      {
        uniqueProjectId,
        payload,
      },
      {
        onSuccess: (response: any) => {
          if (openBoxRemovalSelection(response, payload)) {
            return;
          }

          toastManager.add({
            title: response?.message || "Project updated successfully",
            type: "success",
          });

          router.push("/dashboard/track-trace/manage-project");
        },
        onError: (error: any) => {
          if (openBoxRemovalSelection(error?.response?.data || error, payload)) {
            return;
          }

          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update project";

          toastManager.add({
            title: errorMessage,
            type: "error",
          });
        },
      }
    );
  };

  const toggleRemoveBoxSelection = (
    boxId: number,
    canRemove: boolean
  ) => {
    if (!canRemove || isPending) {
      return;
    }

    setSelectedRemoveBoxIds((previous) => {
      if (previous.includes(boxId)) {
        return previous.filter((id) => id !== boxId);
      }

      if (previous.length >= boxRemovalRequiredCount) {
        toastManager.add({
          title: `You can select only ${boxRemovalRequiredCount} box${boxRemovalRequiredCount > 1 ? "es" : ""}`,
          type: "error",
        });

        return previous;
      }

      return [...previous, boxId];
    });
  };

  const handleConfirmBoxRemoval = () => {
    if (!pendingUpdatePayload) {
      return;
    }

    if (selectedRemoveBoxIds.length !== boxRemovalRequiredCount) {
      toastManager.add({
        title: `Please select ${boxRemovalRequiredCount} empty box${boxRemovalRequiredCount > 1 ? "es" : ""}`,
        type: "error",
      });

      return;
    }

    setBoxRemovalDialogOpen(false);

    submitProjectUpdate({
      ...pendingUpdatePayload,
      remove_box_ids: selectedRemoveBoxIds,
    });
  };

  const handleCancelBoxRemoval = () => {
    setBoxRemovalDialogOpen(false);
    setPendingUpdatePayload(null);
    setSelectedRemoveBoxIds([]);
    setBoxRemovalOptions([]);
    setBoxRemovalRequiredCount(0);
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!vendorId) {
      toastManager.add({
        title: "Vendor information not found",
        type: "error",
      });
      return;
    }

    if (!(await validateUploadedExcel(data.file || [], data.packing_type))) {
      return;
    }

    if (data.file?.[0]) {
      const previewMatchesFile = cutlistPreview?.fileName === data.file[0].name;
      if (!previewMatchesFile || cutlistPreviewHasErrors) {
        setCutlistPreviewOpen(true);
        toastManager.add({
          title: "Please fix the missing CutList data before uploading",
          type: "error",
        });
        return;
      }
    }

    const normalizedNoOfBoxes =
      data.packing_type === PackingType.CUSTOM_GROUP
        ? 0
        : Number(data.no_of_boxes || 0);
    const normalizedIsMultiLocation =
      data.packing_type === PackingType.DEFAULT ||
      (data.packing_type === PackingType.GROUPWISE &&
        normalizedNoOfBoxes > 0)
        ? false
        : data.is_multi_location;

    const payload = {
      vendorId,
      lead_id: isCrmEnabled && data.lead_id ? Number(data.lead_id) : null,
      projectName: data.projectName.trim(),

      order_no: data.order_no?.trim() || undefined,
      client_name: data.client_name?.trim() || undefined,
      client_address: data.client_address?.trim() || undefined,
      client_contact_no: data.client_contact_no?.trim() || undefined,
      packing_type: data.packing_type,
      is_multi_location: normalizedIsMultiLocation,
      no_of_boxes: normalizedNoOfBoxes,
      box_info_fields:
        data.box_info_fields
          ?.filter(
            (
              field
            ) =>
              field.field_label
                ?.trim()
          )
          .map(
            (
              field,
              index
            ) => ({
              id:
                field.id,

              field_label:
                field.field_label.trim(),

              field_type:
                field.field_type ||
                "TEXT",

              is_required:
                Boolean(
                  field.is_required
                ),

              sort_order:
                index + 1,

              active:
                true,
            })
          ) || [],

      file: data.file?.[0] || undefined,
    };

    if (mode === "edit") {
      if (!uniqueProjectId) {
        toastManager.add({
          title: "Project ID not found",
          type: "error",
        });
        return;
      }

      submitProjectUpdate(payload);

      return;
    }

    createProject(payload as any, {
      onSuccess: (response) => {
        toastManager.add({
          title: response.message || "Project created successfully",
          type: "success",
        });

        if (payload.is_multi_location && response.unique_project_id) {
          router.push(`/dashboard/track-trace/manage-project/${response.unique_project_id}/locations`);
        } else {
          router.push("/dashboard/track-trace/manage-project");
        }
      },

      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create project";

        toastManager.add({
          title: errorMessage,
          type: "error",
        });
      },
    });
  };

  const handleContinueWithUpload = async () => {
    if (
      cutlistPreviewHasErrors ||
      isPreviewingCutlist ||
      isPending ||
      !isFormComplete
    ) {
      return;
    }

    await form.handleSubmit(
      async (data) => {
        setCutlistPreviewOpen(false);
        await onSubmit(data);
      },
      (errors) => {
        setCutlistPreviewOpen(false);
        const firstErrorKey = Object.keys(errors)[0] as keyof typeof errors;
        const message =
          errors[firstErrorKey]?.message?.toString() ||
          "Please complete all required project fields before submitting.";
        toastManager.add({
          title: message,
          type: "error",
        });
      }
    )();
  };

  if (mode === "edit" && projectLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (mode === "edit" && projectError) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm font-semibold text-red-600">
          Failed to load project.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/track-trace/manage-project")}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Title Row ── */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {mode === "edit" ? "Edit Track & Trace Project" : "Create New Project"}
          </h1>
          {mode === "edit" && (
            <Badge
              variant="secondary"
              className="text-xs font-semibold bg-primary/10 text-primary border-primary/20"
            >
              Edit Mode
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {mode === "edit"
            ? "Update project details, packing rules, and excel data"
            : "Define a new Track & Trace project by selecting a lead or entering client details manually"}
        </p>
      </div>

      {/* ── Form Container ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Quick Setup Guide Card */}
          <div className="rounded-2xl border bg-muted/20 p-5">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-foreground">Quick Setup Guide</p>
                  <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground leading-relaxed">
                    {isCrmEnabled && (
                      <li>Select the lead/project this cutlist belongs to, if available.</li>
                    )}
                    <li>If lead is not available, enter order and client details manually.</li>
                    <li>Download and fill the Excel template.</li>
                    <li>Upload the completed file.</li>
                  </ol>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  disabled={isPending}
                  className="h-8 text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Excel Template
                </Button>
              </div>
            </div>
          </div>

          {/* Project & Client Details Card */}
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Project & Client Details</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Basic project identification, client contacts, and site location.
              </p>
            </div>

            <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Project Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Villa A Track & Trace Project"
                        {...field}
                        disabled={isPending}
                        className="h-10 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {configLoading ? (
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  Checking CRM configuration...
                </div>
              ) : isCrmEnabled ? (
                <FormField
                  control={form.control}
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Select Lead <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <LeadSearchBox
                          vendorId={vendorId}
                          value={field.value ?? undefined}
                          selectedLeadFromProject={selectedLeadFromProject}
                          disabled={isPending}
                          onClear={clearLeadSelection}
                          onChange={(leadId, lead) => {
                            field.onChange(leadId);
                            fillLeadDetails(leadId, lead);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  CRM is disabled for this vendor.
                </div>
              )}

              <FormField
                control={form.control}
                name="order_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Order Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter order number"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 text-sm disabled:bg-muted/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Client Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter client name"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 text-sm disabled:bg-muted/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_contact_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Client Contact No <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter contact number"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 text-sm disabled:bg-muted/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Client Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter client address"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 text-sm disabled:bg-muted/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Packing & Box Rules Card */}
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Packing & Box Configuration</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define box limits, packing rules, and custom mobile app box attributes.
              </p>
            </div>

            <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                control={form.control}
                name="packing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Packing Type <span className="text-destructive">*</span>
                    </FormLabel>

                    <FormControl>
                      <Select
                        key={field.value}
                        value={field.value}
                        onValueChange={(val) => {
                          if (!val) return;

                          const packingType = normalizePackingType(val);

                          field.onChange(packingType);
                          void validateUploadedExcel(
                            form.getValues("file") || [],
                            packingType
                          );
                        }}
                        disabled={isPending || mode === "edit"}
                      >
                        <SelectTrigger className="h-10 text-sm w-full">
                          <SelectValue placeholder="Select packing type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PackingType.DEFAULT}>Default</SelectItem>
                          <SelectItem value={PackingType.GROUPWISE}>Groupwise</SelectItem>
                          <SelectItem value={PackingType.CUSTOM_GROUP}>
                            Custom Packing Group
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {mode === "create"
                          ? "Choose carefully. Packing Type cannot be changed after the project is created."
                          : "Packing Type is locked and cannot be changed after project creation."}
                      </span>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showNoOfBoxes && (
                <FormField
                  control={form.control}
                  name="no_of_boxes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        No of Boxes <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="e.g., 10"
                          value={String(field.value ?? 0)}
                          disabled={isPending}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value === "" ? 0 : Number(value));
                          }}
                          className="h-10 text-sm w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showMultiLocation && (
                <FormField
                  control={form.control}
                  name="is_multi_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Multi Location{" "}
                        {!isDefaultPacking && (
                          <span className="text-xs font-normal text-muted-foreground">
                            (optional)
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Select
                          key={field.value ? "multi-location-yes" : "multi-location-no"}
                          value={field.value ? "YES" : "NO"}
                          onValueChange={(value) => field.onChange(value === "YES")}
                          disabled={isPending || isDefaultPacking}
                        >
                          <SelectTrigger className="h-10 w-full text-sm">
                            <SelectValue placeholder="Select an option..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NO">No</SelectItem>
                            <SelectItem value="YES">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {isDefaultPacking
                          ? "Default packing uses a single location."
                          : "Use locations to organize the project's packing groups."}
                      </p>
                      {mode === "edit" && isMultiLocation && isMultiLocationSaved && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending || isDownloadingMultiLocationTemplate}
                            onClick={handleDownloadMultiLocationTemplate}
                          >
                            {isDownloadingMultiLocationTemplate ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 size-4" />
                            )}
                            Download Location
                          </Button>
                          <Button
                            type="button"
                            className="w-full"
                            disabled={isPending || !uniqueProjectId}
                            onClick={() =>
                              router.push(
                                `/dashboard/track-trace/manage-project/${uniqueProjectId}/locations`
                              )
                            }
                          >
                            <Upload className="mr-2 size-4" />
                            Upload Locations
                          </Button>
                        </div>
                      )}
                      {mode === "edit" && isMultiLocation && !isMultiLocationSaved && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Save the project before downloading the Location Excel.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Dynamic Box Information Fields Sub-Section */}
            <div className="space-y-4 pt-1" style={{ display: "none" }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Custom Box Information Fields
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Extra mobile app box fields (e.g. Floor Name, Room Name, Zone, Area, Tower).
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    appendBoxInfoField({
                      field_label: "",
                      field_type: "TEXT",
                      is_required: false,
                      active: true,
                      sort_order: boxInfoFields.length + 1,
                    })
                  }
                  className="h-8 text-xs gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Box Field
                </Button>
              </div>

              {boxInfoFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-8 px-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    No custom box information fields configured
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                    Click "Add Box Field" above to collect extra custom attributes when scanning or managing boxes in the mobile app.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {boxInfoFields.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-xl border bg-muted/20 p-3.5 md:grid-cols-[1fr_160px_120px_40px] items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`box_info_fields.${index}.field_label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                              Field Label
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Floor Name"
                                disabled={isPending}
                                {...field}
                                className="h-9 text-sm bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`box_info_fields.${index}.field_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                              Data Type
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value || "TEXT"}
                                onValueChange={(val) => field.onChange(val)}
                                disabled={isPending}
                              >
                                <SelectTrigger className="h-9 text-xs w-full bg-background">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TEXT">Text</SelectItem>
                                  <SelectItem value="NUMBER">Number</SelectItem>
                                  <SelectItem value="DATE">Date</SelectItem>
                                  <SelectItem value="TEXTAREA">Textarea</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`box_info_fields.${index}.is_required`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                              Requirement
                            </FormLabel>
                            <FormControl>
                              <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-xs cursor-pointer hover:bg-accent/50">
                                <input
                                  type="checkbox"
                                  checked={Boolean(field.value)}
                                  disabled={isPending}
                                  onChange={(event) =>
                                    field.onChange(event.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded border-input"
                                />
                                <span className="font-medium">Required</span>
                              </label>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => removeBoxInfoField(index)}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Excel File Import Card */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Excel Data Import</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload the completed project cutlist Excel spreadsheet (`.xlsx`, `.xls`).
              </p>
            </div>

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploadField
                      value={field.value || []}
                      onChange={(files) => {
                        field.onChange(files);
                        void previewCutlistFile(files);
                        void validateUploadedExcel(
                          files,
                          form.getValues("packing_type")
                        );
                      }}
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      multiple={false}
                      disabled={isPending || isValidatingExcel || isPreviewingCutlist}
                      maxFiles={1}
                      invalid={Boolean(form.formState.errors.file)}
                    />
                  </FormControl>
                  {field.value && field.value.length > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void previewCutlistFile(field.value || [])}
                        disabled={isPreviewingCutlist || isValidatingExcel}
                        className="h-8 text-xs gap-1.5"
                      >
                        {isPreviewingCutlist ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="size-3.5" />
                        )}
                        Review Cutlist Excel Preview
                      </Button>
                    </div>
                  )}
                  {selectedPackingType === PackingType.CUSTOM_GROUP && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        <strong>Custom Packing Group is mandatory.</strong> The
                        Excel file must contain a Custom Packing Group column with
                        a value in every item row.
                      </span>
                    </p>
                  )}
                  {isValidatingExcel && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Validating Custom Packing Group data...
                    </p>
                  )}
                  {mode === "edit" && (
                    <p className="text-xs text-muted-foreground">
                      Leave empty if you do not want to replace the current Excel file.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => router.push("/dashboard/track-trace/manage-project")}
              className="h-10 min-w-[100px]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isPending || isValidatingExcel}
              className="h-10 min-w-[150px]"
            >
              {isPending || isValidatingExcel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isValidatingExcel
                    ? "Validating Excel..."
                    : mode === "edit"
                      ? "Updating..."
                      : "Creating..."}
                </>
              ) : (
                <>
                  {mode === "edit" ? "Update Project" : "Create Project"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={cutlistPreviewOpen} onOpenChange={setCutlistPreviewOpen}>
        <DialogContent className="h-[min(880px,calc(100vh-2rem))] w-[98vw] max-w-[1800px] gap-0 overflow-hidden p-0 sm:max-w-[1800px]">
          <DialogHeader className="shrink-0 border-b bg-gradient-to-b from-muted/40 to-background px-6 py-5 pr-12 text-left">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border bg-background p-2.5 text-primary shadow-sm">
                <FileSpreadsheet className="size-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg">Review CutList Excel</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  Check your Excel rows and required fields before uploading the project.
                </DialogDescription>
                {cutlistPreview?.fileName && <p className="mt-2 max-w-[70vw] truncate font-mono text-[11px] text-muted-foreground">{cutlistPreview.fileName}</p>}
              </div>
            </div>
          </DialogHeader>

          {cutlistPreview && (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div className="grid gap-2 sm:grid-cols-5">
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">File</p>
                  <p className="mt-0.5 truncate text-xs font-medium">{cutlistPreview.fileName}</p>
                </div>
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Data rows</p>
                  <p className="mt-0.5 text-xs font-medium">{cutlistPreview.rowCount}</p>
                </div>
                <div className={cn("rounded-md border px-3 py-2", cutlistPreviewHasErrors ? "border-destructive/40 bg-destructive/5" : "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20")}>
                  <p className="text-xs text-muted-foreground">Overall status</p>
                  <p className={cn("mt-0.5 text-xs font-semibold", cutlistPreviewHasErrors ? "text-destructive" : "text-emerald-700 dark:text-emerald-400")}>
                    {cutlistPreviewHasErrors ? "Needs correction" : "Ready to upload"}
                  </p>
                </div>
                <div className="rounded-md border bg-emerald-50/60 px-3 py-2 dark:bg-emerald-950/20">
                  <p className="text-xs text-muted-foreground">Passed rows</p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{previewPassedRows}</p>
                </div>
                <div className={cn("rounded-md border px-3 py-2", previewInvalidRows.length ? "border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20" : "bg-muted/20")}>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                  <p className={cn("mt-0.5 text-xs font-semibold", previewInvalidRows.length ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{previewInvalidRows.length}</p>
                </div>
              </div>

              {cutlistPreview.parseError ? (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {cutlistPreview.parseError}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-t-md border border-b-0 bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Rows preview</span>
                      <span>{previewRows.length} item{previewRows.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" />Missing</span>
                      <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" />Duplicate</span>
                      <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" />Passed</span>
                    </div>
                  </div>
                  <div className="max-h-[430px] overflow-auto rounded-b-md border bg-background shadow-sm">
                    <table className="w-full min-w-max text-[11px]">
                      <thead className="sticky top-0 z-10 bg-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <tr>
                          <th className="w-16 whitespace-nowrap border-r px-2 py-2">Row</th>
                          <th className="w-28 whitespace-nowrap border-r px-2.5 py-2">Status</th>
                          {cutlistPreview.fields.map((field) => (
                            <th key={field.key} className="min-w-[110px] whitespace-nowrap border-r px-2.5 py-2">{field.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cutlistPreview.rows.map((row) => {
                          const rowHasError = row.missing.length > 0 || row.duplicates.length > 0;
                          return (
                            <tr key={row.row} className={rowHasError ? "bg-destructive/5" : "bg-background"}>
                              <td className="border-r px-2 py-2 font-mono font-semibold text-muted-foreground">{row.row}</td>
                              <td className={cn("whitespace-nowrap border-r px-2.5 py-2 font-semibold", rowHasError ? "text-destructive" : "text-emerald-700 dark:text-emerald-400")}>
                                {rowHasError ? "Needs correction" : "Passed"}
                              </td>
                              {cutlistPreview.fields.map((field) => {
                                const isQty = field.key === "qty";
                                const isZeroQty = isQty && Boolean(row.values[field.key]) && (Number(row.values[field.key]) <= 0 || isNaN(Number(row.values[field.key])));
                                const missing = isQty
                                  ? row.missing.includes(field.label) || row.missing.includes("Quantity cannot be 0")
                                  : row.missing.includes(field.label);
                                const duplicate = row.duplicates.includes(field.label);
                                return (
                                  <td
                                    key={field.key}
                                    className={cn(
                                      "max-w-[220px] truncate border-r px-2.5 py-2",
                                      missing && "bg-destructive/10 font-semibold text-destructive",
                                      duplicate && "bg-amber-100 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                    )}
                                    title={
                                      isZeroQty
                                        ? "Quantity can never be 0"
                                        : missing
                                          ? `${field.label} is missing`
                                          : duplicate
                                            ? "Duplicate Unique Code"
                                            : row.values[field.key]
                                    }
                                  >
                                    {isZeroQty
                                      ? `${row.values[field.key]} (cannot be 0)`
                                      : missing
                                        ? "Missing"
                                        : row.values[field.key] || ""}
                                    {duplicate && <span className="ml-1">(duplicate)</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className={cn("rounded-md border px-3 py-2 text-xs", cutlistPreview.uniqueCodeMode === "mixed" ? "border-destructive/30 bg-destructive/5 text-destructive" : "bg-muted/30")}>
                    <span className="font-semibold">Unique Code: </span>
                    {cutlistPreview.uniqueCodeMode === "all-filled" && "Provided for every row; Excel and database duplicate rules will apply."}
                    {cutlistPreview.uniqueCodeMode === "all-blank" && "Blank for every row; the system will generate CutList IDs automatically."}
                    {cutlistPreview.uniqueCodeMode === "mixed" && "Some rows have a code and some rows are blank. Fill every row or clear every row."}
                  </div>

                  {cutlistPreview.rowErrors.length > 0 && (
                    <div className="max-h-36 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <p className="mb-1 text-xs font-semibold text-destructive">Validation details by row</p>
                      <div className="space-y-0.5 text-[11px] text-destructive">
                        {cutlistPreview.rowErrors.slice(0, 20).map((error) => (
                          <p key={error.row}>
                            Row {error.row}: {[...error.missing, ...error.duplicates.map((field) => `${field} duplicate`)].join(", ")}
                          </p>
                        ))}
                        {cutlistPreview.rowErrors.length > 20 && <p>And {cutlistPreview.rowErrors.length - 20} more row(s).</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            {!isFormComplete ? (
              <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <Info className="size-3.5 shrink-0" />
                <span>
                  Please fill{" "}
                  <strong className="font-semibold">
                    {missingProjectDetails.join(", ")}
                  </strong>{" "}
                  to enable upload.
                </span>
              </p>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCutlistPreviewOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  cutlistPreviewHasErrors ||
                  isPreviewingCutlist ||
                  isPending ||
                  !isFormComplete
                }
                onClick={() => void handleContinueWithUpload()}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Continue with upload
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {boxRemovalDialogOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
            <div className="border-b p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Select Empty Boxes to Remove
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    You reduced No of Boxes. Select exactly{" "}
                    <span className="font-semibold text-foreground">
                      {boxRemovalRequiredCount}
                    </span>{" "}
                    empty box{boxRemovalRequiredCount > 1 ? "es" : ""} to
                    remove. Boxes with items cannot be removed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelBoxRemoval}
                  disabled={isPending}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              <div className="mb-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                Selected{" "}
                <span className="font-semibold">
                  {selectedRemoveBoxIds.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {boxRemovalRequiredCount}
                </span>
              </div>

              <div className="space-y-2">
                {boxRemovalOptions.map((box) => {
                  const selected = selectedRemoveBoxIds.includes(box.id);
                  const disabled = !box.can_remove || isPending;

                  return (
                    <button
                      key={box.id}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        toggleRemoveBoxSelection(box.id, box.can_remove)
                      }
                      className={cn(
                        "flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                          : "bg-background hover:bg-muted/60",
                        disabled && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          readOnly
                          className="h-4 w-4"
                        />

                        <div className="min-w-0">
                          <p className="font-semibold">
                            Box {box.box_name || box.sequence_no}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Status: {box.box_status || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            box.item_count > 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          )}
                        >
                          {box.item_count} item{box.item_count === 1 ? "" : "s"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {box.can_remove ? "Can remove" : "Cannot remove"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelBoxRemoval}
                disabled={isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmBoxRemoval}
                disabled={
                  isPending ||
                  selectedRemoveBoxIds.length !== boxRemovalRequiredCount
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Selected Boxes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
