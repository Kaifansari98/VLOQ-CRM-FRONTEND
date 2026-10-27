"use client";

import {
  listPurchaseOrders,
  POStatus,
  PurchaseOrder,
} from "@/api/purchaseOrder/purchaseOrder";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PurchaseOrderHeader } from "@/components/purchase-order/list/PurchaseOrderHeader";
import { PurchaseOrderFilters } from "@/components/purchase-order/list/PurchaseOrderFilters";
import { PurchaseOrderTable } from "@/components/purchase-order/list/PurchaseOrderTable";
import { useRouter } from "next/navigation";
import {
  fmtMoney,
  getPOFinancials,
} from "@/components/purchase-order/shared/poUtils";
import {
  ClipboardList,
  IndianRupee,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";

export default function PurchaseOrdersPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "">("");  

  const fetchData = useCallback(() => {
    if (!vendorId) return;

    setLoading(true);

    listPurchaseOrders(vendorId, {
      page,
      search: search || undefined,
      status: statusFilter || undefined,
      limit: pageSize,
    })
      .then((res) => {
        setPurchaseOrders(res.purchase_orders ?? []);
        setTotal(res.total ?? 0);
        setPageSize(res.page_size ?? pageSize);
        setTotalPages(res.total_pages ?? 0);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to fetch purchase orders",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [vendorId, page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const amount = purchaseOrders.reduce(
      (s, po) => s + Number(po.total_amount ?? 0),
      0
    );

    return {
      count: total,
      approved: purchaseOrders.filter((p) => p.status === "Approved").length,
      received: purchaseOrders.filter((p) => p.status === "Received").length,
      amount,
    };
  }, [purchaseOrders, total]);

  return (
    <>
      <PurchaseOrderHeader />

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="flex w-full flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Purchase Orders
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Track supplier orders, delivery status, receipts and financial totals.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={ClipboardList} label="TOTAL POS" value={stats.count} />
            <KpiCard icon={PackageCheck} label="APPROVED ON PAGE" value={stats.approved} />
            <KpiCard icon={ShoppingCart} label="RECEIVED ON PAGE" value={stats.received} />
            <KpiCard
              icon={IndianRupee}
              label="AMOUNT ON PAGE"
              value={stats.amount > 0 ? fmtMoney(stats.amount) : "₹0.00"}
            />
          </div>

          <PurchaseOrderFilters
            search={search}
            statusFilter={statusFilter}
            loading={loading}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onStatus={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            onRefresh={fetchData}
          />

          <PurchaseOrderTable
            loading={loading}
            purchaseOrders={purchaseOrders}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            onOpen={(id) => router.push(`/dashboard/inventory/purchase-orders/${id}`)}
          />
        </div>
      </main>
    
    </>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}