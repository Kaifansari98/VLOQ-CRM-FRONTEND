"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPendingDefects, getResolvedDefects, DefectImage } from "@/api/track-trace/defect-dashboard.api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown, X, ZoomIn } from "lucide-react";

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

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
      
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="h-[90vh] sm:max-w-[95vw] bg-black/95 flex flex-col items-center justify-center border-none">
        <DialogTitle className="sr-only">Defect photos</DialogTitle>
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
      </DialogContent>
    </Dialog>
  );
}

export default function DefectsTable({
  vendorId,
  type,
  leadId,
}: {
  vendorId: number;
  leadId?: number;
  type: "pending" | "resolved";
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isPending: loading, isError, refetch } = useQuery({
    queryKey: ["defects", vendorId, leadId, type, page, pageSize],
    queryFn: () => (type === "pending" ? getPendingDefects : getResolvedDefects)(
      vendorId, page, { lead_id: leadId, page_size: pageSize },
    ),
  });

  // Lightbox state for table row images modal
  const [activeLightbox, setActiveLightbox] = useState<{
    images: (DefectImage & { label?: string })[];
    index: number;
  } | null>(null);

  const handlePageChange = (p: number) => setPage(p);

  if (isError) return (
    <div role="alert" className="rounded-xl border p-6 text-center space-y-3">
      <p className="text-sm text-destructive">Unable to load defects.</p>
      <Button variant="outline" onClick={() => refetch()}>Try again</Button>
    </div>
  );

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
          No matching defects to display.
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
            {from}–{to} of {data.total} defects.
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

