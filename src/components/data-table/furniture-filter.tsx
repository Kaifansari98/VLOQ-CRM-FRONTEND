"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import { useProductTypes } from "@/hooks/useTypesMaster";
import FilterPicker from "./filter-picker";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function FurnitureFilter({ column }: Props) {
  const { data: productTypes, isLoading } = useProductTypes();

  // Normalize API → Picker options
  const furnitureOptions: FilterOption[] = useMemo(() => {
    if (!productTypes?.data?.length) return [];

    return productTypes.data.map((item: any) => ({
      id: item.id,
      label: item.type,
    }));
  }, [productTypes]);

  // Directly read IDs from table filter
  const selectedIds: number[] = (column.getFilterValue() as number[]) ?? [];

  // Picker → Table (ID sync)
  const handleChange = (ids: number[]) => {
    column.setFilterValue(ids.length ? ids : []);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[200px]">
      <FilterPicker
        data={furnitureOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : "Search furniture..."}
        emptyLabel="Select furniture"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
