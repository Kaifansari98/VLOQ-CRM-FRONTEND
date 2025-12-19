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
  columnCount = 15,
  rowCount = 10,
}: DataTableSkeletonProps) {
  return (
    <div className="py-2">
      {/* ================= HEADER SECTION ================= */}
      <div className="px-4 space-y-3 md:space-y-2 md:flex md:flex-col lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
        {/* Title + Description (Desktop only) */}
        <div className="hidden md:block space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* My / Overall Tabs */}
        <div className="flex gap-2 justify-start lg:justify-end">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* ================= TABLE SECTION ================= */}
      <div className="pt-3 px-4">
        {/* ================= MOBILE LAYOUT ================= */}
        <div className="flex flex-col gap-4 md:hidden">
          {/* Filters grid */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Search at bottom */}
          <Skeleton className="h-8 w-full sm:w-64" />
        </div>

        {/* ================= DESKTOP LAYOUT ================= */}
        <div className="hidden md:flex justify-between items-end mb-4">
          {/* Left: Search + Created At */}
          <div className="flex items-end gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-9 w-32" />
          </div>

          {/* Right: Other filters */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* ================= TABLE ================= */}
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

        {/* ================= PAGINATION ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          {/* Rows per page */}
          <Skeleton className="h-7 w-40" />

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </div>
      </div>
    </div>
  );
}