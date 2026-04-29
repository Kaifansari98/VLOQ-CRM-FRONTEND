"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSiteSupervisors } from "@/hooks/booking-stage/use-booking";
import {
  getSupervisorLeads,
  type SupervisorLeadRow,
  type SupervisorLeadsResponse,
} from "@/api/dashboard/dashboard.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupervisorLeadsTableProps {
  vendorId: number;
}

type SupervisorOption = {
  id: number;
  user_name: string;
};

const PAGE_SIZE = 12;
const ALL_SUPERVISORS = "all";

function getSupervisorOptions(source: any): SupervisorOption[] {
  const rows = source?.data?.site_supervisors ?? source?.data ?? source ?? [];
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row: any) => ({
      id: Number(row.id),
      user_name: String(row.user_name ?? row.name ?? "").trim(),
    }))
    .filter((row: SupervisorOption) => row.id > 0 && row.user_name);
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatClientName(client: string) {
  const limitedWords = String(client || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return limitedWords.length > 0
    ? toTitleCase(limitedWords.join(" "))
    : "—";
}

function formatStage(stage: string) {
  const normalized = String(stage || "")
    .trim()
    .replace(/[-_]+/g, " ");

  return normalized ? toTitleCase(normalized) : "—";
}

export default function SupervisorLeadsTable({
  vendorId,
}: SupervisorLeadsTableProps) {
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>(ALL_SUPERVISORS);
  const { data: supervisorData, isLoading: isLoadingSupervisors } =
    useSiteSupervisors(vendorId);

  const supervisorOptions = useMemo(
    () => getSupervisorOptions(supervisorData),
    [supervisorData],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["dashboard-supervisor-leads", vendorId, selectedSupervisor],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      getSupervisorLeads(vendorId, {
        siteSupervisorId:
          selectedSupervisor === ALL_SUPERVISORS
            ? undefined
            : Number(selectedSupervisor),
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage: SupervisorLeadsResponse) =>
      lastPage?.pagination?.hasNext
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });

  const rows = useMemo(
    () => data?.pages.flatMap((page) => page.rows ?? []) ?? [],
    [data],
  );

  const totalCount =
    data?.pages?.[0]?.pagination?.total ??
    rows.length;

  const selectedSupervisorName =
    selectedSupervisor === ALL_SUPERVISORS
      ? "all supervisors"
      : supervisorOptions.find((option) => String(option.id) === selectedSupervisor)
          ?.user_name?.toLowerCase() ?? "selected supervisor";

  const handleTableScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const remainingScroll =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remainingScroll < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="h-full min-h-[420px] rounded-2xl border bg-background p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3 pb-3">
        <div>
          <p className="text-sm font-medium">Supervisor Leads</p>
          <p className="text-xs text-muted-foreground">
            No. of site under each supervisor
          </p>
        </div>

        <Select
          value={selectedSupervisor}
          onValueChange={setSelectedSupervisor}
          disabled={isLoadingSupervisors}
        >
          <SelectTrigger className="w-[220px] text-xs">
            <SelectValue placeholder="Select supervisor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SUPERVISORS}>All Supervisors</SelectItem>
            {supervisorOptions.map((supervisor) => (
              <SelectItem key={supervisor.id} value={String(supervisor.id)}>
                {supervisor.user_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="overflow-x-auto overflow-y-auto max-h-[340px] flex-1"
        onScroll={handleTableScroll}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-border/60">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                Lead Code
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                Client
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                Stage
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-border/30">
                    {Array.from({ length: 3 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No supervisor leads found
                      </td>
                    </tr>
                  )
                : rows.map((lead: SupervisorLeadRow) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">
                        {lead.lead_code || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-xs">
                        {formatClientName(lead.client)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatStage(lead.stage)}
                      </td>
                    </tr>
                  ))}
          </tbody>
        </table>

        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
