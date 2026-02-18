"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { getTrackTraceProjectColumns } from "./track-trace-project-columns";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

interface Props {
  table: TrackTraceProject[] | null;
  onRowDoubleClick?: (row: TrackTraceProject) => void;
  className?: string;
}

export default function TrackTraceProjectTable({
  table,
  onRowDoubleClick,
  className,
}: Props) {
  const router = useRouter();

  const tableData = useMemo(() => table ?? [], [table]);

  const columns = useMemo(() => getTrackTraceProjectColumns(), []);

  const reactTable = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
  });

  const handleRowClick = (row: TrackTraceProject) => {
    onRowDoubleClick?.(row);
  };

  return (
    <DataTable
      table={reactTable}
      onRowDoubleClick={handleRowClick}
      className={className}
    />
  );
}
