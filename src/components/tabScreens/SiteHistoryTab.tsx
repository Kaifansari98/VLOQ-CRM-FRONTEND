"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fetchLeadLogs } from "@/api/leads";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  Upload,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteHistoryTabProps {
  leadId: number;
  vendorId: number;
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
      return "bg-emerald-500";
    case "UPDATE":
      return "bg-blue-500";
    default:
      return "bg-slate-500";
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-foreground">
          Site History Timeline
        </h2>
        <p className="text-sm text-muted-foreground">
          Track all activities and changes for this lead
        </p>
      </motion.div>

      <div className="relative">
        {/* Timeline line with gradient */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="absolute left-[19px] top-0 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent"
        />

        <AnimatePresence mode="popLayout">
          {allLogs.map((log, index) => {
            const ActionIcon = getActionIcon(log.action_type);
            const dotColor = getActionColor(log.action_type);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="relative pl-16 pb-5 last:pb-6"
              >
                {/* Timeline icon container */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08 + 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={`absolute left-0 top-3 h-10 w-10 rounded-full ${dotColor} flex items-center justify-center shadow-lg ring-4 ring-background`}
                >
                  <ActionIcon size={18} className="text-white" />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-border bg-card/50 backdrop-blur-sm gap-3">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {format(
                            new Date(log.created_at),
                            "MMM dd, yyyy · hh:mm a"
                          )}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="capitalize font-semibold"
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
                          <p className="text-base text-foreground font-medium leading-relaxed">
                            {main}
                          </p>
                          {remark && (
                            <p className="text-xs text-muted-foreground">
                              {remark}
                            </p>
                          )}
                        </>
                      );
                    })()}

                    <div
                      className={`flex items-center gap-2 text-sm pb-0 ${
                        log.docs.length > 0
                          ? "border-b border-border/50 pb-4"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {log.created_by?.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">
                            {log.created_by?.name || "Unknown"}
                          </span>
                          {log.created_by?.email && (
                            <span className="text-xs text-muted-foreground">
                              {log.created_by.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {log.docs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="space-y-2"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Attachments ({log.docs.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {log.docs.map((doc: any) => (
                            <motion.a
                              key={doc.id}
                              href={doc.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all shadow-sm"
                            >
                              <FileText size={14} className="text-primary" />
                              <span className="font-medium truncate max-w-[200px]">
                                {doc.original_name}
                              </span>
                            </motion.a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load more section */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center mt-6 mb-8"
      >
        {isFetchingNextPage ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-muted-foreground">Loading more...</p>
          </motion.div>
        ) : hasNextPage ? (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              onClick={() => fetchNextPage()}
              className="font-semibold shadow-sm hover:shadow-md transition-all"
            >
              Load More History
            </Button>
          </motion.div>
        ) : allLogs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 py-4"
          >
            <CheckCircle2 className="text-primary" size={24} />
            <p className="text-muted-foreground text-sm font-medium">
              You've reached the end of the timeline
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <FileText
              className="mx-auto text-muted-foreground/50 mb-3"
              size={48}
            />
            <p className="text-muted-foreground text-base">
              No history logs available yet
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
