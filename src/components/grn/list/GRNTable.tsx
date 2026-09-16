"use client";

import { GRNSummary } from "@/api/grn/grn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { GRNTableRow } from "./GRNTableRow";

export function GRNTable({
  data,
  loading,
  page,
  onPageChange,
  onOpen,
}: {
  data: any;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {[
                "GRN No",
                "PO No",
                "Supplier",
                "Status",
                "Items",
                "Received Date",
                "Created By",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-5 w-full rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data?.grns?.length ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-2xl bg-muted p-4">
                      <ClipboardList
                        size={28}
                        className="text-muted-foreground/50"
                      />
                    </div>
                    <p className="text-sm font-bold">No GRNs found</p>
                    <p className="text-xs text-muted-foreground">
                      Create a new GRN against an approved PO.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.grns.map((grn: GRNSummary, idx: number) => (
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

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{data.total}</span>{" "}
            total GRNs
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 rounded-xl p-0"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={14} />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-xl px-3 text-xs"
              disabled
            >
              {page} / {data.total_pages}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 rounded-xl p-0"
              disabled={page === data.total_pages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}