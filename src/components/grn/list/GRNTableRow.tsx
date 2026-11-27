"use client";

import { GRNSummary } from "@/api/grn/grn";
import { GRNStatusBadge } from "../shared/GRNStatusBadge";
import { fmtDate } from "../shared/statusUtils";
import { ArrowRight, Eye, Package } from "lucide-react";

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
      className="group cursor-pointer border-b transition-colors hover:bg-muted/40"
    >
      <td className="px-4 py-3">
        <p className="text-xs font-bold text-foreground">{grn.grn_no}</p>
        <p className="text-[11px] text-muted-foreground">
          {grn.invoice_no || grn.gate_entry_no || grn.vehicle_no || "—"}
        </p>
      </td>

      <td className="px-4 py-3">
        <span className="text-xs font-medium text-foreground">
          {grn.purchaseOrder?.po_no ?? "—"}
        </span>
      </td>

      <td className="px-4 py-3">
        <p className="text-xs font-bold uppercase text-foreground">
          {grn.companyVendor?.company_name ?? "—"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {grn.companyVendor?.vendor_code ?? "—"}
        </p>
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-xs font-medium text-foreground">
          <Package size={13} className="text-muted-foreground" />
          {grn._count?.items ?? 0}{" "}
          {grn._count?.items === 1 ? "Product" : "Products"}
        </span>
      </td>

      <td className="px-4 py-3">
        <GRNStatusBadge status={grn.status} size="sm" />
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground">
        {fmtDate(grn.received_date)}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-foreground">
        {grn.createdBy?.user_name ?? "—"}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-right">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onOpen(grn.id)}
            title="View Details"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => onOpen(grn.id)}
            title="Open GRN"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}