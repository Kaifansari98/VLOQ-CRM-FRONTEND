"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import { useFranchisesByVendorId } from "@/api/franchise";
import FilterPicker from "./filter-picker";
import { useAppSelector } from "@/redux/store";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { Table } from "@tanstack/react-table";

type FilterOption = {
  id: number;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
  table?: Table<LeadColumn>;
}

export default function FranchisesFilter({ column, table }: Props) {
  const userType = useAppSelector((s) => {
    const u = s.auth.user as any;
    if (!u) return "";
    if (typeof u.user_type === "string") return u.user_type;
    if (typeof u.user_role === "string") return u.user_role;
    if (typeof u.role === "string") return u.role;
    return (
      u.user_type?.user_type ||
      u.user_type?.user_type_name ||
      u.user_type?.name ||
      u.user_type?.title ||
      u.user_type?.role ||
      u.user_role ||
      u.role ||
      ""
    );
  });

  const isAllowed = useMemo(() => {
    const cleanRole = (userType || "")
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-");
    const allowedRoles = [
      "factory",
      "backend",
      "tech-check",
      "head-site-supervisor",
      "super-admin",
      "site-supervisor",
      "pre-prod",
    ];
    return allowedRoles.includes(cleanRole);
  }, [userType]);

  const vendorId = useAppSelector(
    (s) => s.auth.user?.vendor_id ?? s.auth.user?.vendor?.id
  );
  const { data: franchises = [], isLoading } = useFranchisesByVendorId(vendorId, !!vendorId);

  // Normalize API → Picker options
  const franchiseOptions: FilterOption[] = useMemo(() => {
    if (!franchises?.length) return [];

    return franchises.map((item: any) => ({
      id: item.id,
      label: item.franchise_name,
    }));
  }, [franchises]);

  const meta = (table?.options?.meta ?? (column as any).table?.options?.meta ?? {}) as any;
  const selectedIds: number[] = meta?.franchisesFilter ?? [];
  const setFranchisesFilter = meta?.setFranchisesFilter;
console.log("franchises data: ", franchises)
  // Picker → Table (ID sync)
  const handleChange = (values: (string | number)[]) => {
    if (setFranchisesFilter) {
      setFranchisesFilter(values as number[]);
    }
  };

  if (!isAllowed) return null;

  return (
    <>
      <div className="w-full min-w-[200px] max-w-[200px]">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Franchises
        </div>
        <FilterPicker
          data={franchiseOptions}
          value={selectedIds}
          onChange={handleChange}
          placeholder={isLoading ? "Loading..." : "Search franchises..."}
          emptyLabel="Select franchises"
          disabled={isLoading}
          multiple
        />
      </div>
      <DropdownMenuSeparator />
    </>
  );
}
