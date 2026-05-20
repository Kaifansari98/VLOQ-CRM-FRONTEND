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
    <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                PO
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                Supplier
              </th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase text-muted-foreground">
                Amount
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                Items
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                Delivery
              </th>
              <th className="px-5 py-4 text-right text-[10px] font-black uppercase text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <Skeleton className="h-8 w-full rounded-xl" />
                    </td>
                  ))}
                </tr>
              ))
            ) : purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                      <ShoppingCart size={30} className="opacity-40" />
                    </div>
                    <p className="text-sm font-semibold">No purchase orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr
                  key={po.id}
                  className="group cursor-pointer border-b transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                  onClick={() => onOpen(po.id)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-1 rounded-full bg-indigo-500 opacity-30 transition-opacity group-hover:opacity-100" />
                      <div>
                        <p className="font-mono text-sm font-black text-indigo-600">
                          {po.po_no}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PI: {po.purchaseIntent?.intent_no ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-indigo-600">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {po.companyVendor?.company_name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {po.companyVendor?.vendor_code ?? "—"}
                        </p>
                         <p className="text-xs text-muted-foreground">
                          
                          {po.paymentTerm?.term_name ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <p className="text-base font-black text-indigo-600">
                      {fmtMoney(po.total_amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Tax {fmtMoney(po.tax_amount)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2">
                      <Package size={14} className="text-indigo-500" />
                      <p className="text-xs font-black">{po._count?.items ?? 0} Items</p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={po.status} />
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold">
                      {fmtDate(po.expected_delivery_date)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Created {fmtDate(po.created_at)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        title="View details"
                        onClick={() => onOpen(po.id)}
                        className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-indigo-600"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        title="Open"
                        onClick={() => onOpen(po.id)}
                        className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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