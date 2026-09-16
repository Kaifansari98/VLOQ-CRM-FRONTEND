"use client";

import { useState } from "react";
import { useAppSelector } from "@/redux/store";
import {
  Calendar,
  CalendarCheck2,
  ClipboardCheck,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import { useActiveLeadTasks } from "@/hooks/useTasksQueries";
import CustomeTooltip from "@/components/custom-tooltip";

interface LeadTasksPopoverProps {
  vendorId: number;
  leadId: number;
}

export default function LeadTasksPopover({
  vendorId,
  leadId,
}: LeadTasksPopoverProps) {
  const [openTasksPopover, setOpenTasksPopover] = useState(false);
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id,
  );
  const {
    data: activeLeadTasks = [],
    isLoading: isActiveLeadTasksLoading,
  } = useActiveLeadTasks(
    vendorId,
    leadId,
    franchiseId ?? undefined,
    !!vendorId && !!leadId,
  );

  return (
    <Popover open={openTasksPopover} onOpenChange={setOpenTasksPopover}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative bg-accent p-1.5 rounded-sm border-none shadow-none"
          aria-label="View open tasks"
        >
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {activeLeadTasks.length}
          </span>
          <CalendarCheck2 size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[92vw] sm:w-[420px] p-0 shadow-lg"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Pending Tasks
            </p>
            <p className="text-xs text-muted-foreground">
              Open and in-progress items for this lead
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {activeLeadTasks.length}
          </Badge>
        </div>

        {isActiveLeadTasksLoading ? (
          <div className="flex min-h-[148px] flex-col items-center justify-center gap-2 px-4 py-6 text-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Loading tasks
            </p>
            <p className="text-xs text-muted-foreground">
              Fetching pending tasks for this lead.
            </p>
          </div>
        ) : activeLeadTasks.length === 0 ? (
          <div className="flex min-h-[168px] flex-col items-center justify-center gap-3 px-5 py-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No pending tasks
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                There are no open or in-progress tasks for this lead right now.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {activeLeadTasks.map((task, index) => (
              <div
                key={`${task.task_type}-${task.due_date}-${index}`}
                className="px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {task.task_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-muted-foreground" />
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {formatDate(task.due_date, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {task.remark && task.remark.trim().toLowerCase() !== "n/a" ? (
                  <CustomeTooltip
                    value={task.remark}
                    truncateValue={
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {task.remark}
                      </p>
                    }
                  />
                ) : null}

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User size={12} /> {task.user?.user_name ?? "Unknown"}
                  </span>
                  {task.lead_stage ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>{task.lead_stage}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
