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

export function getCutListColumns(
  machineColumns: string[],
  onMachineHeaderClick?: (machineName: string) => void,
  onMachineCellClick?: (cutListId: number, machineId: number, machineName: string, currentlyAssigned: boolean) => void
): ColumnDef<any>[] {
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
            className="h-auto p-0 font-extrabold hover:bg-transparent hover:text-primary flex-1"
            onClick={() => onMachineHeaderClick?.(machineName)}
          >
            {machineName}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${column.getFilterValue() ? 'text-primary' : ''}`}
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
            className="flex items-center justify-center cursor-pointer hover:bg-accent rounded p-1 transition-colors"
            onClick={() => {
              if (machineId && onMachineCellClick) {
                onMachineCellClick(cutListId, machineId, machineName, isAssigned);
              }
            }}
            title={isAssigned ? `Click to unassign ${machineName}` : `Click to assign ${machineName}`}
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