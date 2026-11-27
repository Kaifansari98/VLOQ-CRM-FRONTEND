"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  TruckIcon,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useMetalCutlist } from "@/api/production/production-api";
import {
  getBoxItems,
  getProjectDetail,
  ProjectDetailData,
} from "@/api/track-trace/track-trace-cutlist.api";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ComingSoon from "@/components/generics/ComingSoon";
import { cn } from "@/lib/utils";

type ProjectBox = ProjectDetailData["boxes"][0];

const PAGE_SIZE = 12;

const BOX_FILTERS = [
  { value: "all", label: "All Boxes" },
  { value: "with_items", label: "With Items" },
  { value: "empty", label: "Empty" },
  { value: "packed", label: "Packed" },
  { value: "unpacked", label: "Unpacked" },
  { value: "factory_out", label: "Factory Out" },
  { value: "site_in", label: "Site In" },
];

const formatWeight = (value: unknown) => {
  const weight = Number(value || 0);
  return Number.isFinite(weight) && weight > 0
    ? `${weight.toFixed(2)} kg`
    : "0.00 kg";
};

const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

const getBoxDisplayNumber = (box: ProjectBox) => {
  const sequenceNumber = Number(box.sequence_no);
  if (Number.isInteger(sequenceNumber) && sequenceNumber > 0) {
    return String(sequenceNumber);
  }
  return String(box.box_name || "").match(/\d+/)?.[0] || String(box.box_name || box.id);
};

interface TrackTracePackingDetailsSectionProps {
  leadId: number;
  instanceId?: number | null;
}

/** View-only list of the boxes in the lead instance's Track & Trace project. */
export default function TrackTracePackingDetailsSection({
  leadId,
  instanceId,
}: TrackTracePackingDetailsSectionProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data: leadCutlist, isLoading: projectLoading } = useMetalCutlist(
    vendorId,
    leadId,
    instanceId,
  );
  const projectId = leadCutlist?.project?.unique_project_id;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [boxStatus, setBoxStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedBox, setSelectedBox] = useState<ProjectBox | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, boxStatus]);

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: [
      "track-trace-packing-boxes",
      vendorId,
      projectId,
      page,
      debouncedSearch,
      boxStatus,
    ],
    queryFn: () =>
      getProjectDetail(Number(vendorId), String(projectId), {
        search: debouncedSearch || undefined,
        box_status: boxStatus !== "all" ? boxStatus : undefined,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: !!vendorId && !!projectId,
    placeholderData: keepPreviousData,
  });

  if (projectLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (!projectId) {
    return (
      <ComingSoon
        heading="No Track & Trace Project Yet"
        description="Upload a Woodwork or Metalwork cutlist in Pre-Production Files to create the Track & Trace project."
      />
    );
  }

  const boxes = data?.boxes ?? [];
  const pagination = data?.boxes_pagination;
  const stats = data?.stats;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const currentPage = pagination?.page ?? page;

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Boxes", value: stats.total_boxes },
            { label: "Boxes With Items", value: stats.boxes_with_items },
            { label: "Packed Boxes", value: stats.packed_boxes },
            { label: "Packed Weight", value: formatWeight(stats.total_weight) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card px-3.5 py-2.5">
              <p className="text-xs font-semibold text-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search box no, status, weight..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={boxStatus} onValueChange={setBoxStatus}>
          <SelectTrigger className="h-9 w-full text-sm sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOX_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFetching && !isPending && (
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        )}
      </div>

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load boxes. Please refresh.
        </div>
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : boxes.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No boxes found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {boxes.map((box) => {
            const itemCount = Number(box.items_count || 0);
            const isPacked = String(box.box_status || "").toLowerCase() === "packed";
            const groupName = String(box.group_name || box.product_group_name || "").trim();

            return (
              <button
                key={box.id}
                type="button"
                onClick={() => setSelectedBox(box)}
                className="group flex w-full flex-col gap-3 rounded-xl border bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted/80">
                      <Box size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        Box {getBoxDisplayNumber(box)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[groupName && `Group: ${groupName}`, box.location_name && `Location: ${box.location_name}`]
                          .filter(Boolean)
                          .join(" · ") || "No extra box info"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px] font-semibold",
                      isPacked
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {box.box_status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-foreground">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatWeight(box.total_weight)}
                  </span>
                  <span
                    className={cn(
                      "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      box.factory_out_at
                        ? "border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <TruckIcon size={11} /> Factory
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      box.site_in_at
                        ? "border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <MapPin size={11} /> Site
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {pagination.from}–{pagination.to} of {pagination.total} boxes
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {selectedBox && (
        <BoxItemsViewDialog
          vendorId={Number(vendorId)}
          projectId={projectId}
          box={selectedBox}
          onClose={() => setSelectedBox(null)}
        />
      )}
    </div>
  );
}

function BoxItemsViewDialog({
  vendorId,
  projectId,
  box,
  onClose,
}: {
  vendorId: number;
  projectId: string;
  box: ProjectBox;
  onClose: () => void;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["track-trace-packing-box-items", vendorId, projectId, box.id],
    queryFn: () => getBoxItems(vendorId, projectId, box.id),
  });

  const items = data?.items ?? [];
  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const totalWeight = items.reduce(
    (sum, item) => sum + Number(item.weight || 0),
    0,
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b bg-muted/30 px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Box size={16} /> Box {getBoxDisplayNumber(box)}
            <Badge variant="outline" className="text-xs font-semibold">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Qty {totalQty} · {formatWeight(totalWeight)}
            {data?.box.packedByUser &&
              ` · Packed by ${data.box.packedByUser.user_name} on ${fmtDateTime(data.box.packed_at)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto">
          {isPending ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-5 text-sm text-destructive">Failed to load box items.</p>
          ) : items.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No items in this box.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase">#</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Item</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Code</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Group</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Category</TableHead>
                  <TableHead className="text-xs font-bold uppercase">L × W × T</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase">Qty</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase">Weight</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Packed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="text-xs font-semibold">{item.cut_list?.item_name || "—"}</TableCell>
                    <TableCell className="text-xs">{item.cut_list?.unique_code || "—"}</TableCell>
                    <TableCell className="text-xs">{item.cut_list?.group_name || "—"}</TableCell>
                    <TableCell className="text-xs">{item.cut_list?.category_name || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">
                      {[item.cut_list?.length, item.cut_list?.width, item.cut_list?.thickness]
                        .map((value) => value || "—")
                        .join(" × ")}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{Number(item.qty || 1)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatWeight(item.weight)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      <span className="block">{fmtDateTime(item.actual_in_at)}</span>
                      {item.inOperator && (
                        <span className="text-muted-foreground">{item.inOperator.name}</span>
                      )}
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
