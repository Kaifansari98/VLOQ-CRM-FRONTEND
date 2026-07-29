"use client";

import { toastManager } from "@/components/ui/toast";
import { getBoxItems, getProjectDetail, ProjectDetailData, downloadBoxPdf, downloadProjectFullReport } from "@/api/track-trace/track-trace-cutlist.api";
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
  Download,
  Loader2,

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
  const bg = { blue: "bg-blue-50", green: "bg-emerald-50", amber: "bg-amber-50", purple: "bg-indigo-50", slate: "bg-slate-50" }[color];
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

function BoxCard({
  box,
  onClick,
  onDownload,
  downloading,
}: {
  box: ProjectDetailData["boxes"][0];
  onClick: () => void;
  onDownload: () => void;
  downloading?: boolean;
}) {
  const isPacked = box.box_status === "packed";
  const factoryOut = !!box.factory_out_at;
  const siteIn = !!box.site_in_at;

  const visibleBoxInfoValues =
    box.box_info_values?.filter(
      (item) =>
        item.field_value &&
        String(item.field_value).trim()
    ) || [];

  return (
    <div
      onClick={onClick}
      className="group w-full cursor-pointer rounded-xl border bg-card hover:border-indigo-300 hover:shadow-md transition-all p-4 flex gap-4 items-start"
    >
      <div
        className={cn(
          "mt-0.5 rounded-lg p-2",
          isPacked ? "bg-emerald-50" : "bg-amber-50"
        )}
      >
        <Package
          size={18}
          className={isPacked ? "text-emerald-600" : "text-amber-500"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-sm text-foreground truncate">
            {box.box_name}
          </span>

          <Badge
            variant={isPacked ? "default" : "secondary"}
            className="text-[10px] shrink-0"
          >
            {box.box_status}
          </Badge>

          <span className="text-xs text-muted-foreground shrink-0">
            {box.items_count} items
          </span>
        </div>
        {visibleBoxInfoValues.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {visibleBoxInfoValues.map((item) => (
              <div
                key={`${box.id}-${item.field_id}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-muted/40 px-2 py-1"
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {item.field_label}
                </span>

                <span className="max-w-32 truncate text-[11px] font-semibold text-foreground">
                  {item.field_value}
                </span>
              </div>
            ))}
          </div>
        )}

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

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={downloading}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-all",
            "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          title="Download box PDF"
        >
          {downloading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
        </button>

        <ChevronRight
          size={16}
          className="text-muted-foreground group-hover:text-indigo-500 transition-colors"
        />
      </div>
    </div>
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
        {done && by && <p className="text-[9px] text-muted-foreground">by {by}</p>}
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
  const [productGroup, setProductGroup] = useState("all");
  const [selectedMachineId, setSelectedMachineId] = useState("all");
  const [machineStatus, setMachineStatus] = useState<"both" | "done" | "pending">("both");

  const getProductGroup = (item: any) => {
    return (
      item.group ||
      item.group_name ||
      item.groupName ||
      item.product_group ||
      item.productGroup ||
      "Ungrouped"
    );
  };

  const productGroups = Array.from(
    new Set(cutlist.map((item: any) => getProductGroup(item)).filter(Boolean))
  ).sort();

  const filtered = cutlist.filter((item: any) => {
    const searchText = search.trim().toLowerCase();
    const itemName = String(item.item_name || "").toLowerCase();
    const uniqueCode = String(item.unique_code || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const group = String(getProductGroup(item) || "").toLowerCase();

    const matchesSearch =
      !searchText ||
      itemName.includes(searchText) ||
      uniqueCode.includes(searchText) ||
      category.includes(searchText) ||
      group.includes(searchText);

    const matchesProductGroup =
      productGroup === "all" || getProductGroup(item) === productGroup;

    let matchesMachine = true;

    if (selectedMachineId !== "all") {
      const machineId = Number(selectedMachineId);
      const mapping = item.machines.find(
        (machineMapping: any) => Number(machineMapping.machine_id) === machineId
      );

      if (!mapping) {
        matchesMachine = false;
      } else if (machineStatus === "done") {
        matchesMachine = mapping.scanned === true;
      } else if (machineStatus === "pending") {
        matchesMachine = mapping.scanned !== true;
      } else {
        matchesMachine = true;
      }
    }

    return matchesSearch && matchesProductGroup && matchesMachine;
  });

  const resetFilters = () => {
    setSearch("");
    setProductGroup("all");
    setSelectedMachineId("all");
    setMachineStatus("both");
  };

  return (
    <div className="rounded-xl border overflow-hidden shadow-sm">
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Layers size={15} className="text-indigo-500" />
            Cut List ({filtered.length}/{cutlist.length} items)
          </h2>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={resetFilters}
            className="h-8 gap-1 text-xs"
          >
            <X size={13} />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Search
            </label>
            <input
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Search items, code, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Product / Group
            </label>
            <select
              value={productGroup}
              onChange={(e) => setProductGroup(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="all">All Products / Groups</option>
              {productGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Machine
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="all">All Machines</option>
              {machineIds.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Status
            </label>
            <select
              value={machineStatus}
              onChange={(e) => setMachineStatus(e.target.value as "both" | "done" | "pending")}
              disabled={selectedMachineId === "all"}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="both">Both</option>
              <option value="done">Done</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-black uppercase w-8">#</TableHead>
              <TableHead className="text-xs font-black uppercase">Item</TableHead>
              <TableHead className="text-xs font-black uppercase">Product</TableHead>
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
            ) : filtered.map((item: any, idx) => (
              <TableRow key={item.id} className={cn("hover:bg-primary/5", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-sm">{item.item_name}</TableCell>
                <TableCell className="font-semibold text-sm">{getProductGroup(item)}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.unique_code}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.length}×{item.width}×{item.thickness}
                </TableCell>
                <TableCell className="text-xs font-bold">1</TableCell>
                <TableCell className="text-xs">{item.category}</TableCell>

                {machineIds.map(m => {
                  const mapping = item.machines.find((mm: any) => Number(mm.machine_id) === Number(m.id));
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
  const { uniqueProjectId } = useParams<{ uniqueProjectId: string }>();

  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedBox, setSelectedBox] = useState<{ id: number; name: string } | null>(null);
  const [downloadingBoxId, setDownloadingBoxId] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    if (!vendorId || !uniqueProjectId) return;
    setLoading(true);
    getProjectDetail(Number(vendorId), String(uniqueProjectId))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [vendorId, uniqueProjectId]);

  const machineIds = data
    ? data.machines.map(m => ({ id: m.machine_id, name: m.machine_name }))
    : [];

  const handleDownloadBoxPdf = async (box: ProjectDetailData["boxes"][0]) => {
    if (!vendorId || !uniqueProjectId) return;

    try {
      setDownloadingBoxId(box.id);

      const response = await downloadBoxPdf(
        box.id,
        String(uniqueProjectId),
        Number(vendorId)
      );

      if (!response?.status && !response?.success) {
        throw new Error(response?.message || "Failed to generate PDF");
      }

      const pdfUrl =
        response?.data?.download_url ||
        response?.data?.pdf_url ||
        response?.download_url ||
        response?.pdf_url;

      if (!pdfUrl) {
        throw new Error("PDF URL not found in response");
      }

      const link = document.createElement("a");
      link.href = pdfUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${box.box_name || "box"}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastManager.add({
        title: "Box PDF generated successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error("Download box PDF error:", error);
      alert(error?.message || "Failed to download box PDF");
    } finally {
      setDownloadingBoxId(null);
    }
  };


  const handleDownloadAllBoxes = async () => {
    if (!vendorId || !uniqueProjectId) return;

    try {
      setDownloadingAll(true);

      const response = await downloadProjectFullReport(
        String(uniqueProjectId),
        Number(vendorId)
      );

      if (!response?.status && !response?.success) {
        throw new Error(response?.message || "Failed to generate full report");
      }

      const pdfUrl =
        response?.data?.download_url ||
        response?.data?.pdf_url ||
        response?.download_url ||
        response?.pdf_url;

      if (!pdfUrl) {
        throw new Error("Report URL not found in response");
      }

      const link = document.createElement("a");
      link.href = pdfUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${data?.project?.project_name || "project"}-full-report.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Download all boxes error:", error);
      alert(error?.message || "Failed to download full report");
    } finally {
      setDownloadingAll(false);
    }
  };

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
            <StatCard label="Total Items" value={data.stats.total_items} color="blue" />
            <StatCard label="Total Panels" value={data.stats.total_panels} color="purple" />
            <StatCard label="Total Boxes" value={data.stats.total_boxes} color="slate" />
            <StatCard label="Packed Boxes" value={data.stats.packed_boxes} color="green" />
            <StatCard label="Unpacked" value={data.stats.unpacked_boxes} color="amber" />
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Box size={15} className="text-indigo-500" />
                  Boxes ({data.boxes.length})
                </h2>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={downloadingAll}
                  onClick={handleDownloadAllBoxes}
                  className="h-8 gap-2 rounded-lg"
                >
                  {downloadingAll ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Download All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.boxes.map(box => (
                  <BoxCard
                    key={box.id}
                    box={box}
                    downloading={downloadingBoxId === box.id}
                    onClick={() => setSelectedBox({ id: box.id, name: box.box_name })}
                    onDownload={() => handleDownloadBoxPdf(box)}
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
          projectId={String(uniqueProjectId)}
          boxId={selectedBox.id}
          boxName={selectedBox.name}
        />
      )}
    </>
  );
}