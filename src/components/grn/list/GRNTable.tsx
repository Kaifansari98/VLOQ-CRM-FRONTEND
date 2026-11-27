"use client";

import { GRNSummary } from "@/api/grn/grn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRNTableRow } from "./GRNTableRow";

export function GRNTable({
  data,
  loading,
  page,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  onOpen,
}: {
  data: any;
  loading: boolean;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onOpen: (id: number) => void;
}) {
  const grns: GRNSummary[] = data?.grns ?? [];
  const totalPages = Math.max(1, data?.total_pages || 1);

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                GRN No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                PO No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Received Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Created By
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <Skeleton className="h-5 w-full rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            ) : grns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-xl bg-muted p-4">
                      <ClipboardList
                        size={28}
                        className="text-muted-foreground/50"
                      />
                    </div>
                    <p className="text-sm font-semibold">No GRNs found</p>
                    <p className="text-xs text-muted-foreground">
                      Create a new GRN against an approved PO.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              grns.map((grn: GRNSummary, idx: number) => (
                <GRNTableRow
                  key={grn.id}
                  grn={grn}
                  index={idx}
                  onOpen={onOpen}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching screenshot */}
      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t p-3 sm:flex-row sm:gap-6">
        <div className="text-xs text-muted-foreground">
          0 of {grns.length} row(s) selected.
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center space-x-2">
            <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              Rows per page
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={(val) => {
                if (onPageSizeChange) onPageSizeChange(Number(val));
              }}
            >
              <SelectTrigger className="h-8 w-[64px] rounded-md border text-xs">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent side="top" className="rounded-lg text-xs">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="whitespace-nowrap text-xs font-medium">
            Page {page} of {totalPages}
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}