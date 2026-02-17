"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import FilterPicker from "./filter-picker";
import { LeadColumn } from "../utils/column/column-type";

/* ===========================
   CONSTANT TASK TYPES
=========================== */

const TASK_TYPES = [
  "Pending Work",
  "Pending Materials",
  "Production Items",
  "Miscelleneous Items",
  "Production Ready",
  "Post Dispatch Photos",
  "Follow Up",
  "BookingDone - ISM",
  "Initial Site Measurement",
  "Order Login"
];

/* ===========================
   TYPES
=========================== */

type Option = {
  id: string;
  label: string;
};

interface Props {
  column: Column<LeadColumn, unknown>;
}

/* ===========================
   COMPONENT
=========================== */

export default function TaskTypeFilterPicker({ column }: Props) {
  // ✅ Normalize static list → picker options
  const options: Option[] = useMemo(() => {
    return TASK_TYPES.map((type) => ({
      id: type,
      label: type,
    }));
  }, []);

  // ✅ Read selected values from table state
  const selectedValues = (column.getFilterValue() as string[]) ?? [];

  // ✅ Sync picker → Tanstack table filter state
  const handleChange = (values: (string | number)[]) => {
    if (!values.length) {
      column.setFilterValue([]);
      return;
    }

    column.setFilterValue(values.map(String));
  };

  return (
    <div className="w-full min-w-[200px] max-w-[220px]">
      <FilterPicker
        data={options}
        value={selectedValues}
        onChange={handleChange}
        placeholder="Search task type..."
        emptyLabel="Task Type"
        multiple
      />
    </div>
  );
}
