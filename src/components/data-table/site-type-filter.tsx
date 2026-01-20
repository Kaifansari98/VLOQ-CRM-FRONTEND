"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";
import { useSiteTypes } from "@/hooks/useTypesMaster";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function SiteTypeFilter({ column }: Props) {
  // API Call
  const { data: siteTypes, isLoading } = useSiteTypes();

  // Normalize API → Picker format
  const siteTypeOptions: FilterOption[] = useMemo(() => {
    if (!siteTypes?.data?.length) return [];

    return siteTypes.data.map((item: any) => ({
      id: item.id,
      label: item.type,
    }));
  }, [siteTypes]);

  // ✅ Direct ID state from table
  const selectedIds: number[] =
    (column.getFilterValue() as number[]) ?? [];

  // ✅ Picker → Table (ID Sync)
  const handleChange = (ids: number[]) => {
    column.setFilterValue(ids.length ? ids : []);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[200px]">
      <FilterPicker
        data={siteTypeOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : "Search site type..."}
        emptyLabel="Select site type"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
