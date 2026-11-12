"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Inbox,
  Loader2,
  MessageSquareWarning,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useComplaints } from "@/api/client-complaints";
import { ClientComplaintRow, ComplaintStatus } from "@/types/client-complaints";
import {
  ALL_STATUSES,
  COMPONENT_LABELS,
  PRIORITY_META,
  STATUS_GROUPS,
  STATUS_META,
  toneClasses,
} from "./complaint-meta";

interface ClientComplaintsViewProps {
  vendorId?: number;
  canRegister: boolean;
  onCreateOpen: () => void;
  onViewItem: (item: ClientComplaintRow) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const StatusBadge = ({ status }: { status: ComplaintStatus }) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${meta.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
    </span>
  );
};

export const ClientComplaintsView: React.FC<ClientComplaintsViewProps> = ({
  vendorId,
  canRegister,
  onCreateOpen,
  onViewItem,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // Either a dashboard group key or "status:<STATUS>" for a single status.
  const [filter, setFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, rowsPerPage]);

  const statuses = useMemo<ComplaintStatus[]>(() => {
    if (filter.startsWith("status:")) return [filter.slice(7) as ComplaintStatus];
    return STATUS_GROUPS.find((g) => g.key === filter)?.statuses ?? [];
  }, [filter]);

  const pageSize = Number(rowsPerPage) || 10;
  const { data, isLoading, isFetching, isError } = useComplaints(vendorId, {
    page: currentPage,
    limit: pageSize,
    search: search || undefined,
    status: statuses,
  });

  const rows = data?.rows ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const groupCount = (groupStatuses: ComplaintStatus[]) => {
    const counts = data?.status_counts ?? {};
    const keys = groupStatuses.length ? groupStatuses : ALL_STATUSES;
    return keys.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  };

  const hasFilters = !!searchInput || filter !== "all";

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Client Complaints</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register, track and resolve after-sales complaints from clients
          </p>
        </div>
        {canRegister && (
          <Button
            onClick={onCreateOpen}
            className="w-fit gap-2 text-xs font-semibold h-10 px-4 shadow-sm rounded-xl"
          >
            <Plus className="w-4 h-4" /> Register Complaint
          </Button>
        )}
      </div>

      {/* Dashboard counters — clicking one filters the list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {STATUS_GROUPS.map(({ key, label, statuses: groupStatuses, tone }) => {
          const selected = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(selected && key !== "all" ? "all" : key)}
              className={`rounded-2xl border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/30 ${
                selected ? "border-primary ring-1 ring-primary/30" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground font-medium truncate">{label}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${toneClasses(tone).dot}`} />
              </div>
              <div className="text-xl font-bold leading-tight text-foreground mt-1">
                {isLoading ? <Skeleton className="h-6 w-8" /> : groupCount(groupStatuses)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 w-full">
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Complaint ID, client, mobile, lead code or issue..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
          {isFetching && !isLoading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_GROUPS.map((g) => (
                <SelectItem key={g.key} value={g.key}>
                  {g.key === "all" ? "Status: All" : g.label}
                </SelectItem>
              ))}
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={`status:${s}`}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput("");
                setFilter("all");
              }}
              className="h-9 text-xs text-muted-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="border rounded-2xl bg-card overflow-x-auto shadow-sm">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wider uppercase pl-6">Complaint</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">Client</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">Product</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">Priority</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">Status</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">Assigned</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">Registered</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wider uppercase pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="py-4 px-6">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  {/* Complaint */}
                  <TableCell className="py-3.5 pl-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted/40 border shrink-0 mt-0.5">
                        <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <div
                          onClick={() => onViewItem(item)}
                          className="font-bold text-xs text-foreground hover:text-primary cursor-pointer transition-colors font-mono"
                        >
                          {item.complaint_code}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[240px] mt-0.5">
                              {item.category} · {COMPONENT_LABELS[item.component]}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[320px] text-xs break-words whitespace-pre-wrap">
                              {item.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {item.possible_duplicate && (
                            <span className="inline-flex items-center gap-1 px-1.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                              <AlertTriangle className="w-2.5 h-2.5" /> Possible duplicate
                            </span>
                          )}
                          {item.cycle_number > 1 && (
                            <span className="inline-flex items-center gap-1 px-1.5 rounded-md text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                              <RotateCcw className="w-2.5 h-2.5" /> Reopened ×{item.cycle_number - 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="text-xs">
                    <div className="font-semibold text-foreground">{item.client_name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.client_mobile}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {item.lead_code ?? (item.client_type === "EXCEPTIONAL" ? "Exceptional" : "External client")}
                    </div>
                  </TableCell>

                  {/* Product */}
                  <TableCell className="text-xs max-w-[200px]">
                    <div className="text-foreground truncate">{item.product_type ?? "—"}</div>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    {item.priority ? (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${PRIORITY_META[item.priority].className}`}
                      >
                        {PRIORITY_META[item.priority].label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Not set</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>

                  {/* Assigned */}
                  <TableCell className="text-xs">
                    <div className="space-y-0.5">
                      <div className="text-foreground">
                        <span className="text-[10px] font-semibold text-muted-foreground mr-1">SS</span>
                        {item.assigned_ss?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                      </div>
                      <div className="text-foreground">
                        <span className="text-[10px] font-semibold text-muted-foreground mr-1">HSS</span>
                        {item.assigned_hss?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                      </div>
                    </div>
                  </TableCell>

                  {/* Registered */}
                  <TableCell className="text-xs whitespace-nowrap">
                    <div className="font-medium text-foreground">{formatDate(item.created_at)}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{formatTime(item.created_at)}</div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onViewItem(item)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="w-6 h-6" />
                    <span className="text-xs">
                      {isError
                        ? "Unable to load complaints. Please refresh."
                        : hasFilters
                          ? "No complaints match your filter criteria."
                          : "No complaints registered yet."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-muted/20 text-xs">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{totalItems === 0 ? 0 : startIndex + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> results
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows per page</span>
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="w-[65px] h-8 text-xs bg-muted/30 rounded-lg">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)} title="First Page">
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} title="Previous Page">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-muted-foreground">
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} title="Next Page">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} title="Last Page">
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
