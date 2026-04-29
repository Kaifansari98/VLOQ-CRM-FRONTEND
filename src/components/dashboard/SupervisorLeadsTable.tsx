"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSiteSupervisors } from "@/hooks/booking-stage/use-booking";
import {
  postUniversalStageLeads,
  type UniversalStageLead,
  type UniversalStageLeadResponse,
} from "@/api/universalstage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupervisorLeadsTableProps {
  vendorId: number;
  userId: number;
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

function getClientName(lead: UniversalStageLead) {
  const fullName = `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim();
  return fullName || lead.account?.name || "—";
}

function getLeadStage(lead: UniversalStageLead & { statusType?: { type?: string | null } }) {
  return lead.statusType?.type || "—";
}

export default function SupervisorLeadsTable({
  vendorId,
  userId,
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
    queryKey: ["dashboard-supervisor-leads", vendorId, userId, selectedSupervisor],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      postUniversalStageLeads(vendorId, {
        userId,
        page: pageParam,
        limit: PAGE_SIZE,
        filter_name: "",
        filter_lead_code: "",
        contact: "",
        alt_contact_no: "",
        email: "",
        site_address: "",
        archetech_name: "",
        designer_remark: "",
        furniture_type: [],
        furniture_structure: [],
        site_type: [],
        source: [],
        assign_to:
          selectedSupervisor === ALL_SUPERVISORS
            ? []
            : [Number(selectedSupervisor)],
        created_at: "desc",
        global_search: "",
        site_map_link: null,
      }),
    getNextPageParam: (lastPage: UniversalStageLeadResponse) =>
      lastPage?.pagination?.hasNext
        ? lastPage.pagination.currentPage + 1
        : undefined,
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const rows = useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data],
  );

  const totalCount =
    data?.pages?.[0]?.pagination?.totalRecoards ??
    data?.pages?.[0]?.count ??
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
                : rows.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">
                        {lead.lead_code || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-sm">
                        {getClientName(lead)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {getLeadStage(lead as UniversalStageLead & {
                          statusType?: { type?: string | null };
                        })}
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
