"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import BaseModal from "@/components/utils/baseModal";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCheck,
  Cog,
  PackageCheck,
  CalendarClock,
  Truck,
  XCircle,
  ExternalLink,
  Eye,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Wrench,
  Download,
  FileIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Package,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import CustomeTooltip from "@/components/custom-tooltip";
import { useAppSelector } from "@/redux/store";
import {
  useMiscellaneousByStatus,
  MiscellaneousItem,
} from "@/api/miscellaneousModuleApi";
import { Skeleton } from "@/components/ui/skeleton";
import InstallationMiscellaneous from "@/components/installation/under-installation/InstallationMiscellaneous";

export const STAGE_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  "awaiting-approval": {
    title: "Awaiting Approval",
    description: "Newly reported miscellaneous issues awaiting admin or supervisor review.",
    icon: Clock,
    color: "text-amber-500",
  },
  "misc-approved": {
    title: "Misc Approved",
    description: "Approved issues pending production scheduling and Expected Ready Date (ERD) assignment.",
    icon: CheckCheck,
    color: "text-purple-500",
  },
  "under-process": {
    title: "Under Process",
    description: "Approved issues with ERD scheduled, currently under fulfillment or production.",
    icon: Cog,
    color: "text-orange-500",
  },
  "ready-to-dispatch": {
    title: "RTD (Ready To Dispatch)",
    description: "Material is prepared and ready for dispatch from the factory/vendor.",
    icon: PackageCheck,
    color: "text-cyan-500",
  },
  "rtd": {
    title: "RTD (Ready To Dispatch)",
    description: "Material is prepared and ready for dispatch from the factory/vendor.",
    icon: PackageCheck,
    color: "text-cyan-500",
  },
  "dispatch-scheduled": {
    title: "Dispatch Scheduled",
    description: "Dispatch and delivery date has been scheduled for on-site transport.",
    icon: CalendarClock,
    color: "text-indigo-500",
  },
  "dispatched": {
    title: "Dispatched",
    description: "Materials are dispatched and in transit to the installation site.",
    icon: Truck,
    color: "text-blue-500",
  },
  "resolved": {
    title: "Resolved",
    description: "Miscellaneous issues successfully fulfilled, verified, and resolved.",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  "rejected": {
    title: "Rejected",
    description: "Miscellaneous requests that were declined or rejected during review.",
    icon: XCircle,
    color: "text-rose-500",
  },
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const separateImageAndDocs = (docs: any[]) => {
  const imageExtensions = ["jpg", "jpeg", "png", "webp"];
  const videoExtensions = ["mp4", "mov", "webm", "avi"];
  const images = docs.filter((d) => {
    const ext = (d.doc_og_name || d.original_name)?.split(".").pop()?.toLowerCase();
    return imageExtensions.includes(ext || "");
  });
  const videos = docs.filter((d) => {
    const ext = (d.doc_og_name || d.original_name)?.split(".").pop()?.toLowerCase();
    return videoExtensions.includes(ext || "");
  });
  const nonImages = docs.filter((d) => {
    const ext = (d.doc_og_name || d.original_name)?.split(".").pop()?.toLowerCase();
    return !imageExtensions.includes(ext || "") && !videoExtensions.includes(ext || "");
  });
  return { images, videos, nonImages };
};

const renderStatusBadge = (entry: MiscellaneousItem) => {
  let label = entry.status_label;
  if (!label) {
    if (entry.is_resolved) {
      label = "RESOLVED";
    } else if (entry.misc_approved === false) {
      label = "REJECTED";
    } else if (entry.misc_approved !== true) {
      label = "AWAITING APPROVAL";
    } else if (entry.delivery_task?.status === "completed") {
      label = "DISPATCHED";
    } else if (entry.required_delivery_date) {
      label = "DISPATCH SCHEDULED";
    } else if (entry.task?.status === "completed") {
      label = "RTD";
    } else if (entry.expected_ready_date) {
      label = "UNDER PROCESS";
    } else {
      label = "MISCL APPROVED";
    }
  }

  let className =
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";

  if (label === "REJECTED") {
    className =
      "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  } else if (label === "RESOLVED") {
    className =
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  } else if (label === "DISPATCHED") {
    className =
      "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  } else if (label === "DISPATCH SCHEDULED") {
    className =
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  } else if (label === "RTD" || label === "READY TO DISPATCH") {
    className =
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
  } else if (label === "UNDER PROCESS") {
    className =
      "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  } else if (label === "MISCL APPROVED") {
    className =
      "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  }

  return (
    <Badge
      variant="outline"
      className={`text-xs px-2.5 py-0.5 font-semibold whitespace-nowrap border ${className}`}
    >
      {label}
    </Badge>
  );
};

interface MiscellaneousStatusTableProps {
  status: string;
}

export function MiscellaneousStatusTable({
  status,
}: MiscellaneousStatusTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Selected item for modals
  const [selectedItemForDocs, setSelectedItemForDocs] =
    useState<MiscellaneousItem | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] =
    useState<MiscellaneousItem | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Scoping Auth state
  const user = useAppSelector((state) => state.auth.user);
  const selectedFranchiseId = useAppSelector(
    (state) => state.auth.franchise_id,
  );
  const userType = user?.user_type?.user_type
    ?.toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
  const vendorId = user?.vendor_id ?? 0;
  const franchiseId = selectedFranchiseId ?? user?.franchise_id ?? undefined;
  const userId = user?.id;

  const skipFranchiseFilter =
    userType === "factory" ||
    userType === "miscellaneous" ||
    userType === "super-admin" ||
    userType === "auditor";

  const payload = React.useMemo(
    () => ({
      status,
      franchise_id: skipFranchiseFilter ? undefined : franchiseId,
      user_type: userType,
      user_id: userId,
      page,
      limit,
      global_search: debouncedSearch || undefined,
    }),
    [status, skipFranchiseFilter, franchiseId, userType, userId, page, limit, debouncedSearch],
  );

  const { data, isLoading, isFetching, refetch } = useMiscellaneousByStatus(
    vendorId,
    payload,
  );

  const entries: MiscellaneousItem[] =
    data?.miscellaneous || data?.data || [];
  const totalRecords = data?.pagination?.totalRecords ?? data?.count ?? 0;
  const totalPages = data?.pagination?.totalPages || Math.ceil(totalRecords / limit) || 1;

  const config = STAGE_CONFIG[status] || {
    title: status
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: "Manage and track miscellaneous issues in this stage.",
    icon: AlertCircle,
    color: "text-primary",
  };

  const StageIcon = config.icon;

  const handleNavigateToDetails = (leadId: number, accountId: number) => {
    router.push(
      `/dashboard/installation/under-installation/details/${leadId}?accountId=${accountId}`,
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header Title & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-muted/60 border ${config.color}`}>
              <StageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {config.title}
                </h1>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  {totalRecords} {totalRecords === 1 ? "Issue" : "Issues"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[240px] md:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by lead, customer, problem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Select
            value={String(limit)}
            onValueChange={(val) => {
              setLimit(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[110px] text-xs">
              <SelectValue placeholder="Page limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 gap-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Miscellaneous Type
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Lead / Project
                </TableHead>
                <TableHead className="w-[160px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  ERD Date
                </TableHead>
                <TableHead className="min-w-[170px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Responsible Teams
                </TableHead>
                <TableHead className="w-[100px] text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Documents
                </TableHead>
                <TableHead className="w-[150px] text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Problem Description
                </TableHead>
                <TableHead className="w-[90px] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Quantity
                </TableHead>
                <TableHead className="w-[110px] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Cost
                </TableHead>
                <TableHead className="w-[100px] text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="space-y-1">
                          <Skeleton className="w-24 h-4" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-20 h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-28 h-5 rounded-full" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="w-12 h-6 rounded-full mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="w-24 h-6 rounded-full mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-40 h-4" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="w-8 h-4 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="w-12 h-4 ml-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="w-16 h-8 rounded-md mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="p-3 bg-muted/60 rounded-full border">
                        <Wrench className="w-8 h-8 text-muted-foreground/60" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-base text-foreground">
                          No issues found in {config.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {debouncedSearch
                            ? `No results match your search query "${debouncedSearch}". Try clearing filters.`
                            : `There are currently no miscellaneous items in this stage.`}
                        </p>
                      </div>
                      {debouncedSearch && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSearch("")}
                          className="mt-2"
                        >
                          Clear Search Filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-muted/40 cursor-pointer transition-colors border-b last:border-0"
                    onClick={() => setSelectedItemForDetail(entry)}
                  >
                    {/* 1. Miscellaneous Type */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            entry.is_resolved
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : entry.misc_approved === false
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                          }`}
                        >
                          {entry.is_resolved ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : entry.misc_approved === false ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {entry.type?.name || "Miscellaneous"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* 2. Lead / Project */}
                    <TableCell className="py-3.5">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToDetails(
                                entry.lead_id,
                                entry.account_id,
                              );
                            }}
                            title="Open Lead Details"
                          >
                            {entry.lead?.lead_code || `Lead #${entry.lead_id}`}
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </span>
                          {entry.lead?.franchise?.franchise_name && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 font-normal shrink-0"
                            >
                              {entry.lead.franchise.franchise_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">
                          {entry.lead?.firstname || ""}{" "}
                          {entry.lead?.lastname || ""}
                          {entry.lead?.contact_no && (
                            <span className="text-muted-foreground ml-1.5 font-normal">
                              ({entry.lead.contact_no})
                            </span>
                          )}
                        </p>
                      </div>
                    </TableCell>

                    {/* 3. ERD Date */}
                    <TableCell className="py-3.5">
                      {entry.expected_ready_date ? (
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(entry.expected_ready_date)}
                          </p>
                          {entry.solution && (
                            <CustomeTooltip
                              value={entry.solution}
                              truncateValue={
                                <p className="text-[11px] text-muted-foreground truncate max-w-[140px] cursor-help">
                                  {entry.solution}
                                </p>
                              }
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* 4. Responsible Teams */}
                    <TableCell className="py-3.5">
                      {entry.teams && entry.teams.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center">
                          {entry.teams.slice(0, 2).map((team) => (
                            <Badge
                              key={team.team_id}
                              variant="secondary"
                              className="text-[11px] px-2 py-0.5 font-normal"
                            >
                              {team.team_name}
                            </Badge>
                          ))}
                          {entry.teams.length > 2 && (
                            <CustomeTooltip
                              value={entry.teams
                                .map((t) => t.team_name)
                                .join(", ")}
                              truncateValue={
                                <Badge
                                  variant="outline"
                                  className="text-[11px] px-1.5 py-0.5 cursor-pointer font-medium"
                                >
                                  +{entry.teams.length - 2}
                                </Badge>
                              }
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* 5. Documents */}
                    <TableCell className="py-3.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemForDocs(entry);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">
                          {entry.documents?.length ?? 0}
                        </span>
                      </Button>
                    </TableCell>

                    {/* 6. Status */}
                    <TableCell className="py-3.5 text-center">
                      {renderStatusBadge(entry)}
                    </TableCell>

                    {/* 7. Problem Description */}
                    <TableCell className="py-3.5 max-w-[220px]">
                      {entry.problem_description ? (
                        <CustomeTooltip
                          value={entry.problem_description}
                          truncateValue={
                            <p className="text-xs text-foreground/90 truncate cursor-help">
                              {entry.problem_description}
                            </p>
                          }
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* 8. Quantity */}
                    <TableCell className="py-3.5 text-right font-medium text-sm">
                      {entry.quantity !== null && entry.quantity !== undefined
                        ? entry.quantity
                        : "-"}
                    </TableCell>

                    {/* 9. Cost */}
                    <TableCell className="py-3.5 text-right font-medium text-sm">
                      {entry.cost !== null && entry.cost !== undefined
                        ? `₹${Number(entry.cost).toLocaleString("en-IN")}`
                        : "-"}
                    </TableCell>

                    {/* 10. Actions */}
                    <TableCell className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemForDetail(entry);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Go to Project Stage"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToDetails(
                              entry.lead_id,
                              entry.account_id,
                            );
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination Bar ── */}
        {totalRecords > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {Math.min((page - 1) * limit + 1, totalRecords)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, totalRecords)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {totalRecords}
              </span>{" "}
              records
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 gap-1"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>

              <span className="px-2.5 font-medium text-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 gap-1"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Documents Modal ── */}
      <Dialog
        open={!!selectedItemForDocs}
        onOpenChange={(open) => {
          if (!open) setSelectedItemForDocs(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Attached Documents ({selectedItemForDocs?.documents?.length ?? 0})
            </DialogTitle>
            <DialogDescription>
              Lead:{" "}
              <span className="font-medium text-foreground">
                {selectedItemForDocs?.lead?.lead_code}
              </span>{" "}
              • Issue:{" "}
              <span className="font-medium text-foreground">
                {selectedItemForDocs?.type?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {!selectedItemForDocs?.documents?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No documents uploaded for this issue.
              </p>
            ) : (
              selectedItemForDocs.documents.map((doc) => {
                const isImage =
                  doc.original_name.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
                  doc.file_key.match(/\.(jpeg|jpg|gif|png|webp)$/i);

                return (
                  <div
                    key={doc.document_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isImage && doc.signed_url ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.signed_url}
                            alt={doc.original_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted/70 flex items-center justify-center shrink-0">
                          <FileIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.original_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.doc_type_name && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {doc.doc_type_name}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(doc.uploaded_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.signed_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 gap-1.5"
                        >
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Open
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Link unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Exact Reused Installation Miscellaneous Modal ── */}
      {selectedItemForDetail && (
        <InstallationMiscellaneous
          vendorId={selectedItemForDetail.vendor_id}
          leadId={selectedItemForDetail.lead_id}
          accountId={selectedItemForDetail.account_id}
          initialMiscId={selectedItemForDetail.id}
          onlyModal={true}
          onModalClose={() => setSelectedItemForDetail(null)}
        />
      )}
    </div>
  );
}
