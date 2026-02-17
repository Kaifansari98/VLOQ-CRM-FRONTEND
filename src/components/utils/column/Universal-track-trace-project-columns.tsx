"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MapPin } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/custom-tooltip";

import { LeadColumn } from "./column-type";
import {
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
  tableTextSearchFilter,
} from "@/lib/utils";
import CustomeStatusBadge from "@/components/origin-status-badge";
import { TrackTraceProjectColumn } from "./track-trace-project-columns";

interface UniversalColumnOptions {
  showStageColumn?: boolean;
}

export function getUniversalTableColumns(
  options: UniversalColumnOptions = {},
): ColumnDef<TrackTraceProjectColumn>[] {
  const { showStageColumn = false } = options;
  const columns: ColumnDef<TrackTraceProjectColumn>[] = [
    // 1) Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project Name" />
      ),
      cell: ({ row }) => (
        <div className=" font-medium">{row.getValue("project_name")}</div>
      ),
      meta: {
        label: "Project Name",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
      {
      accessorKey: "project_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project Status" />
      ),
      cell: ({ row }) => (
        <div className=" font-medium">{row.getValue("project_status")}</div>
      ),
      meta: {
        label: "Project Status",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },    
  ];
  return columns;
}
