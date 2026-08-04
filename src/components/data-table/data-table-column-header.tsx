"use client";

import type { Column } from "@tanstack/react-table";
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
import LeadCodeFranchiseFilter from "./lead-code-franchise-filter";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.ComponentProps<typeof Button> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const meta = ((column as any).table?.options?.meta ?? {}) as any;
  const columnMeta = (column.columnDef.meta ?? {}) as Record<string, any>;
  const isFurnitureColumn = column.id === "furnitureType";
  const isLeadCodeColumn = column.id === "lead_code" || title === "Lead Code";
  const isSalesColumn =
    column.id === "assign_to" || column.id === "assignedToName";
  const isSiteTypeColumn = column.id === "siteType";
  const isStructureColumn = column.id === "furnitueStructures";
  const isAddressColumn = column.id === "siteAddress";
  const isSourceColumn = column.id === "source";
  const isSiteMapColumn = column.id === "site_map_link";
  const isSalesExecutiveColumn = column.id === "sales_executive";
  const isStageColumn = column.id === "status";
  const isTastTypeColumn = column.id === "taskType";
  const isPriorityColumn = column.id === "priority";
  const adminTaskStatusFilter = meta.adminTaskStatusFilter as
    | { onClear?: () => void }
    | undefined;
  const adminTaskSalesExecutiveFilter = meta.adminTaskSalesExecutiveFilter as
    | { onClear?: () => void }
    | undefined;
  const leadCodeFranchiseFilter = meta.leadCodeFranchiseFilter as
    | {
        enabled?: boolean;
        value?: (string | number)[];
        onClear?: () => void;
      }
    | undefined;
  const useLeadCodeFranchiseFilter =
    isLeadCodeColumn &&
    (columnMeta.useFranchiseFilter === true ||
      leadCodeFranchiseFilter?.enabled === true);

  const filterValue = column.getFilterValue();
  const hasColumnFilter = Array.isArray(filterValue)
    ? filterValue.length > 0
    : Boolean(filterValue);
  const hasLeadCodeFranchiseFilter =
    useLeadCodeFranchiseFilter &&
    Array.isArray(leadCodeFranchiseFilter?.value) &&
    leadCodeFranchiseFilter.value.length > 0;
  const hasActiveFilter = hasColumnFilter || hasLeadCodeFranchiseFilter;

  const showHeaderIcon =
    column.getCanSort() ||
    isFurnitureColumn ||
    useLeadCodeFranchiseFilter ||
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

  if (useLeadCodeFranchiseFilter) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "-ml-3 h-8 data-[state=open]:bg-accent",
                hasActiveFilter && "text-primary",
              )}
              aria-label={`Open ${title} filter`}
            >
              <span>{title}</span>
              <Filter className="ml-1 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[22rem] p-0">
            <LeadCodeFranchiseFilter column={column as any} />

            {hasActiveFilter && (
              <>
                <div className="border-t" />
                <button
                  type="button"
                  onClick={() => {
                    leadCodeFranchiseFilter?.onClear?.();
                    column.setFilterValue([]);
                  }}
                  className="flex w-full items-center px-4 py-3 text-left text-sm hover:bg-accent"
                >
                  <X className="mr-2 size-4" />
                  Clear Filter
                </button>
              </>
            )}

            {column.getCanHide() && (
              <>
                <div className="border-t" />
                <button
                  type="button"
                  onClick={() => column.toggleVisibility(false)}
                  className="flex w-full items-center px-4 py-3 text-left text-sm hover:bg-accent"
                >
                  <EyeOff className="mr-2 size-4 text-muted-foreground/70" />
                  Hide
                </button>
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
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
              useLeadCodeFranchiseFilter
                ? `Open ${title} filter`
                : column.getCanSort()
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
              (useLeadCodeFranchiseFilter ? (
                <Filter className="ml-1 size-4" />
              ) : column.getIsSorted() === "desc" ? (
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
          {/* FURNITURE FILTER */}
          {isFurnitureColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <FurnitureFilter column={column as any} />
            </div>
          )}

          {/* SALES ASSIGNT TO FILTER FOR TASK TABLE */}
          {isSalesColumn && (
            <div onClick={(e) => e.preventDefault()}>
              <AssignToFilter column={column as any} />
            </div>
          )}

          {isSalesExecutiveColumn && (
            <div onClick={(e) => e.preventDefault()}>
              <SalesExecutiveFilter column={column as any} />
            </div>
          )}

          {/* SITE TYPE FILTER */}
          {isSiteTypeColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <SiteTypeFilter column={column as any} />
            </div>
          )}

          {isStageColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <StageTypeFilter column={column as any} />
            </div>
          )}

          {isPriorityColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <PriorityFilter column={column as any} />
            </div>
          )}
          {isStructureColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <ProductStructureFilter column={column as any} />
            </div>
          )}

          {/* SITE ADDRESS FILTER */}
          {isAddressColumn && (
            <div onClick={(e) => e.preventDefault()}>
              <SiteAddressFilter column={column as any} />
            </div>
          )}
          {/* SOURCE FILTER */}
          {isSourceColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <SourceFilter column={column as any} />
            </div>
          )}

          {isTastTypeColumn && (  
           <div onSelect={(e) => e.preventDefault()}>
            <TaskTypeFilterPicker column={column as any} />
           </div> 
          )}

          {/* SITE MAP lINK FILTER */}
          {isSiteMapColumn && (
            <div onSelect={(e) => e.preventDefault()}>
              <SiteMapLinkFilter column={column as any} />
            </div>
          )}
          {column.getCanSort() && !useLeadCodeFranchiseFilter && (
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
                  } else if (
                    useLeadCodeFranchiseFilter &&
                    leadCodeFranchiseFilter?.onClear
                  ) {
                    leadCodeFranchiseFilter.onClear();
                    column.setFilterValue([]);
                  }

                  if (!useLeadCodeFranchiseFilter) {
                    column.setFilterValue([]);
                  }
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
