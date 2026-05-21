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
  GitBranch,
  CheckCheck,
  XCircle,
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

const getActionStyle = (actionType: string) => {
  switch (actionType) {
    case "CREATE":
      return "bg-foreground text-primary-foreground ring-4 ring-background";
    case "UPDATE":
      return "bg-background text-foreground border-2 border-foreground/40 ring-4 ring-background";
    default:
      return "bg-background text-muted-foreground border-2 border-border ring-4 ring-background";
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

const getApprovalStatusMeta = (status: ReturnType<typeof getApprovalStatus>) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        icon: CheckCheck,
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
        dotClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        badgeClass:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
        dotClass:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
      };
    default:
      return {
        label: "Requested",
        icon: GitBranch,
        badgeClass:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
        dotClass:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
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

  // Reset search when tab changes
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

  const timelineItems = allLogs.map((log) => {
    const parsed = parseActionMessage(log.action);
    const approvalStatus = getApprovalStatus(log.action);
    const approvalMeta = getApprovalStatusMeta(approvalStatus);

    return {
      log,
      parsed,
      approvalStatus,
      approvalMeta,
    };
  });

  const timelineContent = (
    <div className="pt-3">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              className={`absolute left-[15px] top-0 bottom-0 w-px ${
                isApprovalTimeline
                  ? "bg-gradient-to-b from-sky-200 via-border to-red-200 dark:from-sky-900/50 dark:via-border dark:to-red-900/50"
                  : "bg-border"
              }`}
            />

            <AnimatePresence mode="popLayout">
              {timelineItems.map(
                ({ log, parsed, approvalMeta, approvalStatus }, index) => {
                  const ActionIcon = isApprovalTimeline
                    ? approvalMeta.icon
                    : getActionIcon(log.action_type);
                  const dotStyle = isApprovalTimeline
                    ? `border ${approvalMeta.dotClass}`
                    : getActionStyle(log.action_type);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      className="relative pl-12 pb-3 last:pb-0"
                    >
                      <div
                        className={`absolute left-0 top-2.5 flex h-8 w-8 items-center justify-center rounded-full ${dotStyle}`}
                      >
                        <ActionIcon size={14} />
                      </div>

                      <Card
                        className={`gap-2.5 border p-4 ${
                          isApprovalTimeline
                            ? "border-border/80 bg-gradient-to-br from-background via-background to-muted/20"
                            : "border-border bg-transparent"
                        }`}
                      >
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

                          <div className="flex items-center gap-2 flex-wrap">
                            {isApprovalTimeline ? (
                              <Badge
                                variant="outline"
                                className={`h-5 px-2 text-[11px] font-semibold ${approvalMeta.badgeClass}`}
                              >
                                {approvalMeta.label}
                              </Badge>
                            ) : null}
                            {formatStageLabel(log.stage?.name) && (
                              <Badge
                                variant="secondary"
                                className="capitalize text-xs font-medium h-5 px-1.5"
                              >
                                {formatStageLabel(log.stage?.name)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isApprovalTimeline ? (
                          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <GitBranch size={13} />
                              <span className="tracking-wide uppercase">
                                Approval Event
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-foreground leading-relaxed">
                              {parsed.main}
                            </p>
                            {parsed.remark && (
                              <div className="mt-2 rounded-md border border-border/50 bg-background/80 px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Remark
                                </p>
                                <p className="mt-1 text-xs italic text-muted-foreground">
                                  {parsed.remark}
                                </p>
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex h-2 w-2 rounded-full bg-current opacity-70" />
                              <span>
                                Approval Request{" "}
                                {approvalStatus === "requested"
                                  ? "raised"
                                  : approvalStatus}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-foreground font-medium leading-relaxed">
                              {parsed.main}
                            </p>
                            {parsed.remark && (
                              <p className="text-xs text-muted-foreground italic">
                                {parsed.remark}
                              </p>
                            )}
                          </>
                        )}

                        <div
                          className={`flex items-center gap-2 ${
                            log.docs.length > 0
                              ? "border-b border-border/50 pb-2.5"
                              : ""
                          }`}
                        >
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
                              {isApprovalTimeline
                                ? `Linked Files (${log.docs.length})`
                                : `Attachments (${log.docs.length})`}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {log.docs.map((doc: any) => (
                                <a
                                  key={doc.id}
                                  href={doc.signedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                                    isApprovalTimeline
                                      ? "border-border/80 bg-background hover:bg-muted/50"
                                      : "border-border bg-muted/40 hover:bg-muted"
                                  }`}
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
                },
              )}
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
            ) : (
              <div className="text-center py-10">
                <FileText
                  className="mx-auto text-muted-foreground/30 mb-2"
                  size={36}
                />
                <p className="text-sm text-muted-foreground">
                  No logs available yet
                </p>
              </div>
            )}
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
      title: "Follow Up's",
      color: "bg-foreground",
      cardContent: timelineContent,
    },
    {
      id: "approvals",
      title: "Approvals",
      color: "bg-foreground",
      cardContent: timelineContent,
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
          Track all activities and changes for this lead
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
              placeholder="Search history..."
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
            {isExporting ? "Exporting..." : "Export Site History"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
