"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTraceTraceDashboard } from "@/hooks/track-trace/useTraceTraceDashboard";
import type {
  MachineScanStatus,
  ProjectScanStatus,
} from "@/api/track-trace/track-trace-dashboard.api";
import { useAppSelector } from "@/redux/store";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Machine cell ─────────────────────────────────────────────────────────────

function MachineCell({ machine }: { machine: MachineScanStatus }) {
  const allDone = machine.all_scanned;
  const pct =
    machine.total > 0
      ? Math.round((machine.scanned / machine.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-1 min-w-[110px]">
      {/* Status label */}
      <div className="flex items-center gap-1">
        {allDone ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            All Scanned
          </span>
        ) : machine.pending > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock className="size-3" />
            {machine.pending} pending
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Not started</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            allDone ? "bg-emerald-500" : "bg-amber-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Scanned / total */}
      <span className="text-[10px] text-muted-foreground">
        {machine.scanned}/{machine.total}
      </span>
    </div>
  );
}

// ─── Project table ────────────────────────────────────────────────────────────

function ProjectTable({ projects }: { projects: ProjectScanStatus[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Package className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No projects found</p>
      </div>
    );
  }

  // Collect all unique machines in sequence order across all projects
  const machineMap = new Map<number, { id: number; name: string; seq: number }>();
  projects.forEach((p) =>
    p.machines.forEach((m) => {
      if (!machineMap.has(m.machine_id)) {
        machineMap.set(m.machine_id, {
          id: m.machine_id,
          name: m.machine_name,
          seq: m.sequence_no,
        });
      }
    })
  );
  const allMachines = Array.from(machineMap.values()).sort(
    (a, b) => a.seq - b.seq
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px] sticky left-0 bg-background z-10 border-r">
              Project
            </TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[110px]">Created</TableHead>
            {allMachines.map((m) => (
              <TableHead key={m.id} className="min-w-[130px]">
                {m.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {projects.map((project) => {
            const statusColor =
              project.project_status === "Initiated"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : project.project_status === "Started"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground";

            const machineById = new Map(
              project.machines.map((m) => [m.machine_id, m])
            );

            return (
              <TableRow key={project.project_id}>
                {/* Project name */}
                <TableCell className="font-medium sticky left-0 bg-background z-10 border-r max-w-[200px]">
                  <span className="block truncate" title={project.project_name}>
                    {project.project_name}
                  </span>
                </TableCell>

                {/* Status badge */}
                <TableCell>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize whitespace-nowrap",
                      statusColor
                    )}
                  >
                    {project.project_status}
                  </span>
                </TableCell>

                {/* Created date */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(project.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>

                {/* One column per machine */}
                {allMachines.map((m) => {
                  const machine = machineById.get(m.id);
                  return (
                    <TableCell key={m.id}>
                      {machine ? (
                        <MachineCell machine={machine} />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="flex gap-6 px-4 py-3 border-b bg-muted/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-6 items-center px-4 py-4 border-b">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-10 w-28 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TraceTraceDashboard() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError } = useTraceTraceDashboard(vendorId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold">Track & Trace Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor scan progress across all projects and machines
        </p>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load dashboard data. Please try again.
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="gap-2">
            Active
            {data && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                {data.active_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            Archived
            {data && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                {data.archived_count}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <ProjectTable projects={data?.active ?? []} />
          )}
        </TabsContent>

        <TabsContent value="archived">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <ProjectTable projects={data?.archived ?? []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}