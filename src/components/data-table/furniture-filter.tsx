"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import { useB2BRequirementTypes, useProductTypes } from "@/hooks/useTypesMaster";
import FilterPicker from "./filter-picker";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
  isB2b?: boolean;
}

export default function FurnitureFilter({ column, isB2b = false }: Props) {
  const { data: productTypes, isLoading: isTypesLoading } = useProductTypes();
  const { data: b2bRequirementTypes, isLoading: isB2bLoading } = useB2BRequirementTypes();

  const isLoading = isB2b ? isB2bLoading : isTypesLoading;

  // Normalize API → Picker options
  const furnitureOptions: FilterOption[] = useMemo(() => {
    if (isB2b) {
      const list = b2bRequirementTypes?.data || [];
      return list.map((item: any) => ({
        id: item.id,
        label: item.type,
      }));
    }

    if (!productTypes?.data?.length) return [];

    return productTypes.data.map((item: any) => ({
      id: item.id,
      label: item.type,
    }));
  }, [isB2b, b2bRequirementTypes, productTypes]);

  // Directly read IDs from table filter
  const selectedIds: number[] = (column.getFilterValue() as number[]) ?? [];

  // Picker → Table (ID sync)
  const handleChange = (values: (string | number)[]) => {
    column.setFilterValue(values as number[]);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[200px]">
      <FilterPicker
        data={furnitureOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : isB2b ? "Search requirement type..." : "Search furniture..."}
        emptyLabel={isB2b ? "Select requirement type" : "Select furniture"}
        disabled={isLoading}
        multiple
      />
    </div>
  );
}

