"use client";

import { useEffect, useState } from "react";
import { ArrowRight, History, Loader2, Search } from "lucide-react";
import { useComplaintActivity } from "@/api/client-complaints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_META } from "./complaint-meta";
import { complaintDate, displayText } from "./complaint-details-format";

export function ComplaintActivityLog({
  vendorId,
  complaintId,
  cycleId,
}: {
  vendorId: number;
  complaintId: number;
  cycleId?: number;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { data, isPending, isError, refetch, isFetching } =
    useComplaintActivity(vendorId, complaintId, {
      page,
      limit: 20,
      search: query || undefined,
      cycle_id: cycleId,
    });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Activity log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recorded actions, status changes and decisions.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search activity"
            placeholder="Search activity…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      {isPending ? (
        <div
          role="status"
          className="flex items-center gap-2 p-8 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" /> Loading history…
        </div>
      ) : isError ? (
        <div role="alert" className="rounded-xl border p-6 text-sm">
          Couldn’t load activity history.{" "}
          <Button variant="link" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : !data?.rows.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <History className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {query
              ? "No activities match your search."
              : "No activity recorded for this selection."}
          </p>
        </div>
      ) : (
        <ol className="space-y-0">
          {data.rows.map((entry) => (
            <li
              key={entry.id}
              className="relative ml-3 border-l pb-6 pl-6 last:border-transparent last:pb-0"
            >
              <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
              <div className="rounded-xl border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {displayText(entry.action)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Cycle {entry.cycle.cycle_number}
                  </span>
                </div>
                {entry.from_status || entry.to_status ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {entry.from_status
                      ? (STATUS_META[entry.from_status]?.label ??
                        displayText(entry.from_status))
                      : "Registered"}
                    <ArrowRight className="size-3" />
                    {entry.to_status
                      ? (STATUS_META[entry.to_status]?.label ??
                        displayText(entry.to_status))
                      : "No status change"}
                  </div>
                ) : null}
                {entry.remarks && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                    {entry.remarks}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {entry.actor?.user_name || displayText(entry.actor_type)}
                  </span>
                  <span>·</span>
                  <time dateTime={entry.created_at}>
                    {complaintDate(entry.created_at, true)}
                  </time>
                  {entry.acting_on_behalf_of_client && (
                    <span className="rounded-md bg-muted px-2 py-1">
                      On behalf of client
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
          <span>
            {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of{" "}
            {data.total} activities{" "}
            {isFetching && (
              <Loader2 className="ml-1 inline size-3 animate-spin" />
            )}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page * 20 >= data.total || isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
