"use client";

import type { Column, Table } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  EyeOff,
  Filter,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import FurnitureFilter from "./furniture-filter";
import SalesExecutiveFilter from "./sales-executive-filter";
import SiteTypeFilter from "./site-type-filter";
import ProductStructureFilter from "./product-structure-filter";
import SiteAddressFilter from "./site-address-filter";
import SourceFilter from "./source-filter";
import SiteMapLinkFilter from "./site-map-link-filter";
import AssignToFilter from "./assign-to-filter";
import StageTypeFilter from "./stage-type-filter";
import TaskTypeFilterPicker from "./data-table-task-filter";
import PriorityFilter from "./priority-filter";
import FranchisesFilter from "./franchises-filter";
import FilterPicker from "./filter-picker";


interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.ComponentProps<typeof Button> {
  column: Column<TData, TValue>;
  table?: Table<TData>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  table,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const meta = (table?.options?.meta ?? (column as any).table?.options?.meta ?? {}) as any;
  const isB2b = meta.isB2b ?? false;
  const isFurnitureColumn = column.id === "furnitureType";
  const isLeadCodeColumn =
    column.id === "lead_code" || column.id === "leadCode" || title === "Lead Code";
  const isSalesColumn =
    column.id === "assign_to" || column.id === "assignedToName";
  const isSiteTypeColumn = column.id === "siteType";
  const isStructureColumn = column.id === "furnitueStructures";
  const isAddressColumn = column.id === "siteAddress";
  const isSourceColumn = column.id === "source";
  const isSiteMapColumn = column.id === "site_map_link";
  const isSalesExecutiveColumn = column.id === "sales_executive";
  const isStageColumn = false;
  const isTastTypeColumn = column.id === "taskType";
  const isPriorityColumn = column.id === "priority";
  const adminTaskStatusFilter = meta.adminTaskStatusFilter as
    | { onClear?: () => void }
    | undefined;
  const adminTaskSalesExecutiveFilter = meta.adminTaskSalesExecutiveFilter as
    | { onClear?: () => void }
    | undefined;
  const filterValue = column.getFilterValue();
  const hasActiveFilter = Array.isArray(filterValue)
    ? filterValue.length > 0
    : Boolean(filterValue);

  const showHeaderIcon =
    column.getCanSort() ||
    isFurnitureColumn ||
    isSalesColumn ||
    isSiteTypeColumn ||
    isStructureColumn ||
    isAddressColumn ||
    isSourceColumn ||
    isSiteMapColumn ||
    isSalesExecutiveColumn ||
    isStageColumn || isTastTypeColumn || isPriorityColumn;

  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }



  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "-ml-3 h-8 data-[state=open]:bg-accent",
              hasActiveFilter && "text-primary",
            )}
            aria-label={
              column.getCanSort()
                ? column.getIsSorted() === "desc"
                  ? `Sorted descending. Click to sort ascending.`
                  : column.getIsSorted() === "asc"
                    ? `Sorted ascending. Click to sort descending.`
                    : `Not sorted. Click to sort ascending.`
                : undefined
            }
          >
            <span>{title}</span>

            {showHeaderIcon &&
              (column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-1 size-4" />
              ) : column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-1 size-4" />
              ) : hasActiveFilter ? (
                <Filter className="ml-1 size-4" />
              ) : (
                <ChevronsUpDown className="ml-1 size-4" />
              ))}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="p-0">
          {/* FRANCHISES FILTER (for Lead Code) */}
          {isLeadCodeColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <FranchisesFilter column={column as any} table={table as any} />
            </div>
          )}

          {/* FURNITURE FILTER */}
          {isFurnitureColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <FurnitureFilter column={column as any} isB2b={isB2b} />
            </div>
          )}

          {/* SALES ASSIGNT TO FILTER FOR TASK TABLE */}
          {isSalesColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <AssignToFilter column={column as any} />
            </div>
          )}

          {isSalesExecutiveColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <SalesExecutiveFilter column={column as any} table={table as any} />
            </div>
          )}

          {/* SITE TYPE FILTER */}
          {isSiteTypeColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <SiteTypeFilter column={column as any} />
            </div>
          )}

          {isStageColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <StageTypeFilter column={column as any} table={table as any} />
            </div>
          )}

          {isPriorityColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <PriorityFilter column={column as any} />
            </div>
          )}
          {isStructureColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <ProductStructureFilter column={column as any} isB2b={isB2b} />
            </div>
          )}

          {/* SITE ADDRESS FILTER */}
          {isAddressColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <SiteAddressFilter column={column as any} />
            </div>
          )}

          {/* SOURCE FILTER */}
          {isSourceColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <SourceFilter column={column as any} />
            </div>
          )}

          {isSiteMapColumn && (
            <div onClick={(e) => e.stopPropagation()}>
              <SiteMapLinkFilter column={column as any} />
            </div>
          )}

          {isTastTypeColumn && adminTaskStatusFilter && (
            <div onClick={(e) => e.stopPropagation()}>
              <div className="w-full min-w-[200px] max-w-[200px]">
                <FilterPicker
                  data={[
                    { id: "pending", label: "Pending" },
                    { id: "completed", label: "Completed" },
                  ]}
                  value={(column.getFilterValue() as string[]) ?? []}
                  onChange={(val) => column.setFilterValue(val)}
                  placeholder="Task Status"
                  emptyLabel="Select Status"
                  multiple
                />
              </div>
            </div>
          )}

          {isSalesExecutiveColumn && adminTaskSalesExecutiveFilter && (
            <div onClick={(e) => e.stopPropagation()}>
              <div className="w-full min-w-[200px] max-w-[200px]">
                <FilterPicker
                  data={adminTaskSalesExecutiveFilter as any}
                  value={(column.getFilterValue() as string[]) ?? []}
                  onChange={(val) => column.setFilterValue(val)}
                  placeholder="Sales Executive"
                  emptyLabel="Select Executive"
                  multiple
                />
              </div>
            </div>
          )}

          {column.getCanSort() && (
            <>
              <DropdownMenuItem
                onClick={() => column.toggleSorting(false)}
                className="m-1"
              >
                <ChevronUp className="mr-2 size-4 text-muted-foreground/70" />
                Asc
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => column.toggleSorting(true)}
                className="m-1"
              >
                <ChevronDown className="mr-2 size-4 text-muted-foreground/70" />
                Desc
              </DropdownMenuItem>

              {column.getIsSorted() && (
                <DropdownMenuItem
                  onClick={() => column.clearSorting()}
                  className="m-1"
                >
                  <ChevronsUpDown className="mr-2 size-4 text-muted-foreground/70" />
                  Clear Sort
                </DropdownMenuItem>
              )}

              {isFurnitureColumn && <DropdownMenuSeparator />}
            </>
          )}

          {/* CLEAR FILTER */}
          {hasActiveFilter && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (isStageColumn && adminTaskStatusFilter?.onClear) {
                    adminTaskStatusFilter.onClear();
                  } else if (
                    isSalesExecutiveColumn &&
                    adminTaskSalesExecutiveFilter?.onClear
                  ) {
                    adminTaskSalesExecutiveFilter.onClear();
                  }

                  column.setFilterValue([]);
                }}
                className="m-1"
              >
                <X className="mr-2 size-4" />
                Clear Filter
              </DropdownMenuItem>
            </>
          )}

          {/* HIDE COLUMN */}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
                className="m-1"
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
