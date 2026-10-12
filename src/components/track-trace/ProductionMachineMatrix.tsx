"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Factory, RefreshCw, Search, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { getTraceTraceDashboard } from "@/api/track-trace/track-trace-dashboard.api";
import { Button } from "@/components/ui/button";
import DefectsTable from "@/components/track-trace/DefectsTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function ProductionMachineMatrix({
  vendorId,
  leadId,
}: {
  vendorId?: number;
  leadId: number;
}) {
  const [search, setSearch] = useState("");
  const [defectsOpen, setDefectsOpen] = useState(false);
  const { data, isPending, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["production-machine-matrix", "lead-scoped", vendorId, leadId],
    queryFn: () => getTraceTraceDashboard(vendorId!, "all", { lead_id: leadId }),
    enabled: !!vendorId && leadId > 0,
    refetchInterval: 30_000,
  });
  // Never render another lead's projects, even if an API returns an unscoped payload.
  const projects = [...(data?.active ?? []), ...(data?.archived ?? [])].filter(
    (project) => project.lead_id != null && Number(project.lead_id) === leadId,
  );
  const rows = projects.flatMap((project) =>
    project.machines.map((machine) => ({ project, machine })),
  ).sort((a, b) => a.machine.sequence_no - b.machine.sequence_no);
  const visibleRows = rows.filter(({ machine, project }) =>
    `${machine.machine_name} ${project.project_name}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const scanned = rows.reduce((sum, { machine }) => sum + machine.scanned, 0);
  const pending = rows.reduce((sum, { machine }) => sum + machine.pending, 0);

  return (
    <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-muted/20 p-5 sm:p-6">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
            <Factory className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Track &amp; Trace Live Matrix</h2>
            <p className="mt-1 text-sm text-muted-foreground">Machine progress for this project</p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={isFetching || !vendorId} onClick={() => refetch()}>
          <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isError && (
        <div role="alert" className="border-b bg-destructive/5 px-6 py-4 text-sm text-destructive">
          Unable to refresh machine progress. {data ? "Showing the last available data." : "Please try Refresh again."}
        </div>
      )}
      {!vendorId || isPending ? (
        <div role="status" className="space-y-4 p-6" aria-label="Loading machine progress">
          {[1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : !data ? null : projects.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Factory className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h3 className="font-medium">No Track &amp; Trace data for this project yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Machine progress will appear once a project is linked to this lead.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x border-b bg-muted/10 sm:grid-cols-4">
            {[
              ["Project panels", projects.reduce((sum, project) => sum + project.total_panels, 0)],
              ["Machines", new Set(rows.map(({ machine }) => machine.machine_id)).size],
              ["Completed scans", scanned],
              ["Pending at machines", pending],
            ].map(([label, value]) => (
              <div key={label} className="px-5 py-4">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 p-5">
            <Button
              type="button"
              className="shrink-0 gap-2"
              aria-haspopup="dialog"
              aria-expanded={defectsOpen}
              onClick={() => setDefectsOpen(true)}
            >
              <AlertTriangle className="size-4" />
              View defects
            </Button>
            <Dialog open={defectsOpen} onOpenChange={setDefectsOpen}>
              <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[95vw] lg:max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Project defects</DialogTitle>
                  <DialogDescription>Pending and resolved defects for this project, including defect and resolution photos.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 overflow-y-auto">
                  <Tabs defaultValue="pending" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="pending"><Clock className="mr-2 size-4" />Pending</TabsTrigger>
                      <TabsTrigger value="resolved"><CheckCircle2 className="mr-2 size-4" />Resolved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending"><DefectsTable vendorId={vendorId} leadId={leadId} type="pending" /></TabsContent>
                    <TabsContent value="resolved"><DefectsTable vendorId={vendorId} leadId={leadId} type="resolved" /></TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input aria-label="Search machines" placeholder="Search machines…" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>

          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  {["Machine / Project", "Assigned panels", "Completed scans", "Pending here", "Awaiting upstream", "Progress"].map((label) => (
                    <th key={label} scope="col" className="px-5 py-3 text-left font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleRows.map(({ project, machine }) => {
                  const assigned = machine.assigned ?? machine.total;
                  const percentage = assigned ? Math.min(100, Math.round(machine.scanned / assigned * 100)) : 0;
                  const complete = assigned > 0 && machine.scanned >= assigned;
                  return (
                    <tr key={`${project.project_id}:${machine.machine_id}`} className="transition-colors hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tabular-nums">{machine.sequence_no}</span>
                          <div><p className="font-medium">{machine.machine_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{project.project_name}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-4 tabular-nums">{assigned}</td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{machine.scanned}</td>
                      <td className="px-5 py-4"><span className={`rounded-md px-2 py-1 font-medium tabular-nums ${machine.pending ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>{machine.pending}</span></td>
                      <td className="px-5 py-4 tabular-nums text-muted-foreground">{Math.max(0, assigned - machine.scanned - machine.pending)}</td>
                      <td className="min-w-44 px-5 py-4">
                        <div className="mb-2 flex justify-between gap-3 text-xs"><span className={complete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{complete ? "Completed" : machine.scanned ? "In progress" : machine.pending ? "Ready to scan" : "Waiting"}</span><span className="tabular-nums">{percentage}%</span></div>
                        <div role="progressbar" aria-label={`${project.project_name}: ${machine.machine_name} scan completion`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${percentage}%` }} /></div>
                      </td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">{rows.length ? "No machines match your search." : "No panels have been assigned to machines for these projects yet."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
            <p>Pending here = eligible panels awaiting a scan. Scan totals count each machine operation.</p>
            <span className="flex items-center gap-1.5"><Activity className="size-3.5" />Refreshes every 30s · Updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
          </div>
        </>
      )}
    </section>
  );
}
