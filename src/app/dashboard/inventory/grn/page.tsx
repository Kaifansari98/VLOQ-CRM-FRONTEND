"use client";

import { listGRNs } from "@/api/grn/grn";
import { CreateGRNSheet } from "@/components/grn/create/CreateGRNSheet";
// import { GRNDetailSheet } from "@/components/grn/detail/GRNDetailSheet";

import { GRNFilters } from "@/components/grn/list/GRNFilters";
import { GRNPageHeader } from "@/components/grn/list/GRNPageHeader";
import { GRNTable } from "@/components/grn/list/GRNTable";
import { useAppSelector } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GRNListPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
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

  return (
    <>
      <GRNPageHeader
        onCreate={() => {
          setInitialPoId(undefined);
          setShowCreate(true);
        }}
      />

      <main className="space-y-4 p-4 md:p-5">
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
  onPageChange={setPage}
  onOpen={(grnId) => {
    router.push(`/dashboard/inventory/grn/${grnId}`);
  }}
/>
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