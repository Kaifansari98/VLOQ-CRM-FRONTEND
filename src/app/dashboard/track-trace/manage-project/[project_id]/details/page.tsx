"use client";

import { getBoxItems, getProjectDetail, ProjectDetailData } from "@/api/track-trace/track-trace-cutlist.api";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  Box, CheckCircle2, Clock, MapPin, Package,
  TruckIcon, User, Layers, ChevronRight, X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = "blue" }: {
  label: string; value: string | number; sub?: string;
  color?: "blue" | "green" | "amber" | "purple" | "slate";
}) {
  const bg  = { blue: "bg-blue-50", green: "bg-emerald-50", amber: "bg-amber-50", purple: "bg-indigo-50", slate: "bg-slate-50" }[color];
  const txt = { blue: "text-blue-600", green: "text-emerald-600", amber: "text-amber-600", purple: "text-indigo-600", slate: "text-slate-600" }[color];
  return (
    <div className={cn("rounded-xl border p-4 flex flex-col gap-1", bg)}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-black tabular-nums", txt)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Machine Progress Bar ─────────────────────────────────────────────────────

function MachineBar({ m }: { m: ProjectDetailData["machines"][0] }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-36 shrink-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{m.machine_name}</p>
        {m.machine_type && <p className="text-[10px] text-muted-foreground">{m.machine_type}</p>}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${m.pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-indigo-600 w-10 text-right">{m.pct}%</span>
      <span className="text-xs text-muted-foreground w-24 text-right">
        {m.scanned}/{m.total} scanned
      </span>
    </div>
  );
}

// ─── Box Card ─────────────────────────────────────────────────────────────────

function BoxCard({ box, onClick }: { box: ProjectDetailData["boxes"][0]; onClick: () => void }) {
  const isPacked  = box.box_status === "packed";
  const factoryOut = !!box.factory_out_at;
  const siteIn     = !!box.site_in_at;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl border bg-card hover:border-indigo-300 hover:shadow-md transition-all p-4 flex gap-4 items-start"
    >
      <div className={cn("mt-0.5 rounded-lg p-2", isPacked ? "bg-emerald-50" : "bg-amber-50")}>
        <Package size={18} className={isPacked ? "text-emerald-600" : "text-amber-500"} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-sm text-foreground truncate">{box.box_name}</span>
          <Badge variant={isPacked ? "default" : "secondary"} className="text-[10px] shrink-0">
            {box.box_status}
          </Badge>
          <span className="text-xs text-muted-foreground shrink-0">{box.items_count} items</span>
        </div>

        {/* Dispatch timeline */}
        <div className="flex items-center gap-4 flex-wrap">
          <DispatchStep
            label="Factory Out"
            done={factoryOut}
            by={box.factory_out_by}
            at={box.factory_out_at}
            Icon={TruckIcon}
          />
          <div className="h-px w-6 bg-border shrink-0" />
          <DispatchStep
            label="Site In"
            done={siteIn}
            by={box.site_in_by}
            at={box.site_in_at}
            Icon={MapPin}
          />
        </div>
      </div>

      <ChevronRight size={16} className="text-muted-foreground mt-1 shrink-0 group-hover:text-indigo-500 transition-colors" />
    </button>
  );
}

function DispatchStep({ label, done, by, at, Icon }: {
  label: string; done: boolean; by: string | null; at: string | null; Icon: any;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("rounded-full p-1", done ? "bg-emerald-100" : "bg-muted")}>
        <Icon size={11} className={done ? "text-emerald-600" : "text-muted-foreground"} />
      </div>
      <div>
        <p className={cn("text-[10px] font-bold", done ? "text-emerald-700" : "text-muted-foreground")}>{label}</p>
        {done && at && <p className="text-[9px] text-muted-foreground">{fmtDateTime(at)}</p>}
        {done && by  && <p className="text-[9px] text-muted-foreground">by {by}</p>}
      </div>
    </div>
  );
}

// ─── Box Items Dialog ─────────────────────────────────────────────────────────

function BoxItemsDialog({
  open, onClose, vendorId, projectId, boxId, boxName,
}: {
  open: boolean; onClose: () => void;
  vendorId: number; projectId: string; boxId: number; boxName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getBoxItems>> | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getBoxItems(vendorId, projectId, boxId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, boxId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Box size={18} className="text-indigo-500" />
            {boxName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !data ? (
            <p className="pt-6 text-sm text-muted-foreground">Failed to load items.</p>
          ) : data.items.length === 0 ? (
            <p className="pt-6 text-sm text-muted-foreground">No items in this box.</p>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-black uppercase">Item</TableHead>
                  <TableHead className="text-xs font-black uppercase">Code</TableHead>
                  <TableHead className="text-xs font-black uppercase">Size (L×W×T)</TableHead>
                  <TableHead className="text-xs font-black uppercase">Category</TableHead>
                  <TableHead className="text-xs font-black uppercase">Machine</TableHead>
                  <TableHead className="text-xs font-black uppercase">Scanned At</TableHead>
                  <TableHead className="text-xs font-black uppercase">Scanned By</TableHead>
                  <TableHead className="text-xs font-black uppercase">Site In</TableHead>
                  <TableHead className="text-xs font-black uppercase">Site By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, idx) => (
                  <TableRow key={item.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <TableCell className="font-semibold text-sm">{item.cut_list.item_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.cut_list.unique_code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.cut_list.length}×{item.cut_list.width}×{item.cut_list.thickness}
                    </TableCell>
                    <TableCell className="text-xs">{item.cut_list.category_name}</TableCell>
                    <TableCell className="text-xs">{item.machine.machine_name}</TableCell>
                    <TableCell className="text-xs">
                      {item.actual_in_at
                        ? <span className="text-emerald-700 font-medium">{fmtDateTime(item.actual_in_at)}</span>
                        : <span className="text-amber-500">Pending</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.inOperator
                        ? <span className="flex items-center gap-1"><User size={10} />{item.inOperator.name}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.site_in_at
                        ? <span className="text-blue-700 font-medium">{fmtDateTime(item.site_in_at)}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.siteInByUser
                        ? <span className="flex items-center gap-1"><User size={10} />{item.siteInByUser.name}</span>
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cut List Table ───────────────────────────────────────────────────────────

function CutListSection({ cutlist, machineIds }: {
  cutlist: ProjectDetailData["cutlist"];
  machineIds: { id: number; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const filtered = cutlist.filter(item =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.unique_code.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-xl border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b gap-3 flex-wrap">
        <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Layers size={15} className="text-indigo-500" /> Cut List ({cutlist.length} items)
        </h2>
        <input
          className="border rounded-lg px-3 py-1.5 text-sm w-56 bg-background focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Search items…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-black uppercase w-8">#</TableHead>
              <TableHead className="text-xs font-black uppercase">Item</TableHead>
              <TableHead className="text-xs font-black uppercase">Code</TableHead>
              <TableHead className="text-xs font-black uppercase">Size (mm)</TableHead>
              <TableHead className="text-xs font-black uppercase">Qty</TableHead>
              <TableHead className="text-xs font-black uppercase">Category</TableHead>
              {machineIds.map(m => (
                <TableHead key={m.id} className="text-xs font-black uppercase text-center min-w-36">{m.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7 + machineIds.length} className="text-center py-10 text-muted-foreground text-sm">
                  No items found
                </TableCell>
              </TableRow>
            ) : filtered.map((item, idx) => (
              <TableRow key={item.id} className={cn("hover:bg-primary/5", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-sm">{item.item_name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.unique_code}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.length}×{item.width}×{item.thickness}
                </TableCell>
                <TableCell className="text-xs font-bold">{item.qty}</TableCell>
                <TableCell className="text-xs">{item.category}</TableCell>

                {machineIds.map(m => {
                  const mapping = item.machines.find(mm => mm.machine_id === m.id);
                  if (!mapping) {
                    return <TableCell key={m.id} className="text-center text-xs text-muted-foreground">—</TableCell>;
                  }
                  return (
                    <TableCell key={m.id} className="text-center">
                      {mapping.scanned ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                            <CheckCircle2 size={11} /> Done
                          </span>
                          {mapping.scanned_by && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <User size={8} />{mapping.scanned_by}
                            </span>
                          )}
                          {mapping.scanned_at && (
                            <span className="text-[9px] text-muted-foreground">{fmtDateTime(mapping.scanned_at)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-medium">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { project_id } = useParams<{ project_id: string }>();

  const [data, setData]       = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const [selectedBox, setSelectedBox] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (!vendorId || !project_id) return;
    setLoading(true);
    getProjectDetail(Number(vendorId), String(project_id))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [vendorId, project_id]);

  const machineIds = data
    ? data.machines.map(m => ({ id: m.machine_id, name: m.machine_name }))
    : [];

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">Track & Trace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{data?.project.project_name ?? "Project Detail"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-6">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load project detail. Please refresh.
          </div>
        )}

        {!loading && !error && data && (<>

          {/* ── Lead info banner ── */}
          <div className="rounded-xl border bg-card px-5 py-4 flex flex-wrap gap-6 items-start shadow-sm">
            <div className="flex-1 min-w-48">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-1 rounded-full bg-indigo-500" />
                <h1 className="text-xl font-black text-foreground">{data.project.project_name}</h1>
              </div>
              {data.project.lead && (
                <div className="pl-3 flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" /> {data.project.lead.lead_name}
                  </p>
                  {data.project.lead.lead_phone && (
                    <p className="text-xs text-muted-foreground">{data.project.lead.lead_phone}</p>
                  )}
                  {data.project.lead.lead_address && (
                    <p className="text-xs text-muted-foreground">{data.project.lead.lead_address}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-xs">{data.project.project_status}</Badge>
              <Badge
                className={cn("text-xs", data.project.track_trace_status === "Completed" ? "bg-emerald-500" : "bg-indigo-500")}
              >
                T&T: {data.project.track_trace_status}
              </Badge>
              {data.project.details?.estimated_completion_date && (
                <span className="text-xs text-muted-foreground">
                  Due: {fmtDate(data.project.details.estimated_completion_date)}
                </span>
              )}
            </div>
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Items"  value={data.stats.total_items}    color="blue"   />
            <StatCard label="Total Panels" value={data.stats.total_panels}   color="purple" />
            <StatCard label="Total Boxes"  value={data.stats.total_boxes}    color="slate"  />
            <StatCard label="Packed Boxes" value={data.stats.packed_boxes}   color="green"  />
            <StatCard label="Unpacked"     value={data.stats.unpacked_boxes} color="amber"  />
          </div>

          {/* ── Machine progress ── */}
          {data.machines.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="font-bold text-sm mb-3 text-foreground">Machine Progress</h2>
              <div className="divide-y">
                {data.machines.map(m => <MachineBar key={m.machine_id} m={m} />)}
              </div>
            </div>
          )}

          {/* ── Boxes ── */}
          {data.boxes.length > 0 && (
            <div>
              <h2 className="font-bold text-sm mb-3 text-foreground flex items-center gap-2">
                <Box size={15} className="text-indigo-500" /> Boxes ({data.boxes.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.boxes.map(box => (
                  <BoxCard
                    key={box.id}
                    box={box}
                    onClick={() => setSelectedBox({ id: box.id, name: box.box_name })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Cut list table ── */}
          <CutListSection cutlist={data.cutlist} machineIds={machineIds} />

        </>)}
      </div>

      {/* ── Box items dialog ── */}
      {selectedBox && (
        <BoxItemsDialog
          open={!!selectedBox}
          onClose={() => setSelectedBox(null)}
          vendorId={Number(vendorId)}
          projectId={String(project_id)}
          boxId={selectedBox.id}
          boxName={selectedBox.name}
        />
      )}
    </>
  );
}