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
      {/* Pending Work Grid */}
      <Card className="rounded-2xl border bg-background transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>

              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Pending Work
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track tasks pending during installation
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <Badge
              variant="secondary"
              className="gap-1 px-3 py-1 rounded-lg text-xs shadow-sm"
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
            <div className="border-2 border-dashed rounded-xl p-12 text-center bg-muted/30">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-muted rounded-full shadow-inner">
                  <Wrench className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-md font-medium text-foreground">
                  No Pending Work Found
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  All the pending work of the site will get displayed here.
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

                  const isLong = description.length > 120;
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
                        className="
                    group h-full rounded-xl 
                    border 
                    bg-background 
                    cursor-pointer transition-all duration-300
                    hover:border-primary/40 
                    hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)]
                  "
                      >
                        <CardContent className="px-5 space-y-3 flex flex-col h-full justify-between">
                          <div>

                          {/* HEADER */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="p-2.5 rounded-lg border bg-primary/10 border-primary/20">
                              <Wrench className="h-4 w-4 text-primary" />
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 mt-1 rounded-md shadow-sm ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </Badge>
                          </div>

                          {/* TITLE */}
                          <h4 className="mt-3 font-semibold text-sm line-clamp-1">
                            {workTitle || "Untitled Work"}
                          </h4>

                          {/* DESCRIPTION */}
                          {description &&
                            (isLong ? (
                              <RemarkTooltip
                                title="Additional Note"
                                remark={
                                  <span className="block text-left line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                                    {preview}
                                  </span>
                                }
                                remarkFull={description}
                              />
                            ) : (
                              <span className="block text-xs text-muted-foreground leading-relaxed mt-1">
                                {preview}
                              </span>
                            ))}
                          </div>

                          {/* META */}
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
