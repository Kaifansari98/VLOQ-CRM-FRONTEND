"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2, Search, X } from "lucide-react";
import {
  getComplaintLeadFranchises,
  getComplaintLeadOptions,
} from "@/api/client-complaints";
import { useAppSelector } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AssignToPicker from "@/components/assign-to-picker";
import type { ComplaintLeadLookup } from "@/types/client-complaints";

interface Props {
  vendorId: number;
  selectedLead: ComplaintLeadLookup | null;
  selecting: boolean;
  onSelect: (code: string) => void;
  onClear: () => void;
  error?: string;
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function ComplaintLeadPicker({
  vendorId,
  selectedLead,
  selecting,
  onSelect,
  onClear,
  error,
}: Props) {
  const viewerId = useAppSelector((state) => state.auth.user?.id);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [franchise, setFranchise] = useState("all");
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const waitingForSearch = search.trim() !== debouncedSearch;
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const franchises = useQuery({
    queryKey: ["complaint-lead-franchises", vendorId, viewerId],
    queryFn: ({ signal }) => getComplaintLeadFranchises(vendorId, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const leads = useInfiniteQuery({
    queryKey: [
      "complaint-lead-options",
      vendorId,
      viewerId,
      franchise,
      debouncedSearch,
    ],
    queryFn: ({ pageParam, signal }) =>
      getComplaintLeadOptions(
        vendorId,
        {
          franchise_id: franchise === "all" ? undefined : Number(franchise),
          search: debouncedSearch || undefined,
          after_id: pageParam ?? undefined,
        },
        signal,
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: !selectedLead && !waitingForSearch,
    retry: false,
    gcTime: 0,
  });
  const rows = leads.data?.pages.flatMap((page) => page.rows) ?? [];
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = leads;
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [franchise, debouncedSearch]);
  useEffect(() => {
    const sentinel = sentinelRef.current,
      root = listRef.current;
    if (
      !sentinel ||
      !root ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      selectedLead ||
      waitingForSearch
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          void fetchNextPage({ cancelRefetch: false });
      },
      { root, rootMargin: "0px 0px 40px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    selectedLead,
    waitingForSearch,
  ]);
  const loading = waitingForSearch || leads.isPending;

  return (
    <div
      className={
        selectedLead ? "space-y-2.5" : "flex min-h-0 flex-1 flex-col gap-2.5"
      }
    >
      <Label htmlFor="complaint-lead-search" className="text-xs">
        Find a CRM lead
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            id="complaint-lead-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              onClear();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setDebouncedSearch(search.trim());
              }
            }}
            placeholder="Search name or lead code…"
            className="h-9 rounded-xl pl-9 text-xs"
          />
        </div>
        <div
          className="w-full sm:w-48"
          role="group"
          aria-label="Filter leads by franchise"
        >
          <AssignToPicker
            data={[
              { id: 0, label: "All franchises" },
              ...(franchises.data ?? []).map((item) => ({
                id: item.id,
                label: item.franchise_name,
              })),
            ]}
            value={franchise === "all" ? 0 : Number(franchise)}
            onChange={(id) => {
              setFranchise(id ? String(id) : "all");
              onClear();
            }}
            placeholder="Search franchises…"
            emptyLabel="All franchises"
            className="h-9 rounded-xl text-xs"
            textClassName="text-xs"
          />
        </div>
      </div>
      {franchises.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 text-xs text-destructive"
        >
          <span>Couldn’t load franchises.</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => franchises.refetch()}
          >
            Retry franchises
          </Button>
        </div>
      )}
      {selectedLead ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-xs font-semibold">
            {initials(selectedLead.client_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {selectedLead.client_name}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {selectedLead.lead_code}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Change selected lead"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          ref={listRef}
          role="region"
          aria-label="CRM leads"
          aria-busy={loading || selecting || isFetchingNextPage}
          className="max-h-72 overflow-y-auto overscroll-contain rounded-xl border lg:min-h-72 lg:max-h-none lg:flex-1 lg:basis-0"
        >
          {loading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 p-8 text-xs text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" />
              Loading leads…
            </div>
          ) : leads.isError && !leads.data ? (
            <div role="alert" className="p-6 text-center text-xs">
              <p>Couldn’t load leads.</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => leads.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : !rows.length ? (
            <p className="p-8 text-center text-xs text-muted-foreground">
              No leads found{franchise !== "all" ? " for this franchise" : ""}
              {debouncedSearch ? " matching your search" : ""}.
            </p>
          ) : (
            <>
              {rows.map((row) => {
                const name = [row.firstname, row.lastname]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => onSelect(row.lead_code)}
                    disabled={selecting}
                    className="flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
                    aria-label={`Select ${name || "Unnamed lead"}, ${row.lead_code}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/30 text-xs font-semibold">
                      {initials(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">
                        {name || "Unnamed lead"}
                      </span>
                      <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                        {row.lead_code}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
              <div
                ref={sentinelRef}
                className="flex min-h-10 items-center justify-center px-3 py-2"
                aria-live="polite"
              >
                {isFetchingNextPage ? (
                  <span
                    role="status"
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading more leads…
                  </span>
                ) : isFetchNextPageError ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => fetchNextPage()}
                  >
                    Retry loading more
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {hasNextPage
                      ? "Scroll to load more"
                      : "All matching leads loaded"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {selecting && (
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Loader2 className="size-3.5 animate-spin" />
          Loading client details…
        </p>
      )}
      {error && (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
