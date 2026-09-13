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
  Boxes,
  CheckCircle2,
  Clock3,
  Cpu,
  ListChecks,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  Printer,
  RefreshCw,
  ScanLine,
  Trash2,
  Wifi,
  WifiOff,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useCreatePackagingBox,
  usePackagingBoxes,
  usePackagingProjectContext,
} from "@/hooks/track-trace/usePackagingScanner";
import {
  MachineScanQueueItem,
  useMachineScanQueue,
} from "@/hooks/track-trace/useMachineScanQueue";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  getPackagingBoxPrint,
  PackagingBox,
  PackagingBoxInfoField,
  PackagingBoxStatus,
  updatePackagingBoxStatus,
} from "@/api/track-trace/packaging-scanner.api";

const AUTO_SUBMIT_DELAY_MS = 300;
const BOX_WEIGHT_WARNING_KG = 25;
const WITHOUT_LOCATION_VALUE = "__without_location__";
const AUTO_PRINT_API_ATTEMPTS = 3;
const AUTO_PRINT_RETRY_DELAY_MS = 750;
const AUTO_PRINT_DIALOG_RETRY_MS = 1_500;
const AUTO_PRINT_CLEANUP_MS = 20_000;

type BoxAction = "pack" | "unpack" | "pack-print" | "print";

const getBoxActionError = (error: unknown) => {
  const responseData = (
    error as {
      response?: { data?: { message?: string; error?: string } };
    }
  )?.response?.data;

  return (
    responseData?.message ||
    responseData?.error ||
    (error instanceof Error ? error.message : "Box action failed")
  );
};

const QueueStatus = ({ item }: { item: MachineScanQueueItem }) => {
  if (item.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
        <Loader2 className="size-3.5 animate-spin" />
        Scanning
      </span>
    );
  }

  if (item.status === "success") {
    return (
      <span className="inline-flex animate-in items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 fade-in zoom-in-75 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        Success
      </span>
    );
  }

  if (item.status === "failure") {
    return (
      <span className="inline-flex animate-in items-center gap-1.5 whitespace-nowrap rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 fade-in zoom-in-75 dark:text-red-400">
        <XCircle className="size-3.5" />
        Failed
      </span>
    );
  }

  if (item.status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <WifiOff className="size-3.5 animate-pulse" />
        Waiting
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <Clock3 className="size-3.5" />
      Queued
    </span>
  );
};

export default function MachineScannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { machineId: machineIdParam } = useParams<{ machineId: string }>();
  const machineId = Number(machineIdParam);
  const requestedProjectId = Number(searchParams.get("projectId"));
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: machines = [], isLoading, isError } =
    useActiveMachines(vendorId);
  const machine = machines.find((item) => item.id === machineId);
  const isPackagingMachine = machine?.machine_type_id === 18;
  const hasValidProjectId =
    Number.isInteger(requestedProjectId) && requestedProjectId > 0;
  const packagingProjectId =
    isPackagingMachine && hasValidProjectId ? requestedProjectId : undefined;
  const {
    data: packagingContext,
    isLoading: isLoadingPackagingContext,
    isError: isPackagingContextError,
    refetch: refetchPackagingContext,
  } = usePackagingProjectContext(
    vendorId,
    packagingProjectId,
    Boolean(isPackagingMachine),
  );
  const isCustomGroupPacking =
    packagingContext?.packing_type === "CUSTOM_GROUP";
  const isGroupwisePacking = packagingContext?.packing_type === "GROUPWISE";
  const supportsLocationSelection = Boolean(
    isCustomGroupPacking || isGroupwisePacking,
  );
  const requiresDestinationBox = Boolean(
    isPackagingMachine && packagingContext && !isCustomGroupPacking,
  );
  const showPackagingSetup = Boolean(
    isPackagingMachine && !isCustomGroupPacking,
  );
  const packagingLocations = packagingContext?.locations ?? [];
  const showLocationSelection = Boolean(
    supportsLocationSelection && packagingLocations.length > 0,
  );
  const {
    data: packagingBoxes = [],
    isLoading: isLoadingBoxes,
    isError: isBoxesError,
    isFetching: isFetchingBoxes,
    refetch: refetchBoxes,
  } = usePackagingBoxes(
    vendorId,
    packagingProjectId,
    requiresDestinationBox,
  );
  const createBoxMutation = useCreatePackagingBox(
    vendorId,
    packagingProjectId,
  );

  const [scanValue, setScanValue] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<number>();
  const [isBoxSelectorOpen, setIsBoxSelectorOpen] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<
    string | null | undefined
  >();
  const [isCreateBoxOpen, setIsCreateBoxOpen] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [boxInfoValues, setBoxInfoValues] = useState<Record<number, string>>(
    {},
  );
  const [boxFormError, setBoxFormError] = useState("");
  const [boxAction, setBoxAction] = useState<BoxAction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedAutoPrintRef = useRef(false);
  const autoPrintedBoxIdsRef = useRef<Set<number>>(new Set());
  const autoPrintingBoxIdsRef = useRef<Set<number>>(new Set());
  const autoPrintChainRef = useRef<Promise<void>>(Promise.resolve());
  const selectedBox = useMemo(
    () => packagingBoxes.find((box) => box.id === selectedBoxId),
    [packagingBoxes, selectedBoxId],
  );
  const hasLocationDecision = Boolean(
    !supportsLocationSelection ||
      packagingLocations.length === 0 ||
      selectedLocationName !== undefined,
  );
  const scannerReady = Boolean(
    machine &&
      (!isPackagingMachine ||
        (packagingContext &&
          hasLocationDecision &&
          (isCustomGroupPacking || selectedBox?.box_status === "unpacked"))),
  );
  const {
    items: queuedItems,
    addScan,
    clearCompleted,
    isHydrated: isQueueHydrated,
    isOnline,
    isQueuePaused,
    pendingCount,
  } = useMachineScanQueue({
    vendorId,
    machineId,
    userId,
    enabled: scannerReady,
    projectId: packagingProjectId,
    boxId: requiresDestinationBox ? selectedBox?.id : undefined,
    boxName: requiresDestinationBox ? selectedBox?.box_name : undefined,
    locationName:
      supportsLocationSelection && selectedLocationName
        ? selectedLocationName
        : undefined,
  });

  useEffect(() => {
    setSelectedLocationName(undefined);
    initializedAutoPrintRef.current = false;
    autoPrintedBoxIdsRef.current.clear();
    autoPrintingBoxIdsRef.current.clear();
    autoPrintChainRef.current = Promise.resolve();
  }, [packagingProjectId]);

  useEffect(() => {
    if (machine && isPackagingMachine && !hasValidProjectId) {
      router.replace(`/dashboard/track-trace/machines/${machine.id}/projects`);
    }
  }, [hasValidProjectId, isPackagingMachine, machine, router]);

  useEffect(() => {
    if (
      !isLoadingBoxes &&
      !isFetchingBoxes &&
      selectedBoxId &&
      !packagingBoxes.some((box) => box.id === selectedBoxId)
    ) {
      setSelectedBoxId(undefined);
    }
  }, [isFetchingBoxes, isLoadingBoxes, packagingBoxes, selectedBoxId]);

  const clearAutoSubmitTimer = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
  }, []);

  const processScan = useCallback(
    (value: string) => {
      const scannedItem = value.trim();

      if (!scannedItem) {
        return;
      }

      if (!addScan(scannedItem)) {
        return;
      }

      clearAutoSubmitTimer();
      setScanValue("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [addScan, clearAutoSubmitTimer],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    processScan(scanValue);
  };

  const handleScanChange = (value: string) => {
    setScanValue(value);
    clearAutoSubmitTimer();

    if (value.trim()) {
      autoSubmitTimerRef.current = setTimeout(
        () => processScan(value),
        AUTO_SUBMIT_DELAY_MS,
      );
    }
  };

  const openCreateBoxDialog = () => {
    const openDialog = () => {
      setNewBoxName("");
      setBoxInfoValues({});
      setBoxFormError("");
      setIsCreateBoxOpen(true);
    };

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined).finally(openDialog);
      return;
    }

    openDialog();
  };

  const updateBoxInfoValue = (fieldId: number, value: string) => {
    setBoxInfoValues((current) => ({
      ...current,
      [fieldId]: value,
    }));
    setBoxFormError("");
  };

  const getBoxFieldInput = (field: PackagingBoxInfoField) => {
    const value = boxInfoValues[field.id] ?? "";

    if (field.field_type === "TEXTAREA") {
      return (
        <textarea
          id={`box-field-${field.id}`}
          value={value}
          onChange={(event) =>
            updateBoxInfoValue(field.id, event.target.value)
          }
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
        />
      );
    }

    return (
      <Input
        id={`box-field-${field.id}`}
        type={
          field.field_type === "NUMBER"
            ? "number"
            : field.field_type === "DATE"
              ? "date"
              : "text"
        }
        value={value}
        onChange={(event) => updateBoxInfoValue(field.id, event.target.value)}
      />
    );
  };

  const handleCreateBox = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBoxFormError("");

    const trimmedName = newBoxName.trim();

    if (!trimmedName) {
      setBoxFormError("Box name is required");
      return;
    }

    const missingField = packagingContext?.box_info_fields.find(
      (field) => field.is_required && !boxInfoValues[field.id]?.trim(),
    );

    if (missingField) {
      setBoxFormError(`${missingField.field_label} is required`);
      return;
    }

    if (
      !vendorId ||
      !userId ||
      !packagingProjectId ||
      !packagingContext?.project_details_id
    ) {
      setBoxFormError("Project details are unavailable. Refresh and try again.");
      return;
    }

    try {
      const createdBox = await createBoxMutation.mutateAsync({
        project_id: packagingProjectId,
        project_details_id: packagingContext.project_details_id,
        vendor_id: vendorId,
        lead_id: packagingContext.lead_id,
        box_name: trimmedName,
        box_status: "unpacked",
        created_by: userId,
        box_info_values: packagingContext.box_info_fields.map((field) => ({
          field_id: field.id,
          field_value: boxInfoValues[field.id]?.trim() || null,
        })),
      });

      setSelectedBoxId(createdBox.id);
      setIsCreateBoxOpen(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error: unknown) {
      const message = (
        error as {
          response?: { data?: { message?: string; error?: string } };
        }
      )?.response?.data;

      setBoxFormError(
        message?.message || message?.error || "Failed to create box",
      );
    }
  };

  const openBoxPrintWindow = () => {
    const printWindow = window.open("", "_blank", "width=420,height=700");

    if (!printWindow) {
      throw new Error("Please allow popups to print the box label");
    }

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head><title>Preparing box label...</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          Preparing box label for print...
        </body>
      </html>
    `);
    printWindow.document.close();

    return printWindow;
  };

  const renderBoxPrint = async (
    box: PackagingBox,
    printWindow: Window,
  ) => {
    if (!vendorId || !packagingProjectId) {
      throw new Error("Project information is unavailable");
    }

    const response = await getPackagingBoxPrint(
      box.id,
      packagingProjectId,
      vendorId,
    );
    const printHtml = response.data?.print_html;

    if (!response.success || !printHtml) {
      throw new Error(response.message || "Failed to generate box label");
    }

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const renderAutomaticBoxPrint = useCallback(
    async (boxId: number) => {
      if (!vendorId || !packagingProjectId) {
        throw new Error("Project information is unavailable");
      }

      const response = await getPackagingBoxPrint(
        boxId,
        packagingProjectId,
        vendorId,
      );
      const printHtml = response.data?.print_html;

      if (!response.success || !printHtml) {
        throw new Error(response.message || "Failed to generate box label");
      }

      // The backend HTML contains its own delayed window.print(). Automatic
      // printing is more reliable when this page controls the iframe load and
      // invokes print only after fonts and images have finished loading.
      const controlledPrintHtml = printHtml.replace(
        "window.print();",
        "window.__automaticPrintIsControlled = true;",
      );
      const printFrame = document.createElement("iframe");
      printFrame.title = `Print label for box ${boxId}`;
      printFrame.setAttribute("aria-hidden", "true");
      printFrame.style.position = "fixed";
      printFrame.style.width = "420px";
      printFrame.style.height = "700px";
      printFrame.style.left = "-10000px";
      printFrame.style.top = "0";
      printFrame.style.border = "0";

      await new Promise<void>((resolve, reject) => {
        let isFinished = false;
        let retryTimer: number | undefined;
        let cleanupTimer: number | undefined;
        let loadTimer: number | undefined;

        const finishPrinting = (error?: unknown) => {
          if (isFinished) return;
          isFinished = true;
          if (retryTimer) window.clearTimeout(retryTimer);
          if (cleanupTimer) window.clearTimeout(cleanupTimer);
          if (loadTimer) window.clearTimeout(loadTimer);
          printFrame.remove();
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        };

        printFrame.addEventListener(
          "load",
          () => {
            if (loadTimer) {
              window.clearTimeout(loadTimer);
              loadTimer = undefined;
            }

            const frameWindow = printFrame.contentWindow;

            if (!frameWindow) {
              finishPrinting(
                new Error("Unable to open the box label for printing"),
              );
              return;
            }

            frameWindow.addEventListener(
              "afterprint",
              () => finishPrinting(),
              { once: true },
            );

            const waitForImages = Promise.all(
              Array.from(frameWindow.document.images).map(
                (image) =>
                  image.complete
                    ? Promise.resolve()
                    : new Promise<void>((imageReady) => {
                        image.addEventListener("load", () => imageReady(), {
                          once: true,
                        });
                        image.addEventListener("error", () => imageReady(), {
                          once: true,
                        });
                      }),
              ),
            );

            void Promise.all([
              frameWindow.document.fonts?.ready ?? Promise.resolve(),
              waitForImages,
            ])
              .then(() => {
                if (isFinished) return;

                const requestPrint = () => {
                  if (isFinished || printFrame.contentWindow !== frameWindow) {
                    return;
                  }

                  frameWindow.focus();
                  frameWindow.print();
                };

                // Retry once when a browser silently ignores the first iframe
                // print request. If a dialog opens, JavaScript pauses and the
                // afterprint handler clears this timer when it closes.
                retryTimer = window.setTimeout(
                  requestPrint,
                  AUTO_PRINT_DIALOG_RETRY_MS,
                );
                cleanupTimer = window.setTimeout(
                  () => finishPrinting(),
                  AUTO_PRINT_CLEANUP_MS,
                );
                window.setTimeout(requestPrint, 150);
              })
              .catch(finishPrinting);
          },
          { once: true },
        );

        loadTimer = window.setTimeout(
          () =>
            finishPrinting(new Error("Box label took too long to load")),
          10_000,
        );
        printFrame.srcdoc = controlledPrintHtml;
        document.body.appendChild(printFrame);
      });
    },
    [packagingProjectId, vendorId],
  );

  const handleToggleBoxStatus = async () => {
    if (!selectedBox || !userId || boxAction) return;

    const nextStatus: PackagingBoxStatus =
      selectedBox.box_status === "packed" ? "unpacked" : "packed";

    try {
      setBoxAction(nextStatus === "packed" ? "pack" : "unpack");
      await updatePackagingBoxStatus(selectedBox.id, nextStatus, userId);
      await refetchBoxes();
      toastManager.add({
        title: `Box marked as ${nextStatus}`,
        type: "success",
      });
    } catch (error: unknown) {
      toastManager.add({
        title: getBoxActionError(error),
        type: "error",
      });
    } finally {
      setBoxAction(null);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handlePrintBox = async () => {
    if (!selectedBox || boxAction) return;

    let printWindow: Window | null = null;

    try {
      printWindow = openBoxPrintWindow();
      setBoxAction("print");
      await renderBoxPrint(selectedBox, printWindow);
      toastManager.add({
        title: "Box label opened for printing",
        type: "success",
      });
    } catch (error: unknown) {
      if (printWindow && !printWindow.closed) printWindow.close();
      toastManager.add({
        title: getBoxActionError(error),
        type: "error",
      });
    } finally {
      setBoxAction(null);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handlePackAndPrint = async () => {
    if (
      !selectedBox ||
      selectedBox.box_status === "packed" ||
      !userId ||
      boxAction
    ) {
      return;
    }

    let printWindow: Window | null = null;
    let packed = false;

    try {
      printWindow = openBoxPrintWindow();
      setBoxAction("pack-print");
      await updatePackagingBoxStatus(selectedBox.id, "packed", userId);
      packed = true;
      await refetchBoxes();
      await renderBoxPrint(selectedBox, printWindow);
      toastManager.add({
        title: "Box packed and label opened for printing",
        type: "success",
      });
    } catch (error: unknown) {
      if (printWindow && !printWindow.closed) printWindow.close();
      toastManager.add({
        title: packed
          ? `Box packed, but printing failed: ${getBoxActionError(error)}`
          : getBoxActionError(error),
        type: "error",
      });
    } finally {
      setBoxAction(null);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  useEffect(() => {
    if (!isCustomGroupPacking || !isQueueHydrated) {
      return;
    }

    const completedBoxes = queuedItems.flatMap((item) => {
      const boxId = item.result?.box_id;

      return item.status === "success" &&
        item.result?.box_completed &&
        typeof boxId === "number"
        ? [
            {
              boxId,
              boxNumber:
                String(item.result.box_name || boxId)
                  .replace(/^box\s*/i, "")
                  .trim() || String(boxId),
            },
          ]
        : [];
    });

    // Restored queue history must not reopen print dialogs after a reload.
    if (!initializedAutoPrintRef.current) {
      completedBoxes.forEach(({ boxId }) =>
        autoPrintedBoxIdsRef.current.add(boxId),
      );
      initializedAutoPrintRef.current = true;
      return;
    }

    completedBoxes.forEach(({ boxId, boxNumber }) => {
      if (
        autoPrintedBoxIdsRef.current.has(boxId) ||
        autoPrintingBoxIdsRef.current.has(boxId)
      ) {
        return;
      }

      autoPrintingBoxIdsRef.current.add(boxId);
      autoPrintChainRef.current = autoPrintChainRef.current.then(async () => {
        let lastError: unknown;

        try {
          for (
            let attempt = 1;
            attempt <= AUTO_PRINT_API_ATTEMPTS;
            attempt += 1
          ) {
            try {
              await renderAutomaticBoxPrint(boxId);
              autoPrintedBoxIdsRef.current.add(boxId);
              toastManager.add({
                title: `Box ${boxNumber} completed. Label sent to print.`,
                type: "success",
              });
              return;
            } catch (error: unknown) {
              lastError = error;

              if (attempt < AUTO_PRINT_API_ATTEMPTS) {
                await new Promise<void>((resolve) => {
                  window.setTimeout(resolve, AUTO_PRINT_RETRY_DELAY_MS);
                });
              }
            }
          }

          toastManager.add({
            title: `Box completed, but label printing failed: ${getBoxActionError(lastError)}`,
            type: "error",
          });
        } finally {
          autoPrintingBoxIdsRef.current.delete(boxId);
        }
      });
    });
  }, [
    isCustomGroupPacking,
    isQueueHydrated,
    queuedItems,
    renderAutomaticBoxPrint,
  ]);

  useEffect(() => {
    if (
      !scannerReady ||
      !isQueueHydrated ||
      isBoxSelectorOpen ||
      isLocationSelectorOpen ||
      isCreateBoxOpen
    ) {
      return;
    }

    const focusScannerInput = () => {
      const input = inputRef.current;

      if (
        document.visibilityState === "visible" &&
        input &&
        !input.disabled &&
        document.activeElement !== input
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
  }, [
    isBoxSelectorOpen,
    isCreateBoxOpen,
    isLocationSelectorOpen,
    isQueueHydrated,
    scannerReady,
  ]);

  useEffect(() => clearAutoSubmitTimer, [clearAutoSubmitTimer]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await fullscreenContainerRef.current?.requestFullscreen();
    } catch {
      // Fullscreen can be denied by browser or device policy.
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenContainerRef.current);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const hasValidVendor = Number.isInteger(vendorId) && Number(vendorId) > 0;
  const hasValidMachineId = Number.isInteger(machineId) && machineId > 0;
  const hasCompletedItems = queuedItems.some(
    (item) => item.status === "success" || item.status === "failure",
  );
  const hasProcessingItem = queuedItems.some(
    (item) => item.status === "processing",
  );
  const displayedItems = [...queuedItems].reverse();

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
                <BreadcrumbPage>Scanner</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <div
          ref={fullscreenContainerRef}
          className="mx-auto w-full max-w-5xl space-y-5 bg-background fullscreen:h-screen fullscreen:max-w-none fullscreen:overflow-y-auto fullscreen:p-4 sm:fullscreen:p-6"
        >
          {machine && !isPackagingMachine && (
            <div className="flex items-center justify-between gap-3">
              <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
                <Link href="/dashboard/track-trace/machines">
                  <ArrowLeft className="size-4" />
                  Back to machines
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                </span>
              </Button>
            </div>
          )}

          {isLoading && hasValidVendor && hasValidMachineId && (
            <Skeleton className="h-40 w-full rounded-xl" />
          )}

          {(!hasValidVendor || !hasValidMachineId || isError) && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
              <AlertCircle className="mb-3 size-9 text-destructive" />
              <h1 className="font-semibold">Unable to open machine scanner</h1>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                The vendor or machine information is invalid. Return to the machines
                page and try again.
              </p>
            </div>
          )}

          {hasValidVendor &&
            hasValidMachineId &&
            !isLoading &&
            !isError &&
            !machine && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
                <Cpu className="mb-3 size-10 text-muted-foreground" />
                <h1 className="font-semibold">Machine not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This machine is unavailable or is no longer active.
                </p>
              </div>
            )}

          {machine && (
            <>
              {isPackagingMachine &&
                isCustomGroupPacking &&
                packagingContext && (
                  <div className="space-y-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {packagingContext.project_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Custom Packing Group · Boxes are assigned automatically
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/dashboard/track-trace/machines/${machine.id}/projects`}
                          >
                            Change project
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={toggleFullscreen}
                        >
                          {isFullscreen ? (
                            <Minimize2 className="size-4" />
                          ) : (
                            <Maximize2 className="size-4" />
                          )}
                          <span className="hidden sm:inline">
                            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {packagingLocations.length > 0 ? (
                      <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-2 sm:w-56">
                          <MapPin className="size-4 shrink-0 text-primary" />
                          <div>
                            <Label htmlFor="packing-location">Location</Label>
                            <p className="text-[11px] text-muted-foreground">
                              Select once before scanning.
                            </p>
                          </div>
                        </div>
                        <Select
                          value={
                            selectedLocationName === undefined
                              ? undefined
                              : selectedLocationName === null
                                ? WITHOUT_LOCATION_VALUE
                                : `location:${selectedLocationName}`
                          }
                          onValueChange={(value) => {
                            clearAutoSubmitTimer();
                            setScanValue("");
                            setSelectedLocationName(
                              value === WITHOUT_LOCATION_VALUE
                                ? null
                                : value.slice("location:".length),
                            );
                            window.setTimeout(
                              () => inputRef.current?.focus(),
                              0,
                            );
                          }}
                          onOpenChange={(open) => {
                            setIsLocationSelectorOpen(open);

                            if (open && document.fullscreenElement) {
                              void document
                                .exitFullscreen()
                                .catch(() => undefined);
                            }
                          }}
                        >
                          <SelectTrigger
                            id="packing-location"
                            className="h-10 w-full sm:max-w-md"
                          >
                            <SelectValue placeholder="Select location or continue without one" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={WITHOUT_LOCATION_VALUE}>
                              Continue without location
                            </SelectItem>
                            {packagingLocations.map((location) => (
                              <SelectItem
                                key={location.location_name}
                                value={`location:${location.location_name}`}
                              >
                                {location.location_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                        <MapPin className="size-4" />
                        No project locations configured. Scanning will continue
                        without a location.
                      </div>
                    )}
                  </div>
                )}

              <div
                className={cn(
                  "space-y-5",
                  showPackagingSetup &&
                    "lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0",
                )}
              >
                {showPackagingSetup && (
                  <section className="overflow-hidden rounded-xl border bg-card shadow-sm lg:order-3 lg:self-start">
                    <div className="flex flex-col gap-2 border-b px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-violet-500/10 p-1.5 text-violet-600 dark:text-violet-400">
                          <Boxes className="size-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold">
                            {packagingContext?.packing_type === "GROUPWISE"
                              ? "Groupwise packaging setup"
                              : "Packaging setup"}
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/dashboard/track-trace/machines/${machine.id}/projects`}
                          >
                            Change project
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={toggleFullscreen}
                        >
                          {isFullscreen ? (
                            <Minimize2 className="size-4" />
                          ) : (
                            <Maximize2 className="size-4" />
                          )}
                          <span className="hidden sm:inline">
                            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {(isLoadingPackagingContext || isLoadingBoxes) && (
                      <div className="p-3 sm:p-4">
                        <Skeleton className="h-14 rounded-lg" />
                      </div>
                    )}

                    {(isPackagingContextError || isBoxesError) && (
                      <div className="m-3 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 sm:m-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                          <div>
                            <p className="text-sm font-semibold">
                              Packaging information could not be loaded
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              The project may be unavailable, or the connection was
                              interrupted.
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            void refetchPackagingContext();
                            void refetchBoxes();
                          }}
                        >
                          <RefreshCw className="size-4" />
                          Try again
                        </Button>
                      </div>
                    )}

                    {packagingContext && !isBoxesError && (
                      <div className="p-3 sm:p-4">
                        <div className="grid gap-3">
                          {isGroupwisePacking && showLocationSelection && (
                            <div className="rounded-lg border bg-background p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <MapPin className="size-4 shrink-0 text-primary" />
                                <div>
                                  <Label htmlFor="groupwise-packing-location">
                                    Location
                                  </Label>
                                  <p className="text-[11px] text-muted-foreground">
                                    Select a location or continue without one.
                                  </p>
                                </div>
                              </div>

                              <Select
                                value={
                                  selectedLocationName === undefined
                                    ? undefined
                                    : selectedLocationName === null
                                      ? WITHOUT_LOCATION_VALUE
                                      : `location:${selectedLocationName}`
                                }
                                onValueChange={(value) => {
                                  clearAutoSubmitTimer();
                                  setScanValue("");
                                  setSelectedLocationName(
                                    value === WITHOUT_LOCATION_VALUE
                                      ? null
                                      : value.slice("location:".length),
                                  );
                                  window.setTimeout(
                                    () => inputRef.current?.focus(),
                                    0,
                                  );
                                }}
                                onOpenChange={(open) => {
                                  setIsLocationSelectorOpen(open);

                                  if (open && document.fullscreenElement) {
                                    void document
                                      .exitFullscreen()
                                      .catch(() => undefined);
                                  }
                                }}
                              >
                                <SelectTrigger
                                  id="groupwise-packing-location"
                                  className="h-10 w-full"
                                >
                                  <SelectValue placeholder="Select location or continue without one" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={WITHOUT_LOCATION_VALUE}>
                                    Continue without location
                                  </SelectItem>
                                  {packagingLocations.map((location) => (
                                    <SelectItem
                                      key={location.location_name}
                                      value={`location:${location.location_name}`}
                                    >
                                      {location.location_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="rounded-lg border bg-background p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div>
                                <Label htmlFor="packaging-box">
                                  Destination box
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                  {packagingContext.packing_type === "GROUPWISE"
                                    ? "Each box accepts items from one product group."
                                    : "Scans are added to the selected box."}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => void refetchBoxes()}
                                disabled={isFetchingBoxes}
                                aria-label="Refresh boxes"
                              >
                                <RefreshCw
                                  className={cn(
                                    "size-4",
                                    isFetchingBoxes && "animate-spin",
                                  )}
                                />
                              </Button>
                            </div>

                            <div className="flex gap-2">
                              <Select
                                value={selectedBoxId?.toString()}
                                onValueChange={(value) => {
                                  clearAutoSubmitTimer();
                                  setScanValue("");
                                  setSelectedBoxId(Number(value));
                                  window.setTimeout(
                                    () => inputRef.current?.focus(),
                                    0,
                                  );
                                }}
                                onOpenChange={(open) => {
                                  setIsBoxSelectorOpen(open);

                                  if (open && document.fullscreenElement) {
                                    void document
                                      .exitFullscreen()
                                      .catch(() => undefined);
                                  }
                                }}
                              >
                                <SelectTrigger
                                  id="packaging-box"
                                  className="h-10 min-w-0 flex-1"
                                >
                                  <SelectValue placeholder="Select a box" />
                                </SelectTrigger>
                                <SelectContent>
                                  {packagingBoxes.map((box) => (
                                    <SelectItem
                                      key={box.id}
                                      value={box.id.toString()}
                                    >
                                      <span className="flex w-full items-center gap-2">
                                        <Box className="size-4" />
                                        <span>{box.box_name}</span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                          {box.box_status === "packed"
                                            ? "Packed"
                                            : `${box.items_count ?? 0} items`}
                                        </span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 shrink-0 gap-1.5 px-3"
                                onClick={openCreateBoxDialog}
                                disabled={!packagingContext.project_details_id}
                              >
                                <PackagePlus className="size-4" />
                                <span className="hidden sm:inline">New box</span>
                              </Button>
                            </div>

                            {packagingBoxes.length === 0 && (
                              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                Create the first box to start scanning.
                              </p>
                            )}
                            {!packagingContext.project_details_id && (
                              <p className="mt-2 text-xs text-destructive">
                                A project detail is required before adding boxes.
                              </p>
                            )}
                          </div>

                          {selectedBox && (
                            <div className="rounded-lg border bg-background p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">
                                    {selectedBox.box_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedBox.items_count ?? 0} items
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
                                    selectedBox.box_status === "packed"
                                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                      : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                  )}
                                >
                                  {selectedBox.box_status}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <Button
                                  type="button"
                                  size="lg"
                                  variant={
                                    selectedBox.box_status === "packed"
                                      ? "outline"
                                      : "default"
                                  }
                                  className="h-12 gap-2 text-sm font-semibold"
                                  disabled={boxAction !== null}
                                  onClick={() => void handleToggleBoxStatus()}
                                >
                                  {boxAction === "pack" ||
                                  boxAction === "unpack" ? (
                                    <Loader2 className="size-5 animate-spin" />
                                  ) : selectedBox.box_status === "packed" ? (
                                    <PackageOpen className="size-5" />
                                  ) : (
                                    <PackageCheck className="size-5" />
                                  )}
                                  {selectedBox.box_status === "packed"
                                    ? "Unpack box"
                                    : "Pack box"}
                                </Button>

                                <Button
                                  type="button"
                                  size="lg"
                                  className="h-12 gap-2 text-sm font-semibold"
                                  disabled={
                                    boxAction !== null ||
                                    selectedBox.box_status === "packed"
                                  }
                                  onClick={() => void handlePackAndPrint()}
                                >
                                  {boxAction === "pack-print" ? (
                                    <Loader2 className="size-5 animate-spin" />
                                  ) : (
                                    <Printer className="size-5" />
                                  )}
                                  Pack &amp; Print
                                </Button>

                                <Button
                                  type="button"
                                  size="lg"
                                  variant="outline"
                                  className="h-12 gap-2 text-sm font-semibold"
                                  disabled={boxAction !== null}
                                  onClick={() => void handlePrintBox()}
                                >
                                  {boxAction === "print" ? (
                                    <Loader2 className="size-5 animate-spin" />
                                  ) : (
                                    <Printer className="size-5" />
                                  )}
                                  Print
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {!isOnline && (
                  <div className="flex animate-in items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-800 fade-in dark:text-amber-300 lg:order-1 lg:col-span-2">
                    <WifiOff className="mt-0.5 size-5 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold">You are offline</p>
                      <p className="mt-0.5 text-xs opacity-90">
                        Keep scanning. Items will stay in this browser and retry when
                        the connection returns.
                      </p>
                    </div>
                  </div>
                )}

                <section
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-colors sm:p-6 lg:order-2 lg:self-start",
                    hasProcessingItem && "border-blue-500/50",
                  )}
                >
                  {hasProcessingItem && (
                    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-blue-500/10">
                      <div className="h-full w-1/2 animate-pulse bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                    </div>
                  )}

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "rounded-lg bg-primary/10 p-2 text-primary transition-transform",
                          hasProcessingItem && "animate-pulse scale-105",
                        )}
                      >
                        <ScanLine className="size-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Scan QR code</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Keep the cursor in the box below and scan continuously.
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex",
                        isOnline && !isQueuePaused
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {isOnline && !isQueuePaused ? (
                        <Wifi className="size-3.5" />
                      ) : (
                        <WifiOff className="size-3.5 animate-pulse" />
                      )}
                      {!isOnline
                        ? "Offline"
                        : isQueuePaused
                          ? "Reconnecting"
                          : "Online"}
                    </span>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <div className="relative flex-1">
                      <Barcode className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        ref={inputRef}
                        value={scanValue}
                        onChange={(event) => handleScanChange(event.target.value)}
                        placeholder={
                          supportsLocationSelection && !hasLocationDecision
                            ? "Select a location or continue without one"
                            : requiresDestinationBox && !selectedBox
                            ? "Select a box before scanning"
                            : requiresDestinationBox &&
                                selectedBox?.box_status === "packed"
                              ? "Unpack the selected box before scanning"
                            : "Scan or enter QR value"
                        }
                        className="flex h-11 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pl-10 pr-3 font-mono text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        aria-label="Scanned QR code value"
                        disabled={!isQueueHydrated || !scannerReady}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-11 gap-2 px-6"
                      disabled={
                        !scanValue.trim() || !isQueueHydrated || !scannerReady
                      }
                    >
                      <ScanLine className="size-4" />
                      Submit
                    </Button>
                  </form>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Scanner input submits on Enter or automatically after a short pause.
                    You can scan the next item while earlier scans are validating.
                  </p>

                  {pendingCount > 0 && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {isQueuePaused ? (
                        <WifiOff className="size-4 shrink-0 animate-pulse text-amber-500" />
                      ) : (
                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                      )}
                      <span>
                        {pendingCount} {pendingCount === 1 ? "item is" : "items are"}{" "}
                        still in the queue. Reloading this page will show a warning.
                      </span>
                    </div>
                  )}
                </section>
              </div>

              <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <ListChecks className="size-5 text-primary" />
                    <h2 className="font-semibold">Scanned items</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
                      {queuedItems.length}
                    </span>
                    {hasCompletedItems && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                        onClick={() => {
                          clearCompleted();
                          window.setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        Clear completed
                      </Button>
                    )}
                  </div>
                </div>

                {queuedItems.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                    <Barcode className="mb-2 size-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No items scanned yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your scanned QR values will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 pl-5 sm:pl-6">#</TableHead>
                          <TableHead className="min-w-56">
                            Scanned item
                          </TableHead>
                          <TableHead>Scanned value</TableHead>
                          {isPackagingMachine && (
                            <TableHead className="min-w-36">Box</TableHead>
                          )}
                          {showLocationSelection && (
                            <TableHead className="min-w-40">Location</TableHead>
                          )}
                          <TableHead className="w-32">Status</TableHead>
                          <TableHead className="min-w-64">Message</TableHead>
                          <TableHead className="w-28 pr-5 text-right sm:pr-6">
                            Time
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedItems.map((item, index) => (
                          <TableRow
                            key={item.id}
                            className={cn(
                              "animate-in fade-in",
                              item.status === "processing" && "bg-blue-500/5",
                              item.status === "success" && "bg-emerald-500/5",
                              item.status === "failure" && "bg-red-500/5",
                              typeof item.result?.box_total_weight === "number" &&
                                item.result.box_total_weight >=
                                  BOX_WEIGHT_WARNING_KG &&
                                "bg-amber-500/10",
                            )}
                          >
                            <TableCell className="pl-5 font-medium tabular-nums text-muted-foreground sm:pl-6">
                              {queuedItems.length - index}
                            </TableCell>
                            <TableCell>
                              {item.result ? (
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground">
                                    {item.result.item_name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {[
                                      item.result.group_name,
                                      item.result.project_name,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {item.status === "success"
                                    ? "Item details unavailable"
                                    : "—"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-80 break-all font-mono font-medium">
                              {item.result?.unique_code || item.value}
                            </TableCell>
                            {isPackagingMachine && (
                              <TableCell className="text-sm font-medium">
                                <p>
                                  {item.result?.box_name ||
                                    item.boxName ||
                                    (item.boxId ? `Box #${item.boxId}` : "—")}
                                </p>
                                {isCustomGroupPacking &&
                                  item.result?.box_position &&
                                  item.result.boxes_per_product && (
                                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                      {item.result.packing_group_name ||
                                        "Packing group"}
                                      {" · "}
                                      {item.result.box_position} of{" "}
                                      {item.result.boxes_per_product}
                                      {item.result.product_set_no
                                        ? ` · Set ${item.result.product_set_no}`
                                        : ""}
                                    </p>
                                  )}
                                {item.result?.box_completed && (
                                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    <PackageCheck className="size-3.5" />
                                    Packed · label queued for print
                                  </p>
                                )}
                                {typeof item.result?.box_total_weight ===
                                  "number" && (
                                  <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                    {item.result.box_total_weight.toFixed(2)} kg{" "}
                                    total
                                  </p>
                                )}
                              </TableCell>
                            )}
                            {showLocationSelection && (
                              <TableCell className="text-sm">
                                {item.result?.location_name ||
                                  item.locationName ||
                                  "Without location"}
                              </TableCell>
                            )}
                            <TableCell>
                              <QueueStatus item={item} />
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-sm text-muted-foreground",
                                item.status === "failure" &&
                                  "font-medium text-destructive",
                                item.status === "success" &&
                                  "text-emerald-700 dark:text-emerald-400",
                              )}
                            >
                              <div className="space-y-1.5">
                                <p>{item.message}</p>
                                {typeof item.result?.box_total_weight ===
                                  "number" &&
                                  item.result.box_total_weight >=
                                    BOX_WEIGHT_WARNING_KG && (
                                    <div
                                      role="status"
                                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
                                    >
                                      <AlertCircle className="size-3.5 shrink-0" />
                                      Warning: box weight is{" "}
                                      {item.result.box_total_weight.toFixed(2)} kg{" "}
                                      ({BOX_WEIGHT_WARNING_KG} kg warning
                                      threshold). Scanning remains enabled.
                                    </div>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell className="pr-5 text-right text-xs tabular-nums text-muted-foreground sm:pr-6">
                              {new Date(
                                item.result?.scanned_at || item.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Dialog
        open={isCreateBoxOpen}
        onOpenChange={(open) => {
          setIsCreateBoxOpen(open);

          if (!open) {
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleCreateBox} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="size-5 text-primary" />
                Add a new box
              </DialogTitle>
              <DialogDescription>
                Create a box for {packagingContext?.project_name}. It will be
                selected automatically when saved.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-box-name">Box name *</Label>
                <Input
                  id="new-box-name"
                  value={newBoxName}
                  onChange={(event) => {
                    setNewBoxName(event.target.value);
                    setBoxFormError("");
                  }}
                  placeholder="e.g. Box 12"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {packagingContext?.box_info_fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={`box-field-${field.id}`}>
                    {field.field_label}
                    {field.is_required ? " *" : ""}
                  </Label>
                  {getBoxFieldInput(field)}
                </div>
              ))}

              {boxFormError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{boxFormError}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateBoxOpen(false)}
                disabled={createBoxMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={createBoxMutation.isPending}
              >
                {createBoxMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PackagePlus className="size-4" />
                )}
                {createBoxMutation.isPending ? "Creating..." : "Create box"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
