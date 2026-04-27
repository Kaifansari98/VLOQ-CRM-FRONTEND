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
// IDType is used by FilterPicker for IDs (string | number)
type IDType = string | number;

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
  const adminTaskSalesExecutiveFilter = ((column as any).table?.options?.meta as any)
    ?.adminTaskSalesExecutiveFilter as
    | {
        value: (string | number)[];
        onChange: (values: (string | number)[]) => void;
      }
    | undefined;

  const vendorId = useAppSelector(
    (state) => state.auth.user?.vendor_id,
  ) as number;
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id,
  ) as number | undefined;

  const { data: vendorUsers, isLoading } =
    useVendorSalesExecutiveUsers(vendorId, franchiseId);

  const salesOptions: FilterOption[] = useMemo(() => {
    if (!vendorUsers?.data?.sales_executives?.length) return [];

    return vendorUsers.data.sales_executives.map((user: SalesUserItem) => ({
      id: user.id,
      label: user.user_name,
    }));
  }, [vendorUsers]);

  // ✅ Table filter now stores IDs directly
  type IDType = string | number;
  const selectedIds: IDType[] = adminTaskSalesExecutiveFilter
    ? (adminTaskSalesExecutiveFilter.value as IDType[])
    : ((column.getFilterValue() as IDType[]) ?? []);

  const handleChange = (ids: IDType[]): void => {
    if (adminTaskSalesExecutiveFilter) {
      adminTaskSalesExecutiveFilter.onChange(ids);
      column.setFilterValue(ids);
      return;
    }

    column.setFilterValue(ids);
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
