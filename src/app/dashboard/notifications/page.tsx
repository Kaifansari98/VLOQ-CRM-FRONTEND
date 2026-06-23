"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { markNotificationRead } from "@/redux/slices/notificationsSlice";
import {
  fetchNotifications,
  markNotificationRead as markReadApi,
  markNotificationsReadBulk,
} from "@/api/notifications";
import { NotificationItem } from "@/types/notifications";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  CheckSquare,
  Circle,
  MessageCircle,
  Target,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import ApprovalRequestActionModal from "@/components/tasks/ApprovalRequestActionModal";


// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

type TabId = "all" | "leads" | "task" | "mention" | "approval";

interface Filters {
  tab: TabId;
  search: string;
  page: number;
}

interface PageCache {
  notifications: NotificationItem[];
  totalCount: number;
}

const TABS = [
  { id: "all" as const,      label: "All Notifications", icon: Bell        },
  { id: "leads" as const,    label: "Leads",             icon: Target       },
  { id: "task" as const,     label: "Tasks",             icon: Briefcase    },
  { id: "mention" as const,  label: "Mentions",          icon: MessageCircle },
  { id: "approval" as const, label: "Approvals",         icon: CheckSquare  },
];

const TYPE_CONFIG: Record<
  NonNullable<NotificationItem["type"]>,
  { label: string; Icon: typeof Bell; color: string }
> = {
  LEAD_ASSIGNED:  { label: "Lead",        Icon: Target,        color: "text-emerald-500" },
  TASK_ASSIGNED:  { label: "Task",        Icon: Briefcase,     color: "text-blue-500"    },
  CHAT_MENTION:   { label: "Mention",     Icon: MessageCircle, color: "text-amber-500"   },
  LEAD_MILESTONE: { label: "Milestone",   Icon: Bell,          color: "text-purple-500"  },
  LEAD_ACTION:    { label: "Lead Action", Icon: Bell,          color: "text-sky-500"     },
  APPROVAL:       { label: "Approval",    Icon: CheckSquare,   color: "text-teal-500"    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitial = (name?: string | null) =>
  name?.trim()?.charAt(0)?.toUpperCase() || "";

const getRelativeTime = (dateString: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const DATE_GROUPS = ["Today", "Yesterday", "This Week", "Earlier"] as const;

const groupNotificationsByDate = (
  items: NotificationItem[],
): [string, NotificationItem[]][] => {
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today.getTime() - 7 * 86400_000);

  const map: Record<string, NotificationItem[]> = {};
  for (const item of items) {
    const d = new Date(item.created_at);
    const key =
      d.toDateString() === today.toDateString()     ? "Today"     :
      d.toDateString() === yesterday.toDateString() ? "Yesterday" :
      d > weekAgo                                   ? "This Week" : "Earlier";
    (map[key] ??= []).push(item);
  }
  return DATE_GROUPS.filter((k) => map[k]).map((k) => [k, map[k]]);
};

/** Cache key — same shape as Filters so cache is always filter-aware */
const cacheKey = (f: Filters) => `${f.tab}|${f.search}|${f.page}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const user     = useAppSelector((state) => state.auth.user);

  const [filters, setFilters] = useState<Filters>({ tab: "all", search: "", page: 1 });
  const [searchInput, setSearchInput]     = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount]       = useState(0);
  // `isLoading` is true only on the INITIAL load (no prior data shown).
  // Pagination reuses `isPaging` so existing content stays visible.
  const [isLoading, setIsLoading]         = useState(false);
  const [isPaging, setIsPaging]           = useState(false);
  const [approvalModalData, setApprovalModalData] = useState<{ leadId: number; taskId: number } | null>(null);

  const markedIdsRef       = useRef<Set<number>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const prefetchAbortRef   = useRef<AbortController | null>(null);
  const searchTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Page-level cache: avoids re-fetching already-loaded pages
  const pageCacheRef       = useRef<Map<string, PageCache>>(new Map());

  const reduxNotifications = useAppSelector((state) => state.notifications.items);
  const lastReduxIdRef     = useRef<number | undefined>(undefined);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Apply already-known read state so UI is consistent before API confirms */
  const applyReadState = useCallback(
    (items: NotificationItem[]) =>
      items.map((item) =>
        markedIdsRef.current.has(item.id) ? { ...item, is_read: true } : item,
      ),
    [],
  );

  /** Fetch a single page. Returns null if aborted. */
  const fetchPage = useCallback(
    async (
      f: Filters,
      signal: AbortSignal,
    ): Promise<PageCache | null> => {
      if (!user?.vendor_id || !user?.id) return null;
      try {
        const { notifications: items, totalCount: total } = await fetchNotifications(
          user.vendor_id,
          user.id,
          {
            take:   PAGE_SIZE,
            skip:   (f.page - 1) * PAGE_SIZE,
            search: f.search || undefined,
            tab:    f.tab !== "all" ? f.tab : undefined,
            signal,
          },
        );
        if (signal.aborted) return null;

        const processed = [...items]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return { notifications: processed, totalCount: total };
      } catch (err) {
        if (axios.isCancel(err) || signal.aborted) return null;
        throw err;
      }
    },
    [user?.id, user?.vendor_id],
  );

  // ─── Prefetch next page ────────────────────────────────────────────────────
  const prefetchNext = useCallback(
    (currentFilters: Filters, currentTotal: number) => {
      const totalPages = Math.max(1, Math.ceil(currentTotal / PAGE_SIZE));
      if (currentFilters.page >= totalPages) return; // already on last page

      const nextFilters: Filters = { ...currentFilters, page: currentFilters.page + 1 };
      const key = cacheKey(nextFilters);
      if (pageCacheRef.current.has(key)) return; // already cached

      // Cancel any existing prefetch
      prefetchAbortRef.current?.abort();
      const controller = new AbortController();
      prefetchAbortRef.current = controller;

      fetchPage(nextFilters, controller.signal)
        .then((result) => {
          if (result && !controller.signal.aborted) {
            pageCacheRef.current.set(key, result);
          }
        })
        .catch(() => {/* silent — prefetch failures don't matter */});
    },
    [fetchPage],
  );

  // ─── Main fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !user?.vendor_id) {
      setNotifications([]);
      setTotalCount(0);
      return;
    }

    const key     = cacheKey(filters);
    const cached  = pageCacheRef.current.get(key);

    // ── Cache hit: show instantly, no spinner ────────────────────────────────
    if (cached) {
      const processed = applyReadState(cached.notifications);
      setNotifications(processed);
      setTotalCount(cached.totalCount);
      setIsLoading(false);
      setIsPaging(false);
      // Prefetch the next page after showing cached data
      prefetchNext(filters, cached.totalCount);
      return;
    }

    // ── Cache miss: fetch from server ────────────────────────────────────────
    // Cancel previous main fetch
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Also cancel any pending prefetch so it doesn't compete
    prefetchAbortRef.current?.abort();

    // Show spinner only if no data visible yet; otherwise show paging overlay
    if (notifications.length === 0) {
      setIsLoading(true);
    } else {
      setIsPaging(true);
    }

    fetchPage(filters, controller.signal)
      .then((result) => {
        if (!result || controller.signal.aborted) return;

        // Clamp page if total shrank
        const maxPage = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));
        if (result.totalCount > 0 && filters.page > maxPage) {
          setFilters((f) => ({ ...f, page: maxPage }));
          return;
        }

        // Store in cache for instant back-navigation
        pageCacheRef.current.set(key, result);

        const processed = applyReadState(result.notifications);
        setNotifications(processed);
        setTotalCount(result.totalCount);

        // Prefetch next page while user reads current one
        prefetchNext(filters, result.totalCount);
      })
      .catch((err) => {
        if (controller.signal.aborted || axios.isCancel(err)) return;
        console.error("[NotificationDashboard] Fetch failed:", err);
        toastManager.add({ title: "Failed to load notifications", type: "error" });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsPaging(false);
        }
      });

    return () => {
      controller.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsPaging(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user?.id, user?.vendor_id]);

  // ─── Clear cache when tab or search changes ────────────────────────────────
  // (Page changes keep the cache; tab/search changes invalidate everything)
  const prevTabSearchRef = useRef({ tab: filters.tab, search: filters.search });
  useEffect(() => {
    const prev = prevTabSearchRef.current;
    if (prev.tab !== filters.tab || prev.search !== filters.search) {
      pageCacheRef.current.clear();
      prevTabSearchRef.current = { tab: filters.tab, search: filters.search };
    }
  }, [filters.tab, filters.search]);

  // ─── FCM new notification → clear cache + go to page 1 ───────────────────
  useEffect(() => {
    const newId = reduxNotifications[0]?.id;
    if (
      newId !== undefined &&
      lastReduxIdRef.current !== undefined &&
      newId !== lastReduxIdRef.current
    ) {
      pageCacheRef.current.clear(); // stale data
      setFilters((f) => ({ ...f, page: 1 }));
    }
    lastReduxIdRef.current = newId;
  }, [reduxNotifications]);

  // ─── Auto bulk-mark visible items as read ─────────────────────────────────
  useEffect(() => {
    if (!user?.id || notifications.length === 0) return;

    const unread = notifications.filter(
      (item) => !item.is_read && !markedIdsRef.current.has(item.id),
    );
    if (unread.length === 0) return;

    unread.forEach((item) => {
      markedIdsRef.current.add(item.id);
      dispatch(markNotificationRead(item.id));
    });

    const ids = unread.map((item) => item.id);
    markNotificationsReadBulk(ids, user.id).catch(() => {
      ids.forEach((id) => markedIdsRef.current.delete(id));
      pageCacheRef.current.clear();
      setFilters((f) => ({ ...f }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, user?.id]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: value, page: 1 }));
    }, 450);
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    setFilters((f) => ({ ...f, tab, page: 1 }));
  }, []);

  const goToPrevPage = useCallback(() =>
    setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) })), []);

  const goToNextPage = useCallback((totalPages: number) =>
    setFilters((f) => ({ ...f, page: Math.min(totalPages, f.page + 1) })), []);

  const handleNotificationClick = useCallback(async (notification: NotificationItem) => {
    if (user?.id && !notification.is_read) {
      dispatch(markNotificationRead(notification.id));
      setNotifications((curr) =>
        curr.map((item) => item.id === notification.id ? { ...item, is_read: true } : item),
      );
      try {
        await markReadApi(notification.id, user.id);
      } catch {
        pageCacheRef.current.clear();
        setFilters((f) => ({ ...f }));
      }
    }

    if (notification.type === "APPROVAL" && notification.redirect_url) {
      const url = new URL(notification.redirect_url, window.location.origin);
      const taskId = Number(url.searchParams.get("taskId"));
      const leadId = Number(url.searchParams.get("leadId"));
      if (taskId && leadId) {
        setApprovalModalData({ leadId, taskId });
        return;
      }
    }

    if (notification.redirect_url) {
      /^https?:\/\//i.test(notification.redirect_url)
        ? window.location.assign(notification.redirect_url)
        : router.push(notification.redirect_url);
    }
  }, [user?.id, dispatch, router]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const groupedEntries   = useMemo(() => groupNotificationsByDate(notifications), [notifications]);
  const hasNotifications = notifications.length > 0;
  const totalPages       = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart        = totalCount === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const pageEnd          = Math.min(filters.page * PAGE_SIZE, totalCount);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Notifications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
        <div className="w-full">

          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated with your latest activities and updates
            </p>
          </motion.div>

          {/* Tabs + Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex space-x-6 overflow-x-auto pb-px scrollbar-none">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={cn(
                    "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none whitespace-nowrap",
                    filters.tab === id ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {filters.tab === id && (
                    <motion.div
                      layoutId="activeNotificationTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72 mb-3 md:mb-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground",
                  "placeholder:text-muted-foreground/50",
                  "shadow-sm outline-none",
                  "transition-[border-color,box-shadow] duration-150",
                  "focus:border-ring/60 focus:ring-2 focus:ring-ring/20",
                )}
              />
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">

            {/* Initial full-page spinner (no data yet) */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
                <p className="text-sm text-muted-foreground">Loading notifications</p>
              </motion.div>
            )}

            {/* Empty state */}
            {!isLoading && !hasNotifications && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {searchInput
                    ? <Search className="h-6 w-6 text-muted-foreground" />
                    : <CheckCheck className="h-6 w-6 text-muted-foreground" />}
                </div>
                <h3 className="font-medium">
                  {searchInput ? "No results found" : "You're all caught up"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground text-center px-4">
                  {searchInput
                    ? `No notifications found matching "${searchInput}"`
                    : "No new notifications to show"}
                </p>
              </motion.div>
            )}

            {/* Notification list — stays visible during pagination with a subtle overlay */}
            {!isLoading && hasNotifications && (
              <motion.div
                key={`${filters.tab}-${filters.search}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="relative space-y-8"
              >
                {/* Paging overlay — keeps content visible, just dims it slightly */}
                {isPaging && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center pt-16 rounded-lg bg-background/60 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
                      <p className="text-xs text-muted-foreground">Loading page {filters.page}</p>
                    </div>
                  </div>
                )}

                {groupedEntries.map(([dateGroup, groupNotifs]) => (
                  <div key={dateGroup} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {dateGroup}
                      </h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="space-y-2">
                      {groupNotifs.map((notification) => {
                        const config     = notification.type ? TYPE_CONFIG[notification.type] : null;
                        const Icon       = config?.Icon ?? Bell;
                        const senderName = notification.sender?.user_name;

                        return (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "group relative w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/50",
                              !notification.is_read && "border-foreground/10 bg-accent/30",
                            )}
                          >
                            <div className="flex gap-3">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarFallback className="text-xs font-medium bg-muted">
                                    {getInitial(senderName) || <Icon className="h-4 w-4" />}
                                  </AvatarFallback>
                                </Avatar>
                                {config && (
                                  <div className="absolute bottom-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-muted">
                                    <Icon className={cn("h-2.5 w-2.5", config.color)} />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className={cn("text-sm leading-tight", !notification.is_read ? "font-medium" : "font-normal")}>
                                    {notification.title || "Notification"}
                                  </h3>
                                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                                    {getRelativeTime(notification.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {senderName && (
                                    <span className="text-xs text-muted-foreground">{senderName}</span>
                                  )}
                                  {config && (
                                    <>
                                      {senderName && <span className="text-muted-foreground/40">•</span>}
                                      <span className={cn("text-xs font-medium", config.color)}>
                                        {config.label}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Unread dot */}
                              {!notification.is_read && (
                                <div className="absolute right-3 top-3">
                                  <Circle className="h-2 w-2 fill-foreground text-foreground" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {pageStart}–{pageEnd} of {totalCount} notifications
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={goToPrevPage}
                      disabled={filters.page <= 1 || isPaging}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <span className="min-w-[88px] text-center text-sm text-muted-foreground">
                      Page {filters.page} of {totalPages}
                    </span>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => goToNextPage(totalPages)}
                      disabled={filters.page >= totalPages || isPaging}
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <ApprovalRequestActionModal
        open={!!approvalModalData}
        onOpenChange={(open) => {
          if (!open) setApprovalModalData(null);
        }}
        data={approvalModalData || undefined}
      />
    </>
  );
}
