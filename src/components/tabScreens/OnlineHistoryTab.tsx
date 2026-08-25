"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeadOnlineHistory } from "@/api/leads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  User,
  MapPin,
  Activity,
  Zap,
  UserPlus,
  FileText,
  Loader2
} from "lucide-react";

interface OnlineHistoryEvent {
  id: string;
  event_type: "creation" | "status_change" | "assignment" | "store_assignment" | "stage_move";
  action: string;
  remark: string | null;
  created_at: string;
  user: {
    name: string;
    email: string;
  } | null;
}

interface OnlineHistoryTabProps {
  leadId: number;
  vendorId: number;
}

const getOnlineEventIcon = (eventType: string) => {
  switch (eventType) {
    case "creation":
      return UserPlus;
    case "status_change":
      return Activity;
    case "assignment":
      return User;
    case "store_assignment":
      return MapPin;
    case "stage_move":
      return Zap;
    default:
      return FileText;
  }
};

const getEventBadgeColor = (eventType: string) => {
  switch (eventType) {
    case "creation":
      return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50";
    case "status_change":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50";
    case "assignment":
      return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200/50";
    case "store_assignment":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50";
    case "stage_move":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50";
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200/50";
  }
};

const getEventBadgeLabel = (eventType: string) => {
  switch (eventType) {
    case "creation":
      return "Ingestion";
    case "status_change":
      return "Status Change";
    case "assignment":
      return "Assignment";
    case "store_assignment":
      return "Store Allocation";
    case "stage_move":
      return "Stage Movement";
    default:
      return "System Log";
  }
};

export default function OnlineHistoryTab({ leadId, vendorId }: OnlineHistoryTabProps) {
  const { data: events = [], isLoading, error } = useQuery<OnlineHistoryEvent[]>({
    queryKey: ["leadOnlineHistory", leadId, vendorId],
    queryFn: () => fetchLeadOnlineHistory({ leadId, vendorId }),
    enabled: Boolean(leadId && vendorId),
  });

  return (
    <div className="py-4 px-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-800 dark:text-slate-200" /> Online lifecycle history
        </h2>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          Track the complete online ingestion, allocations, and stage movements for this lead.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted-foreground mb-2" size={24} />
          <p className="text-xs text-muted-foreground">Loading online history...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-sm text-red-500 font-medium">Failed to load online history logs.</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-card/30">
          <FileText className="mx-auto text-muted-foreground/30 mb-2" size={36} />
          <p className="text-sm text-muted-foreground font-medium">No online logs available yet</p>
          <p className="text-xs text-muted-foreground/80 mt-0.5 max-w-[280px] mx-auto">
            This lead might have been directly created in the main CRM pipeline instead of an online source.
          </p>
        </div>
      ) : (
        <div className="relative mt-2">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {events.map((event, index) => {
                const ActionIcon = getOnlineEventIcon(event.event_type);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    className="relative pl-12 pb-2 last:pb-0"
                  >
                    {/* Circle Icon */}
                    <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 ring-4 ring-background shadow-sm">
                      <ActionIcon size={14} />
                    </div>

                    <Card className="gap-2.5 border p-4 bg-card hover:bg-accent/10 transition-colors shadow-sm space-y-2">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock size={13} className="opacity-70" />
                          <span className="text-xs font-medium">
                            {format(new Date(event.created_at), "MMM dd, yyyy · hh:mm a")}
                          </span>
                        </div>

                        <Badge
                          variant="outline"
                          className={`capitalize text-[10px] font-semibold h-5 px-2 border ${getEventBadgeColor(event.event_type)}`}
                        >
                          {getEventBadgeLabel(event.event_type)}
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground font-medium leading-relaxed">
                        {event.action}
                      </p>

                      {event.remark && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-slate-300 dark:border-slate-700 pl-2 py-0.5">
                          {event.remark}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-border">
                          <span className="text-[10px] font-bold text-foreground">
                            {event.user?.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">
                            {event.user?.name || "System / Automated"}
                          </span>
                          {event.user?.email && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {event.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
