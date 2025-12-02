"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function DataTableSkeleton({
  columnCount = 15, // matches your universal table columns
  rowCount = 10,
}: DataTableSkeletonProps) {
  return (
    <div className="px-4 py-4 flex flex-col gap-5 w-full">
      {/* ----------- TOP SWITCH TABS / VIEWS ----------- */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* ----------- FILTER BAR + SEARCH ----------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* ----------- MAIN TABLE ----------- */}
      <div className="rounded-md border overflow-hidden w-full">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i} className="px-2 py-2">
                  <Skeleton className="h-5 w-[80%] mx-auto" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell key={colIndex} className="px-3 py-3">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ----------- PAGINATION ----------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3">
        {/* Rows per page */}
        <Skeleton className="h-7 w-40 rounded-md" />

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}
