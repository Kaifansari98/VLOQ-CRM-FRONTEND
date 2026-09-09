"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MachineScanResult,
  validateMachineScan,
} from "@/api/track-trace/machine-scanner.api";

export type MachineScanQueueStatus =
  | "queued"
  | "processing"
  | "waiting"
  | "success"
  | "failure";

export interface MachineScanQueueItem {
  id: string;
  value: string;
  status: MachineScanQueueStatus;
  message: string;
  createdAt: number;
  attempts: number;
  projectId?: number;
  boxId?: number;
  boxName?: string;
  result?: MachineScanResult;
}

interface UseMachineScanQueueOptions {
  vendorId?: number;
  machineId?: number;
  userId?: number;
  enabled?: boolean;
  projectId?: number;
  boxId?: number;
  boxName?: string;
}

const MAX_STORED_ITEMS = 250;
const QUEUE_STATUSES = new Set<MachineScanQueueStatus>([
  "queued",
  "processing",
  "waiting",
  "success",
  "failure",
]);
const PENDING_STATUSES = new Set<MachineScanQueueStatus>([
  "queued",
  "processing",
  "waiting",
]);

const trimQueueHistory = (items: MachineScanQueueItem[]) => {
  if (items.length <= MAX_STORED_ITEMS) {
    return items;
  }

  let completedItemsToRemove = items.length - MAX_STORED_ITEMS;

  return items.filter((item) => {
    if (completedItemsToRemove > 0 && !PENDING_STATUSES.has(item.status)) {
      completedItemsToRemove -= 1;
      return false;
    }

    return true;
  });
};

const makeQueueId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getResponseError = (error: unknown) => {
  const response = (
    error as {
      response?: {
        data?: {
          message?: string;
          errors?: string | string[];
        };
      };
    }
  )?.response;

  if (!response) {
    return null;
  }

  const errors = response.data?.errors;
  const errorText = Array.isArray(errors) ? errors.join(", ") : errors;

  return errorText || response.data?.message || "Scan validation failed";
};

const isStoredScanResult = (result: unknown): result is MachineScanResult => {
  if (!result || typeof result !== "object") {
    return false;
  }

  const candidate = result as Partial<MachineScanResult>;

  return (
    typeof candidate.mapping_id === "number" &&
    typeof candidate.cut_list_id === "number" &&
    typeof candidate.project_id === "number" &&
    typeof candidate.project_name === "string" &&
    typeof candidate.machine_id === "number" &&
    typeof candidate.machine_name === "string" &&
    typeof candidate.item_name === "string" &&
    typeof candidate.unique_code === "string" &&
    (candidate.description === null ||
      typeof candidate.description === "string") &&
    (candidate.group_name === null || typeof candidate.group_name === "string") &&
    (candidate.box_id === null || typeof candidate.box_id === "number") &&
    typeof candidate.scanned_at === "string"
  );
};

const isStoredQueueItem = (item: unknown): item is MachineScanQueueItem => {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Partial<MachineScanQueueItem>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.value === "string" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.attempts === "number" &&
    typeof candidate.status === "string" &&
    QUEUE_STATUSES.has(candidate.status as MachineScanQueueStatus) &&
    typeof candidate.message === "string" &&
    (candidate.projectId === undefined ||
      (typeof candidate.projectId === "number" && candidate.projectId > 0)) &&
    (candidate.boxId === undefined ||
      (typeof candidate.boxId === "number" && candidate.boxId > 0)) &&
    (candidate.boxName === undefined || typeof candidate.boxName === "string") &&
    (candidate.result === undefined || isStoredScanResult(candidate.result))
  );
};

export const useMachineScanQueue = ({
  vendorId,
  machineId,
  userId,
  enabled = true,
  projectId,
  boxId,
  boxName,
}: UseMachineScanQueueOptions) => {
  const storageKey = useMemo(() => {
    if (!vendorId || !machineId || !userId) {
      return null;
    }

    const baseKey =
      `track-trace-machine-scan-queue:v1:${vendorId}:${machineId}:${userId}`;

    return projectId ? `${baseKey}:project:${projectId}` : baseKey;
  }, [machineId, projectId, userId, vendorId]);

  const [items, setItems] = useState<MachineScanQueueItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [workerTick, setWorkerTick] = useState(0);

  const mountedRef = useRef(false);
  const storageKeyRef = useRef<string | null>(storageKey);
  const activeRequestRef = useRef<AbortController | null>(null);
  const retryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  storageKeyRef.current = storageKey;

  const persistItems = useCallback((nextItems: MachineScanQueueItem[]) => {
    const key = storageKeyRef.current;

    if (!key || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(nextItems));
    } catch {
      // Queue processing must continue even when browser storage is unavailable.
    }
  }, []);

  const updateItems = useCallback(
    (
      updater: (
        currentItems: MachineScanQueueItem[],
      ) => MachineScanQueueItem[],
    ) => {
      setItems((currentItems) => {
        const nextItems = updater(currentItems);
        persistItems(nextItems);
        return nextItems;
      });
    },
    [persistItems],
  );

  const scheduleRetry = useCallback(
    (queueItemId: string, attempts: number) => {
      const existingTimer = retryTimersRef.current.get(queueItemId);

      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const delay = Math.min(30_000, 2_000 * 2 ** Math.min(attempts, 4));
      const timer = setTimeout(() => {
        retryTimersRef.current.delete(queueItemId);

        if (!mountedRef.current) {
          return;
        }

        updateItems((currentItems) =>
          currentItems.map((item) =>
            item.id === queueItemId && item.status === "waiting"
              ? {
                  ...item,
                  status: "queued",
                  message: "Queued for retry",
                }
            : item,
          ),
        );
        setIsQueuePaused(!window.navigator.onLine);
      }, delay);

      retryTimersRef.current.set(queueItemId, timer);
    },
    [updateItems],
  );

  useEffect(() => {
    mountedRef.current = true;
    const browserIsOnline = window.navigator.onLine;
    setIsOnline(browserIsOnline);
    setIsQueuePaused(!browserIsOnline);

    return () => {
      mountedRef.current = false;
      activeRequestRef.current?.abort();
      retryTimersRef.current.forEach((timer) => clearTimeout(timer));
      retryTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setIsHydrated(false);
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    retryTimersRef.current.forEach((timer) => clearTimeout(timer));
    retryTimersRef.current.clear();
    setIsQueuePaused(!window.navigator.onLine);

    if (!storageKey) {
      setItems([]);
      setIsHydrated(true);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      const parsedValue = storedValue ? JSON.parse(storedValue) : [];
      const restoredItems = Array.isArray(parsedValue)
        ? trimQueueHistory(
            parsedValue.filter(isStoredQueueItem).map((item) =>
              PENDING_STATUSES.has(item.status)
                ? {
                    ...item,
                    status: "queued" as const,
                    message: "Restored from queue",
                  }
                : item,
            ),
          )
        : [];

      setItems(restoredItems);
      persistItems(restoredItems);
    } catch {
      setItems([]);
      persistItems([]);
    }

    setIsHydrated(true);
  }, [persistItems, storageKey]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setIsQueuePaused(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setIsQueuePaused(false);
      updateItems((currentItems) =>
        currentItems.map((item) =>
          item.status === "waiting"
            ? {
                ...item,
                status: "queued",
                message: "Connection restored. Queued for retry",
              }
            : item,
        ),
      );
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [updateItems]);

  const pendingCount = items.filter((item) =>
    PENDING_STATUSES.has(item.status),
  ).length;

  useEffect(() => {
    if (pendingCount === 0) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Scanned items are still in the queue.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingCount]);

  useEffect(() => {
    if (
      !isHydrated ||
      !enabled ||
      !isOnline ||
      isQueuePaused ||
      activeRequestRef.current ||
      !vendorId ||
      !machineId ||
      !userId
    ) {
      return;
    }

    const nextItem = items.find((item) => item.status === "queued");

    if (!nextItem) {
      return;
    }

    const abortController = new AbortController();
    activeRequestRef.current = abortController;

    updateItems((currentItems) =>
      currentItems.map((item) =>
        item.id === nextItem.id
          ? {
              ...item,
              status: "processing",
              message: "Validating scan...",
              attempts: item.attempts + 1,
            }
          : item,
      ),
    );

    void validateMachineScan(
      {
        vendor_id: vendorId,
        machine_id: machineId,
        unique_code: nextItem.value,
        created_by: userId,
        project_id: nextItem.projectId,
        box_id: nextItem.boxId,
      },
      abortController.signal,
    )
      .then((response) => {
        if (!mountedRef.current) {
          return;
        }

        updateItems((currentItems) =>
          currentItems.map((item) =>
            item.id === nextItem.id
              ? {
                  ...item,
                  status: response.success ? "success" : "failure",
                  message:
                    response.message ||
                    (response.success ? "Scan successful" : "Scan failed"),
                  result:
                    response.success && isStoredScanResult(response.data)
                      ? response.data
                      : undefined,
                }
              : item,
          ),
        );
      })
      .catch((error: unknown) => {
        if (!mountedRef.current || abortController.signal.aborted) {
          return;
        }

        const responseError = getResponseError(error);

        if (responseError) {
          updateItems((currentItems) =>
            currentItems.map((item) =>
              item.id === nextItem.id
                ? {
                    ...item,
                    status: "failure",
                    message: responseError,
                  }
                : item,
            ),
          );
          return;
        }

        setIsQueuePaused(true);
        updateItems((currentItems) =>
          currentItems.map((item) =>
            item.id === nextItem.id
              ? {
                  ...item,
                  status: "waiting",
                  message: window.navigator.onLine
                    ? "Network error. Retrying automatically..."
                    : "Offline. Waiting for connection...",
                }
              : item,
          ),
        );
        scheduleRetry(nextItem.id, nextItem.attempts + 1);
      })
      .finally(() => {
        if (!mountedRef.current) {
          return;
        }

        if (activeRequestRef.current !== abortController) {
          return;
        }

        activeRequestRef.current = null;
        setWorkerTick((currentTick) => currentTick + 1);
      });
  }, [
    enabled,
    isHydrated,
    isOnline,
    isQueuePaused,
    items,
    machineId,
    scheduleRetry,
    updateItems,
    userId,
    vendorId,
    workerTick,
  ]);

  const addScan = useCallback(
    (value: string) => {
      const normalizedValue = value.trim();

      if (!normalizedValue || !isHydrated || !storageKey || !enabled) {
        return false;
      }

      const queueItem: MachineScanQueueItem = {
        id: makeQueueId(),
        value: normalizedValue,
        status: isOnline ? "queued" : "waiting",
        message: isOnline ? "Queued" : "Offline. Waiting for connection...",
        createdAt: Date.now(),
        attempts: 0,
        projectId,
        boxId,
        boxName,
      };

      updateItems((currentItems) =>
        trimQueueHistory([...currentItems, queueItem]),
      );

      return true;
    },
    [
      boxId,
      boxName,
      enabled,
      isHydrated,
      isOnline,
      projectId,
      storageKey,
      updateItems,
    ],
  );

  const clearCompleted = useCallback(() => {
    updateItems((currentItems) =>
      currentItems.filter((item) => PENDING_STATUSES.has(item.status)),
    );
  }, [updateItems]);

  return {
    items,
    addScan,
    clearCompleted,
    isHydrated,
    isOnline,
    isQueuePaused,
    pendingCount,
  };
};
