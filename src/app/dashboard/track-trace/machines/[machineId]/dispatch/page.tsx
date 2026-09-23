"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  Box,
  CheckCircle2,
  Clock,
  Cpu,
  Keyboard,
  Layers,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Scan,
  ScanLine,
  Sparkles,
  Trash2,
  Truck,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { toastManager } from "@/components/ui/toast";
import { useActiveMachines } from "@/hooks/track-trace/useActiveMachines";
import {
  usePackagingBoxes,
  usePackagingProjectContext,
} from "@/hooks/track-trace/usePackagingScanner";
import { markBoxFactoryOutApi } from "@/api/track-trace/track-trace-cutlist.api";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";

interface DispatchFeedItem {
  id: string;
  boxId?: number;
  boxName?: string;
  locationName?: string | null;
  barcodeValue: string;
  boxDetails?: string;
  status: "success" | "failed";
  message: string;
  scannedAt: string;
}

const AUTO_SUBMIT_DELAY_MS = 140;

function parseScannedCode(rawText: string): {
  parsedVendorId?: number;
  parsedProjectId?: number;
  parsedBoxId?: number;
  rawText: string;
} {
  const trimmed = rawText.trim();

  // 1. Try JSON: {"vendor_id":1,"project_id":93,"box_id":22} or {"box":22}
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const obj = JSON.parse(trimmed);
      return {
        parsedVendorId: Number(obj.vendor_id || obj.vendor) || undefined,
        parsedProjectId: Number(obj.project_id || obj.project) || undefined,
        parsedBoxId: Number(obj.box_id || obj.box || obj.id) || undefined,
        rawText: trimmed,
      };
    } catch {
      // not JSON
    }
  }

  // 2. Key-value string format: vendor:1,project:93,box:22
  const kvRegex = /(?:^|[,;\s|])([a-zA-Z_]+)\s*[:=]\s*([^,;\s|]+)/g;
  let match: RegExpExecArray | null;
  const kv: Record<string, string> = {};
  while ((match = kvRegex.exec(trimmed)) !== null) {
    kv[match[1].toLowerCase()] = match[2];
  }

  if (Object.keys(kv).length > 0) {
    return {
      parsedVendorId: kv.vendor || kv.vendor_id ? Number(kv.vendor || kv.vendor_id) : undefined,
      parsedProjectId: kv.project || kv.project_id ? Number(kv.project || kv.project_id) : undefined,
      parsedBoxId: kv.box || kv.box_id || kv.id ? Number(kv.box || kv.box_id || kv.id) : undefined,
      rawText: trimmed,
    };
  }

  // 3. Pure numeric ID: "22"
  if (/^\d+$/.test(trimmed)) {
    return {
      parsedBoxId: Number(trimmed),
      rawText: trimmed,
    };
  }

  // 4. "Box 22" or "box-22"
  const boxMatch = trimmed.match(/^box[\s-_]*(\d+)$/i);
  if (boxMatch) {
    return {
      parsedBoxId: Number(boxMatch[1]),
      rawText: trimmed,
    };
  }

  return { rawText: trimmed };
}

export default function DispatchScannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { machineId: machineIdParam } = useParams<{ machineId: string }>();
  const machineId = Number(machineIdParam);
  const requestedProjectId = Number(searchParams.get("projectId"));
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: machines = [], isLoading: isLoadingMachines } =
    useActiveMachines(vendorId);
  const machine = machines.find((item) => item.id === machineId);

  const hasValidProjectId =
    Number.isInteger(requestedProjectId) && requestedProjectId > 0;
  const projectId = hasValidProjectId ? requestedProjectId : undefined;

  const {
    data: packagingContext,
    isLoading: isLoadingPackagingContext,
    isError: isPackagingContextError,
  } = usePackagingProjectContext(vendorId, projectId, Boolean(hasValidProjectId));

  const {
    data: packagingBoxes = [],
    isLoading: isLoadingBoxes,
    refetch: refetchBoxes,
  } = usePackagingBoxes(vendorId, projectId, Boolean(hasValidProjectId));

  // Local state
  const [scanValue, setScanValue] = useState("");
  const [feedItems, setFeedItems] = useState<DispatchFeedItem[]>([]);
  const [isManualScanOpen, setIsManualScanOpen] = useState(false);
  const [manualScanValue, setManualScanValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const manualScanInputRef = useRef<HTMLInputElement>(null);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Online / offline listeners
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Autofocus keep-alive for barcode guns
  useEffect(() => {
    if (isManualScanOpen) return;

    const focusScannerInput = () => {
      const input = inputRef.current;
      if (
        document.visibilityState === "visible" &&
        input &&
        !input.disabled &&
        document.activeElement !== input &&
        !isManualScanOpen
      ) {
        input.focus({ preventScroll: true });
      }
    };

    focusScannerInput();
    const focusInterval = window.setInterval(focusScannerInput, 750);
    window.addEventListener("focus", focusScannerInput);
    document.addEventListener("visibilitychange", focusScannerInput);

    return () => {
      window.clearInterval(focusInterval);
      window.removeEventListener("focus", focusScannerInput);
      document.removeEventListener("visibilitychange", focusScannerInput);
    };
  }, [isManualScanOpen]);

  const clearAutoSubmitTimer = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearAutoSubmitTimer, [clearAutoSubmitTimer]);

  // Main Scan Processing Function
  const processScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || isProcessing) return;

      clearAutoSubmitTimer();
      setScanValue("");

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const parsed = parseScannedCode(trimmed);

      // Validation 1: Project Safeguard
      if (
        parsed.parsedProjectId &&
        projectId &&
        parsed.parsedProjectId !== projectId
      ) {
        setFeedItems((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            barcodeValue: trimmed,
            status: "failed",
            message: `Belongs to Project #${parsed.parsedProjectId}, not current project`,
            scannedAt: timeStr,
          },
          ...prev,
        ]);
        toastManager.add({
          title: `Scanned box belongs to Project #${parsed.parsedProjectId}`,
          type: "error",
        });
        return;
      }

      // Validation 2: Find box in project boxes
      let targetBox = packagingBoxes.find((b) => {
        if (parsed.parsedBoxId && b.id === parsed.parsedBoxId) return true;
        if (parsed.parsedBoxId && b.sequence_no === parsed.parsedBoxId) return true;
        if (
          b.box_name.toLowerCase() === trimmed.toLowerCase() ||
          `box ${b.box_name}`.toLowerCase() === trimmed.toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      if (!targetBox) {
        setFeedItems((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            barcodeValue: trimmed,
            status: "failed",
            message: "Box not found in this project",
            scannedAt: timeStr,
          },
          ...prev,
        ]);
        toastManager.add({
          title: "Box not found in this project",
          type: "error",
        });
        return;
      }

      const boxDetailsStr = [
        targetBox.items_count != null
          ? `${targetBox.items_count} item${targetBox.items_count === 1 ? "" : "s"}`
          : null,
        targetBox.weight != null && targetBox.weight > 0
          ? `${targetBox.weight.toFixed(1)} kg`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || "—";

      const boxLocation =
        (targetBox as any).location_name ||
        (targetBox as any).box_info_values?.find(
          (v: any) =>
            /location|floor|site/i.test(v.field_key) ||
            /location|floor|site/i.test(v.field_label),
        )?.field_value ||
        (packagingContext?.locations?.length === 1
          ? packagingContext.locations[0].location_name
          : null) ||
        null;

      // Validation 3: Check packed status
      if (targetBox.box_status !== "packed") {
        setFeedItems((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            boxId: targetBox!.id,
            boxName: targetBox!.box_name,
            locationName: boxLocation,
            barcodeValue: trimmed,
            boxDetails: boxDetailsStr,
            status: "failed",
            message: `Box is not packed yet (status: ${targetBox!.box_status})`,
            scannedAt: timeStr,
          },
          ...prev,
        ]);
        toastManager.add({
          title: `Box "${targetBox.box_name}" must be packed first`,
          type: "warning",
        });
        return;
      }

      // Validation 4: Check if already factory out
      const boxAlreadyDispatched = Boolean((targetBox as any).factory_out_at);
      if (boxAlreadyDispatched) {
        setFeedItems((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            boxId: targetBox!.id,
            boxName: targetBox!.box_name,
            locationName: boxLocation,
            barcodeValue: trimmed,
            boxDetails: boxDetailsStr,
            status: "failed",
            message: "Already Scanned",
            scannedAt: timeStr,
          },
          ...prev,
        ]);
        toastManager.add({
          title: `Box "${targetBox.box_name}" already marked as Factory Out`,
          type: "warning",
        });
        return;
      }

      // Execute Factory Out API
      if (!vendorId || !userId || !projectId) {
        toastManager.add({
          title: "Session or project information missing",
          type: "error",
        });
        return;
      }

      try {
        setIsProcessing(true);
        await markBoxFactoryOutApi({
          boxId: targetBox.id,
          projectId,
          vendorId,
          userId,
        });

        // Mark as factory out in local box cache
        (targetBox as any).factory_out_at = new Date().toISOString();

        setFeedItems((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            boxId: targetBox!.id,
            boxName: targetBox!.box_name,
            locationName: boxLocation,
            barcodeValue: trimmed,
            boxDetails: boxDetailsStr,
            status: "success",
            message: "Box marked as Factory Out",
            scannedAt: timeStr,
          },
          ...prev,
        ]);

        toastManager.add({
          title: `Box "${targetBox.box_name}" dispatched successfully!`,
          type: "success",
        });

        void refetchBoxes();
      } catch (error: any) {
        const errMsg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to dispatch box";

        setFeedItems((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            boxId: targetBox!.id,
            boxName: targetBox!.box_name,
            locationName: boxLocation,
            barcodeValue: trimmed,
            boxDetails: boxDetailsStr,
            status: "failed",
            message: errMsg,
            scannedAt: timeStr,
          },
          ...prev,
        ]);

        toastManager.add({
          title: errMsg,
          type: "error",
        });
      } finally {
        setIsProcessing(false);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [clearAutoSubmitTimer, isProcessing, packagingBoxes, projectId, refetchBoxes, userId, vendorId],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (scanValue.trim()) {
      processScan(scanValue);
    }
  };

  const handleScanChange = (val: string) => {
    setScanValue(val);
    clearAutoSubmitTimer();

    if (val.trim()) {
      autoSubmitTimerRef.current = setTimeout(
        () => processScan(val),
        AUTO_SUBMIT_DELAY_MS,
      );
    }
  };

  const handleManualScanSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const val = manualScanValue.trim();
    if (!val) {
      manualScanInputRef.current?.focus();
      return;
    }
    setIsManualScanOpen(false);
    setManualScanValue("");
    processScan(val);
  };

  const clearCompleted = () => {
    setFeedItems([]);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const hasCompletedItems = feedItems.length > 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track &amp; Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/dashboard/track-trace/machines">
                  Machines
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2 font-bold text-foreground text-sm sm:text-base">
                  <span>
                    {packagingContext?.project_name || "Dispatch workstation"}
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Dispatch Boxes
                  </span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">
        <div className="w-full space-y-4 sm:space-y-5">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link
              href={
                machineId
                  ? `/dashboard/track-trace/machines/${machineId}/projects`
                  : "/dashboard/track-trace/machines"
              }
            >
              <ArrowLeft className="size-4" />
              Back to projects
            </Link>
          </Button>

          {/* ── 1. Top HUD Card: Scan QR code (Matching user screenshot) ── */}
          <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
            <div>
              {/* Header */}
              <div className="mb-4 sm:mb-5 flex items-start justify-between gap-3 border-b pb-3.5 sm:pb-4">
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ScanLine className="size-4.5 sm:size-5" />
                    <span className="absolute -top-1 -right-1 flex size-3">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                      Scan QR code
                    </h2>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      Keep the cursor in the box below and scan continuously
                    </p>
                  </div>
                </div>

                {/* Status Badge: Online */}
                <div className="flex items-center justify-end">
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold shadow-2xs",
                      isOnline
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-destructive/25 bg-destructive/10 text-destructive dark:text-red-400",
                    )}
                  >
                    {isOnline ? (
                      <Wifi className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <WifiOff className="size-3.5 text-destructive" />
                    )}
                    <span>{isOnline ? "Online" : "Offline"}</span>
                  </span>
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="relative flex-1 min-w-0">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Barcode className="size-5" />
                    </div>
                    <input
                      ref={inputRef}
                      value={scanValue}
                      onChange={(event) => handleScanChange(event.target.value)}
                      placeholder="Scan QR code or type barcode..."
                      className="flex h-12 sm:h-13 w-full min-w-0 rounded-xl border border-input bg-muted/20 py-2 pl-11 pr-10 font-mono text-sm sm:text-base font-semibold tracking-wide shadow-2xs outline-none transition-all placeholder:text-muted-foreground/60 placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm placeholder:font-normal focus-visible:border-primary focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-input/20"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      aria-label="Scanned QR code value"
                      disabled={isProcessing}
                    />
                    {scanValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setScanValue("");
                          clearAutoSubmitTimer();
                          inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button
                      type="submit"
                      className="h-12 sm:h-13 flex-1 sm:flex-initial gap-2 px-5 sm:px-6 font-semibold shadow-xs"
                      disabled={!scanValue.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ScanLine className="size-4" />
                      )}
                      <span>Submit</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 sm:h-13 gap-2 px-3.5 sm:px-4 font-medium shadow-2xs hover:bg-accent shrink-0"
                      onClick={() => {
                        clearAutoSubmitTimer();
                        setIsManualScanOpen(true);
                        window.setTimeout(
                          () => manualScanInputRef.current?.focus(),
                          0,
                        );
                      }}
                      disabled={isProcessing}
                    >
                      <Keyboard className="size-4 text-muted-foreground" />
                      <span>Manual Scan</span>
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                  Only packed boxes will be marked as Factory Out
                </p>
              </form>
            </div>
          </section>

          {/* ── 2. Bottom Card: Scanned Items Feed (Matching user screenshot) ── */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PackageCheck className="size-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight text-foreground">
                      Scanned Boxes Feed
                    </h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {feedItems.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Live stream of scanned barcodes processed at this workstation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasCompletedItems && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearCompleted}
                  >
                    <Trash2 className="size-3.5" />
                    <span>Clear Completed</span>
                  </Button>
                )}
              </div>
            </div>

            {feedItems.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center px-4 py-8 sm:px-6 text-center">
                <div className="mb-2.5 flex size-12 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/15">
                  <Scan className="size-6 text-primary/70" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Workstation Scanner Standing By
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Scan box barcodes or QR codes to populate this workstation's live dispatch stream.
                </p>
                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    <Sparkles className="size-3 text-primary" />
                    Continuous scanning supported
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto overscroll-x-contain">
                <Table className="min-w-[720px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 pl-4 sm:pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        #
                      </TableHead>
                      <TableHead className="min-w-44 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Scanned Box
                      </TableHead>
                      <TableHead className="min-w-36 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Location
                      </TableHead>
                      <TableHead className="min-w-32 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Box Details
                      </TableHead>
                      <TableHead className="w-28 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="min-w-56 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Message
                      </TableHead>
                      <TableHead className="w-24 pr-4 text-right sm:pr-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Time
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedItems.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "transition-colors",
                          item.status === "success" && "bg-emerald-500/[0.03]",
                          item.status === "failed" && "bg-red-500/5",
                        )}
                      >
                        <TableCell className="pl-4 font-mono text-xs font-medium tabular-nums text-muted-foreground sm:pl-6">
                          {feedItems.length - index}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-foreground text-sm">
                            {item.boxName ? `Box ${item.boxName}` : "—"}
                          </p>
                          {packagingContext?.project_name && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {packagingContext.project_name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {item.locationName ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                              {item.locationName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {item.boxDetails ? (
                            <span className="text-xs font-medium text-foreground">
                              {item.boxDetails}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.status === "success" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400">
                              <XCircle className="size-3" />
                              Failed
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {item.message}
                        </TableCell>
                        <TableCell className="pr-4 text-right sm:pr-6 font-mono text-xs text-muted-foreground tabular-nums">
                          {item.scannedAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── 3. Manual Scan Dialog ── */}
      <Dialog
        open={isManualScanOpen}
        onOpenChange={(open) => {
          setIsManualScanOpen(open);
          if (!open) {
            setManualScanValue("");
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl p-4 sm:p-6 shadow-xl border">
          <form onSubmit={handleManualScanSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Keyboard className="size-5" />
                </div>
                Enter Code Manually
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Type the box QR code or barcode value exactly as printed. It will process through the same instant validation queue.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="manual-scan-code" className="text-xs font-semibold">
                Barcode / QR Value *
              </Label>
              <Input
                ref={manualScanInputRef}
                id="manual-scan-code"
                value={manualScanValue}
                onChange={(event) => setManualScanValue(event.target.value)}
                placeholder="e.g. vendor:1,project:93,box:22 or 22"
                className="h-12 font-mono text-base font-semibold rounded-xl bg-muted/20"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Press Enter or select Submit to push into the dispatch queue.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualScanOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!manualScanValue.trim()}>
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
