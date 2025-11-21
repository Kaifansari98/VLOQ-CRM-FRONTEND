"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import CustomeDatePicker from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, PlusCircle, Loader2, Wrench } from "lucide-react";

import { useAppSelector } from "@/redux/store";
import {
  useCreatePendingWorkTask,
  useOrderLoginSummary,
  usePendingWorkTasks,
} from "@/api/installation/useDispatchStageLeads";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import TextSelectPicker from "@/components/TextSelectPicker";
import RemarkTooltip from "@/components/origin-tooltip";
import FollowUpModal from "@/components/follow-up-modal";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canViewAndWorkUnderInstallationStage } from "@/components/utils/privileges";

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
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);

  const queryClient = useQueryClient();
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const leadStatus = leadData?.status;

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

  const { data: workTitleOptions = [], isLoading: loadingTitles } =
    useOrderLoginSummary(vendorId, leadId);

  /* 📝 Form State */
  const [title, setTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const canWork = canViewAndWorkUnderInstallationStage(userType, leadStatus);

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

      {canWork && (
        <div className="border rounded-xl bg-background transition-all duration-300">
          {/* ---------------- HEADER ---------------- */}
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Add Pending Work
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tasks pending during installation
              </p>
            </div>
          </div>

          {/* ---------------- FORM BODY ---------------- */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Title Picker */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    <Wrench className="h-4 w-4" />
                    Work Title
                    <span className="text-red-500">*</span>
                  </Label>

                  <TextSelectPicker
                    options={
                      workTitleOptions.map(
                        (item: any) => item.item_type || "Untitled Work"
                      ) || []
                    }
                    value={title}
                    onChange={(text) => setTitle(text)}
                    placeholder={
                      loadingTitles
                        ? "Loading work titles..."
                        : "Select work..."
                    }
                    emptyLabel="Select Work"
                    disabled={loadingTitles || !canWork}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Due Date
                    <span className="text-red-500">*</span>
                  </Label>

                  <CustomeDatePicker
                    value={dueDate || ""}
                    onChange={(value) => setDueDate(value || null)}
                    restriction="futureOnly"
                    disabledReason={
                      !canWork
                        ? "You don't have permission to add tasks."
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Additional Notes
                </Label>

                <Textarea
                  placeholder="Describe the work, issue, or requirements..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  disabled={!canWork}
                />
              </div>

              {/* Submit Button */}
              {canWork && (
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
              )}
            </form>
          </div>
        </div>
      )}

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
                <p className="text-sm text-muted-foreground mt-1">
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
            <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-muted/30">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-muted/60 rounded-full shadow-inner">
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

                  const isLong = description.length > 200;
                  const shortDesc = isLong
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
                    bg-background/80 
                    hover:border-primary/40 
                    hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)]
                    transition-all duration-300 cursor-pointer
                  "
                      >
                        <CardContent className="px-5 space-y-3 flex flex-col justify-between">
                          {/* HEADER */}
                          <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="p-2.5 rounded-lg border bg-primary/10 border-primary/20">
                              <Wrench className="h-4 w-4 text-primary" />
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 px-2 rounded-md ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </Badge>
                          </div>

                          {/* TITLE */}
                          <h4 className="font-semibold text-sm line-clamp-1 mt-4">
                            {workTitle || "Untitled Work"}
                          </h4>

                          {/* DESCRIPTION */}
                          {description && (
                            <p className="w-full text-xs text-muted-foreground leading-relaxed mt-1">
                              {isLong ? (
                                <RemarkTooltip
                                  title="Additional Note"
                                  remark={
                                    <span className="block text-left line-clamp-3">
                                      {shortDesc}
                                    </span>
                                  }
                                  remarkFull={description}
                                />
                              ) : (
                                <span className="block text-left line-clamp-3">
                                  {shortDesc}
                                </span>
                              )}
                            </p>
                          )}
                          </div>

                          {/* META */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
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
