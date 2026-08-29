"use client";

import React, { useMemo, useState } from "react";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import ClearInput from "@/components/origin-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MachineData } from "@/types/track-trace";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  EyeOff,
  Layers,
  ListFilter,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Users,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { useAssignedUsersByMachine } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface TrackTraceWorkstationTableProps {
  data: MachineData[];
  onEditClick: (machine: MachineData) => void;
  onAssignUsersClick: (machineId: number) => void;
  className?: string;
}

function WorkstationColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  const isSorted = column.getIsSorted();

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-extrabold text-xs text-foreground hover:text-foreground data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {isSorted === "asc" ? (
              <ChevronUp className="ml-1 size-3.5 text-primary" />
            ) : isSorted === "desc" ? (
              <ChevronDown className="ml-1 size-3.5 text-primary" />
            ) : (
              <ChevronsUpDown className="ml-1 size-3.5 opacity-60" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            className="cursor-pointer"
          >
            <ChevronUp className="mr-2 size-4 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            className="cursor-pointer"
          >
            <ChevronDown className="mr-2 size-4 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
                className="cursor-pointer text-muted-foreground"
              >
                <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function StatusQuickFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "all";
  const options = [
    { value: "all", label: "All Status", dot: null },
    { value: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
    { value: "MAINTENANCE", label: "Maintenance", dot: "bg-amber-500" },
    { value: "INACTIVE", label: "Inactive", dot: "bg-slate-400" },
    { value: "RETIRED", label: "Retired", dot: "bg-destructive" },
  ];
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed h-8 text-xs">
          {isFiltered ? (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 shrink-0 mr-1"
            >
              <XCircle className="h-3.5 w-3.5" />
            </div>
          ) : (
            <ListFilter className="h-3.5 w-3.5 shrink-0 mr-1" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Status</span>
            {isFiltered && (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-4" />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[110px] flex items-center gap-1"
                >
                  {selectedOption?.dot && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedOption.dot}`}
                    />
                  )}
                  {selectedOption?.label}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
              value === option.value ? "bg-accent text-accent-foreground font-medium" : ""
            }`}
          >
            {option.dot && (
              <span className={`h-2 w-2 rounded-full shrink-0 ${option.dot}`} />
            )}
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ScanTypeQuickFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "all";
  const options = [
    { value: "all", label: "All Scan Types" },
    { value: "IN", label: "IN" },
    { value: "OUT", label: "OUT" },
    { value: "PAAS", label: "PAAS" },
    { value: "BOTH", label: "BOTH" },
  ];
  const selectedOption = options.find((o) => o.value === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed h-8 text-xs">
          {isFiltered ? (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 shrink-0 mr-1"
            >
              <XCircle className="h-3.5 w-3.5" />
            </div>
          ) : (
            <ListFilter className="h-3.5 w-3.5 shrink-0 mr-1" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Scan Type</span>
            {isFiltered && (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-4" />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[110px]"
                >
                  {selectedOption?.label}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
              value === option.value ? "bg-accent text-accent-foreground font-medium" : ""
            }`}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function AssignedCountBadge({ machineId }: { machineId: number }) {
  const { data } = useAssignedUsersByMachine(machineId);
  const count = data?.count ?? 0;
  if (count === 0) return null;
  return (
    <Badge
      variant="secondary"
      className="ml-1 px-1.5 py-0 h-4 text-[10px] font-bold bg-primary/10 text-primary border-primary/20"
    >
      {count}
    </Badge>
  );
}

export default function TrackTraceWorkstationTable({
  data,
  onEditClick,
  onAssignUsersClick,
  className,
}: TrackTraceWorkstationTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sequence_no", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scanTypeFilter, setScanTypeFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const debouncedSearch = useDebouncedCallback((val: string) => {
    setGlobalFilter(val.trim());
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return (data ?? []).filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      // Scan Type filter
      if (scanTypeFilter !== "all" && item.scan_type !== scanTypeFilter) {
        return false;
      }
      // Global Search
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        const matchesName = item.machine_name?.toLowerCase().includes(q);
        const matchesCode = item.machine_code?.toLowerCase().includes(q);
        const matchesType = item.machine_type?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesType && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [data, statusFilter, scanTypeFilter, globalFilter]);

  const columns = useMemo<ColumnDef<MachineData>[]>(
    () => [
      {
        id: "serialNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {row.index + 1}
          </span>
        ),
        size: 45,
      },
      {
        accessorKey: "sequence_no",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="SEQ" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-background text-[10px] font-bold">
              {row.original.sequence_no}
            </span>
          </div>
        ),
        size: 70,
      },
      {
        accessorKey: "image_path",
        header: () => <span className="font-extrabold text-xs">IMAGE</span>,
        cell: ({ row }) => {
          const img = row.original.image_path;
          return (
            <div className="relative size-10 rounded-lg border overflow-hidden bg-muted/50 flex items-center justify-center shrink-0">
              {img ? (
                <Image
                  src={img}
                  alt={row.original.machine_name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase">
                  N/A
                </span>
              )}
            </div>
          );
        },
        size: 60,
      },
      {
        accessorKey: "machine_name",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Workstation Name" />
        ),
        cell: ({ row }) => (
          <div className="min-w-[170px] space-y-0.5">
            <p className="font-semibold text-sm text-foreground capitalize">
              {row.original.machine_name}
            </p>
            {row.original.description && (
              <p
                className="text-xs text-muted-foreground line-clamp-1 max-w-[240px]"
                title={row.original.description}
              >
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "machine_code",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="font-mono text-xs uppercase bg-muted/40 font-semibold"
          >
            {row.original.machine_code}
          </Badge>
        ),
      },
      {
        accessorKey: "machine_type",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground capitalize">
            {row.original.machine_type || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.original.status?.toUpperCase();
          const badgeStyles: Record<string, string> = {
            ACTIVE:
              "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30",
            MAINTENANCE:
              "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30",
            INACTIVE:
              "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-500/30",
            RETIRED:
              "bg-destructive/15 text-destructive border-destructive/30",
          };

          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize",
                badgeStyles[status] || "bg-muted text-muted-foreground"
              )}
            >
              {row.original.status || "Active"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "scan_type",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Scan Type" />
        ),
        cell: ({ row }) => {
          const scanType = row.original.scan_type?.toUpperCase();
          const scanStyles: Record<string, string> = {
            IN: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
            OUT: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
            PAAS: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
            BOTH: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
          };

          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-md uppercase",
                scanStyles[scanType] || "bg-muted text-muted-foreground"
              )}
            >
              {row.original.scan_type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "target_per_hour",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Target / Hr" />
        ),
        cell: ({ row }) => (
          <div className="text-xs font-bold tabular-nums">
            {row.original.target_per_hour ?? 0}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">
              sqft
            </span>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <WorkstationColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        id: "assignUsers",
        header: () => (
          <div className="text-center font-extrabold text-xs">OPERATORS</div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 rounded-md gap-1 shadow-none hover:bg-primary/5 hover:border-primary/40"
              onClick={(e) => {
                e.stopPropagation();
                onAssignUsersClick(row.original.id);
              }}
            >
              <Users size={12} className="text-muted-foreground" />
              <span>Assign</span>
              <AssignedCountBadge machineId={row.original.id} />
            </Button>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-extrabold text-xs">ACTION</div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={16} />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => onEditClick(row.original)}
                >
                  <Pencil size={14} />
                  Edit Workstation
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => onAssignUsersClick(row.original.id)}
                >
                  <Users size={14} />
                  Assign Users
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-xs"
                  onClick={() => handleCopyCode(row.original.machine_code)}
                >
                  {copiedCode === row.original.machine_code ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                  Copy Machine Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEditClick, onAssignUsersClick, copiedCode]
  );

  const tableInstance = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
      sorting,
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getRowId: (row) => String(row.id),
  });

  const resetFilters = () => {
    setLocalSearch("");
    setGlobalFilter("");
    setStatusFilter("all");
    setScanTypeFilter("all");
    setColumnFilters([]);
  };

  const isAnyFilterActive =
    (localSearch && localSearch.trim() !== "") ||
    statusFilter !== "all" ||
    scanTypeFilter !== "all" ||
    columnFilters.length > 0;

  return (
    <div className="py-2">
      {/* Header Toolbar matching Manage Projects table */}
      <div className="px-4 mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <ClearInput
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search workstations..."
            className="h-8 w-64"
          />

          {/* Status Filter */}
          <StatusQuickFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />

          {/* Scan Type Filter */}
          <ScanTypeQuickFilter
            value={scanTypeFilter}
            onChange={setScanTypeFilter}
          />

          {/* Created At Date Filter */}
          {tableInstance.getColumn("created_at") && (
            <DataTableDateFilter
              column={tableInstance.getColumn("created_at")!}
              title="Created At"
              multiple
            />
          )}

          {/* Reset Filters */}
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DataTableViewOptions table={tableInstance} />
        </div>
      </div>

      {/* Tanstack DataTable with pagination & interactive double-click */}
      <DataTable
        table={tableInstance}
        showPagination={true}
        onRowDoubleClick={(row) => onEditClick(row)}
        rowClassName={() => "hover:bg-primary/5 cursor-pointer"}
        className={cn("pt-1 px-4", className)}
      />
    </div>
  );
}
