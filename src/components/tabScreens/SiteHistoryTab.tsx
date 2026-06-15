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
  Calendar,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateSiteHistoryReport } from "@/lib/reports/siteHistoryReport";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { useAppSelector } from "@/redux/store";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";

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
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
        accentClass: "text-emerald-600 dark:text-emerald-400",
        borderClass: "border-2 border-green-500/80 dark:border-green-500/50",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        badgeClass:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
        accentClass: "text-rose-600 dark:text-rose-400",
        borderClass: "border-2 border-rose-200/80 dark:border-rose-900/50",
      };
    default:
      return {
        label: "Submitted",
        icon: AlertCircle,
        badgeClass:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
        accentClass: "text-slate-600 dark:text-slate-400",
        borderClass: "border-2 border-slate-200 dark:border-slate-800",
      };
  }
};

type ApprovalLog = {
  id: number;
  action: string;
  action_type: string;
  created_at: string;
  created_by?: { name?: string; email?: string } | null;
  stage?: { name?: string | null } | null;
  docs: any[];
};

type ApprovalGroup = {
  request: ApprovalLog;
  response?: ApprovalLog;
};

type HistoryLog = {
  id: number;
  task_id?: number | null;
  action: string;
  action_type: string;
  created_at: string;
  created_by?: { name?: string; email?: string } | null;
  stage?: { name?: string | null } | null;
  docs: any[];
};

type TaskFlowEventType =
  | "created"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "updated";

type TaskFlowEvent = {
  log: HistoryLog;
  type: TaskFlowEventType;
};

type TaskFlowGroup = {
  taskLabel: string;
  request: HistoryLog;
  events: TaskFlowEvent[];
};

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

const getFileExtension = (fileName?: string | null) =>
  fileName?.split(".").pop()?.toLowerCase() ?? "";

const normalizeTaskLabel = (label?: string | null) =>
  label?.trim().replace(/\s+/g, " ") ?? null;

const parseTaskHistoryAction = (action: string) => {
  const normalizedAction = action.trim();

  const updatedMatch = normalizedAction.match(
    /^Lead's (.+?) has been (rescheduled on|marked as Completed|marked as Cancelled)/i,
  );
  if (updatedMatch) {
    const [, rawLabel, rawType] = updatedMatch;
    const taskLabel = normalizeTaskLabel(rawLabel.replace(/\s+task$/i, ""));
    const loweredType = rawType.toLowerCase();

    return {
      taskLabel,
      type: loweredType.includes("rescheduled")
        ? ("rescheduled" as const)
        : loweredType.includes("completed")
          ? ("completed" as const)
          : ("cancelled" as const),
    };
  }

  const assignedMatch = normalizedAction.match(
    /^Lead has been assigned to .* for (.+?)(?: on|\.| Due Date:)/i,
  );
  if (assignedMatch) {
    return {
      taskLabel: normalizeTaskLabel(assignedMatch[1]),
      type: "created" as const,
    };
  }

  const createdMatch = normalizedAction.match(/^(.+?) task .* created/i);
  if (createdMatch) {
    return {
      taskLabel: normalizeTaskLabel(createdMatch[1]),
      type: "created" as const,
    };
  }

  return {
    taskLabel: null,
    type: "updated" as const,
  };
};

const getTaskEventConfig = (type: TaskFlowEventType) => {
  switch (type) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCheck,
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
        accentClass: "text-emerald-600 dark:text-emerald-400",
        borderClass: "border-2 border-green-500/80 dark:border-green-500/50",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        badgeClass:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
        accentClass: "text-rose-600 dark:text-rose-400",
        borderClass: "border-2 border-rose-200/80 dark:border-rose-900/50",
      };
    case "rescheduled":
      return {
        label: "Rescheduled",
        icon: Calendar,
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
        accentClass: "text-amber-600 dark:text-amber-400",
        borderClass: "border-2 border-amber-200/80 dark:border-amber-900/50",
      };
    default:
      return {
        label: "Updated",
        icon: Edit3,
        badgeClass:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
        accentClass: "text-slate-600 dark:text-slate-400",
        borderClass: "border-2 border-slate-200 dark:border-slate-800",
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
  const isTaskTimeline = activeTab === "task-history";
  const approvalGroups = isApprovalTimeline
    ? [...allLogs]
        .sort(
          (a, b) =>
            new Date((a as ApprovalLog).created_at).getTime() -
            new Date((b as ApprovalLog).created_at).getTime(),
        )
        .reduce<ApprovalGroup[]>((groups, log) => {
          const typedLog = log as ApprovalLog;
          const status = getApprovalStatus(typedLog.action);

          if (status === "requested" || groups.length === 0) {
            groups.push({ request: typedLog });
            return groups;
          }

          const currentGroup = groups[groups.length - 1];
          if (!currentGroup.response) {
            currentGroup.response = typedLog;
          } else {
            groups.push({ request: typedLog });
          }

          return groups;
        }, [])
        .sort(
          (a, b) =>
            new Date(b.request.created_at).getTime() -
            new Date(a.request.created_at).getTime(),
        )
    : [];
  const taskFlowGroups = isTaskTimeline
    ? [...allLogs]
        .sort(
          (a, b) =>
            new Date((a as HistoryLog).created_at).getTime() -
            new Date((b as HistoryLog).created_at).getTime(),
        )
        .reduce<TaskFlowGroup[]>((groups, log) => {
          const typedLog = log as HistoryLog;
          const parsed = parseTaskHistoryAction(typedLog.action);

          if (
            parsed.type === "created" ||
            groups.length === 0 ||
            typedLog.task_id == null
          ) {
            groups.push({
              taskLabel: parsed.taskLabel ?? "Task Update",
              request: typedLog,
              events: [],
            });
            return groups;
          }

          const currentGroup = [...groups]
            .reverse()
            .find(
              (group) =>
                group.request.task_id != null &&
                group.request.task_id === typedLog.task_id,
            );

          if (!currentGroup) {
            groups.push({
              taskLabel: parsed.taskLabel ?? "Task Update",
              request: typedLog,
              events: [],
            });
            return groups;
          }

          currentGroup.events.push({
            log: typedLog,
            type: parsed.type,
          });

          return groups;
        }, [])
        .sort(
          (a, b) =>
            new Date(b.request.created_at).getTime() -
            new Date(a.request.created_at).getTime(),
        )
    : [];

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
              {approvalGroups.map((group, index) => {
                const requestParsed = parseActionMessage(group.request.action);
                const responseStatus = group.response
                  ? getApprovalStatus(group.response.action)
                  : null;
                const responseParsed = group.response
                  ? parseActionMessage(group.response.action)
                  : null;
                const responseConfig = responseStatus
                  ? getApprovalStatusConfig(responseStatus)
                  : null;
                const ResponseIcon = responseConfig?.icon;

                return (
                  <motion.div
                    key={group.request.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-4"
                  >
                    <Card className="overflow-hidden border border-2 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-6">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Approval Flow
                            </p>
                            <h4 className="text-xs font-semibold text-foreground">
                              Approval Request Submitted
                            </h4>
                          </div>
                          
                          <div className="grid sm:grid-cols-2">
                          <div className="px-1.5">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Submitted On
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground">
                              <Calendar size={10} className="text-slate-400" />
                              <span>
                                {format(
                                  new Date(group.request.created_at),
                                  "dd MMM · hh:mm a",
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="px-1.5 border-l-2">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Submitted By
                            </p>
                            <div className="mt-0.5 flex items-center gap-1">
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium text-foreground">
                                  {group.request.created_by?.name || "Unknown"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium leading-4 text-foreground">
                          {requestParsed.main}
                        </p>

                        {requestParsed.remark && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/40">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Remark
                            </p>
                            <p className="mt-0.5 text-[11px] leading-4 text-slate-700 dark:text-slate-300">
                              {requestParsed.remark}
                            </p>
                          </div>
                        )}

                        

                        {/* {formatStageLabel(group.request.stage?.name) && (
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Stage
                            </p>
                            <Badge
                              variant="outline"
                              className="mt-1 capitalize border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                            >
                              {formatStageLabel(group.request.stage?.name)}
                            </Badge>
                          </div>
                        )} */}

                        {group.request.docs.length > 0 && (
                          <div className="border-t border-slate-100 pt-1.5 dark:border-slate-800">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Attachments ({group.request.docs.length})
                            </p>
                            <div className="mt-2 grid gap-3">
                              {group.request.docs.map((doc: any) => (
                                IMAGE_EXTENSIONS.has(
                                  getFileExtension(doc.original_name),
                                ) ? (
                                  <ImageComponent
                                    key={doc.id}
                                    doc={{
                                      id: doc.id,
                                      doc_og_name: doc.original_name,
                                      signedUrl: doc.signedUrl,
                                    }}
                                  />
                                ) : (
                                  <DocumentCard
                                    key={doc.id}
                                    doc={{
                                      id: doc.id,
                                      originalName: doc.original_name,
                                      signedUrl: doc.signedUrl,
                                    }}
                                  />
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {group.response && responseConfig && ResponseIcon && responseParsed && (
                      <div className="relative ml-20">
                        <svg
                          className="pointer-events-none absolute -left-16 -top-4 h-14 w-10 text-slate-300 dark:text-slate-700"
                          viewBox="0 0 40 56"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 0V20C4 34 14 44 28 44H40"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M32 36L40 44L32 52"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <Card
                          className={`overflow-hidden px-6 bg-white dark:bg-slate-950 ${responseConfig.borderClass}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                                  <ResponseIcon
                                    className={`h-2.5 w-2.5 ${responseConfig.accentClass}`}
                                  />
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-semibold leading-3 text-foreground">
                                    {responseConfig.label}
                                  </h4>
                                  <p className="text-[9px] text-muted-foreground">
                                    Response
                                  </p>
                                </div>
                              </div>
                              <div className="grid sm:grid-cols-2">
                              <div className="px-1.5 dark:border-slate-800 dark:bg-slate-900/40">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                  {responseConfig.label} On
                                </p>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-foreground">
                                  <Calendar size={10} className="text-slate-400" />
                                  <span>
                                    {format(
                                      new Date(group.response.created_at),
                                      "dd MMM · hh:mm a",
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="px-1.5 border-l dark:border-slate-800 dark:bg-slate-900/40">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                {responseConfig.label} By
                                </p>
                                <div className="mt-0.5 flex items-center gap-1">
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-medium text-foreground">
                                      {group.response.created_by?.name || "Unknown"}
                                    </p>
                                  </div>
                                </div>
                              </div>  
                            </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-xs font-medium leading-4 text-foreground">
                              {responseParsed.main}
                            </p>

                            {responseParsed.remark && (
                              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/40">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                  Remark
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-700 dark:text-slate-300">
                                  {responseParsed.remark}
                                </p>
                              </div>
                            )}

                            

                            {group.response.docs.length > 0 && (
                              <div className="">
                                
                                <div className="mt-2 grid gap-3">
                                  {group.response.docs.map((doc: any) => (
                                    IMAGE_EXTENSIONS.has(
                                      getFileExtension(doc.original_name),
                                    ) ? (
                                      <ImageComponent
                                        key={doc.id}
                                        doc={{
                                          id: doc.id,
                                          doc_og_name: doc.original_name,
                                          signedUrl: doc.signedUrl,
                                        }}
                                      />
                                    ) : (
                                      <DocumentCard
                                        key={doc.id}
                                        doc={{
                                          id: doc.id,
                                          originalName: doc.original_name,
                                          signedUrl: doc.signedUrl,
                                        }}
                                      />
                                    )
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Load More */}
          <div ref={ref} className="flex justify-center mt-4">
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
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                className="text-xs"
              >
                Load more approvals
              </Button>
            ) : allLogs.length > 0 ? (
              <p className="text-xs text-muted-foreground py-3">
                No more approvals
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  const taskHistoryContent = (
    <div className="pt-3">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading tasks...</p>
        </div>
      ) : allLogs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto text-muted-foreground/30 mb-3" size={40} />
          <p className="text-sm text-muted-foreground font-medium">No task history yet</p>
          <p className="text-xs text-muted-foreground mt-1">Task flows will appear here</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {taskFlowGroups.map((group, index) => {
                const requestParsed = parseActionMessage(group.request.action);

                return (
                  <motion.div
                    key={group.request.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-4"
                  >
                    <Card className="overflow-hidden border border-2 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Task Flow
                          </p>
                          <h4 className="text-xs font-semibold text-foreground">
                            {group.taskLabel}
                          </h4>
                        </div>

                        <div className="grid sm:grid-cols-2">
                          <div className="px-1.5">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Assigned On
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground">
                              <Calendar size={10} className="text-slate-400" />
                              <span>
                                {format(
                                  new Date(group.request.created_at),
                                  "dd MMM · hh:mm a",
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="px-1.5 border-l-2">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Assigned By
                            </p>
                            <div className="mt-0.5 flex items-center gap-1">
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium text-foreground">
                                  {group.request.created_by?.name || "Unknown"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium leading-4 text-foreground">
                          {requestParsed.main}
                        </p>

                        {requestParsed.remark && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/40">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Remark
                            </p>
                            <p className="mt-0.5 text-[11px] leading-4 text-slate-700 dark:text-slate-300">
                              {requestParsed.remark}
                            </p>
                          </div>
                        )}

                        {group.request.docs.length > 0 && (
                          <div className="border-t border-slate-100 pt-1.5 dark:border-slate-800">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                              Attachments ({group.request.docs.length})
                            </p>
                            <div className="mt-2 grid gap-3">
                              {group.request.docs.map((doc: any) =>
                                IMAGE_EXTENSIONS.has(
                                  getFileExtension(doc.original_name),
                                ) ? (
                                  <ImageComponent
                                    key={doc.id}
                                    doc={{
                                      id: doc.id,
                                      doc_og_name: doc.original_name,
                                      signedUrl: doc.signedUrl,
                                    }}
                                  />
                                ) : (
                                  <DocumentCard
                                    key={doc.id}
                                    doc={{
                                      id: doc.id,
                                      originalName: doc.original_name,
                                      signedUrl: doc.signedUrl,
                                    }}
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {group.events.map((event) => {
                      const eventConfig = getTaskEventConfig(event.type);
                      const EventIcon = eventConfig.icon;
                      const eventParsed = parseActionMessage(event.log.action);

                      return (
                        <div key={event.log.id} className="relative ml-20">
                          <svg
                            className="pointer-events-none absolute -left-16 -top-4 h-14 w-10 text-slate-300 dark:text-slate-700"
                            viewBox="0 0 40 56"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 0V20C4 34 14 44 28 44H40"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M32 36L40 44L32 52"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          <Card
                            className={`overflow-hidden px-6 bg-white dark:bg-slate-950 ${eventConfig.borderClass}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                                  <EventIcon
                                    className={`h-2.5 w-2.5 ${eventConfig.accentClass}`}
                                  />
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-semibold leading-3 text-foreground">
                                    {eventConfig.label}
                                  </h4>
                                  <p className="text-[9px] text-muted-foreground">
                                    Task Update
                                  </p>
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2">
                                <div className="px-1.5">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                    {eventConfig.label} On
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-foreground">
                                    <Calendar size={10} className="text-slate-400" />
                                    <span>
                                      {format(
                                        new Date(event.log.created_at),
                                        "dd MMM · hh:mm a",
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="px-1.5 border-l dark:border-slate-800">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                    {eventConfig.label} By
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1">
                                    <div className="min-w-0">
                                      <p className="truncate text-[10px] font-medium text-foreground">
                                        {event.log.created_by?.name || "Unknown"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <p className="text-xs font-medium leading-4 text-foreground">
                                {eventParsed.main}
                              </p>

                              {eventParsed.remark && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/40">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                                    Remark
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-700 dark:text-slate-300">
                                    {eventParsed.remark}
                                  </p>
                                </div>
                              )}

                              {event.log.docs.length > 0 && (
                                <div className="mt-2 grid gap-3">
                                  {event.log.docs.map((doc: any) =>
                                    IMAGE_EXTENSIONS.has(
                                      getFileExtension(doc.original_name),
                                    ) ? (
                                      <ImageComponent
                                        key={doc.id}
                                        doc={{
                                          id: doc.id,
                                          doc_og_name: doc.original_name,
                                          signedUrl: doc.signedUrl,
                                        }}
                                      />
                                    ) : (
                                      <DocumentCard
                                        key={doc.id}
                                        doc={{
                                          id: doc.id,
                                          originalName: doc.original_name,
                                          signedUrl: doc.signedUrl,
                                        }}
                                      />
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div ref={ref} className="flex justify-center mt-4">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="animate-spin text-muted-foreground" size={16} />
                <p className="text-xs text-muted-foreground">Loading more...</p>
              </div>
            ) : hasNextPage ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                className="text-xs"
              >
                Load more tasks
              </Button>
            ) : allLogs.length > 0 ? (
              <p className="text-xs text-muted-foreground py-3">
                No more task flows
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
      cardContent: isTaskTimeline ? taskHistoryContent : timelineContent,
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
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Site History</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isApprovalTimeline
              ? "View all approval requests and their status"
              : "Track all activities and changes for this lead"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder={isApprovalTimeline ? "Search approvals..." : "Search history..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs w-full sm:w-48"
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
            className="shrink-0 gap-2 h-8"
            disabled={isExporting}
            onClick={handleExport}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      <div className="relative mt-2">
        <SmoothTab
          items={tabItems}
          defaultTabId={defaultTabId}
          onChange={(tabId) => setActiveTab(tabId as TabId)}
        />
      </div>
    </motion.div>
  );
}
