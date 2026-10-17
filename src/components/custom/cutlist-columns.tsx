// components/custom/cutlist-columns.tsx
import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check, X, Filter, Pencil, Trash2, Loader2, Minus, Plus, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

interface QtyCellEditorProps {
  cutListId: number;
  currentQty: number;
  itemName: string;
  isDisabled?: boolean;
  disabledReason?: string;
  onUpdate?: (cutListId: number, newQty: number) => Promise<void>;
}

const MAX_CUTLIST_QTY = 999;

function QtyCellEditor({
  cutListId,
  currentQty,
  itemName,
  isDisabled,
  disabledReason,
  onUpdate,
}: QtyCellEditorProps) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<number>(currentQty);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setVal(currentQty);
    }
  }, [open, currentQty]);

  if (isDisabled || !onUpdate) {
    return (
      <span
        className="font-medium text-foreground cursor-not-allowed select-none"
        title={disabledReason || "Quantity cannot be edited."}
      >
        {currentQty}
      </span>
    );
  }

  const handleSave = async (qtyToSave: number) => {
    if (isSaving || qtyToSave < 0 || qtyToSave > MAX_CUTLIST_QTY) return;
    try {
      setIsSaving(true);
      await onUpdate(cutListId, qtyToSave);
      setOpen(false);
    } catch {
      // toast is handled in parent
    } finally {
      setIsSaving(false);
    }
  };

  const isDeleting = val === 0;
  const isOverLimit = val > MAX_CUTLIST_QTY;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 font-medium hover:border-border hover:bg-muted/80 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title="Click to edit quantity or remove item"
        >
          <span>{currentQty}</span>
          <Pencil className="size-3 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 shadow-lg" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-foreground">Edit Quantity</h4>
              <p className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={itemName}>
                {itemName}
              </p>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Max: {MAX_CUTLIST_QTY}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setVal((prev) => Math.max(0, prev - 1))}
              disabled={isSaving || val <= 0}
            >
              <Minus className="size-3.5" />
            </Button>
            <Input
              type="number"
              min={0}
              max={MAX_CUTLIST_QTY}
              value={val}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setVal(0);
                  return;
                }
                const num = parseInt(raw, 10);
                setVal(isNaN(num) ? 0 : Math.max(0, num));
              }}
              className="h-8 text-center text-sm font-semibold"
              disabled={isSaving}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setVal((prev) => Math.min(MAX_CUTLIST_QTY, prev + 1))}
              disabled={isSaving || val >= MAX_CUTLIST_QTY}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          {isOverLimit ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive flex items-start gap-1.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>Quantity cannot exceed {MAX_CUTLIST_QTY}.</span>
            </div>
          ) : isDeleting ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive flex items-start gap-1.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>Setting quantity to 0 will remove this item from the project.</span>
            </div>
          ) : val < currentQty ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Will decrease by {currentQty - val} piece{currentQty - val > 1 ? "s" : ""} in production.
            </p>
          ) : val > currentQty ? (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Will increase by {val - currentQty} piece{val - currentQty > 1 ? "s" : ""} in production.
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            {isDeleting ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleSave(0)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Trash2 className="size-3.5 mr-1" />}
                Remove
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleSave(val)}
                disabled={isSaving || val === currentQty || isOverLimit || val < 0}
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                Save
              </Button>
            )}
          </div>

          {!isDeleting && (
            <div className="border-t pt-2 text-center">
              <button
                type="button"
                onClick={() => setVal(0)}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1"
                disabled={isSaving}
              >
                <Trash2 className="size-3" />
                Remove item completely
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  onQtyUpdate?: (cutListId: number, newQty: number) => Promise<void>,
  isQtyEditDisabled?: boolean,
  projectPackingType?: string,
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
      cell: ({ row }) => {
        const cutListId = Number(row.original.id);
        const currentQty = Number(row.getValue("qty"));
        const itemName =
          row.original.item_name ||
          row.original.description ||
          `Item #${cutListId}`;

        // Determine if item is a custom group packing cutlist item
        const effectivePackingType = String(
          projectPackingType || row.original.packing_type || "",
        )
          .trim()
          .toUpperCase();
        const hasCustomGroup = Boolean(
          row.original.custom_packing_group || row.original.group_name,
        );
        const isCustomGroupCutlist =
          effectivePackingType === "CUSTOM_GROUP" && hasCustomGroup;

        const disabled = isQtyEditDisabled || isCustomGroupCutlist;
        const disabledReason = isQtyEditDisabled
          ? "Project has started. Quantity cannot be edited."
          : isCustomGroupCutlist
            ? "Editing quantity for custom group packing items is currently disabled."
            : undefined;

        return (
          <QtyCellEditor
            cutListId={cutListId}
            currentQty={currentQty}
            itemName={itemName}
            isDisabled={!!disabled}
            disabledReason={disabledReason}
            onUpdate={onQtyUpdate}
          />
        );
      },
      size: 90,
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
            className="h-auto p-0 font-extrabold flex-1 hover:bg-transparent hover:text-primary"
            title={`Click to assign/unassign ${machineName}`}
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
        const isScanned = Boolean(machineData?.scanned);
        const machineId = machineData?.machineId;
        const cutListId = Number(row.original.id);

        const isUncheckDisabled = isAssigned && isScanned;

        const tooltipTitle = isUncheckDisabled
          ? `Cannot uncheck: Item already scanned at ${machineName}`
          : isAssigned
            ? `Click to unassign ${machineName}`
            : `Click to assign ${machineName}`;

        return (
          <div
            className={cn(
              "flex items-center justify-center rounded p-1 transition-colors",
              isUncheckDisabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-accent",
            )}
            onClick={() => {
              if (isUncheckDisabled) {
                return;
              }
              if (machineId && onMachineCellClick) {
                onMachineCellClick(
                  cutListId,
                  machineId,
                  machineName,
                  isAssigned,
                );
              }
            }}
            title={tooltipTitle}
          >
            {isAssigned ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-500 hover:text-red-600 dark:text-red-400" />
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
