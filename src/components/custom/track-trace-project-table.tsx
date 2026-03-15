"use client";

import { useMemo } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { useAppSelector } from "@/redux/store";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

import { getTrackTraceProjectColumns } from "./track-trace-project-columns";

type TrackTraceProjectTableProps = {
  table: TrackTraceProject[] | null;
  onRowDoubleClick?: (row: TrackTraceProject) => void;
  className?: string;
};

export default function TrackTraceProjectTable({
  table,
  onRowDoubleClick,
  className,
}: TrackTraceProjectTableProps) {
  const tableData = useMemo(() => table ?? [], [table]);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const columns = useMemo(
    () => getTrackTraceProjectColumns(Number(vendorId)),
    [vendorId],
  );

  const reactTable = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
  });

  return (
    <DataTable
      table={reactTable}
      onRowDoubleClick={onRowDoubleClick}
      className={className}
    />
  );
}
