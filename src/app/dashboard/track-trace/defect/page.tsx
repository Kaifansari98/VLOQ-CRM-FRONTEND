"use client";

import {
  getDefectSummary,
  getPendingDefects,
  getResolvedDefects,
  DefectSummaryData,
  DefectItem,
  DefectImage,
  PaginatedDefects,
} from "@/api/track-trace/defect-dashboard.api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Clock,
  PackageX,
  RefreshCw,
  Timer,
  TrendingUp,
  Wrench,
  X,
  ZoomIn,
  Image as ImageIcon,
  ShieldCheck,
  Cpu,
  FolderKanban,
  User,
  Package,
  Layers,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold capitalize text-foreground truncate">
          {label}
        </p>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-foreground">
          <Icon size={12} className={iconColor} />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground font-medium truncate">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Bar List ─────────────────────────────────────────────────────────────────

function BarList({
  title,
  subtitle,
  items,
  Icon,
}: {
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No data reported yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground truncate max-w-[200px]" title={item.label}>
                  {item.label}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {item.count}
                </Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{
                    width: `${Math.round((item.count / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: (DefectImage & { label?: string })[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const img = images[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-all"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold">
        {idx + 1} / {images.length}
        {img.label && (
          <span className="ml-2 text-white/50">· {img.label}</span>
        )}
      </p>

      {/* Main image */}
      <img
        src={img.signed_url}
        alt={img.doc_og_name}
        className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Nav */}
      {idx > 0 && (
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 hover:bg-white/20 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i - 1);
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 hover:bg-white/20 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i + 1);
          }}
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
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              className={cn(
                "h-14 w-14 object-cover rounded-lg cursor-pointer shrink-0 border-2 transition-all",
                i === idx
                  ? "border-white scale-105"
                  : "border-transparent opacity-60 hover:opacity-100",
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

function ImageGallery({
  images,
  label,
  badgeVariant = "outline",
}: {
  images: (DefectImage & { label?: string })[];
  label: string;
  badgeVariant?: string;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (images.length === 0) return null;
  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <ImageIcon size={12} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {label} ({images.length})
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIdx(i)}
              className="relative group w-14 h-14 rounded-xl overflow-hidden border bg-muted shrink-0 transition-all hover:border-primary/40"
              title={img.doc_og_name}
            >
              <img
                src={img.signed_url}
                alt={img.doc_og_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn size={16} className="text-background" />
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

// ─── Table Component ─────────────────────────────────────────────────────────

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Defects Table Component ──────────────────────────────────────────────────

function DefectsTable({
  vendorId,
  type,
}: {
  vendorId: number;
  type: "pending" | "resolved";
}) {
  const [data, setData] = useState<PaginatedDefects | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Lightbox state for table row images modal
  const [activeLightbox, setActiveLightbox] = useState<{
    images: (DefectImage & { label?: string })[];
    index: number;
  } | null>(null);

  const fetch = useCallback(
    (p: number) => {
      setLoading(true);
      const fn = type === "pending" ? getPendingDefects : getResolvedDefects;
      fn(vendorId, p)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [vendorId, type],
  );

  useEffect(() => {
    fetch(page);
  }, [page, fetch]);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading)
    return (
      <div className="rounded-2xl border bg-card p-4 space-y-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );

  if (!data || data.defects.length === 0)
    return (
      <div className="mt-8 rounded-2xl border border-dashed bg-muted/20 p-10 text-center space-y-2">
        <AlertTriangle className="mx-auto h-9 w-9 text-muted-foreground/50" />
        <p className="text-sm font-bold text-foreground">
          {type === "pending"
            ? "No pending defects 🎉"
            : "No resolved defects yet"}
        </p>
        <p className="text-xs text-muted-foreground">
          All machines and products are operating cleanly.
        </p>
      </div>
    );

  const from = (page - 1) * data.page_size + 1;
  const to = Math.min(page * data.page_size, data.total);

  return (
    <div className="space-y-4 mt-4">
      {/* ── Main Table Card Container ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-12 text-center text-xs font-bold text-muted-foreground">
                #
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Item Name</span>
                  <ChevronsUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Defect</span>
                  <ChevronsUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Machine</span>
                  <ChevronsUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Project</span>
                  <ChevronsUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Reported By</span>
                  <ChevronsUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Status / Action</span>
                  <ChevronsUpDown size={12} className="opacity-50" />
                </div>
              </TableHead>
              {type === "resolved" && (
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Resolved Date
                </TableHead>
              )}
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Remark
              </TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Photos
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.defects.map((d, index) => {
              const defectImgs = (d.images ?? []).map((img) => ({
                ...img,
                label: "Defect Photo",
              }));
              const resolvedImgs = (d.completionPhotos ?? []).map((img) => ({
                ...img,
                label: "Resolution Photo",
              }));
              const allImages = [...defectImgs, ...resolvedImgs];
              const rowNumber = (page - 1) * pageSize + index + 1;

              return (
                <TableRow
                  key={d.id}
                  className="transition-colors hover:bg-muted/50 border-b last:border-0"
                >
                  {/* Row # Index */}
                  <TableCell className="text-center text-xs text-muted-foreground font-normal py-3.5">
                    {rowNumber}
                  </TableCell>

                  {/* Item Name & Code */}
                  <TableCell className="align-middle py-3.5">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate max-w-[200px]">
                        {d.cutList?.item_name ?? "—"}
                      </p>
                      {d.cutList?.unique_code && (
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {d.cutList.unique_code}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Defect */}
                  <TableCell className="align-middle py-3.5">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[150px] inline-block">
                      {d.defect?.defect_name ?? "—"}
                    </span>
                  </TableCell>

                  {/* Machine */}
                  <TableCell className="align-middle py-3.5">
                    <span className="text-xs font-medium text-foreground truncate max-w-[130px] inline-block">
                      {d.machine.machine_name}
                    </span>
                  </TableCell>

                  {/* Project Name */}
                  <TableCell className="align-middle py-3.5">
                    <span className="text-xs font-bold text-foreground truncate max-w-[170px] inline-block">
                      {d.project.project_name}
                    </span>
                  </TableCell>

                  {/* Reported By & Date */}
                  <TableCell className="align-middle py-3.5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        {d.createdBy.user_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {fmtDate(d.created_at)}
                      </p>
                    </div>
                  </TableCell>

                  {/* Status / Action Pills */}
                  <TableCell className="align-middle py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          type === "resolved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
                        )}
                      >
                        {d.defect_status}
                      </span>

                      {d.action && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                            d.action === "rework"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
                          )}
                        >
                          {d.action}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Resolved Date */}
                  {type === "resolved" && (
                    <TableCell className="align-middle py-3.5">
                      <p className="text-xs text-foreground font-medium">
                        {fmtDate(d.defect_completed_at)}
                      </p>
                    </TableCell>
                  )}

                  {/* Remark */}
                  <TableCell className="align-middle py-3.5">
                    {d.remark ? (
                      <p
                        className="text-xs text-muted-foreground italic truncate max-w-[160px]"
                        title={d.remark}
                      >
                        "{d.remark}"
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Photos Column & Action */}
                  <TableCell className="align-middle py-3.5 text-right">
                    {allImages.length > 0 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {allImages.slice(0, 2).map((img, i) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() =>
                              setActiveLightbox({ images: allImages, index: i })
                            }
                            className="relative group h-8 w-8 rounded-lg overflow-hidden border bg-muted shrink-0 transition-all hover:border-primary/50 hover:scale-105"
                            title={`Click to view ${img.label}`}
                          >
                            <img
                              src={img.signed_url}
                              alt={img.doc_og_name}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn size={12} className="text-background" />
                            </div>
                          </button>
                        ))}

                        {allImages.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActiveLightbox({ images: allImages, index: 0 })
                            }
                            className="h-8 px-2 text-[11px] font-semibold rounded-lg gap-1"
                          >
                            +{allImages.length - 2}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Standard Project Table Footer */}
      {data.total > 0 && (
        <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto pt-4 px-1 sm:flex-row sm:gap-8">
          <div className="flex-1 whitespace-nowrap text-xs text-muted-foreground">
            0 of {data.total} row(s) selected.
          </div>

          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-xs font-medium">
                Rows per page
              </p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem] text-xs">
                  <SelectValue placeholder={`${pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center text-xs font-medium">
              Page {data.page} of {data.total_pages}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                aria-label="Go to first page"
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => handlePageChange(1)}
                disabled={data.page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                aria-label="Go to previous page"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={data.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                aria-label="Go to next page"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  handlePageChange(Math.min(data.total_pages, page + 1))
                }
                disabled={data.page >= data.total_pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                aria-label="Go to last page"
                variant="outline"
                size="icon"
                className="hidden h-8 w-8 lg:flex"
                onClick={() => handlePageChange(data.total_pages)}
                disabled={data.page >= data.total_pages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Modal Overlay (Lightbox) ── */}
      {activeLightbox && (
        <Lightbox
          images={activeLightbox.images}
          startIndex={activeLightbox.index}
          onClose={() => setActiveLightbox(null)}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DefectDashboardPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const [summary, setSummary] = useState<DefectSummaryData | null>(null);
  const [summaryLoading, setSumLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    if (!vendorId) return;
    setSumLoading(true);
    getDefectSummary(Number(vendorId))
      .then(setSummary)
      .catch(console.error)
      .finally(() => setSumLoading(false));
  }, [vendorId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track & Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Defect Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            className="h-8 gap-1.5 text-xs rounded-lg"
          >
            <RefreshCw
              size={13}
              className={cn(summaryLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-6">
        {/* ── Page Title Header ── */}
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Defect Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Track cut-list defects, rework, replacements, and resolution photos.
          </p>
        </div>

        {/* ── Summary stat cards ── */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard
                label="Total Defects"
                value={summary.summary.total}
                Icon={AlertTriangle}
              />
              <StatCard
                label="Pending"
                value={summary.summary.pending}
                Icon={Clock}
                iconColor="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="Resolved"
                value={summary.summary.completed}
                Icon={CheckCircle2}
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Rework"
                value={summary.summary.rework}
                Icon={Wrench}
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label="Replace"
                value={summary.summary.replace}
                Icon={PackageX}
                iconColor="text-red-600 dark:text-red-400"
              />
              <StatCard
                label="Resolution Rate"
                value={`${summary.summary.completion_rate}%`}
                Icon={TrendingUp}
                iconColor="text-primary"
              />
              <StatCard
                label="Avg Resolution"
                value={
                  summary.summary.avg_resolution_hours !== null
                    ? `${summary.summary.avg_resolution_hours}h`
                    : "—"
                }
                Icon={Timer}
              />
            </div>

            {/* ── Bar charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BarList
                title="By Defect Type"
                subtitle="Defect counts broken down by issue category."
                Icon={AlertTriangle}
                items={summary.by_defect_type.slice(0, 8).map((d) => ({
                  label: d.defect_name,
                  count: d.count,
                }))}
              />
              <BarList
                title="By Machine"
                subtitle="Defects reported across factory machines."
                Icon={Cpu}
                items={summary.by_machine.slice(0, 8).map((m) => ({
                  label: m.machine_name,
                  count: m.count,
                }))}
              />
              <BarList
                title="Top Projects"
                subtitle="Projects with highest reported defect items."
                Icon={FolderKanban}
                items={summary.by_project.slice(0, 8).map((p) => ({
                  label: p.project_name,
                  count: p.count,
                }))}
              />
            </div>
          </>
        ) : null}

        {/* ── Tabs ── */}
        {vendorId && (
          <Tabs defaultValue="pending" className="w-full space-y-4">
            <TabsList className="w-full max-w-xs h-10 p-1 bg-muted rounded-xl">
              <TabsTrigger value="pending" className="flex-1 gap-1.5 rounded-lg text-xs font-semibold">
                <Clock size={13} />
                Pending
                {summary && (
                  <Badge variant="outline" className="ml-1 text-[10px] font-bold px-1.5 py-0">
                    {summary.summary.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 gap-1.5 rounded-lg text-xs font-semibold">
                <CheckCircle2 size={13} />
                Resolved
                {summary && (
                  <Badge variant="outline" className="ml-1 text-[10px] font-bold px-1.5 py-0">
                    {summary.summary.completed}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <DefectsTable vendorId={Number(vendorId)} type="pending" />
            </TabsContent>

            <TabsContent value="resolved">
              <DefectsTable vendorId={Number(vendorId)} type="resolved" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}