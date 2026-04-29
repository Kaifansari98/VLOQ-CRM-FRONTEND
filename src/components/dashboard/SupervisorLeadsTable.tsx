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
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      ? ""
      : supervisorOptions.find((option) => String(option.id) === selectedSupervisor)
          ?.user_name ?? "";

  const subtitle = useMemo(() => {
    if (isLoading) return "Loading supervisor leads...";

    const leadText = `${totalCount} Lead${totalCount === 1 ? "" : "s"}`;
    return selectedSupervisorName
      ? `${leadText} - ${selectedSupervisorName}`
      : leadText;
  }, [isLoading, totalCount, selectedSupervisorName]);

  const handleTableScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const remainingScroll =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remainingScroll < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Card className="w-full border flex flex-col bg-background min-h-[420px]">
      <div className="flex items-start justify-between gap-3 pl-4 pr-4">
        <p className="flex flex-col">
          <span className="text-sm font-medium">Supervisor Leads</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </p>

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

      <CardContent className="p-0 flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No supervisor leads found
          </div>
        ) : (
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "340px" }}
            onScroll={handleTableScroll}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Lead Code</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((lead: SupervisorLeadRow) => (
                  <TableRow
                    key={lead.id}
                    className="text-xs hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-[11px]">
                      {lead.lead_code || "—"}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {formatClientName(lead.client)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatStage(lead.stage)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
