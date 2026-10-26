"use client";

import { PurchaseOrder, POStatus } from "@/api/purchaseOrder/purchaseOrder";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Building2,
  Eye,
  Package,
  ShoppingCart,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import {
  fmtDate,
  fmtDateTime,
  fmtMoney,
  StatusBadge,
  toNum,
} from "../shared/poUtils";
import { PurchaseOrderPagination } from "./PurchaseOrderPagination";

export function PurchaseOrderTable({
  loading,
  purchaseOrders,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onOpen,
}: {
  loading: boolean;
  purchaseOrders: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/20 text-muted-foreground">
              <th className="px-4 py-3.5 text-left font-semibold">PO</th>
              <th className="px-4 py-3.5 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3.5 text-right font-semibold">Amount</th>
              <th className="px-4 py-3.5 text-left font-semibold">Items</th>
              <th className="px-4 py-3.5 text-left font-semibold">Status</th>
              <th className="px-4 py-3.5 text-left font-semibold">Delivery</th>
              <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <Skeleton className="h-6 w-full rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            ) : purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                      <ShoppingCart size={24} className="opacity-40" />
                    </div>
                    <p className="text-sm font-semibold">No purchase orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr
                  key={po.id}
                  className="group cursor-pointer border-b transition-colors hover:bg-muted/30"
                  onClick={() => onOpen(po.id)}
                >
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-xs text-foreground">
                      {po.po_no}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      PI: {po.purchaseIntent?.intent_no ?? "—"}
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-xs text-foreground">
                      {po.companyVendor?.company_name ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[po.companyVendor?.vendor_code, po.paymentTerm?.term_name]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <p className="font-bold text-xs text-foreground">
                      {fmtMoney(po.total_amount)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Grand total
                    </p>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                      <Package size={13} className="shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {po._count?.items ?? (po as any).items?.length ?? 0} Products
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={po.status} />
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-xs text-foreground">
                      {fmtDate(po.expected_delivery_date)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Created {fmtDate(po.created_at)}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="View details"
                        onClick={() => onOpen(po.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        title="Open"
                        onClick={() => onOpen(po.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <PurchaseOrderPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onChange={onPageChange}
        />
      )}
    </div>
  );
}