import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import type { DataTableConfig } from "@/config/data-table";
import type { FilterItemSchema } from "@/lib/parsers";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData = RowData, TValue = unknown> {
    
    readonly __tdata?: TData | undefined;
    readonly __tvalue?: TValue | undefined;

    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  }
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant:
    | "edit"
    | "delete"
    | "view"
    | "reassignlead"
    | "measurement"
    | "details"
    | "booking"
    | "move"
    | "measurement-modal"
    | "uploadmeasurement"
    | "uploadfinalmeasurement"
    | "Follow Up"
    | "Pending Materials"
    | "Pending Work";
}

export interface DataTableRowActionOpen<TData> {
  row: Row<TData>;
  variant: "view" | "assigntask" | "edit" | "reassignlead" | "delete";
}

export interface DataTableRowActionSiteMeasurement<TData> {
  row: Row<TData>;
  variant:
    | "view"
    | "uploadmeasurement"
    | "edit"
    | "reassignlead"
    | "delete"
    | "completed"
    | "reschedule"
    | "cancel";
}
export interface DataTableRowActionFinalMeasurement<TData> {
  row: Row<TData>;
  variant:
    | "edit"
    | "delete"
    | "view"
    | "reassignlead"
    | "clientdoc"
    | "finalMeasu"
    | "assignTask"
    | "completed"
    | "reschedule"
    | "cancel";
}

export interface DataTableRowActionClientDocumentation<TData> {
  row: Row<TData>;
  variant: "edit" | "delete" | "view" | "reassignlead" | "clientdoc";
}
