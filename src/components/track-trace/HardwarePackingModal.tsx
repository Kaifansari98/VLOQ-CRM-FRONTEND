"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTrackTraceBoxStatus } from "@/api/track-trace/track-trace-cutlist.api";
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
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Wrench,
  X,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useCreatePackagingBox,
  usePackagingBoxes,
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
  projectDetailsId?: number | null;
  leadId?: number | null;
  onBoxPackedAndClosed?: (boxId: number) => void;
  isMultiLocation?: boolean;
  locations?: Array<{ location_name: string }>;
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
  projectDetailsId,
  leadId,
  onBoxPackedAndClosed,
  isMultiLocation = false,
  locations = [],
}: HardwarePackingModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [packQuantities, setPackQuantities] = useState<Record<number, number>>({});
  const [packingItemId, setPackingItemId] = useState<number | null>(null);
  const [activeCustomBox, setActiveCustomBox] = useState<PackagingBox | null>(null);
  const [isPackingMultiple, setIsPackingMultiple] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    if (isOpen) setSelectedLocation("");
  }, [isOpen]);

  const queryClient = useQueryClient();
  const updateBoxStatusMutation = useMutation({
    mutationFn: ({
      boxId,
      status,
      userId,
      locationName,
    }: {
      boxId: number;
      status: "packed" | "unpacked";
      userId: number;
      locationName?: string;
    }) =>
      updateTrackTraceBoxStatus(
        boxId,
        status,
        userId,
        "Auto-packed from hardware modal",
        locationName,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packaging-boxes"] });
    }
  });

  const {
    data: manualData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useManualPackingItems(vendorId, projectId, Boolean(isOpen && vendorId && projectId));

  const { data: boxesData } = usePackagingBoxes(
    vendorId,
    projectId,
    Boolean(isOpen && vendorId && projectId && packingType === "CUSTOM_GROUP")
  );

  const availableCustomBoxes = useMemo(() => {
    if (!boxesData) return [];
    return boxesData.filter((b) => b.box_status !== "packed");
  }, [boxesData]);

  const addManualItemMutation = useAddManualPackingItem(vendorId, projectId);
  const createBoxMutation = useCreatePackagingBox(vendorId, projectId);

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
    const validQty = Math.max(0, Math.min(nextVal, maxVal));
    setPackQuantities((prev) => ({
      ...prev,
      [itemId]: validQty,
    }));
  };

  const getItemInputQty = (item: ManualPackingItem) => {
    return packQuantities[item.id] ?? 0;
  };


  const handlePackMultiple = async () => {
    const itemsToPack = items.filter((item) => getItemInputQty(item) > 0);
    
    if (itemsToPack.length === 0) {
      toastManager.add({
        title: "No items selected",
        description: "Please increase the quantity for at least one item to pack.",
        type: "warning",
      });
      return;
    }

    if (isMultiLocation && !selectedLocation) {
      toastManager.add({
        title: "Location required",
        description: "Select a packing location before packing hardware.",
        type: "warning",
      });
      return;
    }

    if (packingType !== "CUSTOM_GROUP" && !selectedBox) {
      toastManager.add({
        title: "Box required",
        description: "Please select or create a destination box before packing.",
        type: "error",
      });
      return;
    }

    if (packingType !== "CUSTOM_GROUP" && selectedBox?.box_status === "packed") {
      toastManager.add({
        title: "Box is packed",
        description: "Packed boxes cannot receive new items. Unpack the box first.",
        type: "error",
      });
      return;
    }

    if (!userId || !projectId || !vendorId || !projectDetailsId) {
      toastManager.add({
        title: "Context missing",
        description: "Valid project, vendor, and detail context is required.",
        type: "error",
      });
      return;
    }

    const wrongGroupItems = itemsToPack.filter(item => packingType === "GROUPWISE" && !isItemAllowedForSelectedBox(item));
    if (wrongGroupItems.length > 0) {
      toastManager.add({
        title: "Different group",
        description: "Some selected items do not belong to this box's group.",
        type: "error",
      });
      return;
    }

    setIsPackingMultiple(true);
    try {
      let targetBoxId = selectedBox?.id;
      let usedBoxName = selectedBox?.box_name;
      let wasAutoCreated = false;

      if (packingType === "CUSTOM_GROUP") {
        if (!activeCustomBox) {
          const nextBoxNumber = (boxesData?.length || 0) + 1;
          const autoBoxName = `${nextBoxNumber}`;
          const createdBox = await createBoxMutation.mutateAsync({
            project_id: projectId,
            project_details_id: projectDetailsId,
            vendor_id: vendorId,
            lead_id: leadId || null,
            box_name: autoBoxName,
            box_status: "unpacked",
            created_by: userId,
            box_info_values: [],
          });
          setActiveCustomBox(createdBox);
          targetBoxId = createdBox.id;
          usedBoxName = createdBox.box_name;
          wasAutoCreated = true;
        } else {
          targetBoxId = activeCustomBox.id;
          usedBoxName = activeCustomBox.box_name;
        }
      }

      if (!targetBoxId) {
        throw new Error("Target box ID is missing.");
      }

      let successCount = 0;
      for (const item of itemsToPack) {
        const qtyToPack = getItemInputQty(item);
        if (qtyToPack > 0 && qtyToPack <= item.pending_qty) {
          setPackingItemId(item.id);
          await addManualItemMutation.mutateAsync({
            project_id: projectId,
            vendor_id: vendorId,
            box_id: targetBoxId,
            cut_list_id: item.id,
            qty: qtyToPack,
            user_id: userId,
          });
          successCount++;
        }
      }

      if (successCount > 0) {
        if (packingType === "CUSTOM_GROUP" && wasAutoCreated) {
          await updateBoxStatusMutation.mutateAsync({
            boxId: targetBoxId,
            status: "packed",
            userId,
            locationName: selectedLocation || undefined,
          });
          setActiveCustomBox(null);
          onBoxPackedAndClosed?.(targetBoxId);
        }

        toastManager.add({
          title: "Hardware packed",
          description: `Successfully packed ${successCount} item(s) into "${usedBoxName}"${wasAutoCreated ? " and marked it as packed" : ""}.`,
          type: "success",
        });
        setPackQuantities({});
        onItemPacked?.();
      }

    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to pack items";

      toastManager.add({
        title: "Packing failed",
        description: errorMsg,
        type: "error",
      });
    } finally {
      setIsPackingMultiple(false);
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
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b bg-muted/20">
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
            {packingType === "CUSTOM_GROUP" ? (
              <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 font-medium shadow-2xs">
                <Box className="size-3.5 text-primary shrink-0" />
                <span>Target Box:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Will Auto-Create New Box
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 font-medium shadow-2xs">
                <Box className="size-3.5 text-primary shrink-0" />
                <span>Target Box:</span>
                {selectedBox ? (
                  <span className="font-bold text-foreground truncate max-w-[150px] sm:max-w-[200px]">{selectedBox.box_name}</span>
                ) : (
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    No box selected
                  </span>
                )}
                {selectedBox && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold uppercase shrink-0",
                      selectedBox.box_status === "packed"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {selectedBox.box_status}
                  </span>
                )}
              </div>
            )}

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
            {isMultiLocation && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 text-emerald-700 shadow-2xs dark:bg-emerald-500/10 dark:text-emerald-400">
                <MapPin className="size-3.5 shrink-0" />
                <span className="font-medium text-emerald-800 dark:text-emerald-300">Loc:</span>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                  disabled={isPackingMultiple}
                >
                  <SelectTrigger className="h-6 w-[140px] border-none bg-transparent px-1.5 py-0 text-xs font-bold text-emerald-900 shadow-none focus:ring-0 dark:text-emerald-100 data-[placeholder]:text-emerald-600/70">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-emerald-500/20 shadow-xl">
                    {locations.map((location) => (
                      <SelectItem 
                        key={location.location_name} 
                        value={location.location_name}
                        className="text-xs font-medium cursor-pointer rounded-lg focus:bg-emerald-500/10 focus:text-emerald-900 dark:focus:bg-emerald-500/20 dark:focus:text-emerald-100"
                      >
                        {location.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>




        {/* Warning if no box selected or box is packed */}
        {packingType !== "CUSTOM_GROUP" && (!selectedBox || selectedBox.box_status === "packed") && (
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
          <div className="px-4 sm:px-6 py-1.5">
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
        <div className="px-4 sm:px-6 py-1.5 flex flex-col sm:flex-row gap-2 border-b">
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
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1.5">
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

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 px-3 rounded-xl border transition-all duration-200",
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
                          disabled={currentInputQty <= 0 || isItemLoading || isPackingMultiple}
                        >
                          <Minus className="size-3" />
                        </Button>

                        <Input
                          type="number"
                          min={0}
                          max={item.pending_qty}
                          value={currentInputQty}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              parseInt(e.target.value) || 0,
                              item.pending_qty,
                            )
                          }
                          disabled={isItemLoading || isPackingMultiple}
                          className={cn(
                            "h-7 w-12 text-center font-bold text-xs p-0 border-0 bg-transparent shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors",
                            currentInputQty > 0 ? "text-primary bg-primary/10" : "text-foreground"
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-md"
                          onClick={() =>
                            handleQtyChange(item.id, currentInputQty + 1, item.pending_qty)
                          }
                          disabled={currentInputQty >= item.pending_qty || isItemLoading || isPackingMultiple}
                        >
                          <Plus className="size-3" />
                        </Button>

                        {item.pending_qty > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-bold text-primary hover:text-primary"
                            onClick={() =>
                              handleQtyChange(item.id, item.pending_qty, item.pending_qty)
                            }
                            disabled={isItemLoading || isPackingMultiple}
                          >
                            Max
                          </Button>
                        )}
                      </div>
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
        <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {packingType === "CUSTOM_GROUP" ? (
              <>
                Active target: <strong>{activeCustomBox ? activeCustomBox.box_name : "Will auto-create new box"}</strong>
              </>
            ) : selectedBox ? (
              <>
                Active target: <strong>{selectedBox.box_name}</strong>
              </>
            ) : (
              "No active box selected"
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs h-9 px-4"
              disabled={isPackingMultiple}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePackMultiple}
              disabled={
                isPackingMultiple ||
                items.filter(i => getItemInputQty(i) > 0).length === 0 ||
                (isMultiLocation && !selectedLocation)
              }
              className="rounded-xl text-xs h-9 px-6 font-bold shadow-2xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPackingMultiple ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Packing...
                </>
              ) : (
                <>
                  <PackageCheck className="size-3.5" />
                  {isMultiLocation && !selectedLocation
                    ? "Select Location First"
                    : `Pack Selected (${items.filter(i => getItemInputQty(i) > 0).length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
