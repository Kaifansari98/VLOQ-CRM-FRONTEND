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
import {
  ProjectSortBy,
  ProjectSortOrder,
  TrackTraceProjectListRow,
} from "@/api/track-trace/track-trace.api";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  EyeOff,
  Layers,
  ListFilter,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Trash2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface TrackTraceProjectTableProps {
  table: TrackTraceProjectListRow[];
  page: number;
  limit: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  sortBy?: ProjectSortBy;
  sortOrder?: ProjectSortOrder;
  onSort?: (field: ProjectSortBy) => void;
  onRowDoubleClick?: (row: TrackTraceProjectListRow) => void;
  onCutListClick?: (row: TrackTraceProjectListRow) => void;
  onProjectDetailClick?: (row: TrackTraceProjectListRow) => void;
  onEditClick?: (row: TrackTraceProjectListRow) => void;
  onDeleteClick?: (row: TrackTraceProjectListRow) => void;
  isDeleting?: boolean;
  className?: string;

  // Additional Filter Props
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  ttStatusFilter?: string;
  onTTStatusChange?: (status: string) => void;
  deletedFilter?: string;
  onDeletedChange?: (deleted: string) => void;
  onResetFilters?: () => void;
}

function ProjectColumnHeader<TData, TValue>({
  column,
  title,
  sortField,
  onSort,
  sortBy,
  sortOrder,
}: {
  column: Column<TData, TValue>;
  title: string;
  sortField?: ProjectSortBy;
  onSort?: (field: ProjectSortBy) => void;
  sortBy?: ProjectSortBy;
  sortOrder?: ProjectSortOrder;
}) {
  const isSortedByThisField = sortField && sortBy === sortField;
  const isAsc = isSortedByThisField
    ? sortOrder === "asc"
    : column.getIsSorted() === "asc";
  const isDesc = isSortedByThisField
    ? sortOrder === "desc"
    : column.getIsSorted() === "desc";

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
            {isAsc ? (
              <ChevronUp className="ml-1 size-3.5 text-primary" />
            ) : isDesc ? (
              <ChevronDown className="ml-1 size-3.5 text-primary" />
            ) : (
              <ChevronsUpDown className="ml-1 size-3.5 opacity-60" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem
            onClick={() => {
              if (sortField && onSort) {
                if (!isSortedByThisField || sortOrder !== "asc") {
                  onSort(sortField);
                }
              } else {
                column.toggleSorting(false);
              }
            }}
            className="cursor-pointer"
          >
            <ChevronUp className="mr-2 size-4 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (sortField && onSort) {
                if (!isSortedByThisField || sortOrder !== "desc") {
                  onSort(sortField);
                }
              } else {
                column.toggleSorting(true);
              }
            }}
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

function TTStatusQuickFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "all";
  const options = [
    { value: "all", label: "All T&T Status", dot: null },
    { value: "Not Started", label: "Not Started", dot: "bg-gray-400" },
    { value: "Started", label: "Started", dot: "bg-indigo-500" },
    { value: "Completed", label: "Completed", dot: "bg-emerald-500" },
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
            <span className="truncate">T&T Status</span>
            {isFiltered && (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-4" />
                <Badge variant="secondary" className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[110px] flex items-center gap-1">
                  {selectedOption?.dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedOption.dot}`} />}
                  {selectedOption?.label}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
              value === option.value ? "bg-accent text-accent-foreground font-medium" : ""
            }`}
          >
            {option.dot && <span className={`h-2 w-2 rounded-full shrink-0 ${option.dot}`} />}
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function DeletedStatusQuickFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "active";
  const options = [
    { value: "active", label: "Active Projects" },
    { value: "deleted", label: "Deleted Projects" },
    { value: "all", label: "All Projects" },
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
                onChange("active");
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 shrink-0 mr-1"
            >
              <XCircle className="h-3.5 w-3.5" />
            </div>
          ) : (
            <ListFilter className="h-3.5 w-3.5 shrink-0 mr-1" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Project Status</span>
            {isFiltered && (
              <>
                <Separator orientation="vertical" className="mx-0.5 h-4" />
                <Badge variant="secondary" className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[110px]">
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
            className={`w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
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

export default function TrackTraceProjectTable({
  table,
  page,
  limit,
  totalCount,
  totalPages,
  onPageChange,
  onLimitChange,
  sortBy,
  sortOrder,
  onSort,
  onRowDoubleClick,
  onCutListClick,
  onProjectDetailClick,
  onEditClick,
  onDeleteClick,
  isDeleting = false,
  className,
  searchQuery = "",
  onSearchChange,
  ttStatusFilter = "all",
  onTTStatusChange,
  deletedFilter = "active",
  onDeletedChange,
  onResetFilters,
}: TrackTraceProjectTableProps) {
  const userTypeId = useAppSelector((state) => state.auth.user?.user_type_id);
  const canDelete = userTypeId === 1 || userTypeId === 2;

  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  React.useEffect(() => {
    if (searchQuery === "") {
      setLocalSearch("");
      setGlobalFilter("");
    }
  }, [searchQuery]);

  const debouncedOnSearchChange = useDebouncedCallback((val: string) => {
    onSearchChange?.(val);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    setGlobalFilter(val);
    debouncedOnSearchChange(val);
  };

  const columns = useMemo<ColumnDef<TrackTraceProjectListRow>[]>(
    () => [
      {
        id: "serialNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {(page - 1) * limit + row.index + 1}
          </span>
        ),
        size: 50,
      },
      {
        accessorKey: "order_no",
        header: ({ column }) => (
          <ProjectColumnHeader
            column={column}
            title="Order No."
            sortField="order_no"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-sm">
            {row.original.order_no || row.original.lead?.lead_code || "-"}
          </span>
        ),
      },
      {
        accessorKey: "project_name",
        header: ({ column }) => (
          <ProjectColumnHeader
            column={column}
            title="Project Name"
            sortField="project_name"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {row.original.project_name}
              </span>
              {row.original.isDeleted && (
                <Badge variant="destructive" className="text-[10px]">
                  Deleted
                </Badge>
              )}
            </div>
            {row.original.isDeleted && row.original.deleted_at && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Deleted {new Date(row.original.deleted_at).toLocaleString()}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "track_trace_status",
        header: ({ column }) => (
          <ProjectColumnHeader
            column={column}
            title="T&T Status"
            sortField="track_trace_status"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.track_trace_status ?? "Not Started";
          return (
            <Badge
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                status === "Completed"
                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : status === "Started"
                  ? "bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 dark:bg-indigo-500/20 dark:text-indigo-400"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              )}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "client",
        header: ({ column }) => (
          <ProjectColumnHeader column={column} title="CLIENT" />
        ),
        cell: ({ row }) => {
          const clientName =
            row.original.client_name ||
            [row.original.lead?.firstname, row.original.lead?.lastname]
              .filter(Boolean)
              .join(" ") ||
            "-";
          return (
            <div className="min-w-[160px]">
              <p className="font-medium text-sm">{clientName}</p>
              {row.original.lead?.lead_code && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {row.original.lead.lead_code}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "contact",
        header: ({ column }) => (
          <ProjectColumnHeader column={column} title="CONTACT" />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm">
            {row.original.client_contact_no ||
              row.original.lead?.contact_no ||
              "-"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <ProjectColumnHeader
            column={column}
            title="Created"
            sortField="created_at"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "-"}
          </span>
        ),
      },
      {
        id: "action",
        header: () => <div className="text-center font-extrabold text-xs">ACTION</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {row.original.isDeleted ? (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Deleted
              </Badge>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={18} />
                    <span className="sr-only">Open actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick?.(row.original);
                    }}
                  >
                    <Pencil size={14} />
                    Edit Project
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCutListClick?.(row.original);
                    }}
                  >
                    <Layers size={14} />
                    Cut List
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectDetailClick?.(row.original);
                    }}
                  >
                    <PackageOpen size={14} />
                    Details & Boxes
                  </DropdownMenuItem>

                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isDeleting}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick?.(row.original);
                        }}
                      >
                        <Trash2 size={14} />
                        {isDeleting ? "Deleting..." : "Delete Project"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ),
      },
    ],
    [page, limit, sortBy, sortOrder, onSort, canDelete, isDeleting]
  );

  const tableInstance = useReactTable({
    data: table ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: totalPages !== undefined,
    pageCount: totalPages ?? 1,
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
      sorting,
      globalFilter,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: (row) => String(row.unique_project_id ?? row.id),
  });

  const isAnyFilterActive =
    (localSearch && localSearch.trim() !== "") ||
    ttStatusFilter !== "all" ||
    deletedFilter !== "active" ||
    columnFilters.length > 0;

  return (
    <div className="py-2">
      {/* Header Toolbar matching UniversalTable */}
      <div className="px-4 mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <ClearInput
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="h-8 w-64"
          />

          {/* Created At Date Filter */}
          {tableInstance.getColumn("created_at") && (
            <DataTableDateFilter
              column={tableInstance.getColumn("created_at")!}
              title="Created At"
              multiple
            />
          )}

          {/* T&T Status Filter */}
          {onTTStatusChange && (
            <TTStatusQuickFilter
              value={ttStatusFilter}
              onChange={onTTStatusChange}
            />
          )}

          {/* Deleted Status Filter */}
          {onDeletedChange && (
            <DeletedStatusQuickFilter
              value={deletedFilter}
              onChange={onDeletedChange}
            />
          )}

          {/* Reset Filters */}
          {isAnyFilterActive && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
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

      {/* Table */}
      <DataTable
        table={tableInstance}
        showPagination={true}
        onRowDoubleClick={(row) => {
          if (!row.isDeleted) {
            onRowDoubleClick?.(row);
          }
        }}
        rowClassName={(row) =>
          row.isDeleted
            ? "bg-muted/30 opacity-75"
            : "hover:bg-primary/5 cursor-pointer"
        }
        className={cn("pt-1 px-4", className)}
      />
    </div>
  );
}