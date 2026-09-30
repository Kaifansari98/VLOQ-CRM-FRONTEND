"use client";

import React from "react";
import { Column } from "@tanstack/react-table";

import { LeadColumn } from "../utils/column/column-type";
import FilterPicker from "./filter-picker";

type FilterOption = {
  id: string;
  label: string;
};

const priorityOptions: FilterOption[] = [
  { id: "High", label: "High" },
  { id: "Medium", label: "Medium" },
  { id: "Low", label: "Low" },
];

interface Props {
  column: Column<LeadColumn, unknown>;
}

export default function PriorityFilter({ column }: Props) {
  const selectedIds: string[] = (column.getFilterValue() as string[]) ?? [];

  const handleChange = (ids: (number | string)[]) => {
    const values = ids.map(String).filter(Boolean);
    column.setFilterValue(values.length ? values : []);
  };

  return (
    <div className="w-full min-w-[200px] max-w-[200px]">
      <FilterPicker
        data={priorityOptions}
        value={selectedIds}
        onChange={handleChange}
        placeholder="Search priority..."
        emptyLabel="Select priority"
        multiple
      />
    </div>
  );
}
