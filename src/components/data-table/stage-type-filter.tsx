"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";

import { useAppSelector } from "@/redux/store";
import { useVendorStatusTypes } from "@/api/leads";

/* ===========================
   TYPES
=========================== */

type Option = {
  id: string;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

/* ===========================
   COMPONENT
=========================== */

export default function StageTypeFilter({ column }: Props) {
  const adminTaskStatusFilter = (column.table.options.meta as any)
    ?.adminTaskStatusFilter as
    | {
        value: (string | number)[];
        onChange: (values: (string | number)[]) => void;
      }
    | undefined;

  // Vendor Context
  const vendorId = useAppSelector(
    (state) => state.auth.user?.vendor_id,
  ) as number;

  // ✅ Status Types API
  const { data, isLoading } = useVendorStatusTypes(vendorId);

  // ✅ Normalize API → Picker Options (TYPE BASED)
  const options: Option[] = useMemo(() => {
    if (adminTaskStatusFilter && column.id === "status") {
      return [
        { id: "open", label: "Open" },
        { id: "completed", label: "Completed" },
      ];
    }

    if (!data?.data?.length) return [];

    return data.data.map((status) => ({
      id: status.type, // ✅ Store TYPE not ID
      label: status.type
        .replaceAll("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  }, [data]);

  // ✅ Read selected status types from table filter state
  // Accept both string and number as IDType
  type IDType = string | number;
  const selectedValues: IDType[] = adminTaskStatusFilter
    ? (adminTaskStatusFilter.value as IDType[])
    : ((column.getFilterValue() as IDType[]) ?? []);

  // ✅ Sync picker → table state (IDType BASED)
  const handleChange = (values: IDType[]) => {
    if (adminTaskStatusFilter) {
      adminTaskStatusFilter.onChange(values);
      column.setFilterValue(values);
      return;
    }

    if (!values.length) {
      column.setFilterValue([]);
      return;
    }

    column.setFilterValue(values);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[220px]">
      <FilterPicker
        data={options}
        value={selectedValues}
        onChange={handleChange}
        placeholder={isLoading ? "Loading status..." : "Search status..."}
        emptyLabel="Status"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
