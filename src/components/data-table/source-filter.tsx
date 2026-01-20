"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";
import { useSourceTypes } from "@/hooks/useTypesMaster";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function SourceFilter({ column }: Props) {
  // API Fetch
  const { data: sourceTypes, isLoading } = useSourceTypes();

  // Normalize API → Picker Options
  const sourceOptions: FilterOption[] = useMemo(() => {
    if (!sourceTypes?.data?.length) return [];

    return sourceTypes.data.map((item: any) => ({
      id: item.id,
      label: item.type,
    }));
  }, [sourceTypes]);

  // ✅ Read IDs directly from table state
  const selectedIds: number[] =
    (column.getFilterValue() as number[]) ?? [];

  // ✅ Picker → Table sync (ID only)
  const handleChange = (ids: number[]) => {
    column.setFilterValue(ids.length ? ids : []);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[200px]">
      <FilterPicker
        data={sourceOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : "Search source..."}
        emptyLabel="Select source"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
