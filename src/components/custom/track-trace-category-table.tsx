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
import type { ProjectCategory } from "@/api/track-trace/project-categories.api";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  EyeOff,
  GitBranch,
  ListFilter,
  MoreHorizontal,
  Package,
  PackageCheck,
  Boxes,
  Pencil,
  RotateCcw,
  XCircle,
  Power,
} from "lucide-react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface TrackTraceCategoryTableProps {
  data: ProjectCategory[];
  page: number;
  limit: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  typeFilter?: string;
  onTypeChange?: (type: string) => void;
  onResetFilters?: () => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  onEditClick: (category: ProjectCategory) => void;
  onToggleStatusClick: (category: ProjectCategory) => void;
  isToggling?: boolean;
  isScanPackEnabled?: boolean;
  className?: string;
}

function CategoryColumnHeader<TData, TValue>({
  column,
  title,
  sortField,
  onSort,
  sortBy,
  sortOrder,
}: {
  column: Column<TData, TValue>;
  title: string;
  sortField?: string;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
    { value: "Yes", label: "Active", dot: "bg-emerald-500" },
    { value: "No", label: "Inactive", dot: "bg-slate-400" },
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
      <PopoverContent className="w-40 p-1" align="start">
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

function CategoryTypeQuickFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "all";
  const options = [
    { value: "all", label: "All Categories" },
    { value: "main", label: "Main Categories" },
    { value: "sub", label: "Sub Categories" },
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
            <span className="truncate">Type</span>
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
      <PopoverContent className="w-44 p-1" align="start">
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

function IOSSwitch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-emerald-500" : "bg-muted-foreground/30"
      )}
      title={checked ? "Deactivate Category" : "Activate Category"}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function TrackTraceCategoryTable({
  data,
  page,
  limit,
  totalCount,
  totalPages,
  onPageChange,
  onLimitChange,
  searchQuery = "",
  onSearchChange,
  statusFilter = "all",
  onStatusChange,
  typeFilter = "all",
  onTypeChange,
  onResetFilters,
  sortBy,
  sortOrder,
  onSort,
  onEditClick,
  onToggleStatusClick,
  isToggling = false,
  isScanPackEnabled = false,
  className,
}: TrackTraceCategoryTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const debouncedSearch = useDebouncedCallback((val: string) => {
    onSearchChange?.(val);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };

  const columns = useMemo<ColumnDef<ProjectCategory>[]>(() => {
    const cols: ColumnDef<ProjectCategory>[] = [
      {
        id: "serialNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {(page - 1) * limit + row.index + 1}
          </span>
        ),
        size: 45,
      },
      {
        accessorKey: "category_name",
        header: ({ column }) => (
          <CategoryColumnHeader
            column={column}
            title="Category Name"
            sortField="category_name"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => {
          const category = row.original;
          const isSubCategory = !!category.parent_id;
          return (
            <div className="min-w-[200px] space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isSubCategory && (
                  <GitBranch className="size-3.5 text-indigo-500/70 shrink-0" />
                )}
                <span className="font-semibold text-sm text-foreground">
                  {category.category_name}
                </span>
                {isSubCategory && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-1.5 py-0"
                  >
                    Sub
                  </Badge>
                )}
                {Boolean((category as any).external_category_id) && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1.5 py-0 text-muted-foreground border-muted-foreground/30"
                  >
                    CadBid
                  </Badge>
                )}
              </div>
              {category.parent && (
                <p className="text-[11px] text-muted-foreground pl-5">
                  Under:{" "}
                  <span className="font-semibold text-foreground">
                    {category.parent.category_name}
                  </span>
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "prefix",
        header: ({ column }) => (
          <CategoryColumnHeader
            column={column}
            title="Prefix / Code"
            sortField="prefix"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => {
          const prefix = row.original.prefix;
          return (
            <Badge
              variant="outline"
              className="font-mono text-xs font-semibold uppercase bg-muted/40"
            >
              {prefix || "—"}
            </Badge>
          );
        },
      },
      {
        id: "assigned_modules",
        header: "Assigned Modules",
        cell: ({ row }) => {
          const assignedModules =
            row.original.projectCategoriesMasterVendorMapping || [];
          if (assignedModules.length === 0) {
            return (
              <span className="text-xs text-muted-foreground italic">
                No modules assigned
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
              {assignedModules.map((m) => (
                <Badge
                  key={m.id}
                  variant="secondary"
                  className="text-[10px] font-semibold px-2 py-0.5"
                >
                  {m.projectCategoriesTypeMaster?.module_name || "Module"}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "packing_options",
        header: "Packing & Scan Validation",
        cell: ({ row }) => {
          const category = row.original;
          const isSubCategory = !!category.parent_id;
          const includeInPacking = category.include_in_packing ?? false;
          const scanPackValidate = category.scan_pack_validate ?? false;
          const useInAssembledPacking = category.use_in_assembled_packing ?? false;

          if (isSubCategory) {
            return (
              <span className="text-xs text-muted-foreground italic">
                Inherited from parent
              </span>
            );
          }

          if (!includeInPacking && !scanPackValidate && !useInAssembledPacking) {
            return (
              <span className="text-xs text-muted-foreground italic">
                Not configured
              </span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1.5 items-center">
              {includeInPacking && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1 px-2 py-0.5"
                >
                  <Package className="size-3" /> Include in Packing
                </Badge>
              )}
              {scanPackValidate && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1 px-2 py-0.5"
                >
                  <PackageCheck className="size-3" /> Scan & Pack
                </Badge>
              )}
              {useInAssembledPacking && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 gap-1 px-2 py-0.5"
                >
                  <Boxes className="size-3" /> Assembled
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <CategoryColumnHeader
            column={column}
            title="Status"
            sortField="status"
            onSort={onSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ),
        cell: ({ row }) => {
          const isActive = row.original.status === "Yes";
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <IOSSwitch
                checked={isActive}
                onCheckedChange={() => onToggleStatusClick(row.original)}
                disabled={isToggling}
              />
            </div>
          );
        },
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
                  Edit Category
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-xs"
                  onClick={() => onToggleStatusClick(row.original)}
                >
                  <Power size={14} />
                  {row.original.status === "Yes" ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ];

    return isScanPackEnabled
      ? cols
      : cols.filter((col) => col.id !== "packing_options");
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    onSort,
    isScanPackEnabled,
    onEditClick,
    onToggleStatusClick,
    isToggling,
  ]);

  const tableInstance = useReactTable({
    data: data ?? [],
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
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getRowId: (row) => String(row.id),
  });

  const isAnyFilterActive =
    (localSearch && localSearch.trim() !== "") ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
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
            placeholder="Search categories..."
            className="h-8 w-64"
          />

          {/* Status Quick Filter */}
          {onStatusChange && (
            <StatusQuickFilter
              value={statusFilter}
              onChange={onStatusChange}
            />
          )}

          {/* Category Type Filter */}
          {onTypeChange && (
            <CategoryTypeQuickFilter
              value={typeFilter}
              onChange={onTypeChange}
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

      {/* Tanstack DataTable with server-side pagination & interactive double-click */}
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
