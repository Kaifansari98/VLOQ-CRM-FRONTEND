// components/custom/cutlist-columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function getCutListColumns(
  machineColumns: string[],
  onMachineHeaderClick?: (machineName: string) => void,
  onMachineCellClick?: (cutListId: number, machineId: number, machineName: string, currentlyAssigned: boolean) => void // ✅ Add cell click handler
): ColumnDef<any>[] {
  return [
    // ✅ Checkbox column - PINNED LEFT
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
    
    // ✅ ID column - PINNED LEFT
    {
      accessorKey: "id",
      header: "ID",
      size: 80,
      enablePinning: true,
    },

    // ✅ Description column - PINNED LEFT
    {
      accessorKey: "description",
      header: "Description",
      size: 250,
      enablePinning: true,
    },

    // Scrollable columns
    {
      accessorKey: "item_name",
      header: "Item Name",
      size: 200,
    },
    {
      accessorKey: "length",
      header: "Length",
      size: 100,
    },
    {
      accessorKey: "width",
      header: "Width",
      size: 100,
    },
    {
      accessorKey: "thickness",
      header: "Thickness",
      size: 100,
    },
    {
      accessorKey: "qty",
      header: "Qty",
      size: 80,
    },
    {
      accessorKey: "material_details",
      header: "Material",
      size: 200,
    },
    {
      accessorKey: "unique_code",
      header: "Code",
      size: 120,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
    },
    {
      accessorKey: "elf",
      header: "ELF",
      size: 80,
    },
    {
      accessorKey: "elb",
      header: "ELB",
      size: 80,
    },
    {
      accessorKey: "esl",
      header: "ESL",
      size: 80,
    },
    {
      accessorKey: "esr",
      header: "ESR",
      size: 80,
    },

    // Dynamic machine columns with clickable cells
    ...machineColumns.map((machineName) => ({
      accessorKey: machineName,
      header: () => (
        <Button
          variant="ghost"
          className="h-auto p-0 font-extrabold hover:bg-transparent hover:text-primary w-full"
          onClick={() => onMachineHeaderClick?.(machineName)}
        >
          {machineName}
        </Button>
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
              // ✅ Call API on click
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
    })),
  ];
}