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
    })
      .then((res) => {
        setPurchaseOrders(res.purchase_orders ?? []);
        setTotal(res.total ?? 0);
        setPageSize(res.page_size ?? 20);
        setTotalPages(res.total_pages ?? 0);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to fetch purchase orders",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [vendorId, page, search, statusFilter]);

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
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
            <div className="relative p-5 md:p-6">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-500/10" />

              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                    <ShoppingCart size={22} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black tracking-tight">
                      Purchase Orders
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track supplier orders, delivery status, receipts and financial totals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat icon={ClipboardList} label="Total POs" value={stats.count} />
                <Stat icon={PackageCheck} label="Approved on Page" value={stats.approved} />
                <Stat icon={ShoppingCart} label="Received on Page" value={stats.received} />
                <Stat
                  icon={IndianRupee}
                  label="Amount on Page"
                  value={<span className="text-indigo-600">{fmtMoney(stats.amount)}</span>}
                />
              </div>
            </div>
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
            onOpen={(id) => router.push(`/dashboard/inventory/purchase-orders/${id}`)}
          />
        </div>
      </main>
    
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <Icon size={17} className="mb-3 text-indigo-500" />
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}