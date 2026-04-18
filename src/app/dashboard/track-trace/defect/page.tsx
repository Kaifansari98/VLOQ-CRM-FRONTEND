"use client";

import {
  getDefectSummary, getPendingDefects, getResolvedDefects,
  DefectSummaryData, DefectItem, DefectImage, PaginatedDefects,
} from "@/api/track-trace/defect-dashboard.api";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, PackageX, RefreshCw, Timer, TrendingUp, Wrench,
  X, ZoomIn, Image as ImageIcon, ShieldCheck,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string | null) => {
  if (!iso) return "—";
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

function StatCard({ label, value, sub, color, Icon }: {
  label: string; value: string | number; sub?: string;
  color: "red"|"amber"|"green"|"blue"|"purple"|"slate"; Icon: React.ElementType;
}) {
  const s = {
    red:    { bg:"bg-red-50",    tx:"text-red-600",    ic:"bg-red-100"     },
    amber:  { bg:"bg-amber-50",  tx:"text-amber-600",  ic:"bg-amber-100"   },
    green:  { bg:"bg-emerald-50",tx:"text-emerald-600",ic:"bg-emerald-100" },
    blue:   { bg:"bg-blue-50",   tx:"text-blue-600",   ic:"bg-blue-100"    },
    purple: { bg:"bg-indigo-50", tx:"text-indigo-600", ic:"bg-indigo-100"  },
    slate:  { bg:"bg-slate-50",  tx:"text-slate-600",  ic:"bg-slate-100"   },
  }[color];
  return (
    <div className={cn("rounded-xl border p-4 flex items-start gap-3 shadow-sm", s.bg)}>
      <div className={cn("rounded-lg p-2 shrink-0", s.ic)}>
        <Icon size={18} className={s.tx} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">{label}</p>
        <p className={cn("text-2xl font-black tabular-nums leading-tight mt-0.5", s.tx)}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Bar List ─────────────────────────────────────────────────────────────────

function BarList({ title, items, color }: {
  title: string; color: string;
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm h-full">
      <p className="font-bold text-sm mb-4">{title}</p>
      {items.length === 0
        ? <p className="text-sm text-muted-foreground">No data</p>
        : <div className="space-y-2.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <p className="text-[11px] text-muted-foreground w-32 shrink-0 truncate" title={item.label}>{item.label}</p>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", color)}
                    style={{ width: `${Math.round((item.count / max) * 100)}%` }} />
                </div>
                <span className="text-xs font-bold w-5 text-right">{item.count}</span>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }: {
  images: (DefectImage & { label?: string })[]; startIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const img = images[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {idx + 1} / {images.length}
        {img.label && <span className="ml-2 text-white/50">· {img.label}</span>}
      </p>

      {/* Main image */}
      <img
        src={img.signed_url}
        alt={img.doc_og_name}
        className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Nav */}
      {idx > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setIdx(i => i - 1); }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setIdx(i => i + 1); }}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 flex gap-2 overflow-x-auto max-w-[90vw] px-4">
          {images.map((im, i) => (
            <img
              key={im.id}
              src={im.signed_url}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={cn(
                "h-14 w-14 object-cover rounded-lg cursor-pointer shrink-0 border-2 transition-all",
                i === idx ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
              )}
              alt={im.doc_og_name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Gallery Strip ──────────────────────────────────────────────────────

function ImageGallery({ images, label, badgeColor }: {
  images: (DefectImage & { label?: string })[]; label: string; badgeColor: string;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className={cn("text-[9px] font-bold uppercase tracking-widest px-1", badgeColor)}>
          {label} ({images.length})
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxIdx(i)}
              className="relative group w-14 h-14 rounded-lg overflow-hidden border bg-muted shrink-0"
              title={img.doc_og_name}
            >
              <img src={img.signed_url} alt={img.doc_og_name}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn size={14} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
      {lightboxIdx !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

// ─── Defect Card ──────────────────────────────────────────────────────────────

function DefectCard({ d, isResolved }: { d: DefectItem; isResolved: boolean }) {
  // For resolved: merge both image sets with labels for lightbox
  const defectImages  = d.images ?? [];
  const resolvedImages = d.completionPhotos ?? [];

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top accent stripe */}
      <div className={cn("h-1", isResolved ? "bg-emerald-500" : "bg-amber-500")} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{d.cutList?.item_name ?? "—"}</p>
            {d.cutList?.unique_code && (
              <p className="text-[10px] font-mono text-muted-foreground">{d.cutList.unique_code}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* Status badge */}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
              isResolved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}>
              {isResolved ? <CheckCircle2 size={10} /> : <Clock size={10} />}
              {d.defect_status}
            </span>
            {/* Action badge */}
            {d.action && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 capitalize",
                d.action === "rework" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
              )}>
                {d.action === "rework" ? <Wrench size={9} /> : <PackageX size={9} />}
                {d.action}
              </span>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <MetaRow label="Defect" value={d.defect?.defect_name ?? "—"} />
          <MetaRow label="Machine" value={d.machine.machine_name} />
          <MetaRow label="Project" value={d.project.project_name} />
          <MetaRow label="By" value={d.createdBy.user_name} />
          <MetaRow label="Reported" value={fmt(d.created_at)} />
          {isResolved && <MetaRow label="Resolved" value={fmt(d.defect_completed_at)} />}
        </div>

        {/* Remark */}
        {d.remark && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">
            "{d.remark}"
          </p>
        )}

        {/* Images */}
        {(defectImages.length > 0 || resolvedImages.length > 0) && (
          <div className="border-t pt-3 flex flex-col gap-3">
            {defectImages.length > 0 && (
              <ImageGallery
                images={defectImages.map(i => ({ ...i, label: "Defect Photo" }))}
                label="Defect Photos"
                badgeColor="text-amber-600"
              />
            )}
            {isResolved && resolvedImages.length > 0 && (
              <ImageGallery
                images={resolvedImages.map(i => ({ ...i, label: "Resolution Photo" }))}
                label="Resolution Photos"
                badgeColor="text-emerald-600"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-xs truncate font-medium">{value}</p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <Button size="sm" variant="outline" className="h-8 w-8 p-0"
        disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} />
      </Button>
      {pages.map(p => (
        <Button key={p} size="sm" variant={p === page ? "default" : "outline"}
          className="h-8 w-8 p-0 text-xs"
          onClick={() => onChange(p)}>
          {p}
        </Button>
      ))}
      <Button size="sm" variant="outline" className="h-8 w-8 p-0"
        disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={14} />
      </Button>
      <span className="text-xs text-muted-foreground ml-2">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

// ─── Defects Grid (tab content) ───────────────────────────────────────────────

function DefectsGrid({ vendorId, type }: { vendorId: number; type: "pending" | "resolved" }) {
  const [data, setData]       = useState<PaginatedDefects | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  const fetch = useCallback((p: number) => {
    setLoading(true);
    const fn = type === "pending" ? getPendingDefects : getResolvedDefects;
    fn(vendorId, p)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vendorId, type]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handlePage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
    </div>
  );

  if (!data || data.defects.length === 0) return (
    <div className="mt-8 text-center text-muted-foreground text-sm">
      {type === "pending" ? "No pending defects 🎉" : "No resolved defects yet"}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mt-4 mb-3">
        <p className="text-xs text-muted-foreground">
          Showing {(page - 1) * data.page_size + 1}–{Math.min(page * data.page_size, data.total)} of {data.total} defects
        </p>
        {type === "resolved" && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ImageIcon size={10} className="text-amber-500" /> Defect photos &nbsp;
            <ShieldCheck size={10} className="text-emerald-500" /> Resolution photos
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.defects.map(d => (
          <DefectCard key={d.id} d={d} isResolved={type === "resolved"} />
        ))}
      </div>
      <Pagination page={page} totalPages={data.total_pages} onChange={handlePage} />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DefectDashboardPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const [summary, setSummary]         = useState<DefectSummaryData | null>(null);
  const [summaryLoading, setSumLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    if (!vendorId) return;
    setSumLoading(true);
    getDefectSummary(Number(vendorId))
      .then(setSummary)
      .catch(console.error)
      .finally(() => setSumLoading(false));
  }, [vendorId]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

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
                <BreadcrumbPage>Defect Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSummary}
            className="p-2 rounded-lg hover:bg-muted transition-colors" title="Refresh summary">
            <RefreshCw size={14} className={cn("text-muted-foreground", summaryLoading && "animate-spin")} />
          </button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-6">

        {/* ── Summary stat cards ── */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : summary ? (<>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Total Defects"     value={summary.summary.total}           color="slate"  Icon={AlertTriangle}  />
            <StatCard label="Pending"            value={summary.summary.pending}         color="amber"  Icon={Clock}          />
            <StatCard label="Resolved"           value={summary.summary.completed}       color="green"  Icon={CheckCircle2}   />
            <StatCard label="Rework"             value={summary.summary.rework}          color="blue"   Icon={Wrench}         />
            <StatCard label="Replace"            value={summary.summary.replace}         color="red"    Icon={PackageX}       />
            <StatCard label="Resolution Rate"    value={`${summary.summary.completion_rate}%`} color="purple" Icon={TrendingUp} />
            <StatCard
              label="Avg Resolution"
              value={summary.summary.avg_resolution_hours !== null
                ? `${summary.summary.avg_resolution_hours}h` : "—"}
              color="slate" Icon={Timer}
            />
          </div>

          {/* ── Bar charts ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BarList title="By Defect Type" color="bg-red-400"
              items={summary.by_defect_type.slice(0, 8).map(d => ({ label: d.defect_name, count: d.count }))} />
            <BarList title="By Machine" color="bg-indigo-400"
              items={summary.by_machine.slice(0, 8).map(m => ({ label: m.machine_name, count: m.count }))} />
            <BarList title="Top Projects" color="bg-amber-400"
              items={summary.by_project.slice(0, 8).map(p => ({ label: p.project_name, count: p.count }))} />
          </div>
        </>) : null}

        {/* ── Tabs ── */}
        {vendorId && (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="pending" className="flex-1 gap-1.5">
                <Clock size={13} />
                Pending
                {summary && (
                  <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {summary.summary.pending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 gap-1.5">
                <CheckCircle2 size={13} />
                Resolved
                {summary && (
                  <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {summary.summary.completed}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <DefectsGrid vendorId={Number(vendorId)} type="pending" />
            </TabsContent>

            <TabsContent value="resolved">
              <DefectsGrid vendorId={Number(vendorId)} type="resolved" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}