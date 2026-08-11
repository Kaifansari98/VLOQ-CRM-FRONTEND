"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";
import { useProcessBriefs, useProductStructureTypes } from "@/hooks/useTypesMaster";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
  isB2b?: boolean;
}

export default function ProductStructureFilter({ column, isB2b = false }: Props) {
  // API Calls
  const { data: productStructures, isLoading: isStructuresLoading } = useProductStructureTypes();
  const { data: processBriefsData, isLoading: isBriefsLoading } = useProcessBriefs();

  const isLoading = isB2b ? isBriefsLoading : isStructuresLoading;

  // Normalize API → Picker Options
  const structureOptions: FilterOption[] = useMemo(() => {
    if (isB2b) {
      const list = processBriefsData?.data || [];
      return list.map((item: any) => ({
        id: item.id,
        label: item.name,
      }));
    }

    if (!productStructures?.data?.length) return [];

    return productStructures.data.map((item: any) => ({
      id: item.id,
      label: item.type,
    }));
  }, [isB2b, processBriefsData, productStructures]);

  // Directly read IDs from table filter
  const selectedIds: number[] = (column.getFilterValue() as number[]) ?? [];

  // Picker → Table (ID sync)
  const handleChange = (values: (string | number)[]) => {
    column.setFilterValue(values as number[]);
  };

  return (
    <div className="w-full">
      <FilterPicker
        data={structureOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : isB2b ? "Search process brief..." : "Search structure..."}
        emptyLabel={isB2b ? "Select process brief" : "Select structure"}
        disabled={isLoading}
        multiple
      />
    </div>
  );
}

