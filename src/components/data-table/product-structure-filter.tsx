"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";
import { useProductStructureTypes } from "@/hooks/useTypesMaster";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function ProductStructureFilter({ column }: Props) {
  // API Call
  const { data: productStructures, isLoading } = useProductStructureTypes();

  // Normalize API → Picker Options
  const structureOptions: FilterOption[] = useMemo(() => {
    if (!productStructures?.data?.length) return [];

    return productStructures.data.map((item: any) => ({
      id: item.id,
      label: item.type,
    }));
  }, [productStructures]);

  // ✅ Directly read IDs from table filter
  const selectedIds: number[] = (column.getFilterValue() as number[]) ?? [];

  // ✅ Picker → Table (ID sync)
  const handleChange = (values: (string | number)[]) => {
    column.setFilterValue(values as number[]);
  };

  return (
    <div className="w-full">
      <FilterPicker
        data={structureOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : "Search structure..."}
        emptyLabel="Select structure"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
