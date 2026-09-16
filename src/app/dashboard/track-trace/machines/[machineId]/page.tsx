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
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Barcode,
  Box,
  Boxes,
  CheckCircle2,
  Clock3,
  Cpu,
  FolderGit2,
  Keyboard,
  Layers,
  ListChecks,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Package,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  Printer,
  QrCode,
  RefreshCw,
  Scan,
  ScanLine,
  Sparkles,
  Trash2,
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
  const [manualScanValue, setManualScanValue] = useState("");
  const [isManualScanOpen, setIsManualScanOpen] = useState(false);
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
  const manualScanInputRef = useRef<HTMLInputElement>(null);
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
    (value: string, focusScannerAfterSubmit = true) => {
      const scannedItem = value.trim();

      if (!scannedItem) {
        return false;
      }

      if (!addScan(scannedItem)) {
        return false;
      }

      clearAutoSubmitTimer();
      setScanValue("");
      if (focusScannerAfterSubmit) {
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      return true;
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

  const closeManualScanDialog = () => {
    setIsManualScanOpen(false);
    setManualScanValue("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const openManualScanDialog = () => {
    const openDialog = () => {
      clearAutoSubmitTimer();
      setScanValue("");
      setManualScanValue("");
      setIsManualScanOpen(true);
      window.setTimeout(() => manualScanInputRef.current?.focus(), 0);
    };

    if (document.fullscreenElement) {
      void document
        .exitFullscreen()
        .catch(() => undefined)
        .finally(openDialog);
      return;
    }

    openDialog();
  };

  const handleManualScanSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!manualScanValue.trim()) {
      manualScanInputRef.current?.focus();
      return;
    }

    if (!processScan(manualScanValue, false)) {
      toastManager.add({
        title: "Scanner is not ready. Check the packaging setup and try again.",
        type: "error",
      });
      return;
    }

    closeManualScanDialog();
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
      isCreateBoxOpen ||
      isManualScanOpen
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
    isManualScanOpen,
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
                <BreadcrumbPage className="flex items-center gap-2 font-bold text-foreground text-sm sm:text-base">
                  <span>
                    {packagingContext?.project_name ||
                      machine?.machine_name ||
                      "Scanner Workstation"}
                  </span>
                  {packagingContext?.project_name && (
                    <span className="hidden sm:inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                      {isGroupwisePacking
                        ? "Groupwise"
                        : isCustomGroupPacking
                        ? "Custom Group"
                        : "Packaging"}
                    </span>
                  )}
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

      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-5">
        <div
          ref={fullscreenContainerRef}
          className="w-full space-y-4 bg-background fullscreen:h-screen fullscreen:overflow-y-auto fullscreen:p-6"
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
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <div className="grid gap-4 lg:grid-cols-12">
                <Skeleton className="h-64 rounded-2xl lg:col-span-7" />
                <Skeleton className="h-64 rounded-2xl lg:col-span-5" />
              </div>
            </div>
          )}

          {(!hasValidVendor || !hasValidMachineId || isError) && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:p-6 text-center shadow-xs">
              <div className="mb-3 rounded-full bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="size-8" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Unable to open machine scanner</h1>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                The vendor or machine information is invalid. Return to the machines
                page and try again.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard/track-trace/machines">
                  <ArrowLeft className="mr-2 size-4" />
                  Return to machines
                </Link>
              </Button>
            </div>
          )}

          {hasValidVendor &&
            hasValidMachineId &&
            !isLoading &&
            !isError &&
            !machine && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-4 sm:p-6 text-center">
                <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
                  <Cpu className="size-8" />
                </div>
                <h1 className="text-lg font-bold text-foreground">Machine not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This machine is unavailable or is no longer active.
                </p>
              </div>
            )}

          {machine && (
            <>


              {/* Custom Packing Group Location bar */}
              {isPackagingMachine &&
                isCustomGroupPacking &&
                packagingContext &&
                packagingLocations.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <Label htmlFor="packing-location" className="font-semibold text-foreground">
                          Location Filter
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Optionally tag scans to a specific project location.
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
                        window.setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      onOpenChange={(open) => {
                        setIsLocationSelectorOpen(open);
                        if (open && document.fullscreenElement) {
                          void document.exitFullscreen().catch(() => undefined);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="packing-location"
                        className="h-10 w-full rounded-xl sm:w-72"
                      >
                        <SelectValue placeholder="Select location or continue without" />
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

              {/* Offline Warning banner */}
              {!isOnline && (
                <div className="flex animate-in items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 fade-in dark:text-amber-200">
                  <WifiOff className="mt-0.5 size-5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-bold">Workstation is currently offline</p>
                    <p className="mt-0.5 text-xs opacity-90">
                      You can keep scanning continuously. All barcodes will be safely stored in your browser's local queue and synchronized automatically once network connectivity is restored.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Workstation Grid: Scanner Terminal + Packaging Box Setup */}
              <div
                className={cn(
                  "space-y-4",
                  showPackagingSetup && "lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0",
                )}
              >
                {/* Left Column: Scanner Terminal HUD */}
                <section
                  className={cn(
                    "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 sm:p-6 shadow-xs transition-all duration-300",
                    showPackagingSetup ? "lg:col-span-7 xl:col-span-7" : "w-full",
                    hasProcessingItem && "border-blue-500/50 ring-2 ring-blue-500/20",
                  )}
                >
                  {/* Top Laser Progress Indicator */}
                  {hasProcessingItem && (
                    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-blue-500/10">
                      <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                    </div>
                  )}

                  <div>
                    {/* Scanner Terminal Header */}
                    <div className="mb-4 sm:mb-5 flex items-start justify-between gap-3 border-b pb-3.5 sm:pb-4">
                      <div className="flex items-start gap-3 sm:gap-3.5">
                        <div
                          className={cn(
                            "relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform",
                            hasProcessingItem && "scale-105 animate-pulse",
                          )}
                        >
                          <ScanLine className="size-4.5 sm:size-5" />
                          {scannerReady && (
                            <span className="absolute -top-1 -right-1 flex size-3">
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                            </span>
                          )}
                        </div>
                        <div>
                          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                            Scan QR code
                          </h2>
                          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                            Keep the cursor in the box below and scan continuously
                          </p>
                        </div>
                      </div>

                      {/* Status Badge: Wifi Online */}
                      <div className="flex items-center justify-end">
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold shadow-2xs",
                            isOnline && !isQueuePaused
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : !isOnline
                              ? "border-destructive/25 bg-destructive/10 text-destructive dark:text-red-400"
                              : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {isOnline && !isQueuePaused ? (
                            <Wifi className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <WifiOff className="size-3.5 animate-pulse text-destructive" />
                          )}
                          <span>
                            {!isOnline
                              ? "Offline"
                              : isQueuePaused
                              ? "Reconnecting"
                              : "Online"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Scanner Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative flex-1 min-w-0">
                          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Barcode className="size-5" />
                          </div>
                          <input
                            ref={inputRef}
                            value={scanValue}
                            onChange={(event) => handleScanChange(event.target.value)}
                            placeholder={
                              supportsLocationSelection && !hasLocationDecision
                                ? "Select a location before scanning..."
                                : requiresDestinationBox && !selectedBox
                                ? "Select or create a destination box..."
                                : requiresDestinationBox &&
                                    selectedBox?.box_status === "packed"
                                  ? "Unpack the destination box to scan..."
                                  : "Scan QR code or type barcode..."
                            }
                            className={cn(
                              "flex h-12 sm:h-13 w-full min-w-0 rounded-xl border border-input bg-muted/20 py-2 pl-11 pr-10 font-mono text-sm sm:text-base font-semibold tracking-wide shadow-2xs outline-none transition-all placeholder:text-muted-foreground/60 placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm placeholder:font-normal focus-visible:border-primary focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15 dark:bg-input/20",
                              !scannerReady && "opacity-60 cursor-not-allowed bg-muted/40",
                            )}
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            aria-label="Scanned QR code value"
                            disabled={!isQueueHydrated || !scannerReady}
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
                            className="h-12 sm:h-13 flex-1 sm:flex-initial gap-2 px-5 sm:px-6 font-semibold shadow-xs transition-all active:scale-95"
                            disabled={
                              !scanValue.trim() || !isQueueHydrated || !scannerReady
                            }
                          >
                            <ScanLine className="size-4" />
                            <span>Submit</span>
                          </Button>

                          {isPackagingMachine && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 sm:h-13 gap-2 px-3.5 sm:px-4 font-medium shadow-2xs hover:bg-accent shrink-0"
                              onClick={openManualScanDialog}
                              disabled={!isQueueHydrated || !scannerReady}
                            >
                              <Keyboard className="size-4 text-muted-foreground" />
                              <span>Manual Scan</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Footer Context / Routing Notice */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary/80" />
                      <span>
                        {requiresDestinationBox && selectedBox ? (
                          <>
                            Active routing destination:{" "}
                            <span className="font-bold text-foreground">
                              {selectedBox.box_name}
                            </span>
                          </>
                        ) : isCustomGroupPacking ? (
                          "Boxes assigned automatically per product group"
                        ) : requiresDestinationBox ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            Select a destination box to enable scanning
                          </span>
                        ) : (
                          "Direct verification mode"
                        )}
                      </span>
                    </div>
                  
                  </div>

                  {pendingCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3.5 py-2 text-xs text-blue-800 dark:text-blue-300">
                      {isQueuePaused ? (
                        <WifiOff className="size-4 shrink-0 animate-pulse text-amber-500" />
                      ) : (
                        <Loader2 className="size-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
                      )}
                      <span>
                        {pendingCount} {pendingCount === 1 ? "item is" : "items are"} currently validating in queue. You may continue scanning without pausing.
                      </span>
                    </div>
                  )}
                </section>

                {/* Right Column: Packaging Box Setup & Destination Hub */}
                {showPackagingSetup && (
                  <section className="overflow-hidden rounded-2xl border bg-card p-3.5 sm:p-4 shadow-xs lg:col-span-5 xl:col-span-5 lg:self-start">
                    {/* Hub Header */}
                    <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-violet-500/10 p-1.5 text-violet-600 dark:text-violet-400">
                          <Boxes className="size-4.5" />
                        </div>
                        <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                          {packagingContext?.packing_type === "GROUPWISE"
                            ? "Groupwise Box Hub"
                            : "Packaging Box Hub"}
                        </h2>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {packagingBoxes.length} {packagingBoxes.length === 1 ? "box" : "boxes"}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => void refetchBoxes()}
                        disabled={isFetchingBoxes}
                        aria-label="Refresh boxes"
                      >
                        <RefreshCw
                          className={cn("size-3.5", isFetchingBoxes && "animate-spin")}
                        />
                      </Button>
                    </div>

                    {(isLoadingPackagingContext || isLoadingBoxes) && (
                      <div className="space-y-3 py-2">
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                      </div>
                    )}

                    {(isPackagingContextError || isBoxesError) && (
                      <div className="my-2 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Packaging information unavailable
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Connection interrupted or project details could not load.
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
                          <RefreshCw className="size-3.5" />
                          Retry
                        </Button>
                      </div>
                    )}

                    {packagingContext && !isBoxesError && (
                      <div className="space-y-2.5">
                        {/* Groupwise Location Selector if present */}
                        {isGroupwisePacking && showLocationSelection && (
                          <div className="rounded-xl border bg-muted/20 p-2.5 sm:p-3">
                            <div className="mb-1.5 flex items-center gap-2">
                              <MapPin className="size-4 text-primary" />
                              <div>
                                <Label
                                  htmlFor="groupwise-packing-location"
                                  className="text-xs font-semibold text-foreground"
                                >
                                  Packing Location
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                  Optionally filter destination by location
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
                                className="h-10 w-full rounded-xl bg-background text-xs font-medium"
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

                        {/* Destination Box Dropdown + New Box Row */}
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
                              className="!h-11 data-[size=default]:h-11 min-w-0 flex-1 rounded-lg bg-muted/20 text-xs sm:text-sm font-medium"
                            >
                              <SelectValue placeholder="Choose a destination box..." />
                            </SelectTrigger>
                            <SelectContent>
                              {packagingBoxes.map((box) => (
                                <SelectItem
                                  key={box.id}
                                  value={box.id.toString()}
                                >
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 font-medium">
                                      <Box className="size-4 text-primary/70" />
                                      <span>{box.box_name}</span>
                                    </span>
                                    <span
                                      className={cn(
                                        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                        box.box_status === "packed"
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                          : "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {box.box_status === "packed"
                                        ? "Packed"
                                        : `${box.items_count ?? 0} items`}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 shrink-0 gap-1.5 rounded-xl px-3 sm:px-3.5 text-xs sm:text-sm font-semibold shadow-2xs hover:bg-accent"
                            onClick={openCreateBoxDialog}
                            disabled={!packagingContext.project_details_id}
                          >
                            <PackagePlus className="size-4 text-primary" />
                            <span>New Box</span>
                          </Button>
                        </div>

                        {packagingBoxes.length === 0 && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            No boxes exist for this project yet. Click New Box to start.
                          </p>
                        )}

                        {/* Active Box Status Bar & Action Buttons */}
                        {selectedBox ? (
                          <div className="space-y-2.5 pt-0.5">
                            {/* Status & Items Count Strip */}
                            <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3.5 py-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-medium">
                                  Status:
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
                                    selectedBox.box_status === "packed"
                                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                      : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      selectedBox.box_status === "packed"
                                        ? "bg-emerald-500"
                                        : "bg-amber-500",
                                    )}
                                  />
                                  {selectedBox.box_status}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground font-medium">
                                  Items packed:
                                </span>
                                <span className="font-mono text-sm font-bold text-foreground">
                                  {selectedBox.items_count ?? 0}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons: Unpack / Pack Box, Print Label, Pack & Print */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <Button
                                type="button"
                                variant={
                                  selectedBox.box_status === "packed"
                                    ? "outline"
                                    : "default"
                                }
                                className="h-11 sm:h-12 gap-2 rounded-xl px-2.5 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95"
                                disabled={boxAction !== null}
                                onClick={() => void handleToggleBoxStatus()}
                              >
                                {boxAction === "pack" ||
                                boxAction === "unpack" ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : selectedBox.box_status === "packed" ? (
                                  <PackageOpen className="size-4" />
                                ) : (
                                  <PackageCheck className="size-4" />
                                )}
                                <span className="truncate">
                                  {selectedBox.box_status === "packed"
                                    ? "Unpack"
                                    : "Pack Box"}
                                </span>
                              </Button>

                              <Button
                                type="button"
                                className="h-11 sm:h-12 gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white dark:text-black font-semibold px-2.5 text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50"
                                disabled={boxAction !== null}
                                onClick={() => void handlePrintBox()}
                              >
                                {boxAction === "print" ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Printer className="size-4" />
                                )}
                                <span className="truncate">Print Label</span>
                              </Button>

                              <Button
                                type="button"
                                className="col-span-2 sm:col-span-1 h-11 sm:h-12 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 px-2.5 text-xs sm:text-sm font-semibold text-white dark:text-black shadow-xs hover:from-violet-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                disabled={
                                  boxAction !== null ||
                                  selectedBox.box_status === "packed"
                                }
                                onClick={() => void handlePackAndPrint()}
                              >
                                {boxAction === "pack-print" ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Printer className="size-4" />
                                )}
                                <span className="truncate">Pack & Print</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed bg-muted/10 py-3.5 px-4 text-center">
                            <p className="text-xs text-muted-foreground">
                              Select an existing box above or click <span className="font-semibold text-foreground">New Box</span> to start packing.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Scanned Items Feed Section */}
              <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
                <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                      <ListChecks className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold tracking-tight text-foreground">
                          Scanned Items Feed
                        </h2>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                          {queuedItems.length}
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
                        onClick={() => {
                          clearCompleted();
                          window.setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        <span>Clear Completed</span>
                      </Button>
                    )}
                  </div>
                </div>

                {queuedItems.length === 0 ? (
                  <div className="flex min-h-36 flex-col items-center justify-center px-4 py-6 sm:px-6 text-center">
                    <div className="relative mb-2.5 flex size-12 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/15 shadow-inner">
                      <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/5 opacity-50" />
                      <Scan className="size-6 text-primary/70" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      Workstation Scanner Standing By
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      Scan product barcodes or QR codes to populate this workstation's live packing stream.
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
                          <TableHead className="w-12 pl-4 sm:pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">#</TableHead>
                          <TableHead className="min-w-56 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Scanned Item
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Barcode / Value</TableHead>
                          {isPackagingMachine && (
                            <TableHead className="min-w-36 text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Box</TableHead>
                          )}
                          {showLocationSelection && (
                            <TableHead className="min-w-40 text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</TableHead>
                          )}
                          <TableHead className="w-32 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                          <TableHead className="min-w-64 text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</TableHead>
                          <TableHead className="w-24 pr-4 text-right sm:pr-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Time
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedItems.map((item, index) => {
                          const codeValue = item.result?.unique_code || item.value;

                          return (
                            <TableRow
                              key={item.id}
                              className={cn(
                                "animate-in fade-in transition-colors",
                                item.status === "processing" && "bg-blue-500/5",
                                item.status === "success" && "bg-emerald-500/[0.03]",
                                item.status === "failure" && "bg-red-500/5",
                                typeof item.result?.box_total_weight === "number" &&
                                  item.result.box_total_weight >=
                                    BOX_WEIGHT_WARNING_KG &&
                                  "bg-amber-500/10",
                              )}
                            >
                              <TableCell className="pl-4 font-mono text-xs font-medium tabular-nums text-muted-foreground sm:pl-6">
                                {queuedItems.length - index}
                              </TableCell>
                              <TableCell>
                                {item.result ? (
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground text-sm">
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
                                      ? "Item details verified"
                                      : "—"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs font-semibold text-foreground">
                                  {codeValue}
                                </span>
                              </TableCell>
                              {isPackagingMachine && (
                                <TableCell className="text-sm font-medium">
                                  <p className="font-semibold text-foreground">
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
                                      Packed · label sent
                                    </p>
                                  )}
                                  {typeof item.result?.box_total_weight ===
                                    "number" && (
                                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                      {item.result.box_total_weight.toFixed(2)} kg
                                    </p>
                                  )}
                                </TableCell>
                              )}
                              {showLocationSelection && (
                                <TableCell className="text-sm">
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="size-3 text-primary/70" />
                                    {item.result?.location_name ||
                                      item.locationName ||
                                      "Without location"}
                                  </span>
                                </TableCell>
                              )}
                              <TableCell>
                                <QueueStatus item={item} />
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-xs text-muted-foreground",
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
                                        ({BOX_WEIGHT_WARNING_KG} kg limit).
                                      </div>
                                    )}
                                </div>
                              </TableCell>
                              <TableCell className="pr-4 text-right font-mono text-xs tabular-nums text-muted-foreground sm:pr-6">
                                {new Date(
                                  item.result?.scanned_at || item.createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
        open={isManualScanOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsManualScanOpen(true);
          } else {
            closeManualScanDialog();
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
                Type the item QR or barcode value exactly as printed. It will process through the same instant validation queue.
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
                placeholder="e.g. ITEM-49204-XYZ"
                className="h-12 font-mono text-base font-semibold rounded-xl bg-muted/20"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Press Enter or select Submit to push into the workstation queue.
              </p>
            </div>

            {(selectedBox || selectedLocationName) && (
              <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1">
                {selectedBox && (
                  <p className="flex items-center gap-1.5 text-foreground font-medium">
                    <Box className="size-3.5 text-primary" />
                    <span>Target Box: <strong>{selectedBox.box_name}</strong></span>
                  </p>
                )}
                {selectedLocationName && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Location: {selectedLocationName}</span>
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={closeManualScanDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 rounded-xl font-semibold shadow-xs"
                disabled={
                  !manualScanValue.trim() ||
                  !isQueueHydrated ||
                  !scannerReady
                }
              >
                <ScanLine className="size-4" />
                Submit Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateBoxOpen}
        onOpenChange={(open) => {
          setIsCreateBoxOpen(open);

          if (!open) {
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto shadow-xl border">
          <form onSubmit={handleCreateBox} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <PackagePlus className="size-5" />
                </div>
                Add Destination Box
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create a new packaging box for {packagingContext?.project_name}. It will automatically become your active target box.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-box-name" className="text-xs font-semibold">
                  Box Name / Identifier *
                </Label>
                <Input
                  id="new-box-name"
                  value={newBoxName}
                  onChange={(event) => {
                    setNewBoxName(event.target.value);
                    setBoxFormError("");
                  }}
                  placeholder="e.g. Box 12 or Master Carton A"
                  className="h-11 rounded-xl bg-muted/20"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {packagingContext?.box_info_fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={`box-field-${field.id}`} className="text-xs font-semibold">
                    {field.field_label}
                    {field.is_required ? " *" : ""}
                  </Label>
                  {getBoxFieldInput(field)}
                </div>
              ))}

              {boxFormError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{boxFormError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsCreateBoxOpen(false)}
                disabled={createBoxMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 rounded-xl font-semibold shadow-xs"
                disabled={createBoxMutation.isPending}
              >
                {createBoxMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PackagePlus className="size-4" />
                )}
                {createBoxMutation.isPending ? "Creating..." : "Create & Select Box"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
