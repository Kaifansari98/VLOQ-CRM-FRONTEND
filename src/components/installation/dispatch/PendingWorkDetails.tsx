"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import CustomeDatePicker from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Clock,
  PlusCircle,
  Loader2,
  Wrench,
  CheckCircle2,
} from "lucide-react";

import { useAppSelector } from "@/redux/store";
import {
  useCreatePendingWorkTask,
  usePendingWorkTasks,
} from "@/api/installation/useDispatchStageLeads"; // <-- your new API file
import { toast } from "react-toastify";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import TextSelectPicker from "@/components/TextSelectPicker";
import RemarkTooltip from "@/components/origin-tooltip";
import FollowUpModal from "@/components/follow-up-modal";

interface PendingWorkDetailsProps {
  leadId: number;
  accountId: number;
}

export default function PendingWorkDetails({
  leadId,
  accountId,
}: PendingWorkDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  if (!vendorId) {
    toast.error("Vendor information is missing.");
    return null;
  }
  if (!userId) {
    toast.error("User information is missing.");
    return null;
  }

  /* 🔥 React Query Hooks */
  const { mutateAsync: createPendingWork, isPending } =
    useCreatePendingWorkTask();

  const { data: tasks = [], isLoading } = usePendingWorkTasks(vendorId, leadId);

  /* 📝 Form State */
  const [title, setTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !dueDate) {
      toast.error("Please fill all required fields.");
      return;
    }

    const combinedRemark = `${title.trim()} — ${remark.trim()}`;

    try {
      await createPendingWork({
        vendorId,
        leadId,
        payload: {
          account_id: accountId,
          created_by: userId,
          due_date: dueDate,
          remark: combinedRemark,
        },
      });

      toast.success("Pending Work added successfully!");

      queryClient.invalidateQueries({
        queryKey: ["pendingWorkTasks", vendorId, leadId],
      });

      setTitle("");
      setRemark("");
      setDueDate(null);
    } catch (err) {
      toast.error("Failed to add Pending Work.");
    }
  };

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
      {/* Add Work Card */}
      <Card className="border border-border/70 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Add Pending Work</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tasks pending during installation
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grid Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Picker */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  Work Title
                  <span className="text-red-500">*</span>
                </Label>

                <TextSelectPicker
                  options={[
                    "Touchup Work",
                    "Woodwork Fixing",
                    "Polish Work",
                    "Gap Filling",
                    "Laminate Fix",
                    "Hardware Fix",
                    "Other Work",
                  ]}
                  value={title}
                  onChange={(text) => setTitle(text)}
                  placeholder="Select work..."
                  emptyLabel="Select Work"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due Date
                  <span className="text-red-500">*</span>
                </Label>
                <CustomeDatePicker
                  value={dueDate || ""}
                  onChange={(value) => setDueDate(value || null)}
                  restriction="futureOnly"
                />
              </div>
            </div>

            {/* Remark / Note */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Additional Notes
              </Label>
              <Textarea
                placeholder="Describe the work, issue, or requirements..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || !title.trim() || !dueDate}
              className="w-full md:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Work
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Work Grid */}
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
                <p className="text-sm text-muted-foreground mt-1">
                  Track tasks pending during installation
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
                  No work pending
                </p>
                <p className="text-xs text-muted-foreground">
                  Add tasks using the form above
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
                  const shortDesc =
                    description.length > 80
                      ? description.slice(0, 80) + "..."
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
                            group rounded-xl border border-border/50 
                            bg-neutral-50 dark:bg-neutral-900 
                            hover:border-primary/50 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)]
                            cursor-pointer transition-all duration-300
                        "
                      >
                        <CardContent className="px-5">
                          {/* HEADER */}
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

                          {/* TITLE */}
                          <h4 className="mt-3 font-semibold text-sm line-clamp-1">
                            {workTitle || "Untitled Work"}
                          </h4>

                          <p className="w-full overflow-hidden">
                            {/* DESCRIPTION + TOOLTIP */}
                            {description && (
                              <RemarkTooltip
                                remark={
                                  <span className="block line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                                    {shortDesc}
                                  </span>
                                }
                                remarkFull={description}
                              />
                            )}
                          </p>

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
