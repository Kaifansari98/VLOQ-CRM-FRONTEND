"use client";

import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useMyComplaintTasks } from "@/api/client-complaints";
import { STATUS_META } from "./complaint-meta";
import {
  complaintDate as date,
  displayText as text,
} from "./complaint-details-format";

// Complaint tasks (site visits, repairs) assigned to the user, listed on My
// Tasks. Hidden for users without complaint access or with nothing open.
export function MyComplaintTasks() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data: tasks } = useMyComplaintTasks(vendorId);
  if (!tasks?.length) return null;
  const now = Date.now();

  return (
    <section className="mx-4 mt-4 rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquareWarning className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Complaint Tasks</h2>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="divide-y">
        {tasks.map((task) => {
          const overdue =
            !!task.due_date && new Date(task.due_date).getTime() < now;
          const status = STATUS_META[task.complaint.status];
          return (
            <Link
              key={task.id}
              href={`/dashboard/client-complaints/details/${task.complaint.id}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-xs hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {text(task.task_type)} ·{" "}
                  <span className="font-mono">
                    {task.complaint.complaint_code}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-muted-foreground">
                  {task.complaint.client_name} · {task.complaint.client_mobile}{" "}
                  · {task.complaint.site_address}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                >
                  {status.label}
                </span>
                <span
                  className={
                    overdue
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  {task.due_date ? date(task.due_date, true) : "No due date"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
