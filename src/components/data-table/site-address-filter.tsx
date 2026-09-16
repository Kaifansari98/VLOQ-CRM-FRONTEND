"use client";

import React from "react";
import { Column } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { LeadColumn } from "../utils/column/column-type";

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function SiteAddressFilter({ column }: Props) {
  const value = (column.getFilterValue() as string) ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Empty input = reset filter
    column.setFilterValue(inputValue || undefined);
  };

  return (
    <div className="p-1 w-[240px]">
      <Input
        value={value}
        onChange={handleChange}
        placeholder="Search address..."
        className="h-9 text-sm"
      />
    </div>
  );
}
