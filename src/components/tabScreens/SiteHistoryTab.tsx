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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateSiteHistoryReport } from "@/lib/reports/siteHistoryReport";

interface SiteHistoryTabProps {
  leadId: number;
  vendorId: number;
  leadCode?: string | null;
  leadName?: string | null;
}

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

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case "CREATE":
      return "bg-foreground";
    case "UPDATE":
      return "bg-muted-foreground";
    default:
      return "bg-muted-foreground/60";
  }
};

const parseActionMessage = (action: string) => {
  if (!action.includes("Remark:")) {
    return { main: action.trim(), remark: null };
  }

  // Split and clean up both parts
  const [mainPart, remarkPart] = action.split("Remark:");
  const cleanedMain = mainPart.replace(/—\s*$/, "").trim(); // remove trailing "—" or "— "
  const cleanedRemark = remarkPart?.trim() || null;

  return {
    main: cleanedMain,
    remark: cleanedRemark,
  };
};

export default function SiteHistoryTab({
  leadId,
  vendorId,
  leadCode,
  leadName,
}: SiteHistoryTabProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["leadLogs", leadId, vendorId],
      queryFn: async ({ pageParam }) =>
        await fetchLeadLogs({
          leadId,
          vendorId,
          cursor: pageParam ?? undefined,
          limit: 10,
        }),
      getNextPageParam: (lastPage) =>
        lastPage?.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
      initialPageParam: undefined,
    });

  useEffect(() => {
    console.log("🔍 Logs Data:", data?.pages);
  }, [data]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateSiteHistoryReport({ leadId, vendorId, leadCode, leadName });
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

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <Loader2 className="animate-spin text-primary mb-3" size={40} />
        <p className="text-sm text-muted-foreground">Loading history...</p>
      </motion.div>
    );
  }

  const allLogs = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative py-4 w-full mx-auto"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Site History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track all activities and changes for this lead
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 h-8 text-xs"
          disabled={isExporting}
          onClick={handleExport}
        >
          {isExporting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-3" />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

        <AnimatePresence mode="popLayout">
          {allLogs.map((log, index) => {
            const ActionIcon = getActionIcon(log.action_type);
            const dotColor = getActionColor(log.action_type);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.04,
                }}
                className="relative pl-12 pb-3 last:pb-0"
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-2.5 h-8 w-8 rounded-full ${dotColor} flex items-center justify-center ring-2 ring-background`}
                >
                  <ActionIcon size={14} className="text-primary-foreground" />
                </div>

                <Card className="p-4 border border-border bg-transparent gap-2.5">
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
                    <Badge
                      variant="secondary"
                      className="capitalize text-xs font-medium h-5 px-1.5"
                    >
                      {(() => {
                        switch (log.action_type) {
                          case "CREATE":
                            return "Created";
                          case "UPDATE":
                            return "Updated";
                          case "DELETE":
                            return "Deleted";
                          case "UPLOAD":
                            return "Uploaded";
                          case "STATUS_CHANGE":
                            return "Status Changed";
                          default:
                            return "Action";
                        }
                      })()}
                    </Badge>
                  </div>

                  {(() => {
                    const { main, remark } = parseActionMessage(log.action);
                    return (
                      <>
                        <p className="text-sm text-foreground font-medium leading-relaxed">
                          {main}
                        </p>
                        {remark && (
                          <p className="text-xs text-muted-foreground italic">
                            {remark}
                          </p>
                        )}
                      </>
                    );
                  })()}

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
                        Attachments ({log.docs.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {log.docs.map((doc: any) => (
                          <a
                            key={doc.id}
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-border bg-muted/40 hover:bg-muted transition-colors"
                          >
                            <FileText size={12} className="text-muted-foreground shrink-0" />
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

      <div
        ref={ref}
        className="flex justify-center mt-5 mb-4"
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="animate-spin text-muted-foreground" size={16} />
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
              No history logs available yet
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
