"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Wrench } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { usePendingWorkTasks } from "@/api/installation/useDispatchStageLeads";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import RemarkTooltip from "@/components/origin-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import FollowUpModal from "@/components/follow-up-modal";

export default function PendingWorkTab({
  leadId,
  accountId,
}: {
  leadId: number;
  accountId: number;
}) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data: tasks = [], isLoading } = usePendingWorkTasks(vendorId, leadId);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid */}
      <Card className="rounded-2xl border border-border/70 bg-white dark:bg-neutral-900 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl border flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Pending Work
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track and update task status
                </p>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="gap-1 px-3 py-1 rounded-lg text-xs"
            >
              <Wrench className="w-3 h-3" />
              {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center bg-neutral-50/40 dark:bg-neutral-800/30">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-neutral-200 dark:bg-neutral-700 rounded-full shadow-inner">
                  <Wrench className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No pending work
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {tasks.map((task: any, idx: number) => {
                  const [workTitle, ...descParts] = (task.remark || "").split(
                    "—"
                  );
                  const description = descParts.join("—").trim();

                  const isLong = description.length > 120; // 👈 Tooltip only for LONG text
                  const preview = isLong
                    ? description.slice(0, 200) + "..."
                    : description;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                    >
                      <Card
                        className="
          group h-full rounded-xl border border-border/50 
          bg-neutral-50 dark:bg-neutral-900 
          hover:border-primary/50 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)]
          cursor-pointer transition-all duration-300
        "
                        onClick={() => {
                          if (
                            task.status === "completed" ||
                            task.status === "cancelled"
                          )
                            return;

                          setSelectedTask({
                            id: task.id,
                            leadId,
                            accountId,
                            remark: task.remark,
                            dueDate: task.due_date,
                          });
                          setOpenTaskModal(true);
                        }}
                      >
                        <CardContent className="px-5">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="p-2.5 rounded-lg border bg-primary/10">
                              <Wrench className="h-4 w-4 text-primary" />
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 mt-1 rounded-md ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h4 className="mt-3 font-semibold text-sm line-clamp-1">
                            {workTitle || "Untitled Work"}
                          </h4>

                          {/* Description + Tooltip logic */}
                          {description &&
                            (isLong ? (
                              <RemarkTooltip
                              title="Additional Note"
                                remark={
                                  <span className="block line-clamp-3 text-xs text-left text-muted-foreground leading-relaxed">
                                    {preview}
                                  </span>
                                }
                                remarkFull={description}
                              />
                            ) : (
                              <span className="block text-xs text-left text-muted-foreground leading-relaxed">
                                {preview}
                              </span>
                            ))}

                          {/* Meta */}
                          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              Due:{" "}
                              {format(new Date(task.due_date), "dd MMM yyyy")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow up modal */}
      {selectedTask && (
        <FollowUpModal
          open={openTaskModal}
          onOpenChange={setOpenTaskModal}
          variant="Pending Work"
          data={{
            id: selectedTask.leadId,
            accountId: selectedTask.accountId,
            taskId: selectedTask.id,
            remark: selectedTask.remark,
            dueDate: selectedTask.dueDate,
          }}
        />
      )}
    </div>
  );
}
