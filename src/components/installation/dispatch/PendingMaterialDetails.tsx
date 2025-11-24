"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Package,
  CheckCircle2,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {
  useCreatePendingMaterialTask,
  useOrderLoginSummary,
  usePendingMaterialTasks,
} from "@/api/installation/useDispatchStageLeads";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import TextSelectPicker from "@/components/TextSelectPicker";

interface PendingMaterialDetailsProps {
  leadId: number;
  accountId: number;
  disabled: boolean;
}

export default function PendingMaterialDetails({
  leadId,
  accountId,
  disabled,
}: PendingMaterialDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();
  if (!vendorId) {
    toast.error("Vendor information is missing.");
    return;
  }

  if (!userId) {
    toast.error("User information is missing.");
    return;
  }

  const { mutateAsync: createPendingTask, isPending } =
    useCreatePendingMaterialTask();

  const { data: orderLoginSummary = [], isLoading: loadingSummary } =
    useOrderLoginSummary(vendorId, leadId);

  const { data: tasks = [], isLoading } = usePendingMaterialTasks(
    vendorId,
    leadId
  );

  if (!vendorId || !userId) {
  return <p className="text-red-500 p-4">Missing vendor/user info.</p>;
}

  // 🧩 Form state
  const [title, setTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !dueDate) {
      toast.error("Please fill all required fields.");
      return;
    }

    const combinedRemark = `${title.trim()} — ${remark.trim()}`;

    try {
      await createPendingTask({
        vendorId,
        leadId,
        payload: {
          account_id: accountId,
          created_by: userId,
          due_date: dueDate,
          remark: combinedRemark,
        },
      });

      toast.success("Pending Material added successfully!");
      queryClient.invalidateQueries({
        queryKey: ["pendingMaterialTasks", vendorId, leadId],
      });
      setTitle("");
      setRemark("");
      setDueDate(null);
    } catch (err) {
      toast.error("Failed to add Pending Material.");
    }
  };

  // Calculate status badge color
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
      {/* Add New Material Card */}
      {disabled && (
        <div className="border rounded-lg bg-background overflow-hidden">
          {/* ---------- HEADER ---------- */}
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Add Pending Material
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track materials that are pending for dispatch
                </p>
              </div>
            </div>

      {/* Submit */}
      <Button
          type="submit"
          disabled={isPending || !title.trim() || !dueDate}
          className="w-full md:w-auto"
          form="pending-material-form"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Material
            </>
          )}
        </Button>
    </div>

    {/* ---------- CONTENT ---------- */}
    <div className="p-6">
      <form id="pending-material-form" onSubmit={handleSubmit} className="space-y-6">

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Title */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Material Title <span className="text-red-500">*</span>
            </Label>

                  <TextSelectPicker
                    options={
                      orderLoginSummary.map(
                        (item: any) => item.item_type || "Untitled Item"
                      ) || []
                    }
                    value={title}
                    onChange={(selectedText) => setTitle(selectedText)}
                    placeholder={
                      loadingSummary
                        ? "Loading materials..."
                        : "Select material..."
                    }
                    emptyLabel="Select Material"
                    disabled={loadingSummary}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due Date <span className="text-red-500">*</span>
                  </Label>

                  <CustomeDatePicker
                    value={dueDate || ""}
                    onChange={(value) => setDueDate(value || null)}
                    restriction="futureOnly"
                  />
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Description / Notes
                </Label>

                <Textarea
                  placeholder="Add additional details about the material..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Materials List */}
      <div className="border rounded-lg bg-background overflow-hidden">
        {/* ---------- HEADER ---------- */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Pending Materials
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Materials awaiting dispatch
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" />
            {tasks.length} {tasks.length === 1 ? "Item" : "Items"}
          </Badge>
        </div>

        {/* ---------- CONTENT ---------- */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-10 border border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/40">
              <div className="p-4 bg-muted rounded-full">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-3">
                No pending materials yet
              </p>
              <p className="text-xs text-muted-foreground">
                Add materials using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {tasks.map((task: any, idx: number) => {
                  const [taskTitle, ...descParts] = (task.remark || "").split(
                    "—"
                  );
                  const description = descParts.join("—").trim();

                  return (
                    <motion.div
                      key={task.id || idx}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      layout
                    >
                      {/* ---------- ITEM CARD ---------- */}
                      <div
                        className="
                  border rounded-xl px-4 py-4
                  bg-background/60 backdrop-blur-sm
                  transition-all duration-300
                "
                      >
                        <div className="flex items-start gap-3">
                          {/* Left Icon */}
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-4 w-4 text-primary" />
                          </div>

                          {/* Text Block */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground">
                              {taskTitle || "Untitled Material"}
                            </h4>

                            {description && (
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {description}
                              </p>
                            )}

                            {/* Meta Row */}
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                Due:{" "}
                                {format(new Date(task.due_date), "dd MMM yyyy")}
                              </div>

                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusColor(
                                  task.status
                                )} capitalize`}
                              >
                                {task.status === "completed" && (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
