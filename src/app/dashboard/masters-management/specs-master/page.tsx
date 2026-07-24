"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Upload,
  Download,
  Layers,
  Package,
  Palette,
  CopyX,
  FileWarning,
} from "lucide-react";
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { FileUploadField } from "@/components/custom/file-upload";
import BaseModal from "@/components/utils/baseModal";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
import {
  useCarcassTypes,
  useCarcasMaterials,
  useAllCarcassMaterialFinishes,
  useCreateCarcassType,
  useCreateCarcasMaterial,
  useCreateCarcassMaterialFinish,
  useUploadCarcassMaterialFinishes,
  useShutterTypes,
  useShutterMaterials,
  useAllShutterMaterialFinishes,
  useCreateShutterType,
  useCreateShutterMaterial,
  useCreateShutterMaterialFinish,
  useUploadShutterMaterialFinishes,
  useCarcassLegs,
  useAllSkirtingCarcassLegs,
  useAllSkirtingCarcassLegsColors,
  useCreateCarcassLegs,
  useCreateSkirtingCarcassLegs,
  useCreateSkirtingCarcassLegsColor,
  useUploadSkirtingCarcassLegsColors,
  useLightCarcasTypes,
  useAllLightCarcasUnits,
  useCreateLightCarcasType,
  useCreateLightCarcasUnit,
  useUploadLightCarcasUnits,
  useOtherAppliances,
  useCreateOtherAppliances,
  useUploadOtherAppliances,
  useDownloadOtherAppliancesReport,
} from "@/hooks/useTypesMaster";

type MasterRow = {
  srNo: number;
  id: number;
  name: string;
  parent?: string | null;
  status: string;
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

type MasterUploadPreview = {
  totalDataRows: number;
  typesToAdd: number;
  materialsToAdd: number;
  finishesToAdd: number;
  skippedMissing: number;
  skippedDuplicate: number;
  skippedRows: Array<{
    row: number;
    reason: string;
    type: "duplicate" | "missing";
  }>;
  headerError?: string;
};

async function parseUploadFile(
  file: File,
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

  const headers: string[] = [];
  const rows: Record<string, string>[] = [];

  if (isCsv) {
    const text = await file.text();
    parseCsvText(text).forEach((cells, idx) => {
      if (idx === 0) {
        cells.forEach((c) => headers.push(c.trim().toLowerCase()));
      } else {
        const rowData: Record<string, string> = {};
        cells.forEach((c, colIdx) => {
          const headerName = headers[colIdx];
          if (headerName) rowData[headerName] = c.trim();
        });
        rows.push(rowData);
      }
    });
  } else {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (worksheet) {
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            headers.push(
              String(cell.value ?? "")
                .trim()
                .toLowerCase(),
            );
          });
        } else {
          const rowData: Record<string, string> = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const headerName = headers[colNumber - 1];
            if (headerName) {
              rowData[headerName] = String(cell.value ?? "").trim();
            }
          });
          rows.push(rowData);
        }
      });
    }
  }

  return { headers, rows };
}

async function computeMasterUploadPreview(
  file: File,
  existing: {
    types: Array<{ id: number; name: string }>;
    materials: Array<{ id: number; name: string }>;
    finishes: Array<{ id: number; name: string; materialId: number }>;
  },
): Promise<MasterUploadPreview> {
  const { headers, rows } = await parseUploadFile(file);

  const typeKey = headers.find((h) => h.includes("type"));
  const materialKey = headers.find(
    (h) => h.includes("material") && !h.includes("finish"),
  );
  const finishKey = headers.find((h) => h.includes("finish"));

  if (!typeKey || !materialKey || !finishKey) {
    return {
      totalDataRows: rows.length,
      typesToAdd: 0,
      materialsToAdd: 0,
      finishesToAdd: 0,
      skippedMissing: 0,
      skippedDuplicate: 0,
      skippedRows: [],
      headerError:
        "Required columns missing. The sheet must have Carcass Type, Carcass Material, and Carcass Material Finish columns.",
    };
  }

  const typeMap = new Map<string, number>(
    existing.types.map((t) => [t.name.trim().toLowerCase(), t.id]),
  );
  const materialMap = new Map<string, number>(
    existing.materials.map((m) => [m.name.trim().toLowerCase(), m.id]),
  );
  const finishKeySet = new Set<string>(
    existing.finishes.map(
      (f) => `${f.materialId}::${f.name.trim().toLowerCase()}`,
    ),
  );
  const newTypeNames = new Set<string>();
  const newMaterialNames = new Set<string>();

  let skippedMissing = 0;
  let skippedDuplicate = 0;
  let finishesToAdd = 0;
  const skippedRows: Array<{
    row: number;
    reason: string;
    type: "duplicate" | "missing";
  }> = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const typeName = (row[typeKey] || "").trim();
    const materialName = (row[materialKey] || "").trim();
    const finishName = (row[finishKey] || "").trim();

    if (!typeName || !materialName || !finishName) {
      skippedMissing++;
      skippedRows.push({
        row: rowNumber,
        reason: "Missing required value(s)",
        type: "missing",
      });
      return;
    }

    const typeLower = typeName.toLowerCase();
    const materialLower = materialName.toLowerCase();
    const finishLower = finishName.toLowerCase();

    if (!typeMap.has(typeLower)) {
      newTypeNames.add(typeLower);
    }

    const existingMaterialId = materialMap.get(materialLower);
    if (!existingMaterialId) {
      newMaterialNames.add(materialLower);
    }

    const materialDedupeId = existingMaterialId ?? `new:${materialLower}`;
    const finishDedupeKey = `${materialDedupeId}::${finishLower}`;

    if (finishKeySet.has(finishDedupeKey)) {
      skippedDuplicate++;
      skippedRows.push({
        row: rowNumber,
        reason: `Duplicate finish "${finishName}" for material "${materialName}"`,
        type: "duplicate",
      });
      return;
    }

    finishKeySet.add(finishDedupeKey);
    finishesToAdd++;
  });

  return {
    totalDataRows: rows.length,
    typesToAdd: newTypeNames.size,
    materialsToAdd: newMaterialNames.size,
    finishesToAdd,
    skippedMissing,
    skippedDuplicate,
    skippedRows,
  };
}

async function computeHardwareUploadPreview(
  file: File,
  existing: {
    legs: Array<{ id: number; name: string }>;
    skirtings: Array<{ id: number; name: string; legsId: number }>;
    colors: Array<{ id: number; color: string; skirtingId: number }>;
  },
): Promise<MasterUploadPreview> {
  const { headers, rows } = await parseUploadFile(file);

  const legsKey = headers.find((h) => h.includes("legs"));
  const skirtingKey = headers.find(
    (h) => h.includes("skirting") && !h.includes("color"),
  );
  const colorKey = headers.find((h) => h.includes("color"));

  if (!legsKey || !skirtingKey || !colorKey) {
    return {
      totalDataRows: rows.length,
      typesToAdd: 0,
      materialsToAdd: 0,
      finishesToAdd: 0,
      skippedMissing: 0,
      skippedDuplicate: 0,
      skippedRows: [],
      headerError:
        "Required columns missing. The sheet must have Carcass Legs, Skirting, and Skirting Color columns.",
    };
  }

  const legsMap = new Map<string, number>(
    existing.legs.map((l) => [l.name.trim().toLowerCase(), l.id]),
  );
  const skirtingMap = new Map<string, number>(
    existing.skirtings.map((s) => [
      `${s.legsId}::${s.name.trim().toLowerCase()}`,
      s.id,
    ]),
  );
  const colorKeySet = new Set<string>(
    existing.colors.map(
      (c) => `${c.skirtingId}::${c.color.trim().toLowerCase()}`,
    ),
  );
  const newLegsNames = new Set<string>();
  const newSkirtingKeys = new Set<string>();

  let skippedMissing = 0;
  let skippedDuplicate = 0;
  let colorsToAdd = 0;
  const skippedRows: Array<{
    row: number;
    reason: string;
    type: "duplicate" | "missing";
  }> = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const legsName = (row[legsKey] || "").trim();
    const skirtingName = (row[skirtingKey] || "").trim();
    const colorValue = (row[colorKey] || "").trim();

    if (!legsName || !skirtingName) {
      skippedMissing++;
      skippedRows.push({
        row: rowNumber,
        reason: "Missing required value(s)",
        type: "missing",
      });
      return;
    }

    const legsLower = legsName.toLowerCase();
    const existingLegsId = legsMap.get(legsLower);
    if (!existingLegsId) {
      newLegsNames.add(legsLower);
    }
    const legsDedupeId = existingLegsId ?? `new:${legsLower}`;

    const skirtingLower = skirtingName.toLowerCase();
    const skirtingLookupKey = `${legsDedupeId}::${skirtingLower}`;
    const existingSkirtingId = skirtingMap.get(skirtingLookupKey);
    if (!existingSkirtingId) {
      newSkirtingKeys.add(skirtingLookupKey);
    }
    const skirtingDedupeId = existingSkirtingId ?? `new:${skirtingLookupKey}`;

    if (!colorValue) {
      return;
    }

    const colorLower = colorValue.toLowerCase();
    const colorDedupeKey = `${skirtingDedupeId}::${colorLower}`;

    if (colorKeySet.has(colorDedupeKey)) {
      skippedDuplicate++;
      skippedRows.push({
        row: rowNumber,
        reason: `Duplicate skirting color "${colorValue}" for skirting "${skirtingName}"`,
        type: "duplicate",
      });
      return;
    }

    colorKeySet.add(colorDedupeKey);
    colorsToAdd++;
  });

  return {
    totalDataRows: rows.length,
    typesToAdd: newLegsNames.size,
    materialsToAdd: newSkirtingKeys.size,
    finishesToAdd: colorsToAdd,
    skippedMissing,
    skippedDuplicate,
    skippedRows,
  };
}

async function computeLightUploadPreview(
  file: File,
  existing: {
    types: Array<{ id: number; type: string }>;
    units: Array<{ id: number; type: string; typeId: number }>;
  },
): Promise<MasterUploadPreview> {
  const { headers, rows } = await parseUploadFile(file);

  const typeKey = headers.find((h) => h.includes("type"));
  const unitKey = headers.find((h) => h.includes("unit"));

  if (!typeKey || !unitKey) {
    return {
      totalDataRows: rows.length,
      typesToAdd: 0,
      materialsToAdd: 0,
      finishesToAdd: 0,
      skippedMissing: 0,
      skippedDuplicate: 0,
      skippedRows: [],
      headerError:
        "Required columns missing. The sheet must have Light Carcas Type and Light Unit columns.",
    };
  }

  const typeMap = new Map<string, number>(
    existing.types.map((t) => [t.type.trim().toLowerCase(), t.id]),
  );
  const unitKeySet = new Set<string>(
    existing.units.map((u) => `${u.typeId}::${u.type.trim().toLowerCase()}`),
  );
  const newTypeNames = new Set<string>();

  let skippedMissing = 0;
  let skippedDuplicate = 0;
  let unitsToAdd = 0;
  const skippedRows: Array<{
    row: number;
    reason: string;
    type: "duplicate" | "missing";
  }> = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const typeName = (row[typeKey] || "").trim();
    const unitName = (row[unitKey] || "").trim();

    if (!typeName || !unitName) {
      skippedMissing++;
      skippedRows.push({
        row: rowNumber,
        reason: "Missing required value(s)",
        type: "missing",
      });
      return;
    }

    const typeLower = typeName.toLowerCase();
    const existingTypeId = typeMap.get(typeLower);
    if (!existingTypeId) {
      newTypeNames.add(typeLower);
    }
    const typeDedupeId = existingTypeId ?? `new:${typeLower}`;

    const unitLower = unitName.toLowerCase();
    const unitDedupeKey = `${typeDedupeId}::${unitLower}`;

    if (unitKeySet.has(unitDedupeKey)) {
      skippedDuplicate++;
      skippedRows.push({
        row: rowNumber,
        reason: `Duplicate light unit "${unitName}" for light carcas type "${typeName}"`,
        type: "duplicate",
      });
      return;
    }

    unitKeySet.add(unitDedupeKey);
    unitsToAdd++;
  });

  return {
    totalDataRows: rows.length,
    typesToAdd: newTypeNames.size,
    materialsToAdd: 0,
    finishesToAdd: unitsToAdd,
    skippedMissing,
    skippedDuplicate,
    skippedRows,
  };
}

async function parseOtherAppliancesFile(
  file: File,
): Promise<{ headers: string[]; rows: Record<string, string>[]; error?: string }> {
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";

  const headers: string[] = [];
  const rows: Record<string, string>[] = [];

  if (isCsv) {
    const text = await file.text();
    parseCsvText(text).forEach((cells, idx) => {
      if (idx === 0) {
        cells.forEach((c) => headers.push(c.trim().toLowerCase()));
      } else {
        const rowData: Record<string, string> = {};
        cells.forEach((c, colIdx) => {
          const headerName = headers[colIdx];
          if (headerName) rowData[headerName] = c.trim();
        });
        rows.push(rowData);
      }
    });
  } else {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return {
        headers: [],
        rows: [],
        error: "No worksheet found in the workbook.",
      };
    }
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          headers.push(
            String(cell.value ?? "")
              .trim()
              .toLowerCase(),
          );
        });
      } else {
        const rowData: Record<string, string> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const headerName = headers[colNumber - 1];
          if (headerName) {
            rowData[headerName] = String(cell.value ?? "").trim();
          }
        });
        rows.push(rowData);
      }
    });
  }

  return { headers, rows };
}

async function computeOtherAppliancesUploadPreview(
  file: File,
  existing: {
    appliances: Array<{ id: number; article_number: string; type: string }>;
  },
  type: string,
): Promise<MasterUploadPreview> {
  const { headers, rows, error } = await parseOtherAppliancesFile(file);

  if (error) {
    return {
      totalDataRows: 0,
      typesToAdd: 0,
      materialsToAdd: 0,
      finishesToAdd: 0,
      skippedMissing: 0,
      skippedDuplicate: 0,
      skippedRows: [],
      headerError: error,
    };
  }

  const articleKey = headers.find((h) => h.includes("article"));
  const descKey = headers.find((h) => h.includes("desc"));

  if (!articleKey || !descKey) {
    return {
      totalDataRows: rows.length,
      typesToAdd: 0,
      materialsToAdd: 0,
      finishesToAdd: 0,
      skippedMissing: 0,
      skippedDuplicate: 0,
      skippedRows: [],
      headerError:
        "Required columns missing. The sheet must have Article Number and Description columns.",
    };
  }

  const existingArticles = new Set<string>(
    existing.appliances
      .filter((a) => a.type.toLowerCase() === type.toLowerCase())
      .map((a) => a.article_number.trim().toLowerCase()),
  );

  const newArticlesInSheet = new Set<string>();

  let skippedMissing = 0;
  let skippedDuplicate = 0;
  let entriesToAdd = 0;
  const skippedRows: Array<{
    row: number;
    reason: string;
    type: "duplicate" | "missing";
  }> = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    const articleVal = (row[articleKey] || "").trim();
    const descVal = (row[descKey] || "").trim();

    if (!articleVal || !descVal) {
      skippedMissing++;
      skippedRows.push({
        row: rowNumber,
        reason: "Missing required value(s)",
        type: "missing",
      });
      return;
    }

    const articleLower = articleVal.toLowerCase();

    if (existingArticles.has(articleLower) || newArticlesInSheet.has(articleLower)) {
      skippedDuplicate++;
      skippedRows.push({
        row: rowNumber,
        reason: `Duplicate article number "${articleVal}"`,
        type: "duplicate",
      });
      return;
    }

    newArticlesInSheet.add(articleLower);
    entriesToAdd++;
  });

  return {
    totalDataRows: rows.length,
    typesToAdd: 0,
    materialsToAdd: 0,
    finishesToAdd: entriesToAdd,
    skippedMissing,
    skippedDuplicate,
    skippedRows,
  };
}

const previewTileTones = {
  indigo:
    "border-indigo-200 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300",
  violet:
    "border-violet-200 bg-violet-500/10 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  emerald:
    "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber:
    "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  red: "border-red-200 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
} as const;

function PreviewStatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: keyof typeof previewTileTones;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2",
        previewTileTones[tone],
      )}
    >
      <div className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      <div className="min-w-0 leading-tight">
        <p className="text-base font-semibold tabular-nums">{value}</p>
        <p className="truncate text-[11px] font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

function MasterListingTable({
  title,
  description,
  searchPlaceholder,
  actionLabel,
  rows,
  showParent = false,
  isLoading,
  isError,
  errorMessage,
  onAction,
  extraActions,
}: {
  title: string;
  description: string;
  searchPlaceholder: string;
  actionLabel: string;
  rows: MasterRow[];
  showParent?: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onAction?: () => void;
  extraActions?: React.ReactNode;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = React.useMemo<ColumnDef<MasterRow>[]>(
    () => [
      {
        accessorKey: "srNo",
        header: "Sr. No.",
        cell: ({ row }) => row.original.srNo,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
      ...(showParent
        ? [
            {
              accessorKey: "parent",
              header: "Parent",
              cell: ({ row }: { row: { original: MasterRow } }) =>
                row.original.parent || "—",
            } satisfies ColumnDef<MasterRow>,
          ]
        : []),
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "—";
          return (
            <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
              {status}
            </span>
          );
        },
      },
    ],
    [showParent],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "")
        .trim()
        .toLowerCase();
      if (!search) return true;
      return String(row.getValue(columnId) ?? "")
        .toLowerCase()
        .includes(search);
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-start">
          {extraActions}
          <Button type="button" className="gap-2" onClick={onAction}>
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading {title.toLowerCase()}...
          </div>
        ) : isError ? (
          <div className="py-10 text-sm text-red-500">
            {errorMessage || `Failed to load ${title.toLowerCase()}.`}
          </div>
        ) : (
          <DataTable table={table} className="px-0 pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ClearInput
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full md:w-72"
              />
            </div>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}

function CarcassMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: carcassTypes,
    isLoading: isCarcassTypesLoading,
    isError: isCarcassTypesError,
    error: carcassTypesError,
  } = useCarcassTypes();
  const {
    data: carcasMaterials,
    isLoading: isCarcasMaterialsLoading,
    isError: isCarcasMaterialsError,
    error: carcasMaterialsError,
  } = useCarcasMaterials();
  const {
    data: carcassMaterialFinishes,
    isLoading: isCarcassMaterialFinishesLoading,
    isError: isCarcassMaterialFinishesError,
    error: carcassMaterialFinishesError,
  } = useAllCarcassMaterialFinishes();

  const createCarcassType = useCreateCarcassType();
  const createCarcasMaterial = useCreateCarcasMaterial();
  const uploadCarcassMaterialFinishes = useUploadCarcassMaterialFinishes();
  const createCarcassMaterialFinish = useCreateCarcassMaterialFinish();

  const carcassTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (carcassTypes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [carcassTypes?.data],
  );

  const carcasMaterialRows = React.useMemo<MasterRow[]>(
    () =>
      (carcasMaterials?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [carcasMaterials?.data],
  );

  const carcassMaterialFinishRows = React.useMemo<MasterRow[]>(
    () =>
      (carcassMaterialFinishes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        parent: item.material?.name ?? null,
        status: "active",
      })),
    [carcassMaterialFinishes?.data],
  );

  const [openTypeModal, setOpenTypeModal] = React.useState(false);
  const [typeName, setTypeName] = React.useState("");
  const [openMaterialModal, setOpenMaterialModal] = React.useState(false);
  const [materialName, setMaterialName] = React.useState("");
  const [openFinishModal, setOpenFinishModal] = React.useState(false);
  const [finishName, setFinishName] = React.useState("");
  const [finishMaterialId, setFinishMaterialId] = React.useState("");
  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadPreview, setUploadPreview] =
    React.useState<MasterUploadPreview | null>(null);
  const [isParsingPreview, setIsParsingPreview] = React.useState(false);

  React.useEffect(() => {
    const file = selectedFiles[0];
    if (!file) {
      setUploadPreview(null);
      return;
    }

    let cancelled = false;
    setIsParsingPreview(true);
    computeMasterUploadPreview(file, {
      types: carcassTypes?.data ?? [],
      materials: carcasMaterials?.data ?? [],
      finishes: (carcassMaterialFinishes?.data ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        materialId: f.carcas_material_id,
      })),
    })
      .then((preview) => {
        if (!cancelled) setUploadPreview(preview);
      })
      .catch(() => {
        if (!cancelled) {
          setUploadPreview({
            totalDataRows: 0,
            typesToAdd: 0,
            materialsToAdd: 0,
            finishesToAdd: 0,
            skippedMissing: 0,
            skippedDuplicate: 0,
            skippedRows: [],
            headerError:
              "Could not read this file. Please check the format and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsParsingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedFiles,
    carcassTypes?.data,
    carcasMaterials?.data,
    carcassMaterialFinishes?.data,
  ]);

  const handleCreateType = () => {
    const name = typeName.trim();
    if (!name || !vendorId) return;

    createCarcassType.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenTypeModal(false);
          setTypeName("");
        },
      },
    );
  };

  const handleCreateMaterial = () => {
    const name = materialName.trim();
    if (!name || !vendorId) return;

    createCarcasMaterial.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenMaterialModal(false);
          setMaterialName("");
        },
      },
    );
  };

  const handleCreateFinish = () => {
    const name = finishName.trim();
    const carcasMaterialId = Number(finishMaterialId);
    if (!name || !carcasMaterialId) return;

    createCarcassMaterialFinish.mutate(
      { carcas_material_id: carcasMaterialId, name },
      {
        onSuccess: () => {
          setOpenFinishModal(false);
          setFinishName("");
          setFinishMaterialId("");
        },
      },
    );
  };

  const handleUploadSubmit = () => {
    const file = selectedFiles[0];
    if (!file || !vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", String(vendorId));

    uploadCarcassMaterialFinishes.mutate(formData, {
      onSuccess: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
      onError: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
    });
  };

  const downloadCarcassTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Carcass Masters Template");

    worksheet.columns = [
      { header: "Carcass Type", key: "type", width: 30 },
      { header: "Carcass Material", key: "material", width: 30 },
      { header: "Carcass Material Finish", key: "finish", width: 30 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "carcass_masters_template.xlsx");
  };

  return (
    <>
      <Tabs defaultValue="finish" className="w-full">
        <TabsList>
          <TabsTrigger value="finish">Carcass Material Finish</TabsTrigger>
          <TabsTrigger value="material">Carcass Material</TabsTrigger>
          <TabsTrigger value="type">Carcass Type</TabsTrigger>
        </TabsList>

        <TabsContent value="finish" className="mt-4">
          <MasterListingTable
            title="Carcass Material Finish"
            description="Carcass material finish master entries for the current vendor."
            searchPlaceholder="Search carcass material finish..."
            actionLabel="Add Carcass Material Finish"
            rows={carcassMaterialFinishRows}
            showParent
            isLoading={isCarcassMaterialFinishesLoading}
            isError={isCarcassMaterialFinishesError}
            errorMessage={
              (carcassMaterialFinishesError as any)?.response?.data?.error
            }
            onAction={() => setOpenFinishModal(true)}
            extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCarcassTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadCarcassMaterialFinishes.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="material" className="mt-4">


               <MasterListingTable
            title="Carcass Material Finish"
            description="Carcass material finish master entries for the current vendor."
            searchPlaceholder="Search carcass material finish..."
            actionLabel="Add Carcass Material Finish"
            rows={carcassMaterialFinishRows}
            showParent
            isLoading={isCarcassMaterialFinishesLoading}
            isError={isCarcassMaterialFinishesError}
            errorMessage={
              (carcassMaterialFinishesError as any)?.response?.data?.error
            }
            onAction={() => setOpenFinishModal(true)}
            extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCarcassTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadCarcassMaterialFinishes.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
          <MasterListingTable
            title="Carcass Material"
            description="Carcass material master entries for the current vendor."
            searchPlaceholder="Search carcass material..."
            actionLabel="Add Carcass Material"
            rows={carcasMaterialRows}
            isLoading={isCarcasMaterialsLoading}
            isError={isCarcasMaterialsError}
            errorMessage={(carcasMaterialsError as any)?.response?.data?.error}
            onAction={() => setOpenMaterialModal(true)}
          />
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <MasterListingTable
            title="Carcass Material Finish"
            description="Carcass material finish master entries for the current vendor."
            searchPlaceholder="Search carcass material finish..."
            actionLabel="Add Carcass Material Finish"
            rows={carcassMaterialFinishRows}
            showParent
            isLoading={isCarcassMaterialFinishesLoading}
            isError={isCarcassMaterialFinishesError}
            errorMessage={
              (carcassMaterialFinishesError as any)?.response?.data?.error
            }
            onAction={() => setOpenFinishModal(true)}
            extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadCarcassTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadCarcassMaterialFinishes.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
          <MasterListingTable
            title="Carcass Type"
            description="Carcass type master entries for the current vendor."
            searchPlaceholder="Search carcass type..."
            actionLabel="Add Carcass Type"
            rows={carcassTypeRows}
            isLoading={isCarcassTypesLoading}
            isError={isCarcassTypesError}
            errorMessage={(carcassTypesError as any)?.response?.data?.error}
            onAction={() => setOpenTypeModal(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Type</DialogTitle>
            <DialogDescription>
              Create a new carcass type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carcass-type-name">Carcass Type</Label>
              <Input
                id="carcass-type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter carcass type"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenTypeModal(false);
                setTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateType}
              disabled={
                createCarcassType.isPending || !typeName.trim() || !vendorId
              }
            >
              {createCarcassType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMaterialModal} onOpenChange={setOpenMaterialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Material</DialogTitle>
            <DialogDescription>
              Create a new carcass material for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carcass-material-name">Carcass Material</Label>
              <Input
                id="carcass-material-name"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Enter carcass material"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenMaterialModal(false);
                setMaterialName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMaterial}
              disabled={
                createCarcasMaterial.isPending ||
                !materialName.trim() ||
                !vendorId
              }
            >
              {createCarcasMaterial.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openFinishModal} onOpenChange={setOpenFinishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Material Finish</DialogTitle>
            <DialogDescription>
              Create a new carcass material finish and link it to a carcass
              material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carcass Material</Label>
              <Select
                value={finishMaterialId}
                onValueChange={setFinishMaterialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carcass material" />
                </SelectTrigger>
                <SelectContent>
                  {(carcasMaterials?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carcass-material-finish-name">
                Carcass Material Finish
              </Label>
              <Input
                id="carcass-material-finish-name"
                value={finishName}
                onChange={(e) => setFinishName(e.target.value)}
                placeholder="Enter carcass material finish"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenFinishModal(false);
                setFinishName("");
                setFinishMaterialId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFinish}
              disabled={
                createCarcassMaterialFinish.isPending ||
                !finishName.trim() ||
                !finishMaterialId
              }
            >
              {createCarcassMaterialFinish.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseModal
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setSelectedFiles([]);
            setUploadPreview(null);
          }
        }}
        title="Import Carcass Material Finish"
        description="Upload a CSV or XLSX file with Carcass Type, Carcass Material, and Carcass Material Finish columns. All three columns are required per row; rows with missing values or duplicate finishes are skipped."
        size="smd"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              {isParsingPreview ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading file…
                </div>
              ) : uploadPreview?.headerError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{uploadPreview.headerError}</p>
                </div>
              ) : uploadPreview ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Preview — {uploadPreview.totalDataRows} row
                      {uploadPreview.totalDataRows === 1 ? "" : "s"} found
                    </p>
                    {uploadPreview.skippedRows.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {uploadPreview.skippedRows.length} skipped
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <PreviewStatTile
                      icon={<Layers />}
                      label="New Carcass Type"
                      value={uploadPreview.typesToAdd}
                      tone="indigo"
                    />
                    <PreviewStatTile
                      icon={<Package />}
                      label="New Carcass Material"
                      value={uploadPreview.materialsToAdd}
                      tone="violet"
                    />
                    <PreviewStatTile
                      icon={<Palette />}
                      label="New Material Finish"
                      value={uploadPreview.finishesToAdd}
                      tone="emerald"
                    />
                    <PreviewStatTile
                      icon={<CopyX />}
                      label="Skipped — duplicate"
                      value={uploadPreview.skippedDuplicate}
                      tone="amber"
                    />
                  </div>

                  {uploadPreview.skippedMissing > 0 && (
                    <PreviewStatTile
                      icon={<FileWarning />}
                      label="Skipped — missing Type/Material/Finish value"
                      value={uploadPreview.skippedMissing}
                      tone="red"
                    />
                  )}

                  {uploadPreview.skippedRows.length > 0 && (
                    <div className="rounded-lg border">
                      <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        Skipped row details
                      </div>
                      <ScrollArea className="h-48">
                        <div className="divide-y">
                          {uploadPreview.skippedRows.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 px-3 py-1.5 text-xs"
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-0.5 shrink-0 tabular-nums",
                                  s.type === "duplicate"
                                    ? "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
                                    : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300",
                                )}
                              >
                                Row {s.row}
                              </Badge>
                              <span className="text-muted-foreground">
                                {s.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="flex gap-2 justify-end border-t pt-4 mt-6">
            <Button variant="outline" onClick={() => setOpenUploadModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={
                selectedFiles.length === 0 ||
                isParsingPreview ||
                !!uploadPreview?.headerError ||
                uploadCarcassMaterialFinishes.isPending
              }
            >
              {uploadCarcassMaterialFinishes.isPending
                ? "Uploading..."
                : "Upload & Import"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

function ShutterMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: shutterTypes,
    isLoading: isShutterTypesLoading,
    isError: isShutterTypesError,
    error: shutterTypesError,
  } = useShutterTypes();
  const {
    data: shutterMaterials,
    isLoading: isShutterMaterialsLoading,
    isError: isShutterMaterialsError,
    error: shutterMaterialsError,
  } = useShutterMaterials();
  const {
    data: shutterMaterialFinishes,
    isLoading: isShutterMaterialFinishesLoading,
    isError: isShutterMaterialFinishesError,
    error: shutterMaterialFinishesError,
  } = useAllShutterMaterialFinishes();

  const createShutterType = useCreateShutterType();
  const createShutterMaterial = useCreateShutterMaterial();
  const uploadShutterMaterialFinishes = useUploadShutterMaterialFinishes();
  const createShutterMaterialFinish = useCreateShutterMaterialFinish();

  const shutterTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (shutterTypes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [shutterTypes?.data],
  );

  const shutterMaterialRows = React.useMemo<MasterRow[]>(
    () =>
      (shutterMaterials?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [shutterMaterials?.data],
  );

  const shutterMaterialFinishRows = React.useMemo<MasterRow[]>(
    () =>
      (shutterMaterialFinishes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        parent: item.material?.name ?? null,
        status: "active",
      })),
    [shutterMaterialFinishes?.data],
  );

  const [openTypeModal, setOpenTypeModal] = React.useState(false);
  const [typeName, setTypeName] = React.useState("");
  const [openMaterialModal, setOpenMaterialModal] = React.useState(false);
  const [materialName, setMaterialName] = React.useState("");
  const [openFinishModal, setOpenFinishModal] = React.useState(false);
  const [finishName, setFinishName] = React.useState("");
  const [finishMaterialId, setFinishMaterialId] = React.useState("");
  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadPreview, setUploadPreview] =
    React.useState<MasterUploadPreview | null>(null);
  const [isParsingPreview, setIsParsingPreview] = React.useState(false);

  React.useEffect(() => {
    const file = selectedFiles[0];
    if (!file) {
      setUploadPreview(null);
      return;
    }

    let cancelled = false;
    setIsParsingPreview(true);
    computeMasterUploadPreview(file, {
      types: shutterTypes?.data ?? [],
      materials: shutterMaterials?.data ?? [],
      finishes: (shutterMaterialFinishes?.data ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        materialId: f.shutter_material_id,
      })),
    })
      .then((preview) => {
        if (!cancelled) setUploadPreview(preview);
      })
      .catch(() => {
        if (!cancelled) {
          setUploadPreview({
            totalDataRows: 0,
            typesToAdd: 0,
            materialsToAdd: 0,
            finishesToAdd: 0,
            skippedMissing: 0,
            skippedDuplicate: 0,
            skippedRows: [],
            headerError:
              "Could not read this file. Please check the format and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsParsingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedFiles,
    shutterTypes?.data,
    shutterMaterials?.data,
    shutterMaterialFinishes?.data,
  ]);

  const handleCreateType = () => {
    const name = typeName.trim();
    if (!name || !vendorId) return;

    createShutterType.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenTypeModal(false);
          setTypeName("");
        },
      },
    );
  };

  const handleCreateMaterial = () => {
    const name = materialName.trim();
    if (!name || !vendorId) return;

    createShutterMaterial.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenMaterialModal(false);
          setMaterialName("");
        },
      },
    );
  };

  const handleCreateFinish = () => {
    const name = finishName.trim();
    const shutterMaterialId = Number(finishMaterialId);
    if (!name || !shutterMaterialId) return;

    createShutterMaterialFinish.mutate(
      { shutter_material_id: shutterMaterialId, name },
      {
        onSuccess: () => {
          setOpenFinishModal(false);
          setFinishName("");
          setFinishMaterialId("");
        },
      },
    );
  };

  const handleUploadSubmit = () => {
    const file = selectedFiles[0];
    if (!file || !vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", String(vendorId));

    uploadShutterMaterialFinishes.mutate(formData, {
      onSuccess: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
      onError: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
    });
  };

  const downloadShutterTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Shutter Masters Template");

    worksheet.columns = [
      { header: "Shutter Type", key: "type", width: 30 },
      { header: "Shutter Material", key: "material", width: 30 },
      { header: "Shutter Material Finish", key: "finish", width: 30 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "shutter_masters_template.xlsx");
  };

  return (
    <>
      <Tabs defaultValue="finish" className="w-full">
        <TabsList>
          <TabsTrigger value="finish">Shutter Material Finish</TabsTrigger>
          <TabsTrigger value="material">Shutter Material</TabsTrigger>
          <TabsTrigger value="type">Shutter Type</TabsTrigger>
        </TabsList>

        <TabsContent value="finish" className="mt-4">
          <MasterListingTable
            title="Shutter Material Finish"
            description="Shutter material finish master entries for the current vendor."
            searchPlaceholder="Search shutter material finish..."
            actionLabel="Add Shutter Material Finish"
            rows={shutterMaterialFinishRows}
            showParent
            isLoading={isShutterMaterialFinishesLoading}
            isError={isShutterMaterialFinishesError}
            errorMessage={
              (shutterMaterialFinishesError as any)?.response?.data?.error
            }
            onAction={() => setOpenFinishModal(true)}
            extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadShutterTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadShutterMaterialFinishes.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="material" className="mt-4">
          <MasterListingTable
            title="Shutter Material"
            description="Shutter material master entries for the current vendor."
            searchPlaceholder="Search shutter material..."
            actionLabel="Add Shutter Material"
            rows={shutterMaterialRows}
            isLoading={isShutterMaterialsLoading}
            isError={isShutterMaterialsError}
            errorMessage={(shutterMaterialsError as any)?.response?.data?.error}
            onAction={() => setOpenMaterialModal(true)} extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadShutterTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadShutterMaterialFinishes.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <MasterListingTable
            title="Shutter Type"
            description="Shutter type master entries for the current vendor."
            searchPlaceholder="Search shutter type..."
            actionLabel="Add Shutter Type"
            rows={shutterTypeRows}
            isLoading={isShutterTypesLoading}
            isError={isShutterTypesError}
            errorMessage={(shutterTypesError as any)?.response?.data?.error}
            onAction={() => setOpenTypeModal(true)} extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadShutterTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadShutterMaterialFinishes.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shutter Type</DialogTitle>
            <DialogDescription>
              Create a new shutter type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shutter-type-name">Shutter Type</Label>
              <Input
                id="shutter-type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter shutter type"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenTypeModal(false);
                setTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateType}
              disabled={
                createShutterType.isPending || !typeName.trim() || !vendorId
              }
            >
              {createShutterType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMaterialModal} onOpenChange={setOpenMaterialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shutter Material</DialogTitle>
            <DialogDescription>
              Create a new shutter material for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shutter-material-name">Shutter Material</Label>
              <Input
                id="shutter-material-name"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Enter shutter material"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenMaterialModal(false);
                setMaterialName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMaterial}
              disabled={
                createShutterMaterial.isPending ||
                !materialName.trim() ||
                !vendorId
              }
            >
              {createShutterMaterial.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openFinishModal} onOpenChange={setOpenFinishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shutter Material Finish</DialogTitle>
            <DialogDescription>
              Create a new shutter material finish and link it to a shutter
              material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shutter Material</Label>
              <Select
                value={finishMaterialId}
                onValueChange={setFinishMaterialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shutter material" />
                </SelectTrigger>
                <SelectContent>
                  {(shutterMaterials?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shutter-material-finish-name">
                Shutter Material Finish
              </Label>
              <Input
                id="shutter-material-finish-name"
                value={finishName}
                onChange={(e) => setFinishName(e.target.value)}
                placeholder="Enter shutter material finish"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenFinishModal(false);
                setFinishName("");
                setFinishMaterialId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFinish}
              disabled={
                createShutterMaterialFinish.isPending ||
                !finishName.trim() ||
                !finishMaterialId
              }
            >
              {createShutterMaterialFinish.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseModal
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setSelectedFiles([]);
            setUploadPreview(null);
          }
        }}
        title="Import Shutter Material Finish"
        description="Upload a CSV or XLSX file with Shutter Type, Shutter Material, and Shutter Material Finish columns. All three columns are required per row; rows with missing values or duplicate finishes are skipped."
        size="smd"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              {isParsingPreview ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading file…
                </div>
              ) : uploadPreview?.headerError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{uploadPreview.headerError}</p>
                </div>
              ) : uploadPreview ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Preview — {uploadPreview.totalDataRows} row
                      {uploadPreview.totalDataRows === 1 ? "" : "s"} found
                    </p>
                    {uploadPreview.skippedRows.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {uploadPreview.skippedRows.length} skipped
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <PreviewStatTile
                      icon={<Layers />}
                      label="New Shutter Type"
                      value={uploadPreview.typesToAdd}
                      tone="indigo"
                    />
                    <PreviewStatTile
                      icon={<Package />}
                      label="New Shutter Material"
                      value={uploadPreview.materialsToAdd}
                      tone="violet"
                    />
                    <PreviewStatTile
                      icon={<Palette />}
                      label="New Material Finish"
                      value={uploadPreview.finishesToAdd}
                      tone="emerald"
                    />
                    <PreviewStatTile
                      icon={<CopyX />}
                      label="Skipped — duplicate"
                      value={uploadPreview.skippedDuplicate}
                      tone="amber"
                    />
                  </div>

                  {uploadPreview.skippedMissing > 0 && (
                    <PreviewStatTile
                      icon={<FileWarning />}
                      label="Skipped — missing Type/Material/Finish value"
                      value={uploadPreview.skippedMissing}
                      tone="red"
                    />
                  )}

                  {uploadPreview.skippedRows.length > 0 && (
                    <div className="rounded-lg border">
                      <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        Skipped row details
                      </div>
                      <ScrollArea className="h-48">
                        <div className="divide-y">
                          {uploadPreview.skippedRows.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 px-3 py-1.5 text-xs"
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-0.5 shrink-0 tabular-nums",
                                  s.type === "duplicate"
                                    ? "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
                                    : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300",
                                )}
                              >
                                Row {s.row}
                              </Badge>
                              <span className="text-muted-foreground">
                                {s.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="flex gap-2 justify-end border-t pt-4 mt-6">
            <Button variant="outline" onClick={() => setOpenUploadModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={
                selectedFiles.length === 0 ||
                isParsingPreview ||
                !!uploadPreview?.headerError ||
                uploadShutterMaterialFinishes.isPending
              }
            >
              {uploadShutterMaterialFinishes.isPending
                ? "Uploading..."
                : "Upload & Import"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

function HardwareMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: carcassLegs,
    isLoading: isCarcassLegsLoading,
    isError: isCarcassLegsError,
    error: carcassLegsError,
  } = useCarcassLegs();
  const {
    data: skirtings,
    isLoading: isSkirtingsLoading,
    isError: isSkirtingsError,
    error: skirtingsError,
  } = useAllSkirtingCarcassLegs();
  const {
    data: skirtingColors,
    isLoading: isSkirtingColorsLoading,
    isError: isSkirtingColorsError,
    error: skirtingColorsError,
  } = useAllSkirtingCarcassLegsColors();

  const createCarcassLegs = useCreateCarcassLegs();
  const createSkirtingCarcassLegs = useCreateSkirtingCarcassLegs();
  const createSkirtingCarcassLegsColor = useCreateSkirtingCarcassLegsColor();
  const uploadSkirtingCarcassLegsColors = useUploadSkirtingCarcassLegsColors();

  const carcassLegsRows = React.useMemo<MasterRow[]>(
    () =>
      (carcassLegs?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [carcassLegs?.data],
  );

  const skirtingRows = React.useMemo<MasterRow[]>(
    () =>
      (skirtings?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        parent: item.carcassLegs?.name ?? null,
        status: item.inScope ? "in scope" : "not in scope",
      })),
    [skirtings?.data],
  );

  const skirtingColorRows = React.useMemo<MasterRow[]>(
    () =>
      (skirtingColors?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.color,
        parent: item.skirtingCarcassLegs?.name ?? null,
        status: "active",
      })),
    [skirtingColors?.data],
  );

  const [openLegsModal, setOpenLegsModal] = React.useState(false);
  const [legsName, setLegsName] = React.useState("");
  const [openSkirtingModal, setOpenSkirtingModal] = React.useState(false);
  const [skirtingName, setSkirtingName] = React.useState("");
  const [skirtingLegsId, setSkirtingLegsId] = React.useState("");
  const [skirtingInScope, setSkirtingInScope] = React.useState("true");
  const [openColorModal, setOpenColorModal] = React.useState(false);
  const [colorValue, setColorValue] = React.useState("");
  const [colorLegsId, setColorLegsId] = React.useState("");
  const [colorSkirtingId, setColorSkirtingId] = React.useState("");

  const colorSkirtingOptions = React.useMemo(
    () =>
      (skirtings?.data ?? []).filter(
        (item) => String(item.carcass_legs_id) === colorLegsId,
      ),
    [skirtings?.data, colorLegsId],
  );

  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadPreview, setUploadPreview] =
    React.useState<MasterUploadPreview | null>(null);
  const [isParsingPreview, setIsParsingPreview] = React.useState(false);

  React.useEffect(() => {
    const file = selectedFiles[0];
    if (!file) {
      setUploadPreview(null);
      return;
    }

    let cancelled = false;
    setIsParsingPreview(true);
    computeHardwareUploadPreview(file, {
      legs: carcassLegs?.data ?? [],
      skirtings: (skirtings?.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        legsId: s.carcass_legs_id,
      })),
      colors: (skirtingColors?.data ?? []).map((c) => ({
        id: c.id,
        color: c.color,
        skirtingId: c.skirting_carcass_legs_id,
      })),
    })
      .then((preview) => {
        if (!cancelled) setUploadPreview(preview);
      })
      .catch(() => {
        if (!cancelled) {
          setUploadPreview({
            totalDataRows: 0,
            typesToAdd: 0,
            materialsToAdd: 0,
            finishesToAdd: 0,
            skippedMissing: 0,
            skippedDuplicate: 0,
            skippedRows: [],
            headerError:
              "Could not read this file. Please check the format and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsParsingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFiles, carcassLegs?.data, skirtings?.data, skirtingColors?.data]);

  const handleCreateLegs = () => {
    const name = legsName.trim();
    if (!name || !vendorId) return;

    createCarcassLegs.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenLegsModal(false);
          setLegsName("");
        },
      },
    );
  };

  const handleCreateSkirting = () => {
    const name = skirtingName.trim();
    const carcassLegsId = Number(skirtingLegsId);
    if (!name || !carcassLegsId) return;

    createSkirtingCarcassLegs.mutate(
      {
        carcass_legs_id: carcassLegsId,
        name,
        inScope: skirtingInScope === "true",
      },
      {
        onSuccess: () => {
          setOpenSkirtingModal(false);
          setSkirtingName("");
          setSkirtingLegsId("");
          setSkirtingInScope("true");
        },
      },
    );
  };

  const handleCreateColor = () => {
    const color = colorValue.trim();
    const carcassLegsId = Number(colorLegsId);
    const skirtingCarcassLegsId = Number(colorSkirtingId);
    if (!color || !carcassLegsId || !skirtingCarcassLegsId) return;

    createSkirtingCarcassLegsColor.mutate(
      {
        carcass_legs_id: carcassLegsId,
        skirting_carcass_legs_id: skirtingCarcassLegsId,
        color,
      },
      {
        onSuccess: () => {
          setOpenColorModal(false);
          setColorValue("");
          setColorLegsId("");
          setColorSkirtingId("");
        },
      },
    );
  };

  const handleUploadSubmit = () => {
    const file = selectedFiles[0];
    if (!file || !vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", String(vendorId));

    uploadSkirtingCarcassLegsColors.mutate(formData, {
      onSuccess: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
      onError: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
    });
  };

  const downloadHardwareTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Hardware Masters Template");

    worksheet.columns = [
      { header: "Carcass Legs", key: "legs", width: 30 },
      { header: "Skirting", key: "skirting", width: 30 },
      { header: "Skirting Color", key: "color", width: 30 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "hardware_masters_template.xlsx");
  };

  return (
    <>
      <Tabs defaultValue="color" className="w-full">
        <TabsList>
          <TabsTrigger value="color">Skirting Color</TabsTrigger>
          <TabsTrigger value="skirting">Skirting</TabsTrigger>
          <TabsTrigger value="legs">Carcass Legs</TabsTrigger>
        </TabsList>

        <TabsContent value="color" className="mt-4">
          <MasterListingTable
            title="Skirting Color"
            description="Skirting color master entries for the current vendor."
            searchPlaceholder="Search skirting color..."
            actionLabel="Add Skirting Color"
            rows={skirtingColorRows}
            showParent
            isLoading={isSkirtingColorsLoading}
            isError={isSkirtingColorsError}
            errorMessage={(skirtingColorsError as any)?.response?.data?.error}
            onAction={() => setOpenColorModal(true)}
            extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadHardwareTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadSkirtingCarcassLegsColors.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="skirting" className="mt-4">
          <MasterListingTable
            title="Skirting"
            description="Skirting master entries for the current vendor."
            searchPlaceholder="Search skirting..."
            actionLabel="Add Skirting"
            rows={skirtingRows}
            showParent
            isLoading={isSkirtingsLoading}
            isError={isSkirtingsError}
            errorMessage={(skirtingsError as any)?.response?.data?.error}
            onAction={() => setOpenSkirtingModal(true)}  extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadHardwareTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadSkirtingCarcassLegsColors.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="legs" className="mt-4">
          <MasterListingTable
            title="Carcass Legs"
            description="Carcass legs master entries for the current vendor."
            searchPlaceholder="Search carcass legs..."
            actionLabel="Add Carcass Legs"
            rows={carcassLegsRows}
            isLoading={isCarcassLegsLoading}
            isError={isCarcassLegsError}
            errorMessage={(carcassLegsError as any)?.response?.data?.error}
            onAction={() => setOpenLegsModal(true)}  extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadHardwareTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadSkirtingCarcassLegsColors.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openLegsModal} onOpenChange={setOpenLegsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Legs</DialogTitle>
            <DialogDescription>
              Create a new carcass legs entry for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carcass-legs-name">Carcass Legs</Label>
              <Input
                id="carcass-legs-name"
                value={legsName}
                onChange={(e) => setLegsName(e.target.value)}
                placeholder="Enter carcass legs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenLegsModal(false);
                setLegsName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLegs}
              disabled={
                createCarcassLegs.isPending || !legsName.trim() || !vendorId
              }
            >
              {createCarcassLegs.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openSkirtingModal} onOpenChange={setOpenSkirtingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skirting</DialogTitle>
            <DialogDescription>
              Create a new skirting entry and link it to a carcass legs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carcass Legs</Label>
              <Select value={skirtingLegsId} onValueChange={setSkirtingLegsId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carcass legs" />
                </SelectTrigger>
                <SelectContent>
                  {(carcassLegs?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skirting-name">Skirting</Label>
              <Input
                id="skirting-name"
                value={skirtingName}
                onChange={(e) => setSkirtingName(e.target.value)}
                placeholder="Enter skirting"
              />
            </div>

            <div className="space-y-2">
              <Label>In Scope</Label>
              <Select
                value={skirtingInScope}
                onValueChange={setSkirtingInScope}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Scope</SelectItem>
                  <SelectItem value="false">Not in Scope</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenSkirtingModal(false);
                setSkirtingName("");
                setSkirtingLegsId("");
                setSkirtingInScope("true");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSkirting}
              disabled={
                createSkirtingCarcassLegs.isPending ||
                !skirtingName.trim() ||
                !skirtingLegsId
              }
            >
              {createSkirtingCarcassLegs.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openColorModal} onOpenChange={setOpenColorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skirting Color</DialogTitle>
            <DialogDescription>
              Create a new skirting color and link it to a carcass legs and
              skirting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carcass Legs</Label>
              <Select
                value={colorLegsId}
                onValueChange={(value) => {
                  setColorLegsId(value);
                  setColorSkirtingId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carcass legs" />
                </SelectTrigger>
                <SelectContent>
                  {(carcassLegs?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skirting</Label>
              <Select
                value={colorSkirtingId}
                onValueChange={setColorSkirtingId}
                disabled={!colorLegsId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      colorLegsId
                        ? "Select skirting"
                        : "Select carcass legs first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {colorSkirtingOptions.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skirting-color-value">Color</Label>
              <Input
                id="skirting-color-value"
                value={colorValue}
                onChange={(e) => setColorValue(e.target.value)}
                placeholder="Enter color"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenColorModal(false);
                setColorValue("");
                setColorLegsId("");
                setColorSkirtingId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateColor}
              disabled={
                createSkirtingCarcassLegsColor.isPending ||
                !colorValue.trim() ||
                !colorLegsId ||
                !colorSkirtingId
              }
            >
              {createSkirtingCarcassLegsColor.isPending
                ? "Creating..."
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseModal
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setSelectedFiles([]);
            setUploadPreview(null);
          }
        }}
        title="Import Skirting Color"
        description="Upload a CSV or XLSX file with Carcass Legs, Skirting, and Skirting Color columns. Carcass Legs and Skirting are required per row; Skirting Color may be left blank, but a value that already exists for that skirting is skipped as a duplicate."
        size="smd"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              {isParsingPreview ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading file…
                </div>
              ) : uploadPreview?.headerError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{uploadPreview.headerError}</p>
                </div>
              ) : uploadPreview ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Preview — {uploadPreview.totalDataRows} row
                      {uploadPreview.totalDataRows === 1 ? "" : "s"} found
                    </p>
                    {uploadPreview.skippedRows.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {uploadPreview.skippedRows.length} skipped
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <PreviewStatTile
                      icon={<Layers />}
                      label="New Carcass Legs"
                      value={uploadPreview.typesToAdd}
                      tone="indigo"
                    />
                    <PreviewStatTile
                      icon={<Package />}
                      label="New Skirting"
                      value={uploadPreview.materialsToAdd}
                      tone="violet"
                    />
                    <PreviewStatTile
                      icon={<Palette />}
                      label="New Skirting Color"
                      value={uploadPreview.finishesToAdd}
                      tone="emerald"
                    />
                    <PreviewStatTile
                      icon={<CopyX />}
                      label="Skipped — duplicate"
                      value={uploadPreview.skippedDuplicate}
                      tone="amber"
                    />
                  </div>

                  {uploadPreview.skippedMissing > 0 && (
                    <PreviewStatTile
                      icon={<FileWarning />}
                      label="Skipped — missing Carcass Legs/Skirting value"
                      value={uploadPreview.skippedMissing}
                      tone="red"
                    />
                  )}

                  {uploadPreview.skippedRows.length > 0 && (
                    <div className="rounded-lg border">
                      <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        Skipped row details
                      </div>
                      <ScrollArea className="h-48">
                        <div className="divide-y">
                          {uploadPreview.skippedRows.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 px-3 py-1.5 text-xs"
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-0.5 shrink-0 tabular-nums",
                                  s.type === "duplicate"
                                    ? "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
                                    : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300",
                                )}
                              >
                                Row {s.row}
                              </Badge>
                              <span className="text-muted-foreground">
                                {s.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="flex gap-2 justify-end border-t pt-4 mt-6">
            <Button variant="outline" onClick={() => setOpenUploadModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={
                selectedFiles.length === 0 ||
                isParsingPreview ||
                !!uploadPreview?.headerError ||
                uploadSkirtingCarcassLegsColors.isPending
              }
            >
              {uploadSkirtingCarcassLegsColors.isPending
                ? "Uploading..."
                : "Upload & Import"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

function LightMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: lightCarcasTypes,
    isLoading: isLightCarcasTypesLoading,
    isError: isLightCarcasTypesError,
    error: lightCarcasTypesError,
  } = useLightCarcasTypes();
  const {
    data: lightCarcasUnits,
    isLoading: isLightCarcasUnitsLoading,
    isError: isLightCarcasUnitsError,
    error: lightCarcasUnitsError,
  } = useAllLightCarcasUnits();

  const createLightCarcasType = useCreateLightCarcasType();
  const createLightCarcasUnit = useCreateLightCarcasUnit();
  const uploadLightCarcasUnits = useUploadLightCarcasUnits();

  const lightCarcasTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (lightCarcasTypes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        status: "active",
      })),
    [lightCarcasTypes?.data],
  );

  const lightCarcasUnitRows = React.useMemo<MasterRow[]>(
    () =>
      (lightCarcasUnits?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        parent: item.lightCarcasType?.type ?? null,
        status: "active",
      })),
    [lightCarcasUnits?.data],
  );

  const [openTypeModal, setOpenTypeModal] = React.useState(false);
  const [typeName, setTypeName] = React.useState("");
  const [openUnitModal, setOpenUnitModal] = React.useState(false);
  const [unitName, setUnitName] = React.useState("");
  const [unitTypeId, setUnitTypeId] = React.useState("");
  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadPreview, setUploadPreview] =
    React.useState<MasterUploadPreview | null>(null);
  const [isParsingPreview, setIsParsingPreview] = React.useState(false);

  React.useEffect(() => {
    const file = selectedFiles[0];
    if (!file) {
      setUploadPreview(null);
      return;
    }

    let cancelled = false;
    setIsParsingPreview(true);
    computeLightUploadPreview(file, {
      types: lightCarcasTypes?.data ?? [],
      units: (lightCarcasUnits?.data ?? []).map((u) => ({
        id: u.id,
        type: u.type,
        typeId: u.light_carcas_type_id,
      })),
    })
      .then((preview) => {
        if (!cancelled) setUploadPreview(preview);
      })
      .catch(() => {
        if (!cancelled) {
          setUploadPreview({
            totalDataRows: 0,
            typesToAdd: 0,
            materialsToAdd: 0,
            finishesToAdd: 0,
            skippedMissing: 0,
            skippedDuplicate: 0,
            skippedRows: [],
            headerError:
              "Could not read this file. Please check the format and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsParsingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFiles, lightCarcasTypes?.data, lightCarcasUnits?.data]);

  const handleCreateType = () => {
    const type = typeName.trim();
    if (!type || !vendorId) return;

    createLightCarcasType.mutate(
      { vendor_id: vendorId, type },
      {
        onSuccess: () => {
          setOpenTypeModal(false);
          setTypeName("");
        },
      },
    );
  };

  const handleCreateUnit = () => {
    const type = unitName.trim();
    const lightCarcasTypeId = Number(unitTypeId);
    if (!type || !lightCarcasTypeId || !vendorId) return;

    createLightCarcasUnit.mutate(
      {
        vendor_id: vendorId,
        type,
        light_carcas_type_id: lightCarcasTypeId,
      },
      {
        onSuccess: () => {
          setOpenUnitModal(false);
          setUnitName("");
          setUnitTypeId("");
        },
      },
    );
  };

  const handleUploadSubmit = () => {
    const file = selectedFiles[0];
    if (!file || !vendorId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", String(vendorId));

    uploadLightCarcasUnits.mutate(formData, {
      onSuccess: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
      onError: () => {
        setOpenUploadModal(false);
        setSelectedFiles([]);
        setUploadPreview(null);
      },
    });
  };

  const downloadLightTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Light Masters Template");

    worksheet.columns = [
      { header: "Light Carcas Type", key: "type", width: 30 },
      { header: "Light Unit", key: "unit", width: 30 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "light_masters_template.xlsx");
  };

  return (
    <>
      <Tabs defaultValue="unit" className="w-full">
        <TabsList>
          <TabsTrigger value="unit">Light Unit</TabsTrigger>
          <TabsTrigger value="type">Light Carcas Type</TabsTrigger>
        </TabsList>

        <TabsContent value="unit" className="mt-4">
          <MasterListingTable
            title="Light Unit"
            description="Light carcas unit master entries for the current vendor."
            searchPlaceholder="Search light unit..."
            actionLabel="Add Light Unit"
            rows={lightCarcasUnitRows}
            showParent
            isLoading={isLightCarcasUnitsLoading}
            isError={isLightCarcasUnitsError}
            errorMessage={(lightCarcasUnitsError as any)?.response?.data?.error}
            onAction={() => setOpenUnitModal(true)}
            extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadLightTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadLightCarcasUnits.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <MasterListingTable
            title="Light Carcas Type"
            description="Light carcas type master entries for the current vendor."
            searchPlaceholder="Search light carcas type..."
            actionLabel="Add Light Carcas Type"
            rows={lightCarcasTypeRows}
            isLoading={isLightCarcasTypesLoading}
            isError={isLightCarcasTypesError}
            errorMessage={(lightCarcasTypesError as any)?.response?.data?.error}
            onAction={() => setOpenTypeModal(true)}  extraActions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadLightTemplate}
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setOpenUploadModal(true);
                  }}
                  disabled={uploadLightCarcasUnits.isPending}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </>
            }
          />    
        </TabsContent>
      </Tabs>

      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Light Carcas Type</DialogTitle>
            <DialogDescription>
              Create a new light carcas type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="light-carcas-type-name">Light Carcas Type</Label>
              <Input
                id="light-carcas-type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter light carcas type"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenTypeModal(false);
                setTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateType}
              disabled={
                createLightCarcasType.isPending || !typeName.trim() || !vendorId
              }
            >
              {createLightCarcasType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openUnitModal} onOpenChange={setOpenUnitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Light Unit</DialogTitle>
            <DialogDescription>
              Create a new light unit and link it to a light carcas type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Light Carcas Type</Label>
              <Select value={unitTypeId} onValueChange={setUnitTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select light carcas type" />
                </SelectTrigger>
                <SelectContent>
                  {(lightCarcasTypes?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="light-unit-name">Light Unit</Label>
              <Input
                id="light-unit-name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Enter light unit"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenUnitModal(false);
                setUnitName("");
                setUnitTypeId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUnit}
              disabled={
                createLightCarcasUnit.isPending ||
                !unitName.trim() ||
                !unitTypeId
              }
            >
              {createLightCarcasUnit.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseModal
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setSelectedFiles([]);
            setUploadPreview(null);
          }
        }}
        title="Import Light Unit"
        description="Upload a CSV or XLSX file with Light Carcas Type and Light Unit columns. Both columns are required per row; duplicate light units are skipped."
        size="smd"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              {isParsingPreview ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading file…
                </div>
              ) : uploadPreview?.headerError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{uploadPreview.headerError}</p>
                </div>
              ) : uploadPreview ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Preview — {uploadPreview.totalDataRows} row
                      {uploadPreview.totalDataRows === 1 ? "" : "s"} found
                    </p>
                    {uploadPreview.skippedRows.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {uploadPreview.skippedRows.length} skipped
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <PreviewStatTile
                      icon={<Layers />}
                      label="New Light Carcas Type"
                      value={uploadPreview.typesToAdd}
                      tone="indigo"
                    />
                    <PreviewStatTile
                      icon={<Palette />}
                      label="New Light Unit"
                      value={uploadPreview.finishesToAdd}
                      tone="emerald"
                    />
                    <PreviewStatTile
                      icon={<CopyX />}
                      label="Skipped — duplicate"
                      value={uploadPreview.skippedDuplicate}
                      tone="amber"
                    />
                    {uploadPreview.skippedMissing > 0 && (
                      <PreviewStatTile
                        icon={<FileWarning />}
                        label="Skipped — missing value(s)"
                        value={uploadPreview.skippedMissing}
                        tone="red"
                      />
                    )}
                  </div>

                  {uploadPreview.skippedRows.length > 0 && (
                    <div className="rounded-lg border">
                      <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        Skipped row details
                      </div>
                      <ScrollArea className="h-48">
                        <div className="divide-y">
                          {uploadPreview.skippedRows.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 px-3 py-1.5 text-xs"
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-0.5 shrink-0 tabular-nums",
                                  s.type === "duplicate"
                                    ? "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
                                    : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300",
                                )}
                              >
                                Row {s.row}
                              </Badge>
                              <span className="text-muted-foreground">
                                {s.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="flex gap-2 justify-end border-t pt-4 mt-6">
            <Button variant="outline" onClick={() => setOpenUploadModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={
                selectedFiles.length === 0 ||
                isParsingPreview ||
                !!uploadPreview?.headerError ||
                uploadLightCarcasUnits.isPending
              }
            >
              {uploadLightCarcasUnits.isPending
                ? "Uploading..."
                : "Upload & Import"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

type OtherApplianceMasterRow = {
  srNo: number;
  id: number;
  article_number: string;
  description: string;
};

function OtherAppliancesListingTable({
  type,
  rows,
  isLoading,
  isError,
  errorMessage,
  onAction,
  onTemplateDownload,
  onImportClick,
  isDownloading,
}: {
  type: string;
  rows: OtherApplianceMasterRow[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onAction: () => void;
  onTemplateDownload: () => void;
  onImportClick: () => void;
  isDownloading?: boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = React.useMemo<ColumnDef<OtherApplianceMasterRow>[]>(
    () => [
      {
        accessorKey: "srNo",
        header: "Sr. No.",
        cell: ({ row }) => row.original.srNo,
      },
      {
        accessorKey: "article_number",
        header: "Article Number",
        cell: ({ row }) => row.original.article_number,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "")
        .trim()
        .toLowerCase();
      if (!search) return true;
      return String(row.getValue(columnId) ?? "")
        .toLowerCase()
        .includes(search);
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{type}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {type} master entries for the current vendor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-start">
          <Button
            type="button"
            variant="outline"
            onClick={onTemplateDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onImportClick}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={onAction}
          >
            <Plus className="h-4 w-4" />
            Add {type}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading {type.toLowerCase()}...
          </div>
        ) : isError ? (
          <div className="py-10 text-sm text-red-500">
            {errorMessage || `Failed to load ${type.toLowerCase()}.`}
          </div>
        ) : (
          <DataTable table={table} className="px-0 pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ClearInput
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={`Search ${type.toLowerCase()}...`}
                className="h-9 w-full md:w-72"
              />
            </div>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}

function OtherAppliancesTab({ type }: { type: string }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: otherAppliances,
    isLoading,
    isError,
    error,
  } = useOtherAppliances();
  const createOtherAppliances = useCreateOtherAppliances();
  const uploadMutation = useUploadOtherAppliances();
  const downloadMutation = useDownloadOtherAppliancesReport();

  const rows = React.useMemo<OtherApplianceMasterRow[]>(
    () =>
      (otherAppliances?.data ?? [])
        .filter((item) => item.type === type)
        .map((item, index) => ({
          srNo: index + 1,
          id: item.id,
          article_number: item.article_number,
          description: item.description,
        })),
    [otherAppliances?.data, type],
  );

  const [openModal, setOpenModal] = React.useState(false);
  const [articleNumber, setArticleNumber] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadPreview, setUploadPreview] =
    React.useState<MasterUploadPreview | null>(null);
  const [isParsingPreview, setIsParsingPreview] = React.useState(false);

  React.useEffect(() => {
    const file = selectedFiles[0];
    if (!file) {
      setUploadPreview(null);
      return;
    }

    let cancelled = false;
    setIsParsingPreview(true);
    computeOtherAppliancesUploadPreview(
      file,
      {
        appliances: otherAppliances?.data ?? [],
      },
      type,
    )
      .then((preview) => {
        if (!cancelled) setUploadPreview(preview);
      })
      .catch(() => {
        if (!cancelled) {
          setUploadPreview({
            totalDataRows: 0,
            typesToAdd: 0,
            materialsToAdd: 0,
            finishesToAdd: 0,
            skippedMissing: 0,
            skippedDuplicate: 0,
            skippedRows: [],
            headerError:
              "Could not read this file. Please check the format and try again.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsParsingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFiles, otherAppliances?.data, type]);

  const handleCreate = () => {
    const article = articleNumber.trim();
    const desc = description.trim();
    if (!article || !desc || !vendorId) return;

    const articleLower = article.toLowerCase();
    const isDuplicate = (otherAppliances?.data ?? []).some(
      (item) =>
        item.type.toLowerCase() === type.toLowerCase() &&
        item.article_number.trim().toLowerCase() === articleLower,
    );

    if (isDuplicate) {
      toastManager.add({
        title: `Article number "${article}" already exists for ${type}.`,
        type: "error",
      });
      return;
    }

    createOtherAppliances.mutate(
      {
        vendor_id: vendorId,
        type,
        article_number: article,
        description: desc,
      },
      {
        onSuccess: () => {
          setOpenModal(false);
          setArticleNumber("");
          setDescription("");
        },
      },
    );
  };

  return (
    <>
      <OtherAppliancesListingTable
        type={type}
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.response?.data?.error}
        onAction={() => setOpenModal(true)}
        onTemplateDownload={() => downloadMutation.mutate()}
        onImportClick={() => {
          setSelectedFiles([]);
          setOpenUploadModal(true);
          setUploadPreview(null);
        }}
        isDownloading={downloadMutation.isPending}
      />

      <BaseModal
        open={openUploadModal}
        onOpenChange={(open) => {
          setOpenUploadModal(open);
          if (!open) {
            setSelectedFiles([]);
            setUploadPreview(null);
          }
        }}
        title={`Import ${type}`}
        description={`Upload a CSV or XLSX file containing a tab for ${type}. The columns 'Article Number' and 'Description' are required per sheet.`}
        size="smd"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <FileUploadField
              value={selectedFiles}
              onChange={setSelectedFiles}
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              {isParsingPreview ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reading file…
                </div>
              ) : uploadPreview?.headerError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
                  <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{uploadPreview.headerError}</p>
                </div>
              ) : uploadPreview ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Preview — {uploadPreview.totalDataRows} row
                      {uploadPreview.totalDataRows === 1 ? "" : "s"} found
                    </p>
                    {uploadPreview.skippedRows.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {uploadPreview.skippedRows.length} skipped
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <PreviewStatTile
                      icon={<Layers />}
                      label={`New ${type}`}
                      value={uploadPreview.finishesToAdd}
                      tone="emerald"
                    />
                    <PreviewStatTile
                      icon={<CopyX />}
                      label="Skipped — duplicate"
                      value={uploadPreview.skippedDuplicate}
                      tone="amber"
                    />
                    {uploadPreview.skippedMissing > 0 && (
                      <PreviewStatTile
                        icon={<FileWarning />}
                        label="Skipped — missing value(s)"
                        value={uploadPreview.skippedMissing}
                        tone="red"
                      />
                    )}
                  </div>

                  {uploadPreview.skippedRows.length > 0 && (
                    <div className="rounded-lg border">
                      <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        Skipped row details
                      </div>
                      <ScrollArea className="h-48">
                        <div className="divide-y">
                          {uploadPreview.skippedRows.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs"
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 tabular-nums",
                                  s.type === "duplicate"
                                    ? "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
                                    : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300",
                                )}
                              >
                                Row {s.row}
                              </Badge>
                              <span className="text-muted-foreground">
                                {s.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="flex gap-2 justify-end border-t pt-4 mt-6">
            <Button variant="outline" onClick={() => setOpenUploadModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const file = selectedFiles[0];
                if (!file || !vendorId) return;
                const formData = new FormData();
                formData.append("file", file);
                formData.append("vendorId", String(vendorId));
                formData.append("type", type);
                uploadMutation.mutate(formData, {
                  onSuccess: () => {
                    setOpenUploadModal(false);
                    setSelectedFiles([]);
                    setUploadPreview(null);
                  },
                });
              }}
              disabled={
                selectedFiles.length === 0 ||
                isParsingPreview ||
                !!uploadPreview?.headerError ||
                uploadMutation.isPending
              }
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload & Import"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {type}</DialogTitle>
            <DialogDescription>
              Create a new {type.toLowerCase()} entry for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="other-appliance-article-number">
                Article Number
              </Label>
              <Input
                id="other-appliance-article-number"
                value={articleNumber}
                onChange={(e) => setArticleNumber(e.target.value)}
                placeholder="Enter article number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-appliance-description">Description</Label>
              <Input
                id="other-appliance-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenModal(false);
                setArticleNumber("");
                setDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createOtherAppliances.isPending ||
                !articleNumber.trim() ||
                !description.trim() ||
                !vendorId
              }
            >
              {createOtherAppliances.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OthersMastersSection() {
  const applianceTypes = ["Appliances", "Stone", "Sinks", "Faucets"];

  return (
    <Tabs defaultValue="lights" className="w-full">
      <TabsList>
        <TabsTrigger value="lights">Lights</TabsTrigger>
        {applianceTypes.map((type) => (
          <TabsTrigger key={type} value={type}>
            {type}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="lights" className="mt-4">
        <LightMastersSection />
      </TabsContent>

      {applianceTypes.map((type) => (
        <TabsContent key={type} value={type} className="mt-4">
          <OtherAppliancesTab type={type} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default function SpecsMasterPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Masters Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Specs Master</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Specs Master</h1>
          <p className="text-sm text-muted-foreground">
            Manage carcass, shutter, hardware and other specification masters
            for large-scale project leads from one place.
          </p>
        </div>

        <SmoothTab
          defaultTabId="carcass"
          items={[
            {
              id: "carcass",
              title: "Carcass",
              color: "bg-black hover:bg-black",
              cardContent: <CarcassMastersSection />,
            },
            {
              id: "shutter",
              title: "Shutter",
              color: "bg-black hover:bg-black",
              cardContent: <ShutterMastersSection />,
            },
            {
              id: "hardware",
              title: "Hardware",
              color: "bg-black hover:bg-black",
              cardContent: <HardwareMastersSection />,
            },
            {
              id: "others",
              title: "Others",
              color: "bg-black hover:bg-black",
              cardContent: <OthersMastersSection />,
            },
          ]}
          contentHeightClass="min-h-[240px]"
          pinTabsToBottom={false}
        />
      </div>
    </>
  );
}
