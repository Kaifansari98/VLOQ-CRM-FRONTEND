// components/custom/cutlist-columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

export function getCutListColumns(
  machineColumns: string[],
  onMachineHeaderClick?: (machineName: string) => void,
  onMachineCellClick?: (
    cutListId: number,
    machineId: number,
    machineName: string,
    currentlyAssigned: boolean,
  ) => void,
  data?: any[], // ✅ add this
  isAssignmentDisabled?: boolean,
): ColumnDef<any>[] {
  // ✅ Build unique option lists from data
  const uniqueGroups = Array.from(
    new Set((data ?? []).map((row) => row.group_name).filter(Boolean)),
  ).sort();

  const uniqueCategories = Array.from(
    new Set(
      (data ?? []).map((row) => row.category_name?.trim()).filter(Boolean),
    ),
  ).sort();

  return [
    // Checkbox column (no filter)
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 50,
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
    },

    // ID column with filter
    {
      accessorKey: "id",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>ID</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter ID..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 80,
      enablePinning: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "group_name",
      header: ({ column }) => {
        const selected: string[] = (column.getFilterValue() as string[]) ?? [];
        return (
          <div className="flex items-center gap-2">
            <span>Group</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${selected.length > 0 ? "text-primary" : ""}`}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selected.length > 0
                      ? `${selected.length} selected`
                      : "Filter by group"}
                  </span>
                  {selected.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs"
                      onClick={() => column.setFilterValue(undefined)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {uniqueGroups.map((group) => {
                    const isChecked = selected.includes(group);
                    return (
                      <label
                        key={group}
                        className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...selected, group]
                              : selected.filter((v) => v !== group);
                            column.setFilterValue(
                              next.length > 0 ? next : undefined,
                            );
                          }}
                        />
                        <span className="text-sm truncate" title={group}>
                          {group}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm break-words whitespace-normal max-w-[250px]">
          {row.original.group_name ?? "—"}
        </div>
      ),
      size: 300,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(row.getValue(columnId));
      },
    },

    {
      accessorKey: "category_name",
      header: ({ column }) => {
        const selected: string[] = (column.getFilterValue() as string[]) ?? [];
        return (
          <div className="flex items-center gap-2">
            <span>Category</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${selected.length > 0 ? "text-primary" : ""}`}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selected.length > 0
                      ? `${selected.length} selected`
                      : "Filter by category"}
                  </span>
                  {selected.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs"
                      onClick={() => column.setFilterValue(undefined)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {uniqueCategories.map((category) => {
                    const isChecked = selected.includes(category);
                    return (
                      <label
                        key={category}
                        className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...selected, category]
                              : selected.filter((v) => v !== category);
                            column.setFilterValue(
                              next.length > 0 ? next : undefined,
                            );
                          }}
                        />
                        <span className="text-sm truncate" title={category}>
                          {category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm">
          {row.original.category_name?.trim() ?? "—"}
        </div>
      ),
      size: 150,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(row.getValue<string>(columnId)?.trim());
      },
    },

    // Description column with filter
    {
      accessorKey: "description",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Description</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter description..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 250,
      enablePinning: true,
      enableColumnFilter: true,
    },

    // Item Name
    {
      accessorKey: "item_name",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Item Name</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter item name..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 200,
      enableColumnFilter: true,
    },

    // Length
    {
      accessorKey: "length",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Length</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter length..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 100,
      enableColumnFilter: true,
    },

    // Width
    {
      accessorKey: "width",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Width</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter width..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 100,
      enableColumnFilter: true,
    },

    // Thickness
    {
      accessorKey: "thickness",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Thickness</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter thickness..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 100,
      enableColumnFilter: true,
    },

    // Qty
    {
      accessorKey: "qty",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Qty</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter qty..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 80,
      enableColumnFilter: true,
    },

    // Material
    {
      accessorKey: "material_details",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Material</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter material..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 200,
      enableColumnFilter: true,
    },

    // Code
    {
      accessorKey: "unique_code",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Code</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter code..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 120,
      enableColumnFilter: true,
    },

    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>Status</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter status..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 100,
      enableColumnFilter: true,
    },

    // ELF, ELB, ESL, ESR - same pattern
    {
      accessorKey: "elf",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>ELF</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter ELF..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 80,
      enableColumnFilter: true,
    },
    {
      accessorKey: "elb",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>ELB</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter ELB..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 80,
      enableColumnFilter: true,
    },
    {
      accessorKey: "esl",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>ESL</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter ESL..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 80,
      enableColumnFilter: true,
    },
    {
      accessorKey: "esr",
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span>ESR</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <Input
                placeholder="Filter ESR..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
      size: 80,
      enableColumnFilter: true,
    },

    // Dynamic machine columns with filters
    ...machineColumns.map((machineName) => ({
      accessorKey: machineName,
      header: ({ column }: any) => (
        <div className="flex items-center gap-2 justify-between">
          <Button
            variant="ghost"
            className={cn(
              "h-auto p-0 font-extrabold flex-1",
              isAssignmentDisabled
                ? "cursor-not-allowed opacity-70 hover:bg-transparent"
                : "hover:bg-transparent hover:text-primary",
            )}
            title={
              isAssignmentDisabled
                ? "Project Started: You cannot assign. Only Super Admin can do this."
                : `Click to assign ${machineName}`
            }
            onClick={() => onMachineHeaderClick?.(machineName)}
          >
            {machineName}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? "text-primary" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by status:</label>
                <select
                  className="w-full h-8 border rounded px-2"
                  value={(column.getFilterValue() as string) ?? "all"}
                  onChange={(event) => {
                    const value = event.target.value;
                    column.setFilterValue(value === "all" ? undefined : value);
                  }}
                >
                  <option value="all">All</option>
                  <option value="assigned">Assigned</option>
                  <option value="not-assigned">Not Assigned</option>
                </select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
      cell: ({ row }: any) => {
        const machineData = row.getValue(machineName);
        const isAssigned = machineData?.assigned || false;
        const machineId = machineData?.machineId;
        const cutListId = row.original.id;

        return (
          <div
            className={cn(
              "flex items-center justify-center rounded p-1 transition-colors",
              isAssignmentDisabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-accent",
            )}
            onClick={() => {
              if (machineId && onMachineCellClick) {
                onMachineCellClick(
                  cutListId,
                  machineId,
                  machineName,
                  isAssigned,
                );
              }
            }}
            title={
              isAssignmentDisabled
                ? "Project Started: You cannot assign. Only Super Admin can do this."
                : isAssigned
                  ? `Click to unassign ${machineName}`
                  : `Click to assign ${machineName}`
            }
          >
            {isAssigned ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </div>
        );
      },
      size: 120,
      enableColumnFilter: true,
      filterFn: (row: any, columnId: string, filterValue: string) => {
        const machineData = row.getValue(columnId);
        const isAssigned = machineData?.assigned || false;

        if (filterValue === "assigned") return isAssigned;
        if (filterValue === "not-assigned") return !isAssigned;
        return true;
      },
    })),
  ];
}
