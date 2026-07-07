"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import { useTaskDetails } from "@/hooks/useTasksQueries";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  User,
  AlertCircle,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TaskDetailsModalProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({
  taskId,
  open,
  onOpenChange,
}: TaskDetailsModalProps) {
  const router = useRouter();
  const { data: response, isLoading, error } = useTaskDetails(
    taskId ?? 0,
    open && !!taskId
  );

  const task = response?.data;
  const lead = task?.lead;

  const getLeadDetailsPath = (leadId: number, accountId: number, leadStatus: string) => {
    const stage = (leadStatus || "").toLowerCase();
    
    if (stage.includes("initial site measurement") || stage.includes("ism")) {
      return `/dashboard/leads/initial-site-measurement/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("designing")) {
      return `/dashboard/leads/designing-stage/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("booking")) {
      return `/dashboard/leads/booking-stage/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("order login")) {
      return `/dashboard/production/order-login/details/${leadId}?accountId=${accountId}&tab=orderLogin`;
    }
    if (stage.includes("tech")) {
      return `/dashboard/production/tech-check/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("production")) {
      return `/dashboard/production/pre-post-prod/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("ready to dispatch") || stage.includes("ready")) {
      return `/dashboard/production/ready-to-dispatch/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("site readiness")) {
      return `/dashboard/installation/site-readiness/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("dispatch planning")) {
      return `/dashboard/installation/dispatch-planning/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("dispatch")) {
      return `/dashboard/installation/dispatch-stage/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("under installation") || stage.includes("installation")) {
      return `/dashboard/installation/under-installation/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("final handover") || stage.includes("handover") || stage.includes("completed") || stage.includes("delivered")) {
      return `/dashboard/installation/final-handover/details/${leadId}?accountId=${accountId}&tab=servicing&source=servicing`;
    }
    
    return `/dashboard/leads/leadstable/details/${leadId}?accountId=${accountId}`;
  };

  const handleViewLead = () => {
    if (lead?.id) {
      const path = getLeadDetailsPath(lead.id, lead.account_id, (lead as any).statusType?.type || lead.lead_status);
      router.push(path);
      onOpenChange(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "open":
        return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400";
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={task ? `Task Details - ${task.task_type}` : "Loading Task..."}
      description="Detailed view of the lead task details."
      size="lg"
    >
      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-sm">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-xs">Fetching task details...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-10 text-destructive space-y-2">
            <AlertCircle size={40} />
            <p className="font-semibold">Error Loading Task</p>
            <p className="text-xs text-muted-foreground">Please try again later.</p>
          </div>
        )}

        {task && (
          <>
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Task Summary Card */}
              <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileText size={16} className="text-primary" />
                    Task Summary
                  </h4>
                  <Badge className={`border font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created At:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {task.created_at ? format(new Date(task.created_at), "dd MMM yyyy, hh:mm a") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar size={12} />
                      {task.due_date ? format(new Date(task.due_date), "dd MMM yyyy") : "N/A"}
                    </span>
                  </div>
                  {task.closed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed At:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {format(new Date(task.closed_at), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  )}
                  {task.instance?.title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instance:</span>
                      <span className="font-medium text-foreground">{task.instance.title}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Details */}
              <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                  <User size={16} className="text-primary" />
                  Task Assignment
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">
                      {task.user ? task.user.user_name : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned By:</span>
                    <span className="font-medium">
                      {task.createdBy ? task.createdBy.user_name : "System"}
                    </span>
                  </div>
                  {task.closedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Closed By:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {task.closedBy.user_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Remarks Section */}
            {task.remark && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock size={16} className="text-primary" />
                  Task Remarks
                </h4>
                <div className="border border-border rounded-xl p-4 bg-muted/5 leading-relaxed text-xs">
                  {task.remark}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {lead?.id && (
                <Button onClick={handleViewLead} className="flex items-center gap-1.5">
                  <Eye size={16} />
                  View Lead Details
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
