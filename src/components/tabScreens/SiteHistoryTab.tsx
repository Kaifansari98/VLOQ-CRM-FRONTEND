"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fetchLeadLogs } from "@/api/leads";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  Upload,
  Edit3,
  FileSpreadsheet,
  Search,
  X,
  CheckCheck,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateSiteHistoryReport } from "@/lib/reports/siteHistoryReport";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { useAppSelector } from "@/redux/store";

interface SiteHistoryTabProps {
  leadId: number;
  vendorId: number;
  leadCode?: string | null;
  leadName?: string | null;
}

type TabId = "lead-history" | "task-history" | "follow-ups" | "approvals";

const HISTORY_TYPE_MAP: Record<TabId, "Lead" | "Task" | "FollowUp" | "Approval"> = {
  "lead-history": "Lead",
  "task-history": "Task",
  "follow-ups": "FollowUp",
  approvals: "Approval",
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "CREATE":
      return Upload;
    case "UPDATE":
      return Edit3;
    default:
      return CheckCircle2;
  }
};

const parseActionMessage = (action: string) => {
  if (!action.includes("Remark:")) {
    return { main: action.trim(), remark: null };
  }

  const [mainPart, remarkPart] = action.split("Remark:");
  const cleanedMain = mainPart.replace(/—\s*$/, "").trim();
  const cleanedRemark = remarkPart?.trim() || null;

  return { main: cleanedMain, remark: cleanedRemark };
};

const formatStageLabel = (stageName?: string | null) => {
  if (!stageName) return null;

  return stageName
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getApprovalStatus = (action: string) => {
  const normalizedAction = action.toLowerCase();

  if (normalizedAction.includes("rejected")) {
    return "rejected" as const;
  }

  if (normalizedAction.includes("approved")) {
    return "approved" as const;
  }

  return "requested" as const;
};

const getApprovalStatusConfig = (status: ReturnType<typeof getApprovalStatus>) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        icon: CheckCheck,
        bgClass: "bg-green-50 dark:bg-green-950/30",
        borderClass: "border-green-200 dark:border-green-900/60",
        badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-900/60",
        dotClass: "bg-green-500 dark:bg-green-600",
        textClass: "text-green-900 dark:text-green-100",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        bgClass: "bg-red-50 dark:bg-red-950/30",
        borderClass: "border-red-200 dark:border-red-900/60",
        badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-900/60",
        dotClass: "bg-red-500 dark:bg-red-600",
        textClass: "text-red-900 dark:text-red-100",
      };
    default:
      return {
        label: "Pending",
        icon: AlertCircle,
        bgClass: "bg-amber-50 dark:bg-amber-950/30",
        borderClass: "border-amber-200 dark:border-amber-900/60",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
        dotClass: "bg-amber-500 dark:bg-amber-600",
        textClass: "text-amber-900 dark:text-amber-100",
      };
  }
};

export default function SiteHistoryTab({
  leadId,
  vendorId,
  leadCode,
  leadName,
}: SiteHistoryTabProps) {
  const userType = useAppSelector((state) => state.auth.user?.user_type?.user_type);
  const userTypeId = useAppSelector((state) => state.auth.user?.user_type_id);
  const normalizedUserType = userType?.trim().toLowerCase() ?? "";
  const canSeeLeadHistoryTab =
    normalizedUserType === "super-admin" || normalizedUserType === "custom";
  const visibleTabIds: TabId[] = canSeeLeadHistoryTab
    ? ["lead-history", "task-history", "follow-ups", "approvals"]
    : ["task-history", "follow-ups", "approvals"];
  const defaultTabId: TabId = canSeeLeadHistoryTab
    ? "lead-history"
    : "task-history";

  const [activeTab, setActiveTab] = useState<TabId>(defaultTabId);
  const historyType = HISTORY_TYPE_MAP[activeTab];

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setDebouncedSearch("");
  }, [activeTab]);

  useEffect(() => {
    if (!visibleTabIds.includes(activeTab)) {
      setActiveTab(defaultTabId);
    }
  }, [activeTab, defaultTabId, visibleTabIds]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [
        "leadLogs",
        leadId,
        vendorId,
        historyType,
        debouncedSearch,
        userTypeId,
      ],
      queryFn: async ({ pageParam }) =>
        await fetchLeadLogs({
          leadId,
          vendorId,
          cursor: pageParam ?? undefined,
          limit: 10,
          historyType,
          search: debouncedSearch || undefined,
          userTypeId,
        }),
      enabled: Boolean(userTypeId && visibleTabIds.includes(activeTab)),
      getNextPageParam: (lastPage) =>
        lastPage?.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
      initialPageParam: undefined,
    });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!userTypeId) {
      toast.error("User type is not available.");
      return;
    }

    setIsExporting(true);
    try {
      await generateSiteHistoryReport({
        leadId,
        vendorId,
        leadCode,
        leadName,
        userTypeId,
      });
      toast.success("Site history exported successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export.";
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allLogs = data?.pages.flatMap((page) => page.data) ?? [];
  const isApprovalTimeline = activeTab === "approvals";

  // Timeline content for non-approval tabs
  const timelineContent = (
    <div className="pt-3">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      ) : allLogs.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="mx-auto text-muted-foreground/30 mb-2" size={36} />
          <p className="text-sm text-muted-foreground">No logs available yet</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

            <AnimatePresence mode="popLayout">
              {allLogs.map((log, index) => {
                const parsed = parseActionMessage(log.action);
                const ActionIcon = getActionIcon(log.action_type);

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="relative pl-12 pb-3 last:pb-0"
                  >
                    <div className="absolute left-0 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-primary-foreground ring-4 ring-background">
                      <ActionIcon size={14} />
                    </div>

                    <Card className="gap-2.5 border p-4 bg-transparent">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(log.created_at),
                              "MMM dd, yyyy · hh:mm a"
                            )}
                          </span>
                        </div>

                        {formatStageLabel(log.stage?.name) && (
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs font-medium h-5 px-1.5"
                          >
                            {formatStageLabel(log.stage?.name)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-foreground font-medium leading-relaxed">
                        {parsed.main}
                      </p>
                      {parsed.remark && (
                        <p className="text-xs text-muted-foreground italic">
                          {parsed.remark}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {log.created_by?.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-xs">
                            {log.created_by?.name || "Unknown"}
                          </span>
                          {log.created_by?.email && (
                            <span className="text-[10px] text-muted-foreground">
                              {log.created_by.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {log.docs.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Attachments ({log.docs.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.docs.map((doc: any) => (
                              <a
                                key={doc.id}
                                href={doc.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted px-3 py-1.5 text-xs transition-colors"
                              >
                                <FileText
                                  size={12}
                                  className="text-muted-foreground shrink-0"
                                />
                                <span className="font-medium truncate max-w-[180px]">
                                  {doc.original_name}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div ref={ref} className="flex justify-center mt-5 mb-2">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2
                  className="animate-spin text-muted-foreground"
                  size={16}
                />
                <p className="text-xs text-muted-foreground">Loading more...</p>
              </div>
            ) : hasNextPage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                className="text-xs text-muted-foreground"
              >
                Load more
              </Button>
            ) : allLogs.length > 0 ? (
              <p className="text-xs text-muted-foreground py-3">
                End of timeline
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  // Card-based approval content
  const approvalContent = (
    <div className="pt-3">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading approvals...</p>
        </div>
      ) : allLogs.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="mx-auto text-muted-foreground/30 mb-3" size={40} />
          <p className="text-sm text-muted-foreground font-medium">No approval requests yet</p>
          <p className="text-xs text-muted-foreground mt-1">All requests will appear here</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {allLogs.map((log, index) => {
                const parsed = parseActionMessage(log.action);
                const approvalStatus = getApprovalStatus(log.action);
                const config = getApprovalStatusConfig(approvalStatus);
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`border-2 overflow-hidden transition-all hover:shadow-md ${config.borderClass} ${config.bgClass}`}>
                      {/* Status Header */}
                      <div className="flex items-center justify-between p-4 border-b border-inherit">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.bgClass} border ${config.borderClass}`}>
                            <StatusIcon className={`w-5 h-5 ${config.textClass}`} />
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold ${config.textClass}`}>
                              {config.label}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Approval Request
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`font-semibold border ${config.badgeClass}`}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 space-y-4">
                        {/* Main Action Message */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground leading-relaxed">
                            {parsed.main}
                          </p>
                          {parsed.remark && (
                            <div className="bg-background/80 border border-border rounded-lg p-3">
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                                Remark
                              </p>
                              <p className="text-sm text-foreground italic">
                                {parsed.remark}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-inherit">
                          {/* Date & Time */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              Date & Time
                            </p>
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-foreground font-medium">
                                {format(
                                  new Date(log.created_at),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground ml-5">
                              {format(
                                new Date(log.created_at),
                                "hh:mm a"
                              )}
                            </div>
                          </div>

                          {/* Approved/Requested By */}
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {approvalStatus === "requested" ? "Requested By" : "Actioned By"}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-muted-foreground">
                                  {log.created_by?.name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {log.created_by?.name || "Unknown"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stage Badge */}
                        {formatStageLabel(log.stage?.name) && (
                          <div className="pt-2 border-t border-inherit">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Stage
                            </p>
                            <Badge
                              variant="outline"
                              className="capitalize text-xs font-medium px-3 py-1.5 bg-background/60"
                            >
                              {formatStageLabel(log.stage?.name)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Attachments Section */}
                      {log.docs.length > 0 && (
                        <div className="px-4 py-3 border-t border-inherit bg-background/30">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Linked Documents ({log.docs.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {log.docs.map((doc: any) => (
                              <a
                                key={doc.id}
                                href={doc.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-md border border-border bg-background hover:bg-muted px-2.5 py-1.5 text-xs transition-all hover:border-foreground/40"
                              >
                                <FileText
                                  size={12}
                                  className="text-muted-foreground flex-shrink-0"
                                />
                                <span className="font-medium truncate max-w-[150px]">
                                  {doc.original_name}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Load More */}
          <div ref={ref} className="flex justify-center mt-6">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2
                  className="animate-spin text-muted-foreground"
                  size={16}
                />
                <p className="text-xs text-muted-foreground">Loading more...</p>
              </div>
            ) : hasNextPage ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                className="text-xs"
              >
                Load more approvals
              </Button>
            ) : allLogs.length > 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                No more approvals to load
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  const tabItems = [
    {
      id: "lead-history",
      title: "Lead History",
      color: "bg-foreground",
      cardContent: timelineContent,
    },
    {
      id: "task-history",
      title: "Task History",
      color: "bg-foreground",
      cardContent: timelineContent,
    },
    {
      id: "follow-ups",
      title: "Follow Ups",
      color: "bg-foreground",
      cardContent: timelineContent,
    },
    {
      id: "approvals",
      title: "Approvals",
      color: "bg-foreground",
      cardContent: isApprovalTimeline ? approvalContent : timelineContent,
    },
  ].filter((item) => visibleTabIds.includes(item.id as TabId));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative pb-4 w-full mx-auto"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Site History</h2>
        <p className="text-xs text-muted-foreground">
          {isApprovalTimeline
            ? "View all approval requests and their status"
            : "Track all activities and changes for this lead"}
        </p>
      </div>

      <div className="relative">
        <SmoothTab
          items={tabItems}
          defaultTabId={defaultTabId}
          onChange={(tabId) => setActiveTab(tabId as TabId)}
        />
        <div className="absolute top-0 right-0 flex items-center gap-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder={isApprovalTimeline ? "Search approvals..." : "Search history..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs w-48"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            className="shrink-0 gap-2"
            disabled={isExporting}
            onClick={handleExport}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}