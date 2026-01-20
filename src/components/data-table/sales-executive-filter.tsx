"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { useAppSelector } from "@/redux/store";

/* ===========================
   LOCAL TYPES (INLINE ONLY)
=========================== */

type SalesUserItem = {
  id: number;
  user_name: string;
};

type SalesExecutivesPayload = {
  count: number;
  sales_executives: SalesUserItem[];
};

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

/* ===========================
   COMPONENT
=========================== */

export default function SalesExecutiveFilter({ column }: Props) {
  // 🔵 Vendor context
  const vendorId = useAppSelector(
    (state) => state.auth.user?.vendor_id,
  ) as number;

  // 🔵 Typed API hook
  const { data: vendorUsers, isLoading } =
    useVendorSalesExecutiveUsers(vendorId);

  // 🔵 Normalize API → Picker options
  const salesOptions: FilterOption[] = useMemo(() => {
    if (!vendorUsers?.data?.sales_executives?.length) return [];

    return vendorUsers.data.sales_executives.map((user: SalesUserItem) => ({
      id: user.id,
      label: user.user_name,
    }));
  }, [vendorUsers]);

  // 🔵 Current filter state from table
  const filterValue: string[] = (column.getFilterValue() as string[]) ?? [];

  // 🔵 Resolve selected IDs from labels
  const selectedIds: number[] = useMemo(() => {
    return salesOptions
      .filter((item) => filterValue.includes(item.label))
      .map((item) => item.id);
  }, [filterValue, salesOptions]);

  // 🔵 Sync picker → table filter
  const handleChange = (ids: number[]): void => {
    if (!ids.length) {
      column.setFilterValue([]);
      return;
    }

    const selectedLabels: string[] = salesOptions
      .filter((item) => ids.includes(item.id))
      .map((item) => item.label);

    column.setFilterValue(selectedLabels);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[200px]">
      <FilterPicker
        data={salesOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading..." : "Search executive..."}
        emptyLabel="Select executive"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
