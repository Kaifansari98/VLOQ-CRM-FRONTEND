// components/custom/cutlist-columns.tsx
import { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import { Check, Filter, ImageOff, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const LOCKED_MESSAGE =
  "Project Started: You cannot assign. Only Super Admin can do this.";

/** Case-insensitive "contains" filter that works for strings, numbers and Decimals. */
const containsFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const term = String(filterValue ?? "").trim().toLowerCase();
  if (!term) return true;
  return String(row.getValue(columnId) ?? "").toLowerCase().includes(term);
};

const multiSelectFilter: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true;
  return filterValue.includes(String(row.getValue(columnId) ?? "").trim());
};

const formatNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const Empty = () => <span className="text-muted-foreground/60">—</span>;

function FilterTrigger({ active, label }: { active: boolean; label: string }) {
  return (
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Filter ${label}`}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "size-6 shrink-0 rounded text-muted-foreground hover:text-foreground",
          active && "bg-primary/10 text-primary hover:text-primary",
        )}
      >
        <Filter className="size-3" />
      </Button>
    </PopoverTrigger>
  );
}

function TextFilterHeader({
  column,
  title,
  align = "left",
}: {
  column: Column<any>;
  title: string;
  align?: "left" | "right";
}) {
  const value = (column.getFilterValue() as string) ?? "";
  return (
    <div className={cn("flex items-center gap-1", align === "right" && "justify-end")}>
      <span className="whitespace-nowrap">{title}</span>
      <Popover>
        <FilterTrigger active={!!value} label={title} />
        <PopoverContent className="w-60 p-2" align="start">
          <Input
            autoFocus
            placeholder={`Filter ${title.toLowerCase()}…`}
            value={value}
            onChange={(event) => column.setFilterValue(event.target.value || undefined)}
            className="h-8"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MultiSelectFilterHeader({
  column,
  title,
  options,
}: {
  column: Column<any>;
  title: string;
  options: string[];
}) {
  const selected: string[] = (column.getFilterValue() as string[]) ?? [];
  return (
    <div className="flex items-center gap-1">
      <span className="whitespace-nowrap">{title}</span>
      <Popover>
        <FilterTrigger active={selected.length > 0} label={title} />
        <PopoverContent className="w-64 p-2" align="start">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">
              {selected.length > 0 ? `${selected.length} selected` : `Filter by ${title.toLowerCase()}`}
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
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {options.length === 0 && (
              <p className="px-1 py-2 text-xs text-muted-foreground">No values</p>
            )}
            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-accent"
              >
                <Checkbox
                  checked={selected.includes(option)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...selected, option]
                      : selected.filter((value) => value !== option);
                    column.setFilterValue(next.length > 0 ? next : undefined);
                  }}
                />
                <span className="truncate text-sm" title={option}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

const textColumn = (
  accessorKey: string,
  title: string,
  size: number,
  cellClassName?: string,
): ColumnDef<any> => ({
  accessorKey,
  header: ({ column }) => <TextFilterHeader column={column} title={title} />,
  cell: ({ getValue }) => {
    const value = getValue<string | null>();
    return value ? (
      <div className={cn("text-sm", cellClassName)} title={String(value)}>
        {value}
      </div>
    ) : (
      <Empty />
    );
  },
  size,
  filterFn: containsFilter,
});

const numberColumn = (accessorKey: string, title: string, size: number, strong = false): ColumnDef<any> => ({
  accessorKey,
  header: ({ column }) => <TextFilterHeader column={column} title={title} align="right" />,
  cell: ({ getValue }) => {
    const value = formatNumber(getValue());
    return (
      <div className={cn("text-right tabular-nums", strong && "font-semibold")}>
        {value ?? <Empty />}
      </div>
    );
  },
  size,
  filterFn: containsFilter,
});

const edgeColumn = (accessorKey: string, title: string): ColumnDef<any> => ({
  ...textColumn(accessorKey, title, 80, "font-mono text-xs"),
});

function StatusPill({ status }: { status?: string | null }) {
  if (!status) return <Empty />;
  const isActive = status.toLowerCase() === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-muted-foreground/60")} />
      {status}
    </span>
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
  data?: any[],
  isAssignmentDisabled?: boolean,
): ColumnDef<any>[] {
  const rows = data ?? [];
  const uniqueGroups = Array.from(
    new Set(rows.map((row) => row.group_name?.trim()).filter(Boolean)),
  ).sort() as string[];
  const uniqueCategories = Array.from(
    new Set(rows.map((row) => row.category_name?.trim()).filter(Boolean)),
  ).sort() as string[];

  return [
    {
      id: "select",
      // Selects every row (not just the current page) so bulk labels/assignment cover the whole list.
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected() ||
            (table.getIsSomeRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 44,
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => <TextFilterHeader column={column} title="ID" />,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {getValue<number>()}
        </span>
      ),
      size: 80,
      filterFn: containsFilter,
    },
    {
      id: "image",
      accessorKey: "image_url",
      header: () => <span>Shape</span>,
      cell: ({ row }) =>
        row.original.image_url ? (
          // Signed Wasabi URLs expire, so they bypass next/image caching.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.image_url}
            alt={`Shape of ${row.original.item_name}`}
            loading="lazy"
            className="h-10 w-24 rounded-md border bg-white object-contain p-0.5"
          />
        ) : (
          <div className="flex h-10 w-24 items-center justify-center rounded-md border border-dashed text-muted-foreground/50">
            <ImageOff className="size-4" />
          </div>
        ),
      size: 120,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "group_name",
      header: ({ column }) => (
        <MultiSelectFilterHeader column={column} title="Group" options={uniqueGroups} />
      ),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        return value ? (
          <div className="max-w-[260px] whitespace-normal break-words text-sm font-medium">{value}</div>
        ) : (
          <Empty />
        );
      },
      size: 280,
      filterFn: multiSelectFilter,
    },
    {
      accessorKey: "category_name",
      header: ({ column }) => (
        <MultiSelectFilterHeader column={column} title="Category" options={uniqueCategories} />
      ),
      cell: ({ getValue }) => {
        const value = getValue<string | null>()?.trim();
        return value ? (
          <span className="inline-flex max-w-[180px] truncate rounded-md bg-muted px-2 py-0.5 text-xs font-medium" title={value}>
            {value}
          </span>
        ) : (
          <Empty />
        );
      },
      size: 160,
      filterFn: multiSelectFilter,
    },
    textColumn("description", "Description", 240, "max-w-[280px] truncate"),
    textColumn("item_name", "Item Name", 200, "max-w-[240px] truncate font-medium"),
    numberColumn("length", "Length", 100),
    numberColumn("width", "Width", 100),
    numberColumn("thickness", "Thickness", 100),
    numberColumn("qty", "Qty", 80, true),
    textColumn("material_details", "Material", 200, "max-w-[220px] truncate"),
    textColumn("unique_code", "Code", 130, "font-mono text-xs"),
    {
      accessorKey: "status",
      header: ({ column }) => <TextFilterHeader column={column} title="Status" />,
      cell: ({ getValue }) => <StatusPill status={getValue<string | null>()} />,
      size: 110,
      filterFn: containsFilter,
    },
    edgeColumn("elf", "ELF"),
    edgeColumn("elb", "ELB"),
    edgeColumn("esl", "ESL"),
    edgeColumn("esr", "ESR"),

    ...machineColumns.map((machineName): ColumnDef<any> => {
      const assignedCount = rows.filter((row) => row[machineName]?.assigned).length;
      return {
        accessorKey: machineName,
        header: ({ column }) => {
          const value = (column.getFilterValue() as string) ?? "all";
          return (
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-start rounded px-1 py-0.5 text-left transition-colors",
                  isAssignmentDisabled
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-primary/10 hover:text-primary",
                )}
                title={isAssignmentDisabled ? LOCKED_MESSAGE : `Assign ${machineName} to selected rows`}
                onClick={() => onMachineHeaderClick?.(machineName)}
              >
                <span className="truncate font-semibold">{machineName}</span>
                <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
                  {assignedCount}/{rows.length} assigned
                </span>
              </button>
              <Popover>
                <FilterTrigger active={value !== "all"} label={machineName} />
                <PopoverContent className="w-56 p-3" align="start">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Filter by assignment</p>
                  <Select
                    value={value}
                    onValueChange={(next) => column.setFilterValue(next === "all" ? undefined : next)}
                  >
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All rows</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="not-assigned">Not assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </PopoverContent>
              </Popover>
            </div>
          );
        },
        cell: ({ row }) => {
          const machineData = row.getValue<any>(machineName);
          const isAssigned = machineData?.assigned || false;
          const machineId = machineData?.machineId;
          return (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={!machineId}
                aria-pressed={isAssigned}
                aria-label={`${isAssigned ? "Unassign" : "Assign"} ${machineName}`}
                title={
                  isAssignmentDisabled
                    ? LOCKED_MESSAGE
                    : `Click to ${isAssigned ? "unassign" : "assign"} ${machineName}`
                }
                onClick={() => {
                  if (machineId && onMachineCellClick) {
                    onMachineCellClick(row.original.id, machineId, machineName, isAssigned);
                  }
                }}
                className={cn(
                  "group/cell flex size-7 items-center justify-center rounded-full transition-colors",
                  isAssigned
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground/40",
                  isAssignmentDisabled
                    ? "cursor-not-allowed opacity-60"
                    : isAssigned
                      ? "hover:bg-emerald-500/25"
                      : "hover:bg-accent hover:text-foreground",
                )}
              >
                {isAssigned ? <Check className="size-4" strokeWidth={2.5} /> : <Minus className="size-4" />}
              </button>
            </div>
          );
        },
        size: 130,
        enableSorting: false,
        filterFn: (row, columnId, filterValue: string) => {
          const isAssigned = row.getValue<any>(columnId)?.assigned || false;
          if (filterValue === "assigned") return isAssigned;
          if (filterValue === "not-assigned") return !isAssigned;
          return true;
        },
      };
    }),
  ];
}
