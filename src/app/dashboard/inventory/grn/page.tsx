"use client";

import { listGRNs, GRNSummary } from "@/api/grn/grn";
import { CreateGRNSheet } from "@/components/grn/create/CreateGRNSheet";
import { GRNFilters } from "@/components/grn/list/GRNFilters";
import { GRNPageHeader } from "@/components/grn/list/GRNPageHeader";
import { GRNTable } from "@/components/grn/list/GRNTable";
import { useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Package, Pencil } from "lucide-react";

export default function GRNListPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [initialPoId, setInitialPoId] = useState<number | undefined>(undefined);

  const fetchData = useCallback(() => {
    if (!vendorId) return;

    setLoading(true);

    listGRNs(vendorId, {
      page,
      search: search || undefined,
      status: status || undefined,
    })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vendorId, page, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const grns: GRNSummary[] = data?.grns ?? [];
    return {
      total: data?.total ?? grns.length,
      drafts: grns.filter((g) => g.status === "Draft").length,
      confirmed: grns.filter((g) => g.status === "Confirmed").length,
      closed: grns.filter((g) => g.status === "Closed").length,
    };
  }, [data]);

  return (
    <>
      <GRNPageHeader
        onCreate={() => {
          setInitialPoId(undefined);
          setShowCreate(true);
        }}
      />

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="flex w-full flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Goods Receipt Notes
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Track goods received against approved purchase orders and verify supplier shipments.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={ClipboardList}
              label="TOTAL GRNS"
              value={stats.total}
            />
            <KpiCard
              icon={Pencil}
              label="DRAFTS ON PAGE"
              value={stats.drafts}
            />
            <KpiCard
              icon={CheckCircle2}
              label="CONFIRMED ON PAGE"
              value={stats.confirmed}
            />
            <KpiCard
              icon={Package}
              label="CLOSED ON PAGE"
              value={stats.closed}
            />
          </div>

          <GRNFilters
            search={search}
            status={status}
            loading={loading}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onStatus={(value) => {
              setStatus(value);
              setPage(1);
            }}
            onRefresh={fetchData}
          />

          <GRNTable
            data={data}
            loading={loading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onOpen={(grnId) => {
              router.push(`/dashboard/inventory/grn/${grnId}`);
            }}
          />
        </div>
      </main>

      {showCreate && (
        <CreateGRNSheet
          vendorId={vendorId}
          userId={userId}
          initialPoId={initialPoId}
          onClose={() => {
            setShowCreate(false);
            setInitialPoId(undefined);
          }}
          onCreated={() => {
            setShowCreate(false);
            setInitialPoId(undefined);
            fetchData();
          }}
        />
      )}
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