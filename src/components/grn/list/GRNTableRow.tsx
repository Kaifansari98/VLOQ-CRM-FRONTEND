"use client";

import { GRNSummary } from "@/api/grn/grn";
import { cn } from "@/lib/utils";
import { GRNStatusBadge } from "../shared/GRNStatusBadge";
import { fmtDate } from "../shared/statusUtils";
import { ArrowUpRight } from "lucide-react";

export function GRNTableRow({
  grn,
  index,
  onOpen,
}: {
  grn: GRNSummary;
  index: number;
  onOpen: (id: number) => void;
}) {
  return (
    <tr
      onClick={() => onOpen(grn.id)}
      className={cn(
        "group cursor-pointer border-b transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20",
        index % 2 === 1 && "bg-muted/20"
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-indigo-600">
            {grn.grn_no}
          </span>
          <ArrowUpRight
            size={13}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">
          {grn.purchaseOrder.po_no}
        </span>
      </td>

      <td className="px-4 py-3">
        <p className="text-sm font-semibold">
          {grn.companyVendor.company_name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {grn.companyVendor.vendor_code}
        </p>
      </td>

      <td className="px-4 py-3">
        <GRNStatusBadge status={grn.status} size="xs" />
      </td>

      <td className="px-4 py-3">
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-bold">
          {grn._count.items} items
        </span>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
        {fmtDate(grn.received_date)}
      </td>

      <td className="px-4 py-3 text-xs font-medium">
        {grn.createdBy.user_name}
      </td>
    </tr>
  );
}