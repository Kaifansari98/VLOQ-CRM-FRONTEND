"use client";

import { useState } from "react";
import { ChevronDown, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplaintTask } from "@/types/complaint-details";
import { complaintDate as date } from "./complaint-details-format";

const ROLE_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "head-site-supervisor": "Head Site Supervisor",
  "site-supervisor": "Site Supervisor",
};

const STATUS: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  in_progress: { label: "In progress", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const isOpen = (t: ComplaintTask) => t.status === "open" || t.status === "in_progress";

// The complaint's tasks: who has to do what next, and what was done. Tasks of
// complaints raised against a lead also show in My Tasks.
export function ComplaintTasks({ tasks, multiCycle }: { tasks: ComplaintTask[]; multiCycle: boolean }) {
  const [showDone, setShowDone] = useState(false);
  if (!tasks.length) return null;
  const open = tasks.filter(isOpen);
  const done = tasks.filter((t) => !isOpen(t));
  const today = new Date().toISOString().slice(0, 10);

  const row = (t: ComplaintTask) => {
    const status = STATUS[t.status] ?? STATUS.open;
    const overdue = isOpen(t) && !!t.due_date && t.due_date.slice(0, 10) < today;
    return (
      <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-3 text-xs">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {t.title}
            {multiCycle && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                Cycle {t.cycle_number}
              </span>
            )}
            {t.my_tasks_id && isOpen(t) && (
              <span className="rounded border px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                In My Tasks
              </span>
            )}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t.assigned_to.name}
            {t.assigned_to.role && ` · ${ROLE_LABELS[t.assigned_to.role.toLowerCase()] ?? t.assigned_to.role}`}
            {!isOpen(t) && t.completed_at && (
              <>
                {" · "}
                {t.status === "completed" ? "Done" : "Closed"} {date(t.completed_at, true)}
                {t.completed_by && ` by ${t.completed_by.name}`}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isOpen(t) && t.due_date && (
            <span className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>
              {overdue ? "Overdue · " : "Due "}
              {date(t.due_date)}
            </span>
          )}
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}>
            {status.label}
          </span>
        </div>
      </li>
    );
  };

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <ListChecks className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Tasks</h2>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {open.length} open
        </span>
      </div>
      {open.length ? (
        <ul className="divide-y">{open.map(row)}</ul>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground">No open tasks.</p>
      )}
      {!!done.length && (
        <div className="border-t">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", showDone && "rotate-180")} />
            {showDone ? "Hide" : "Show"} completed tasks ({done.length})
          </button>
          {showDone && <ul className="divide-y border-t bg-muted/10">{done.map(row)}</ul>}
        </div>
      )}
    </section>
  );
}
