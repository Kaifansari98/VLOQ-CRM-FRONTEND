"use client";

import * as React from "react";
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
import { Plus } from "lucide-react";

import type {
  CarcassTypeMasterEntry,
  HandleTypeMasterEntry,
  ShutterSubTypeMasterEntry,
  ShutterTypeMasterEntry,
} from "@/api/typesMasterApi";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useCarcassTypes,
  useCreateCarcassType,
  useCreateHandleType,
  useCreateShutterSubType,
  useCreateShutterType,
  useCreateTimelineRule,
  useFastProductionTimelineRules,
  useHandleTypes,
  useShutterTypes,
  useUpdateTimelineRule,
} from "@/hooks/useTypesMaster";
import { useAppSelector } from "@/redux/store";

type SpecTabId =
  | "carcass"
  | "shutter"
  | "sub-shutter"
  | "timeline-rules"
  | "handles";
type SpecSourceRow =
  | CarcassTypeMasterEntry
  | ShutterTypeMasterEntry
  | HandleTypeMasterEntry
  | (ShutterSubTypeMasterEntry & { shutterTypeName?: string });

type SpecsTableRow = {
  srNo: number;
  id: number;
  name: string;
  status: string;
  parentName?: string;
};

type TimelineRuleRow = {
  srNo: number;
  id: number;
  carcassId: number;
  shutterId: number | null;
  carcassName: string;
  shutterName: string;
  kitchenManufacturingDays: string;
  generalManufacturingDays: string;
  kitchenDays: string;
  otherDays: string;
};

const baseColumns: ColumnDef<SpecsTableRow>[] = [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => <span>{row.original.srNo}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex justify-end">
        <DataTableColumnHeader column={column} title="Status" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <span className="inline-flex rounded-full border px-3 py-1 text-sm">
          {row.original.status}
        </span>
      </div>
    ),
    enableSorting: false,
  },
];

const subShutterColumns: ColumnDef<SpecsTableRow>[] = [
  baseColumns[0],
  baseColumns[1],
  {
    accessorKey: "parentName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Shutter Type" />
    ),
    cell: ({ row }) => <span>{row.original.parentName ?? "-"}</span>,
  },
  baseColumns[2],
];

const timelineRuleColumns: ColumnDef<TimelineRuleRow>[] = [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => <span>{row.original.srNo}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "carcassName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Carcas Type" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.carcassName}</span>
    ),
  },
  {
    accessorKey: "shutterName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Shutter Type" />
    ),
    cell: ({ row }) => <span>{row.original.shutterName}</span>,
  },
  {
    accessorKey: "kitchenManufacturingDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kitchen Manf. Days" />
    ),
    cell: ({ row }) => <span>{row.original.kitchenManufacturingDays}</span>,
  },
  {
    accessorKey: "generalManufacturingDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="General Manf. Days" />
    ),
    cell: ({ row }) => <span>{row.original.generalManufacturingDays}</span>,
  },
  {
    accessorKey: "kitchenDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="FP Kitchen Manf. Days" />
    ),
    cell: ({ row }) => <span>{row.original.kitchenDays}</span>,
  },
  {
    accessorKey: "otherDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="FP General Manf. Days" />
    ),
    cell: ({ row }) => <span>{row.original.otherDays}</span>,
  },
];

function mapRows(rows: SpecSourceRow[]): SpecsTableRow[] {
  return rows.map((row, index) => ({
    srNo: index + 1,
    id: row.id,
    name: row.name,
    status: "Active",
    parentName: "shutterTypeName" in row ? row.shutterTypeName : undefined,
  }));
}

function SpecsTablePanel({
  label,
  rows,
  isLoading,
  showParentColumn = false,
  globalFilter,
  onGlobalFilterChange,
  onOpenCreate,
}: {
  label: string;
  rows: SpecsTableRow[];
  isLoading: boolean;
  showParentColumn?: boolean;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  onOpenCreate: () => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: rows,
    columns: showParentColumn ? subShutterColumns : baseColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "").trim().toLowerCase();
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
          <CardTitle>{label}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage {label.toLowerCase()} spec type master entries.
          </p>
        </div>

        <Button onClick={onOpenCreate} className="sm:self-start">
          <Plus className="mr-2 h-4 w-4" />
          Add {label}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading {label.toLowerCase()} masters...
          </div>
        ) : (
          <DataTable table={table} className="px-0 pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ClearInput
                value={globalFilter}
                onChange={(e) => onGlobalFilterChange(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="h-9 w-full md:w-72"
              />
            </div>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineRulesPanel({
  rows,
  isLoading,
  globalFilter,
  onGlobalFilterChange,
  onOpenCreate,
  onOpenEdit,
}: {
  rows: TimelineRuleRow[];
  isLoading: boolean;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (row: TimelineRuleRow) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const table = useReactTable({
    data: rows,
    columns: timelineRuleColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "").trim().toLowerCase();
      if (!search) return true;
      return String(row.getValue(columnId) ?? "")
        .toLowerCase()
        .includes(search);
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>TimeLine Rules</CardTitle>
          <p className="text-sm text-muted-foreground">
            View vendor-specific timeline rules.
          </p>
        </div>
        <Button onClick={onOpenCreate} className="sm:self-start">
          <Plus className="mr-2 h-4 w-4" />
          Add TimeLine Rule
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading timeline rules...
          </div>
        ) : (
          <DataTable
            table={table}
            className="px-0 pt-0"
            onRowDoubleClick={onOpenEdit}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ClearInput
                value={globalFilter}
                onChange={(e) => onGlobalFilterChange(e.target.value)}
                placeholder="Search timeline rules..."
                className="h-9 w-full md:w-72"
              />
            </div>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}

export default function SpecsMasterTable() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data: carcassTypesResponse, isLoading: isCarcassTypesLoading } =
    useCarcassTypes();
  const { data: shutterTypesResponse, isLoading: isShutterTypesLoading } =
    useShutterTypes();
  const { data: handleTypesResponse, isLoading: isHandleTypesLoading } =
    useHandleTypes();
  const { data: timelineRulesResponse, isLoading: isTimelineRulesLoading } =
    useFastProductionTimelineRules();
  const createCarcassTypeMutation = useCreateCarcassType();
  const createShutterTypeMutation = useCreateShutterType();
  const createShutterSubTypeMutation = useCreateShutterSubType();
  const createHandleTypeMutation = useCreateHandleType();
  const createTimelineRuleMutation = useCreateTimelineRule();
  const updateTimelineRuleMutation = useUpdateTimelineRule();

  const [activeTab, setActiveTab] = React.useState<SpecTabId>("carcass");
  const [filters, setFilters] = React.useState<Record<SpecTabId, string>>({
    carcass: "",
    shutter: "",
    "sub-shutter": "",
    "timeline-rules": "",
    handles: "",
  });
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [newValue, setNewValue] = React.useState("");
  const [selectedShutterTypeId, setSelectedShutterTypeId] = React.useState("");
  const [selectedCarcassId, setSelectedCarcassId] = React.useState("");
  const [selectedShutterSubTypeId, setSelectedShutterSubTypeId] = React.useState("");
  const [kitchenManufacturingDays, setKitchenManufacturingDays] = React.useState("");
  const [generalManufacturingDays, setGeneralManufacturingDays] = React.useState("");
  const [fpKitchenManufacturingDays, setFpKitchenManufacturingDays] = React.useState("");
  const [fpGeneralManufacturingDays, setFpGeneralManufacturingDays] = React.useState("");
  const [editingTimelineRuleId, setEditingTimelineRuleId] = React.useState<number | null>(null);

  const carcassRows = React.useMemo(
    () => mapRows(carcassTypesResponse?.data ?? []),
    [carcassTypesResponse],
  );
  const shutterRows = React.useMemo(
    () => mapRows(shutterTypesResponse?.data ?? []),
    [shutterTypesResponse],
  );
  const subShutterRows = React.useMemo(
    () =>
      mapRows(
        (shutterTypesResponse?.data ?? []).flatMap((item) =>
          (item.subTypes ?? []).map((subType) => ({
            ...subType,
            shutterTypeName: item.name,
          })),
        ),
      ),
    [shutterTypesResponse],
  );
  const handleRows = React.useMemo(
    () => mapRows(handleTypesResponse?.data ?? []),
    [handleTypesResponse],
  );
  const timelineRuleRows = React.useMemo(
    () =>
      (timelineRulesResponse?.data ?? []).map((rule: any, index: number) => ({
        srNo: index + 1,
        id: rule.id,
        carcassId: rule.carcass_id,
        shutterId: rule.shutter_id ?? null,
        carcassName: rule.carcass?.name ?? "-",
        shutterName: rule.shutter?.name ?? "-",
        kitchenManufacturingDays:
          rule.kitchen_manufacturing_days != null
            ? String(rule.kitchen_manufacturing_days)
            : "-",
        generalManufacturingDays:
          rule.other_manufacturing_days != null
            ? String(rule.other_manufacturing_days)
            : "-",
        kitchenDays:
          rule.kitchen_manufacturing_days_for_fast_production != null
            ? String(rule.kitchen_manufacturing_days_for_fast_production)
            : "-",
        otherDays:
          rule.other_manufacturing_days_for_fast_production != null
            ? String(rule.other_manufacturing_days_for_fast_production)
            : "-",
      })),
    [timelineRulesResponse],
  );
  const shutterSubTypeOptions = React.useMemo(
    () =>
      (shutterTypesResponse?.data ?? []).flatMap((item) =>
        (item.subTypes ?? []).map((subType) => ({
          id: subType.id,
          name: subType.name,
          shutterTypeId: item.id,
          shutterTypeName: item.name,
        })),
      ),
    [shutterTypesResponse],
  );

  const resetFormState = () => {
    setOpenCreateModal(false);
    setNewValue("");
    setSelectedShutterTypeId("");
    setSelectedCarcassId("");
    setSelectedShutterSubTypeId("");
    setKitchenManufacturingDays("");
    setGeneralManufacturingDays("");
    setFpKitchenManufacturingDays("");
    setFpGeneralManufacturingDays("");
    setEditingTimelineRuleId(null);
  };

  const openTimelineRuleEditModal = (row: TimelineRuleRow) => {
    setActiveTab("timeline-rules");
    setEditingTimelineRuleId(row.id);
    setSelectedCarcassId(String(row.carcassId));
    setKitchenManufacturingDays(
      row.kitchenManufacturingDays === "-" ? "" : row.kitchenManufacturingDays,
    );
    setGeneralManufacturingDays(
      row.generalManufacturingDays === "-" ? "" : row.generalManufacturingDays,
    );
    setFpKitchenManufacturingDays(row.kitchenDays === "-" ? "" : row.kitchenDays);
    setFpGeneralManufacturingDays(row.otherDays === "-" ? "" : row.otherDays);

    const firstMatchingSubType = shutterSubTypeOptions.find(
      (item) => item.shutterTypeId === row.shutterId,
    );
    setSelectedShutterSubTypeId(firstMatchingSubType ? String(firstMatchingSubType.id) : "");
    setOpenCreateModal(true);
  };

  const handleCreate = () => {
    const onSuccess = () => {
      resetFormState();
    };

    if (!vendorId) return;

    if (activeTab === "timeline-rules") {
      if (
        !selectedCarcassId ||
        !selectedShutterSubTypeId ||
        !kitchenManufacturingDays ||
        !generalManufacturingDays
      ) {
        return;
      }

      const selectedSubType = shutterSubTypeOptions.find(
        (item) => item.id === Number(selectedShutterSubTypeId),
      );
      if (!selectedSubType) return;
      const payload = {
        vendor_id: vendorId,
        carcass_id: Number(selectedCarcassId),
        shutter_id: selectedSubType.shutterTypeId,
        kitchen_manufacturing_days: Number(kitchenManufacturingDays),
        other_manufacturing_days: Number(generalManufacturingDays),
        kitchen_manufacturing_days_for_fast_production:
          fpKitchenManufacturingDays === ""
            ? null
            : Number(fpKitchenManufacturingDays),
        other_manufacturing_days_for_fast_production:
          fpGeneralManufacturingDays === ""
            ? null
            : Number(fpGeneralManufacturingDays),
      };

      if (editingTimelineRuleId) {
        updateTimelineRuleMutation.mutate(
          { id: editingTimelineRuleId, ...payload },
          { onSuccess },
        );
      } else {
        createTimelineRuleMutation.mutate(payload, { onSuccess });
      }
      return;
    }

    const trimmed = newValue.trim();
    if (!trimmed) return;

    const payload = { vendor_id: vendorId, name: trimmed };

    if (activeTab === "carcass") {
      createCarcassTypeMutation.mutate(payload, { onSuccess });
      return;
    }

    if (activeTab === "shutter") {
      createShutterTypeMutation.mutate(payload, { onSuccess });
      return;
    }

    if (activeTab === "sub-shutter") {
      if (!selectedShutterTypeId) return;
      createShutterSubTypeMutation.mutate(
        { shutter_type_id: Number(selectedShutterTypeId), name: trimmed },
        { onSuccess },
      );
      return;
    }

    createHandleTypeMutation.mutate(payload, { onSuccess });
  };

  const isCreating =
    createCarcassTypeMutation.isPending ||
    createShutterTypeMutation.isPending ||
    createShutterSubTypeMutation.isPending ||
    createHandleTypeMutation.isPending ||
    createTimelineRuleMutation.isPending ||
    updateTimelineRuleMutation.isPending;

  const activeLabel =
    activeTab === "carcass"
      ? "Carcas Types"
      : activeTab === "shutter"
        ? "Shutter Types"
        : activeTab === "sub-shutter"
          ? "Sub Shutter Types"
          : activeTab === "timeline-rules"
            ? "TimeLine Rules"
            : "Handle Types";

  return (
    <>
      <Card className="rounded-xl border border-dashed bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Specs Master</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and manage the core spec master values for carcass, shutter,
            and handles.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <SmoothTab
            defaultTabId={activeTab}
            className="w-fit"
            contentHeightClass="min-h-[240px]"
            pinTabsToBottom={false}
            onChange={(tabId) => setActiveTab(tabId as SpecTabId)}
            items={[
              {
                id: "carcass",
                title: "Carcas Types",
                color: "bg-black hover:bg-black",
                cardContent: (
                  <SpecsTablePanel
                    label="Carcas Types"
                    rows={carcassRows}
                    isLoading={isCarcassTypesLoading}
                    globalFilter={filters.carcass}
                    onGlobalFilterChange={(value) =>
                      setFilters((prev) => ({ ...prev, carcass: value }))
                    }
                    onOpenCreate={() => setOpenCreateModal(true)}
                  />
                ),
              },
              {
                id: "shutter",
                title: "Shutter Types",
                color: "bg-black hover:bg-black",
                cardContent: (
                  <SpecsTablePanel
                    label="Shutter Types"
                    rows={shutterRows}
                    isLoading={isShutterTypesLoading}
                    globalFilter={filters.shutter}
                    onGlobalFilterChange={(value) =>
                      setFilters((prev) => ({ ...prev, shutter: value }))
                    }
                    onOpenCreate={() => setOpenCreateModal(true)}
                  />
                ),
              },
              {
                id: "sub-shutter",
                title: "Sub Shutter Types",
                color: "bg-black hover:bg-black",
                cardContent: (
                  <SpecsTablePanel
                    label="Sub Shutter Types"
                    rows={subShutterRows}
                    isLoading={isShutterTypesLoading}
                    showParentColumn
                    globalFilter={filters["sub-shutter"]}
                    onGlobalFilterChange={(value) =>
                      setFilters((prev) => ({ ...prev, "sub-shutter": value }))
                    }
                    onOpenCreate={() => setOpenCreateModal(true)}
                  />
                ),
              },
              {
                id: "timeline-rules",
                title: "TimeLine Rules",
                color: "bg-black hover:bg-black",
                cardContent: (
                  <TimelineRulesPanel
                    rows={timelineRuleRows}
                    isLoading={isTimelineRulesLoading}
                    globalFilter={filters["timeline-rules"]}
                    onOpenCreate={() => setOpenCreateModal(true)}
                    onOpenEdit={openTimelineRuleEditModal}
                    onGlobalFilterChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        "timeline-rules": value,
                      }))
                    }
                  />
                ),
              },
              {
                id: "handles",
                title: "Handle Types",
                color: "bg-black hover:bg-black",
                cardContent: (
                  <SpecsTablePanel
                    label="Handle Types"
                    rows={handleRows}
                    isLoading={isHandleTypesLoading}
                    globalFilter={filters.handles}
                    onGlobalFilterChange={(value) =>
                      setFilters((prev) => ({ ...prev, handles: value }))
                    }
                    onOpenCreate={() => setOpenCreateModal(true)}
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog
        open={openCreateModal}
        onOpenChange={(open) => {
          setOpenCreateModal(open);
          if (!open) {
            resetFormState();
          }
        }}
      >
        <DialogContent
          className={
            activeTab === "timeline-rules" ? "sm:max-w-3xl" : undefined
          }
        >
          <DialogHeader>
            <DialogTitle>
              {activeTab === "timeline-rules" && editingTimelineRuleId
                ? `Edit ${activeLabel}`
                : `Add ${activeLabel}`}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "timeline-rules" && editingTimelineRuleId
                ? `Update the selected ${activeLabel.toLowerCase()} entry for this vendor.`
                : `Create a new ${activeLabel.toLowerCase()} spec master entry for this vendor.`}
            </DialogDescription>
          </DialogHeader>

          {activeTab === "timeline-rules" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Carcas Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCarcassId}
                  onValueChange={setSelectedCarcassId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select carcas type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(carcassTypesResponse?.data ?? []).map((carcassType) => (
                      <SelectItem key={carcassType.id} value={String(carcassType.id)}>
                        {carcassType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Shutter Sub Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedShutterSubTypeId}
                  onValueChange={setSelectedShutterSubTypeId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select shutter sub type" />
                  </SelectTrigger>
                  <SelectContent>
                    {shutterSubTypeOptions.map((subType) => (
                      <SelectItem key={subType.id} value={String(subType.id)}>
                        {subType.shutterTypeName} - {subType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kitchen-manf-days">
                  Kitchen Manf. Days <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kitchen-manf-days"
                  type="number"
                  min="0"
                  value={kitchenManufacturingDays}
                  onChange={(e) => setKitchenManufacturingDays(e.target.value)}
                  placeholder="Enter kitchen manufacturing days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="general-manf-days">
                  General Manf. Days <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="general-manf-days"
                  type="number"
                  min="0"
                  value={generalManufacturingDays}
                  onChange={(e) => setGeneralManufacturingDays(e.target.value)}
                  placeholder="Enter general manufacturing days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fp-kitchen-manf-days">
                  FP Kitchen Manf. Days
                </Label>
                <Input
                  id="fp-kitchen-manf-days"
                  type="number"
                  min="0"
                  value={fpKitchenManufacturingDays}
                  onChange={(e) => setFpKitchenManufacturingDays(e.target.value)}
                  placeholder="Enter FP kitchen manufacturing days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fp-general-manf-days">
                  FP General Manf. Days
                </Label>
                <Input
                  id="fp-general-manf-days"
                  type="number"
                  min="0"
                  value={fpGeneralManufacturingDays}
                  onChange={(e) => setFpGeneralManufacturingDays(e.target.value)}
                  placeholder="Enter FP general manufacturing days"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="spec-master-name">
                {activeLabel} Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="spec-master-name"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Enter ${activeLabel.toLowerCase()} name`}
              />
            </div>
          )}

          {activeTab === "sub-shutter" ? (
            <div className="space-y-2">
              <Label>
                Shutter Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedShutterTypeId}
                onValueChange={setSelectedShutterTypeId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select shutter type" />
                </SelectTrigger>
                <SelectContent>
                  {(shutterTypesResponse?.data ?? []).map((shutterType) => (
                    <SelectItem
                      key={shutterType.id}
                      value={String(shutterType.id)}
                    >
                      {shutterType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetFormState();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !vendorId ||
                isCreating ||
                (activeTab !== "timeline-rules" && !newValue.trim()) ||
                (activeTab === "sub-shutter" && !selectedShutterTypeId) ||
                (activeTab === "timeline-rules" &&
                  (!selectedCarcassId ||
                    !selectedShutterSubTypeId ||
                    !kitchenManufacturingDays ||
                    !generalManufacturingDays))
              }
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
