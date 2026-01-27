"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";
import { useVendorUsers } from "@/api/leads";
import { useAppSelector } from "@/redux/store";

/* ===========================
   TYPES
=========================== */

type IDType = string | number;

type Option = {
  id: IDType;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

/* ===========================
   COMPONENT
=========================== */

export default function AssignToFilter({ column }: Props) {
  // Vendor Context
  const vendorId = useAppSelector(
    (state) => state.auth.user?.vendor_id,
  ) as number;

  // ✅ Vendor Users API
  const { data, isLoading } = useVendorUsers(vendorId);

  // ✅ Normalize API → Picker Options
  const options: Option[] = useMemo(() => {
    if (!data?.data?.length) return [];

    return data.data.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    }));
  }, [data]);

  // ✅ Read selected IDs directly from table filter state
  const selectedIds: IDType[] = (column.getFilterValue() as IDType[]) ?? [];

  // ✅ Sync picker → table state (ID based)
  const handleChange = (ids: IDType[]) => {
    if (!ids.length) {
      column.setFilterValue([]);
      return;
    }

    column.setFilterValue(ids);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[220px]">
      <FilterPicker
        data={options}
        value={selectedIds}
        onChange={handleChange}
        placeholder={isLoading ? "Loading users..." : "Search user..."}
        emptyLabel="Assign To"
        disabled={isLoading}
        multiple
      />
    </div>
  );
}
