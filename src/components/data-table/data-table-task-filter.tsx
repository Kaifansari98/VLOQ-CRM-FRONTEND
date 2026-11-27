"use client";

import React, { useMemo } from "react";
import { Column } from "@tanstack/react-table";

import FilterPicker from "./filter-picker";
import { LeadColumn } from "../utils/column/column-type";

/* ===========================
   CONSTANT TASK TYPES
=========================== */

const TASK_TYPES = [
  "1st Servicing",
  "2nd Servicing",
  "3rd Servicing",
  "Approval Request",
  "Assign a Site Supervisor",
  "Booking Done Approval",
  "BookingDone - ISM",
  "Dispatch",
  "Dispatch Planning Approval",
  "Final Measurements",
  "Follow Up",
  "Initial Site Measurement",
  "Miscellaneous",
  "Miscellaneous Followup",
  "Order Login",
  "Order Login Approval",
  "Order Login Completed",
  "Pending Materials",
  "Pending Work",
  "Pre Prod Completed",
  "Production Ready",
  "Request Fast Production",
  "Site Readiness",
  "Small order request",
  // Complaint tasks (complaints raised against a lead).
  "Complaint Verification",
  "Reopened Complaint Review",
  "Complaint Information Follow-up",
  "On-Hold Complaint Review",
  "Complaint Visit Planning",
  "Complaint Free Visit Approval",
  "Complaint Visit Charge Follow-up",
  "Complaint Visit Scheduling",
  "Complaint Site Visit",
  "Complaint Visit Cash Collection",
  "Complaint Payment Verification",
  "Complaint Inspection Review",
  "Complaint Quotation Preparation",
  "Complaint Quotation Approval",
  "Complaint Quotation Client Follow-up",
  "Complaint Repair Payment Collection",
  "Complaint Resolution Payment Collection",
  "Complaint Material Procurement",
  "Complaint Resolution Start",
  "Complaint Resolution Work",
  "Complaint Client Confirmation",
  "Complaint Closure Approval",
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
