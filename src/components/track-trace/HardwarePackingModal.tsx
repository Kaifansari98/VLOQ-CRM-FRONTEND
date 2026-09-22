"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Clock3,
  Layers,
  Loader2,
  Minus,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  ManualPackingItem,
  PackagingBox,
} from "@/api/track-trace/packaging-scanner.api";
import {
  useAddManualPackingItem,
  useManualPackingItems,
} from "@/hooks/track-trace/usePackagingScanner";

interface HardwarePackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId?: number;
  projectId?: number;
  selectedBox?: PackagingBox;
  userId?: number;
  packingType?: "DEFAULT" | "GROUPWISE" | "CUSTOM_GROUP";
  projectName?: string;
  onItemPacked?: () => void;
}

type StatusFilter = "all" | "pending" | "packed";

export function HardwarePackingModal({
  isOpen,
  onClose,
  vendorId,
  projectId,
  selectedBox,
  userId,
  packingType,
  projectName,
  onItemPacked,
}: HardwarePackingModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [packQuantities, setPackQuantities] = useState<Record<number, number>>({});
  const [packingItemId, setPackingItemId] = useState<number | null>(null);

  const {
    data: manualData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useManualPackingItems(vendorId, projectId, Boolean(isOpen && vendorId && projectId));

  const addManualItemMutation = useAddManualPackingItem(vendorId, projectId);

  const items = manualData?.items ?? [];
  const summary = manualData?.summary;
  const selectedBoxGroup =
    packingType === "GROUPWISE"
      ? selectedBox?.packing_group_name?.trim() || null
      : null;

  const normalizeGroup = (value?: string | null) => value?.trim().toLowerCase() || null;

  const isItemAllowedForSelectedBox = (item: ManualPackingItem) => {
    if (packingType !== "GROUPWISE") return true;
    if (!item.group_name?.trim()) return false;
    if (!selectedBoxGroup) return true;
    return normalizeGroup(item.group_name) === normalizeGroup(selectedBoxGroup);
  };

  const handleQtyChange = (itemId: number, nextVal: number, maxVal: number) => {
    const validQty = Math.max(1, Math.min(nextVal, maxVal));
    setPackQuantities((prev) => ({
      ...prev,
      [itemId]: validQty,
    }));
  };

  const getItemInputQty = (item: ManualPackingItem) => {
    return packQuantities[item.id] ?? Math.min(item.pending_qty, 1);
  };

  const handlePackItem = async (item: ManualPackingItem) => {
    if (!selectedBox) {
      toastManager.add({
        title: "Box required",
        description: "Please select or create a destination box before packing hardware items.",
        type: "error",
      });
      return;
    }

    if (selectedBox.box_status === "packed") {
      toastManager.add({
        title: "Box is packed",
        description: "Packed boxes cannot receive new items. Unpack the box first.",
        type: "error",
      });
      return;
    }

    if (!userId) {
      toastManager.add({
        title: "User not authenticated",
        description: "Valid user session is required to perform packing.",
        type: "error",
      });
      return;
    }

    if (!projectId || !vendorId) {
      toastManager.add({
        title: "Project missing",
        description: "Valid project and vendor context is required.",
        type: "error",
      });
      return;
    }

    if (packingType === "GROUPWISE" && !isItemAllowedForSelectedBox(item)) {
      toastManager.add({
        title: "Different group",
        description: `This box is for "${selectedBoxGroup}" items only. Select a box for "${item.group_name || "this group"}".`,
        type: "error",
      });
      return;
    }

    const qtyToPack = getItemInputQty(item);
    if (!qtyToPack || qtyToPack <= 0 || qtyToPack > item.pending_qty) {
      toastManager.add({
        title: "Invalid quantity",
        description: `Please enter a quantity between 1 and ${item.pending_qty}.`,
        type: "error",
      });
      return;
    }

    setPackingItemId(item.id);
    try {
      await addManualItemMutation.mutateAsync({
        project_id: projectId,
        vendor_id: vendorId,
        box_id: selectedBox.id,
        cut_list_id: item.id,
        qty: qtyToPack,
        user_id: userId,
      });

      toastManager.add({
        title: "Hardware packed",
        description: `Successfully packed ${qtyToPack}x "${item.item_name}" into ${selectedBox.box_name}.`,
        type: "success",
      });

      // Reset local quantity input
      setPackQuantities((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      onItemPacked?.();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to pack item";

      toastManager.add({
        title: "Packing failed",
        description: errorMsg,
        type: "error",
      });
    } finally {
      setPackingItemId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by status
      if (statusFilter === "pending" && item.pending_qty <= 0) {
        return false;
      }
      if (statusFilter === "packed" && item.pending_qty > 0) {
        return false;
      }

      // Filter by search query
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        item.item_name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.material_details?.toLowerCase().includes(query) ||
        item.category_name?.toLowerCase().includes(query) ||
        item.group_name?.toLowerCase().includes(query) ||
        item.unique_code?.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery, statusFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden border shadow-2xl bg-card">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Wrench className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Hardware & Manual Packing
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Pack hardware and non-scanned accessories directly into destination boxes.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs h-9"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Context Strip: Target Box & Packing Mode */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 font-medium shadow-2xs">
              <Box className="size-3.5 text-primary" />
              <span>Target Box:</span>
              {selectedBox ? (
                <span className="font-bold text-foreground">{selectedBox.box_name}</span>
              ) : (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  No box selected
                </span>
              )}
              {selectedBox && (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold uppercase",
                    selectedBox.box_status === "packed"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                  )}
                >
                  {selectedBox.box_status}
                </span>
              )}
            </div>

            {packingType && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-muted-foreground shadow-2xs">
                <Layers className="size-3.5 text-primary/70" />
                <span>Packing Mode:</span>
                <span className="font-semibold text-foreground">{packingType}</span>
              </div>
            )}

            {packingType === "GROUPWISE" && selectedBoxGroup && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1 text-primary shadow-2xs">
                <Layers className="size-3.5" />
                <span>Box group:</span>
                <span className="font-bold">{selectedBoxGroup}</span>
              </div>
            )}

            {projectName && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-muted-foreground shadow-2xs">
                <span>Project:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">
                  {projectName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning if no box selected or box is packed */}
        {(!selectedBox || selectedBox.box_status === "packed") && (
          <div className="px-4 sm:px-6 pt-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="size-4.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold">
                  {!selectedBox
                    ? "Destination box required"
                    : "Selected box is already packed"}
                </p>
                <p className="mt-0.5 opacity-90">
                  {!selectedBox
                    ? "Please select or create an active box from the workstation panel to pack hardware items."
                    : "This box is marked as packed. To add more hardware, unpack the box first."}
                </p>
              </div>
            </div>
          </div>
        )}

        {packingType === "GROUPWISE" && selectedBox && selectedBoxGroup && (
          <div className="px-4 sm:px-6 pt-3">
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary">
              <Layers className="size-4.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Groupwise box locked to {selectedBoxGroup}</p>
                <p className="mt-0.5 text-muted-foreground">
                  Only hardware from this group can be added. Items from other groups are disabled.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metric Counters */}
        {summary && (
          <div className="px-4 sm:px-6 pt-3 pb-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl border bg-card p-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-muted-foreground">Total Items</p>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {summary.total_items}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-muted-foreground">Total Quantity</p>
                <p className="text-base sm:text-lg font-bold text-foreground">
                  {summary.total_qty}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Packed Quantity
                </p>
                <p className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {summary.packed_qty}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-2.5 shadow-2xs">
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Pending Quantity
                </p>
                <p className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-400">
                  {summary.pending_qty}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row gap-2 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hardware by name, description, group..."
              className="h-10 pl-9 rounded-xl text-xs bg-muted/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-xl border bg-muted/20 p-1">
            <Button
              type="button"
              variant={statusFilter === "pending" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-lg text-xs font-semibold px-3"
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({items.filter((i) => i.pending_qty > 0).length})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-lg text-xs font-semibold px-3"
              onClick={() => setStatusFilter("all")}
            >
              All ({items.length})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "packed" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-lg text-xs font-semibold px-3"
              onClick={() => setStatusFilter("packed")}
            >
              Packed ({items.filter((i) => i.pending_qty <= 0).length})
            </Button>
          </div>
        </div>

        {/* Items List Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {isLoading && (
            <div className="space-y-3 py-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="size-10 text-destructive mb-2" />
              <p className="font-semibold text-foreground text-sm">Failed to load hardware items</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Unable to reach the server. Please check your connection and retry.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Package className="size-10 mb-2 opacity-50" />
              <p className="font-semibold text-foreground text-sm">No hardware items found</p>
              <p className="text-xs mt-1 max-w-md">
                No items marked for manual packing (include_in_packing = true and scan_pack = false) were found for this project.
              </p>
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Search className="size-8 mb-2 opacity-40" />
              <p className="font-semibold text-foreground text-sm">No matching items</p>
              <p className="text-xs mt-1">Try adjusting your search or status filter.</p>
            </div>
          )}

          {!isLoading && !isError && filteredItems.map((item) => {
            const isFullyPacked = item.pending_qty <= 0;
            const currentInputQty = getItemInputQty(item);
            const isItemLoading = packingItemId === item.id;
            const isWrongGroup =
              packingType === "GROUPWISE" && !isItemAllowedForSelectedBox(item);
            const canPack =
              Boolean(selectedBox) &&
              selectedBox?.box_status !== "packed" &&
              !isFullyPacked &&
              !isWrongGroup &&
              !isItemLoading;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200",
                  isFullyPacked
                    ? "bg-muted/15 opacity-75 border-border/50"
                    : isWrongGroup
                      ? "bg-muted/10 border-border/60 opacity-65"
                    : "bg-card hover:border-primary/40 shadow-2xs",
                )}
              >
                {/* Item Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {item.item_name}
                    </span>
                    {item.category_name && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {item.category_name}
                      </Badge>
                    )}
                    {item.group_name && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] py-0 px-1.5",
                          isWrongGroup && "border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        Group: {item.group_name}
                      </Badge>
                    )}
                    {isWrongGroup && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        Not this box group
                      </span>
                    )}
                    {isFullyPacked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Packed
                      </span>
                    ) : item.packed_qty > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        <Clock3 className="size-3" />
                        Partially Packed
                      </span>
                    ) : null}
                  </div>

                  {(item.description || item.material_details) && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.description || item.material_details}
                    </p>
                  )}

                  {isWrongGroup && (
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      {item.group_name
                        ? `Select a box for “${item.group_name}” to pack this item.`
                        : "This item has no packing group configured and cannot be packed groupwise."}
                    </p>
                  )}

                  {/* Quantity Breakdown */}
                  <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground">
                    <span>
                      Total: <strong className="text-foreground">{item.total_qty}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Packed:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {item.packed_qty}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Pending:{" "}
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">
                        {item.pending_qty}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Pack Action Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
                  {!isFullyPacked ? (
                    <>
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-lg border bg-muted/20 p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md"
                          onClick={() =>
                            handleQtyChange(item.id, currentInputQty - 1, item.pending_qty)
                          }
                          disabled={currentInputQty <= 1 || isItemLoading}
                        >
                          <Minus className="size-3" />
                        </Button>

                        <Input
                          type="number"
                          min={1}
                          max={item.pending_qty}
                          value={currentInputQty}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              parseInt(e.target.value) || 1,
                              item.pending_qty,
                            )
                          }
                          disabled={isItemLoading}
                          className="h-7 w-12 text-center font-bold text-xs p-0 border-0 bg-transparent shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md"
                          onClick={() =>
                            handleQtyChange(item.id, currentInputQty + 1, item.pending_qty)
                          }
                          disabled={currentInputQty >= item.pending_qty || isItemLoading}
                        >
                          <Plus className="size-3" />
                        </Button>

                        {item.pending_qty > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-bold text-primary hover:text-primary"
                            onClick={() =>
                              handleQtyChange(item.id, item.pending_qty, item.pending_qty)
                            }
                            disabled={isItemLoading}
                          >
                            Max
                          </Button>
                        )}
                      </div>

                      {/* Add to Box Button */}
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canPack}
                        onClick={() => handlePackItem(item)}
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-2xs"
                      >
                        {isItemLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <PackageCheck className="size-3.5" />
                        )}
                        <span>Pack to Box</span>
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground italic pr-2">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedBox ? (
              <>
                Active target: <strong>{selectedBox.box_name}</strong>
              </>
            ) : (
              "No active box selected"
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs h-9 px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
