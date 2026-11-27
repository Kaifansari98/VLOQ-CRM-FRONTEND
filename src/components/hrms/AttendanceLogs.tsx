"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Calendar, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock3, Coffee, CreditCard, Download, FileClock, LogIn, LogOut, Map as MapIcon, MapPin, Monitor, Navigation, PencilLine, RefreshCw, Search, ShieldCheck, Smartphone, Users, X } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomeDatePicker from "@/components/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { attendanceDate, formatDuration, workMilliseconds } from "@/lib/hrms/attendance";
import { attendanceLogCsv, logDuration, logStatuses, logTime, shiftLogDate, titleCase, type AttendanceLogEvent, type AttendanceLogRow, type LogStatus } from "@/lib/hrms/attendance-logs";
import { exportAttendanceLogs, useAttendanceLogDetail, useAttendanceLogs, useHrmsAttendance } from "@/api/hrms-attendance";
import { ViewAttendanceMapModal } from "./ViewAttendanceMapModal";

const PAGE_SIZE = 20;
const colors: Record<LogStatus, string> = {
  WORKING: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ON_BREAK: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  MISSING_PUNCH: "bg-red-500/10 text-red-700 dark:text-red-300",
  NO_RECORD: "bg-muted text-muted-foreground",
};
const sourceIcons = { MANUAL: Monitor, PHONE: Smartphone, CARD: CreditCard };
const emptyCounts: Record<LogStatus, number> = { WORKING: 0, ON_BREAK: 0, COMPLETED: 0, MISSING_PUNCH: 0, NO_RECORD: 0 };
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
const dateLabel = (date: string, long = false) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: long ? "long" : "short", ...(long ? { year: "numeric" as const } : {}) }).format(new Date(`${date}T12:00:00Z`));
const employeeLine = (employee: AttendanceLogRow["employee"]) => [employee.designation, employee.role].filter(Boolean).join(" · ");

function PageHeader() {
  return <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4"><div className="flex items-center gap-2"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" /><Breadcrumb><BreadcrumbList><BreadcrumbItem className="hidden sm:block"><BreadcrumbPage>HRMS Management</BreadcrumbPage></BreadcrumbItem><BreadcrumbSeparator className="hidden sm:block" /><BreadcrumbItem><BreadcrumbPage>Attendance Logs</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb></div><div className="flex items-center gap-2"><NotificationBell /><AnimatedThemeToggler /></div></header>;
}
function StatusBadge({ status }: { status: LogStatus }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium", colors[status])}><span className={cn("size-1.5 rounded-full bg-current", status === "WORKING" && "animate-pulse motion-reduce:animate-none")} />{logStatuses[status]}</span>;
}

export default function AttendanceLogs() {
  const user = useAppSelector(state => state.auth.user);
  const role = String(user?.user_type?.user_type || user?.user_role || "").trim().toLowerCase().replace(/[ _]+/g, "-");
  const timeZone = useMemo(() => {
    const candidate = user?.vendor?.time_zone_master?.time_zone_name || user?.vendor?.time_zone || "Asia/Kolkata";
    try { new Intl.DateTimeFormat("en", { timeZone: candidate }); return candidate; } catch { return "Asia/Kolkata"; }
  }, [user]);
  if (!user) return <><PageHeader /><p role="status" className="p-8 text-sm text-muted-foreground">Loading attendance workspace…</p></>;
  if (role !== "super-admin" || user.vendor?.is_hrms_master_enabled !== true) return <><PageHeader /><div className="m-6 rounded-2xl border bg-background p-10 text-center"><ShieldCheck className="mx-auto mb-4 size-9 text-muted-foreground" /><h1 className="text-xl font-semibold">Attendance Logs</h1><p className="mt-2 text-sm text-muted-foreground">{role !== "super-admin" ? "This workspace is available to your company’s super admins." : "Enable HRMS for your vendor to access this workspace."}</p></div></>;
  return <><PageHeader /><AttendanceLogsWorkspace vendorId={user.vendor_id ?? user.vendor?.id} vendorName={user.vendor.vendor_name || "Your company"} timeZone={timeZone} /></>;
}

function AttendanceLogsWorkspace({ vendorId, vendorName, timeZone: profileTimeZone }: { vendorId?: number; vendorName: string; timeZone: string }) {
  const [today, setToday] = useState("");
  const [period, setPeriod] = useState("today");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [role, setRole] = useState("all");
  const [unit, setUnit] = useState("all");
  const [status, setStatus] = useState<"all" | LogStatus>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Map<string, AttendanceLogRow>>(new Map());
  const [detail, setDetail] = useState<AttendanceLogRow | null>(null);
  const [tab, setTab] = useState("daily");
  const [exporting, setExporting] = useState(false);
  useEffect(() => { const day = attendanceDate(new Date(), profileTimeZone); setToday(day); setStart(day); setEnd(day); }, [profileTimeZone]);
  useEffect(() => { const timer = window.setTimeout(() => setQuery(search.trim()), 300); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { setPage(1); setSelected(new Map()); }, [start, end, query, location, role, unit, status]);

  const invalidRange = !!start && !!end && start > end;
  const filters = { from: start, to: end, search: query, location, role, unit, status, page, page_size: pageSize };
  const logs = useAttendanceLogs(vendorId, filters, !!start && !!end && !invalidRange);
  const data = logs.data;
  const timeZone = data?.vendor_time_zone || profileTimeZone;
  const rows = data?.rows ?? [];
  const counts = data?.counts ?? emptyCounts;
  const total = data?.total ?? 0;
  const pageCount = data?.total_pages ?? 1;
  const currentPage = data?.page ?? page;
  const scopedTotal = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const selectedRows = Array.from(selected.values());
  const allVisible = rows.length > 0 && rows.every(row => selected.has(row.id));
  const loadError = logs.isError ? (logs.error as any)?.response?.data?.message || "Could not load attendance logs." : null;
  const locationLabels = new Map((data?.filters.locations ?? []).map(item => [item.value, item.label]));

  const [monthSearch, setMonthSearch] = useState("");

  const monthsList = useMemo(() => {
    if (!today) return [];
    const [curYear, curMonth] = today.split("-").map(Number);
    // Months of the current year up to current month, with current month on top
    const list: { key: string; label: string; year: number; month: number; start: string; end: string }[] = [];
    for (let m = curMonth; m >= 1; m--) {
      const date = new Date(Date.UTC(curYear, m - 1, 1));
      const monthKey = `${curYear}-${String(m).padStart(2, "0")}`;
      const lastDay = new Date(Date.UTC(curYear, m, 0)).getUTCDate();
      const monthName = new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", month: "long", year: "numeric" }).format(date);
      const isCurrent = m === curMonth;
      list.push({
        key: monthKey,
        label: isCurrent ? `${monthName} (Current)` : monthName,
        year: curYear,
        month: m,
        start: `${monthKey}-01`,
        end: isCurrent ? today : `${monthKey}-${String(lastDay).padStart(2, "0")}`,
      });
    }
    return list;
  }, [today]);

  const filteredMonths = useMemo(() => {
    if (!monthSearch.trim()) return monthsList;
    return monthsList.filter(m => m.label.toLowerCase().includes(monthSearch.toLowerCase().trim()));
  }, [monthsList, monthSearch]);

  const activeFilters = !!search || location !== "all" || role !== "all" || unit !== "all" || status !== "all" || period !== "today";
  const reset = () => { setSearch(""); setLocation("all"); setRole("all"); setUnit("all"); setStatus("all"); setPeriod("today"); setStart(today); setEnd(today); };
  const changePeriod = (value: string) => {
    setPeriod(value);
    if (!today || value === "custom") return;
    if (value === "yesterday") {
      const y = shiftLogDate(today, -1);
      setStart(y);
      setEnd(y);
    } else if (value === "week") {
      setStart(shiftLogDate(today, -6));
      setEnd(today);
    } else if (value.startsWith("month_")) {
      const selectedMonthKey = value.replace("month_", "");
      const found = monthsList.find(m => m.key === selectedMonthKey);
      if (found) {
        setStart(found.start);
        setEnd(found.end);
      }
    } else {
      setStart(today);
      setEnd(today);
    }
  };
  const exportRecords = async () => {
    setExporting(true);
    try {
      const records = selectedRows.length ? selectedRows : await exportAttendanceLogs(filters);
      if (!records.length) return;
      const url = URL.createObjectURL(new Blob(["﻿", attendanceLogCsv(records)], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `attendance-logs-${start}-${end}.csv`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) { toastManager.add({ title: error?.response?.data?.message || "Could not export attendance logs.", type: "error" }); }
    finally { setExporting(false); }
  };
  const toggleRows = (items: AttendanceLogRow[], checked: boolean) => setSelected(previous => { const next = new Map(previous); items.forEach(row => checked ? next.set(row.id, row) : next.delete(row.id)); return next; });

  return <main className="flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8"><div className="mx-auto flex max-w-[1440px] flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Company attendance workspace</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Attendance Logs</h1><p className="mt-2 text-sm text-muted-foreground">A clear view of your people, their workdays, and every attendance event.</p></div><Button className="gap-2" disabled={!total || exporting} onClick={exportRecords}><Download className="size-4" />{exporting ? "Preparing…" : selectedRows.length ? `Export ${selectedRows.length} selected` : "Export CSV"}</Button></div>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-primary/5 p-2"><Building2 className="size-4 text-muted-foreground" /></span><div><p className="break-words text-sm font-semibold">{vendorName}</p><p className="mt-0.5 text-[11px] text-muted-foreground">Super admin workspace · Company-wide view</p></div></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{timeZone}<span className="mx-1">·</span><span>{data ? `Updated ${logTime(data.server_time, timeZone)}` : "Loading…"}</span><Button variant="ghost" size="icon" className="size-7" aria-label="Refresh attendance logs" disabled={logs.isFetching} onClick={() => logs.refetch()}><RefreshCw className={cn("size-3.5", logs.isFetching && "animate-spin motion-reduce:animate-none")} /></Button></div></div>
    {loadError && <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>{loadError}</p></div>}

    <section className="rounded-xl border bg-background p-4 shadow-sm" aria-label="Attendance log filters">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input aria-label="Search employees" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search employee name, role or designation…" className="h-9 pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-44 justify-between font-normal text-foreground">
                <span className="flex items-center gap-2 truncate">
                  <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {period === "today"
                      ? "Today"
                      : period === "yesterday"
                      ? "Yesterday"
                      : period === "week"
                      ? "This week"
                      : period === "custom"
                      ? "Custom range"
                      : period.startsWith("month_")
                      ? monthsList.find(m => m.key === period.replace("month_", ""))?.label || "Select month"
                      : "Today"}
                  </span>
                </span>
                <ChevronRight className="size-3.5 rotate-90 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1">
              <DropdownMenuItem onClick={() => changePeriod("today")}>
                <span className="flex-1">Today</span>
                {period === "today" && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePeriod("yesterday")}>
                <span className="flex-1">Yesterday</span>
                {period === "yesterday" && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changePeriod("week")}>
                <span className="flex-1">This week</span>
                {period === "week" && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer [&>svg]:hidden">
                  <span className="flex-1">Select Month</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 rounded-xl p-2 shadow-xl border bg-popover">
                  <div className="mb-2 px-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search month..."
                        value={monthSearch}
                        onChange={e => setMonthSearch(e.target.value)}
                        className="h-8 pl-8 pr-2 text-xs bg-muted/40 rounded-lg focus-visible:ring-1"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredMonths.map(m => {
                      const isSelected = period === `month_${m.key}`;
                      return (
                        <DropdownMenuItem
                          key={m.key}
                          onClick={() => changePeriod(`month_${m.key}`)}
                          className={cn("text-xs flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors", isSelected ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted")}
                        >
                          <span className="truncate">{m.label}</span>
                          {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                        </DropdownMenuItem>
                      );
                    })}
                    {!filteredMonths.length && (
                      <p className="py-3 text-center text-xs text-muted-foreground">No month found</p>
                    )}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={() => changePeriod("custom")}>
                <span className="flex-1">Custom range</span>
                {period === "custom" && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="text-xs text-muted-foreground">{start && end ? start === end ? dateLabel(start, true) : `${dateLabel(start)} – ${dateLabel(end, true)}` : "Loading dates…"}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">{[
        { label: "Location", value: location, set: setLocation, options: (data?.filters.locations ?? []).map(item => ({ value: item.value, label: item.label })), all: "All locations" },
        { label: "Role", value: role, set: setRole, options: (data?.filters.roles ?? []).map(value => ({ value, label: value })), all: "All roles" },
        { label: "Unit type", value: unit, set: setUnit, options: ["BRANCH", "FRANCHISE", "FACTORY"].map(value => ({ value, label: titleCase(value) })), all: "All unit types" },
      ].map(filter => <div key={filter.label} className="min-w-36 flex-1 space-y-1.5 lg:max-w-56"><Label className="text-[11px] text-muted-foreground">{filter.label}</Label><Select value={filter.value} onValueChange={filter.set}><SelectTrigger aria-label={`Filter ${filter.label.toLowerCase()}`} className="h-9 w-full"><SelectValue>{filter.value === "all" ? filter.all : filter.options.find(option => option.value === filter.value)?.label ?? locationLabels.get(filter.value) ?? filter.value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">{filter.all}</SelectItem>{filter.options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>)}{activeFilters && <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs text-muted-foreground" onClick={reset}><X className="size-3.5" />Clear filters</Button>}</div>
      {period === "custom" && <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:max-w-lg"><div className="space-y-1.5"><Label htmlFor="logs-from" className="text-xs">From date</Label><CustomeDatePicker value={start} onChange={val => setStart(val || "")} className="h-10 w-full" placeholder="Select from date" dateFormat="dd MMM yyyy" restriction="pastOnly" /></div><div className="space-y-1.5"><Label htmlFor="logs-to" className="text-xs">To date</Label><CustomeDatePicker value={end} onChange={val => setEnd(val || "")} className="h-10 w-full" placeholder="Select to date" dateFormat="dd MMM yyyy" minDate={start || undefined} restriction="pastOnly" /></div><p className="text-[11px] text-muted-foreground sm:col-span-2">Ranges can cover up to {data?.range.max_days ?? 31} days.</p></div>}
      {invalidRange && <p role="alert" className="mt-3 text-xs text-destructive">The start date must be on or before the end date.</p>}
    </section>

    <section aria-label="Attendance overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
      { label: "Employees in view", value: String(data?.overview.employees ?? 0).padStart(2, "0"), hint: "Across your selected filters", icon: Users, color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
      { label: "Recorded check-ins", value: String(data?.overview.check_ins ?? 0).padStart(2, "0"), hint: "Attendance records with a punch", icon: CheckCheck, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
      { label: "Needs review", value: String(data?.overview.needs_review ?? 0).padStart(2, "0"), hint: "Records with a missing check-out", icon: FileClock, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
      { label: "Net work time", value: logDuration(data?.overview.work_minutes ?? 0), hint: "Excludes breaks and missing punches", icon: Clock3, color: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
    ].map(card => <div key={card.label} className="rounded-xl border bg-background p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{card.label}</p><span className={cn("rounded-lg p-2", card.color)}><card.icon className="size-4" /></span></div><p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{data ? card.value : "—"}</p><p className="mt-1 text-[11px] text-muted-foreground">{card.hint}</p></div>)}</section>

    <Tabs value={tab} onValueChange={value => { setTab(value); setSelected(new Map()); }} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="daily" className="gap-1.5 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"><FileClock className="size-3.5" />Attendance records</TabsTrigger>
          <TabsTrigger value="employees" className="gap-1.5 px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"><Users className="size-3.5" />Employee summary</TabsTrigger>
        </TabsList>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            aria-label="Search employee by name"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search employee by name…"
            className="h-9 pl-8.5 pr-8 text-xs bg-background rounded-lg border shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear employee search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <div role="group" aria-label="Attendance status" className="flex gap-1 overflow-x-auto rounded-xl border bg-background p-1.5">{([{ value: "all", label: "All records", count: scopedTotal }, ...Object.entries(logStatuses).map(([value, label]) => ({ value: value as LogStatus, label, count: counts[value as LogStatus] }))] as { value: "all" | LogStatus; label: string; count: number }[]).map(item => <button key={item.value} type="button" aria-pressed={status === item.value} onClick={() => setStatus(item.value)} className={cn("flex min-h-9 shrink-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", status === item.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")}><span>{item.label}</span><span className={cn("rounded px-1.5 py-0.5 text-[10px] tabular-nums", status === item.value ? "bg-primary-foreground/15" : "bg-muted")}>{item.count}</span></button>)}</div>

      <TabsContent value="daily" className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b px-4 py-3"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">Attendance records</h2><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{total}</span></div>{selectedRows.length ? <div className="flex items-center gap-3 text-xs"><span className="font-medium">{selectedRows.length} selected</span><button type="button" className="text-muted-foreground underline underline-offset-2" onClick={() => setSelected(new Map())}>Clear selection</button></div> : <p className="text-[11px] text-muted-foreground">Select records to export, or open a log for its full history.</p>}</div>
        <div className={cn("overflow-x-auto transition-opacity", logs.isFetching && logs.isPlaceholderData && "opacity-60")}><table className="w-full min-w-[1060px] text-left text-xs"><thead className="border-b bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="w-10 px-4 py-3"><Checkbox aria-label="Select visible records" checked={allVisible ? true : rows.some(row => selected.has(row.id)) ? "indeterminate" : false} disabled={!rows.length} onCheckedChange={value => toggleRows(rows, value === true)} /></th>{["Employee", "Date", "Location / unit", "In / Out", "Break", "Net work time", "Status", "Log"].map(label => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y">{rows.map(row => {
          const Source = row.source ? sourceIcons[row.source] : Monitor;
          return <tr key={row.id} className={cn("transition-colors hover:bg-muted/20", selected.has(row.id) && "bg-primary/5")}><td className="px-4 py-4"><Checkbox aria-label={`Select ${row.employee.name} on ${row.date}`} checked={selected.has(row.id)} onCheckedChange={value => toggleRows([row], value === true)} /></td><td className="px-3 py-4"><div className="flex items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted/50 text-[11px] font-semibold text-muted-foreground">{initials(row.employee.name)}</span><div><p className="whitespace-nowrap font-semibold">{row.employee.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{employeeLine(row.employee)}</p></div></div></td><td className="px-3 py-4"><p className="whitespace-nowrap font-medium">{dateLabel(row.date)}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.date === data?.range.today ? "Today" : new Intl.DateTimeFormat("en", { timeZone: "UTC", weekday: "short" }).format(new Date(`${row.date}T12:00:00Z`))}</p></td><td className="px-3 py-4"><p className="whitespace-nowrap">{row.employee.location}</p><p className="mt-1 text-[10px] tracking-wide text-muted-foreground">{[row.employee.unit, row.work_location && titleCase(row.work_location)].filter(Boolean).join(" · ") || "—"}</p></td><td className="px-3 py-4"><p className="whitespace-nowrap tabular-nums">{logTime(row.check_in, row.time_zone)} <span className="mx-0.5 text-muted-foreground">/</span> {logTime(row.check_out, row.time_zone)}</p>{row.source && <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Source className="size-3" />{titleCase(row.source)}</p>}</td><td className="px-3 py-4 tabular-nums text-muted-foreground">{row.attendance_id ? `${row.break_minutes}m` : "—"}</td><td className="px-3 py-4"><p className="whitespace-nowrap font-medium tabular-nums">{row.work_minutes === null ? "—" : logDuration(row.work_minutes)}</p>{row.corrected && <span className="mt-1 flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-300"><PencilLine className="size-2.5" />Corrected</span>}</td><td className="px-3 py-4"><StatusBadge status={row.status} /></td><td className="px-3 py-4"><Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" aria-label={`View attendance for ${row.employee.name} on ${row.date}`} onClick={() => setDetail(row)}>View<ChevronRight className="size-3.5" /></Button></td></tr>;
        })}</tbody></table></div>
        {logs.isPending && !invalidRange ? <p role="status" className="px-4 py-14 text-center text-sm text-muted-foreground">Loading attendance records…</p> : !total && <EmptyState invalidRange={invalidRange} onClear={reset} />}
        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t p-3 sm:flex-row sm:gap-8">
          <div className="text-xs text-muted-foreground">
            {total ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, total)} of ${total} record(s)` : "0 records"}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-xs font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem] text-xs">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center text-xs font-medium">
              Page {currentPage} of {pageCount}
            </div>

            <div className="flex items-center space-x-1.5">
              <Button
                aria-label="Go to first page"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(1)}
                disabled={currentPage <= 1}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                aria-label="Go to previous page"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                aria-label="Go to next page"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(Math.min(currentPage + 1, pageCount))}
                disabled={currentPage >= pageCount}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                aria-label="Go to last page"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(pageCount)}
                disabled={currentPage >= pageCount}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="employees" className="overflow-hidden rounded-xl border bg-background shadow-sm"><div className="border-b px-4 py-4"><h2 className="text-sm font-semibold">Employee summary</h2><p className="mt-1 text-[11px] text-muted-foreground">Totals for the selected records. Average workday includes completed days only.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="border-b bg-muted/30 text-[10px] uppercase tracking-wide text-muted-foreground"><tr>{["Employee", "Role", "Days recorded", "Completed", "Missing punches", "Total work", "Avg. completed day", ""].map((label, index) => <th key={index} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y">{(data?.summary ?? []).map(item => <tr key={item.employee.id} className="hover:bg-muted/20"><td className="px-4 py-4"><p className="font-semibold">{item.employee.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{[item.employee.designation, item.employee.location].filter(Boolean).join(" · ")}</p></td><td className="px-4 py-4 text-muted-foreground">{item.employee.role}</td><td className="px-4 py-4 tabular-nums">{item.recorded}</td><td className="px-4 py-4 tabular-nums">{item.completed}</td><td className="px-4 py-4 tabular-nums">{item.missing}</td><td className="px-4 py-4 font-medium tabular-nums">{logDuration(item.work_minutes)}</td><td className="px-4 py-4 tabular-nums">{item.average_minutes === null ? "—" : logDuration(item.average_minutes)}</td><td className="px-4 py-4"><Button variant="ghost" size="sm" onClick={() => setDetail(item.latest)}>Latest log</Button></td></tr>)}</tbody></table></div>{!data?.summary.length && !logs.isPending && <EmptyState invalidRange={invalidRange} onClear={reset} />}</TabsContent>
    </Tabs>

    <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /><p>Only your company’s attendance is shown. Work time excludes breaks; open sessions older than 16 hours are flagged as missing punches for review instead of being treated as absences. “No record” marks active employees without a check-in that day.</p></div>
  </div>

  <AttendanceLogDialog vendorId={vendorId} row={detail} timeZone={timeZone} onClose={() => setDetail(null)} />
  </main>;
}

function eventView(event: AttendanceLogEvent, timeZone: string) {
  const by = event.actor ? ` · by ${event.actor}` : "";
  if (event.action === "IN") return { kind: "in", label: "Checked in", note: `${titleCase(event.source)} punch${by}` };
  if (event.action === "OUT") return { kind: "out", label: "Checked out", note: `Workday completed${by}` };
  if (event.action === "BREAK_START") return { kind: "break", label: "Break started", note: `Employee started a break${by}` };
  if (event.action === "BREAK_END") return { kind: "break", label: "Break ended", note: `Returned to work${by}` };
  const change = (label: string, key: "check_in" | "check_out") => event.before?.[key] !== event.after?.[key] ? `${label} ${logTime(event.before?.[key], timeZone)} → ${logTime(event.after?.[key], timeZone)}` : null;
  const note = [event.correction && `${event.actor || "Admin"} approved ${event.correction.requested_by}'s request`, change("In", "check_in"), change("Out", "check_out"), event.correction && `Reason: ${event.correction.reason}`].filter(Boolean).join(" · ");
  return { kind: "correction", label: "Attendance corrected", note };
}

function AttendanceLogDialog({ vendorId, row, timeZone: fallbackTimeZone, onClose }: { vendorId?: number; row: AttendanceLogRow | null; timeZone: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"log" | "calendar">("log");
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => row?.date ? row.date.slice(0, 7) : "");

  useEffect(() => {
    if (row?.date) {
      setSelectedMonth(row.date.slice(0, 7));
      setActiveTab("log");
    }
  }, [row]);

  const detail = useAttendanceLogDetail(vendorId, row?.attendance_id ?? null);
  const userWorkspace = useHrmsAttendance(vendorId, row?.employee.id, selectedMonth || undefined);

  const record = detail.data && detail.data.attendance_id === row?.attendance_id ? detail.data : row;
  const timeZone = record?.time_zone || fallbackTimeZone;
  const events = detail.data && detail.data.attendance_id === row?.attendance_id ? detail.data.events : [];

  // Monthly calendar calculation for this specific employee (Sunday to Saturday)
  const calendarData = useMemo(() => {
    if (!selectedMonth) return { days: [], offset: 0 };
    const [year, monthNumber] = selectedMonth.split("-").map(Number);
    const startDayOfWeek = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay(); // 0 is Sunday
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return `${selectedMonth}-${String(day).padStart(2, "0")}`;
    });
    return { days, offset: startDayOfWeek };
  }, [selectedMonth]);

  const monthEntries = userWorkspace.data?.entries ?? [];
  const todayStr = attendanceDate(new Date(), timeZone);

  const { totalPresent, totalAbsent } = useMemo(() => {
    let present = 0;
    let absent = 0;
    for (const d of calendarData.days) {
      if (d > todayStr) continue; // Future dates don't count towards past present/absent
      const isPresent = monthEntries.some(item => item.date === d);
      if (isPresent) {
        present++;
      } else {
        absent++;
      }
    }
    return { totalPresent: present, totalAbsent: absent };
  }, [calendarData.days, monthEntries, todayStr]);

  return <Dialog open={!!row} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl lg:max-w-5xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"><DialogHeader><DialogTitle className="flex items-center justify-between pr-6"><span>Employee Attendance</span><div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5"><Button variant={activeTab === "log" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs font-medium" onClick={() => setActiveTab("log")}><FileClock className="mr-1.5 size-3.5" />Daily Log</Button><Button variant={activeTab === "calendar" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs font-medium" onClick={() => setActiveTab("calendar")}><Calendar className="mr-1.5 size-3.5" />Monthly Calendar</Button></div></DialogTitle><DialogDescription>{record ? `${dateLabel(record.date, true)} · ${timeZone}` : ""}</DialogDescription></DialogHeader>{record && <>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full border bg-background text-sm font-semibold">{initials(record.employee.name)}</span>
        <div>
          <p className="text-base font-semibold">{record.employee.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{employeeLine(record.employee)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {((record as any)?.latitude || (events as any[]).some(e => e.latitude)) && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
            onClick={() => setShowMapModal(true)}
          >
            <MapIcon className="size-3.5" />
            View on Map
          </Button>
        )}
        <StatusBadge status={record.status} />
      </div>
    </div>

    {activeTab === "log" ? (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{[record.employee.location, record.employee.unit && titleCase(record.employee.unit)].filter(Boolean).join(" · ")}</span>{record.work_location && <span className="flex items-center gap-1.5"><Building2 className="size-3.5" />Worked from {titleCase(record.work_location)}</span>}</div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-4">{[{ label: "Check in", value: logTime(record.check_in, timeZone) }, { label: "Check out", value: logTime(record.check_out, timeZone) }, { label: "Break time", value: record.attendance_id ? logDuration(record.break_minutes) : "—" }, { label: "Net work time", value: record.work_minutes === null ? "—" : logDuration(record.work_minutes) }].map(item => <div key={item.label}><dt className="text-[11px] text-muted-foreground">{item.label}</dt><dd className="mt-1.5 text-sm font-semibold tabular-nums">{item.value}</dd></div>)}</dl>
        {record.status === "MISSING_PUNCH" && <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">A check-in exists without a check-out. Net work time is not calculated until the record is corrected.</p>}
        <div><h3 className="mb-4 text-sm font-semibold">Punch & audit timeline</h3>{!record.attendance_id ? <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">No attendance events recorded for this day.</div>
          : detail.isPending ? <p role="status" className="py-6 text-center text-sm text-muted-foreground">Loading timeline…</p>
          : detail.isError ? <p role="alert" className="py-6 text-center text-sm text-destructive">{(detail.error as any)?.response?.data?.message || "Could not load the timeline."}</p>
          : <ol>{events.map((event, index) => {
            const view = eventView(event, timeZone);
            const Icon = view.kind === "in" ? LogIn : view.kind === "out" ? LogOut : view.kind === "break" ? Coffee : PencilLine;
            return <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">{index < events.length - 1 && <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-28px)] w-px bg-border" />}<span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border bg-background", view.kind === "correction" && "border-blue-500/30 text-blue-600 dark:text-blue-300")}><Icon className="size-3.5" /></span><div className="flex flex-1 justify-between gap-3 pt-1"><div><p className="text-xs font-medium">{view.label}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{view.note}</p></div><span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{logTime(event.time, timeZone)}</span></div></li>;
          })}</ol>}</div>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/10 p-3">
          <div>
            <h4 className="text-sm font-semibold">Attendance Calendar</h4>
            <p className="text-xs text-muted-foreground">View all check-in/outs for {record.employee.name}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs shadow-2xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Present: {totalPresent}
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                <span className="size-1.5 rounded-full bg-rose-500" />
                Absent: {totalAbsent}
              </span>
            </div>
            <MonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              maxMonth={todayStr.slice(0, 7)}
              isLoading={userWorkspace.isFetching}
            />
          </div>
        </div>

        {userWorkspace.isPending ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading calendar data…</p>
        ) : (
          <div className="rounded-2xl border bg-background p-3 shadow-xs sm:p-4">
            <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <span key={day} className="py-1">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: calendarData.offset }, (_, index) => (
                <div key={`blank-${index}`} className="min-h-20 rounded-xl bg-muted/10 sm:min-h-24" />
              ))}
              {calendarData.days.map(date => {
                const dayNumber = Number(date.slice(-2));
                const dayEntries = monthEntries.filter(item => item.date === date);
                const isToday = date === todayStr;
                const isFuture = date > todayStr;
                const isSelected = date === record.date;
                const isPresent = dayEntries.length > 0;
                const isAbsent = !isFuture && !isPresent;

                // Calculate total worked ms across all sessions on this day
                // If a past session was left open without checkout, cap its duration to the end of that day (23:59:59)
                // so it doesn't leak into subsequent days (e.g. 45+ hours).
                const dayEndTs = new Date(`${date}T23:59:59.999Z`).getTime();
                const totalWorkMs = isPresent
                  ? dayEntries.reduce((acc, entry) => {
                      const start = Date.parse(entry.checkIn);
                      const rawEnd = entry.checkOut ? Date.parse(entry.checkOut) : (isToday ? Date.now() : dayEndTs);
                      const end = Math.max(start, Math.min(rawEnd, dayEndTs));
                      const breakMs = (entry.breaks || []).reduce((bAcc, pause) => {
                        const bStart = Math.max(start, Date.parse(pause.start));
                        const bEnd = Math.min(end, pause.end ? Date.parse(pause.end) : end);
                        return bAcc + Math.max(0, bEnd - bStart);
                      }, 0);
                      return acc + Math.max(0, end - start - breakMs);
                    }, 0)
                  : 0;

                // Format total work time (e.g., 3h 25m)
                const totalSec = Math.floor(totalWorkMs / 1000);
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const durationLabel = `${hrs}h ${mins}m`;

                // First check in and last check out for time range display
                const sortedEntries = [...dayEntries].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
                const firstIn = sortedEntries[0]?.checkIn;
                const lastEntry = sortedEntries[sortedEntries.length - 1];
                const lastOut = lastEntry?.checkOut;

                return (
                  <div
                    key={date}
                    className={cn(
                      "group relative flex min-h-[96px] flex-col justify-start gap-2 rounded-xl border p-2 text-left transition-all sm:min-h-[102px] sm:p-2.5",
                      isToday
                        ? "border-amber-400 bg-amber-500/5 ring-1 ring-amber-400/40 shadow-xs"
                        : isSelected
                        ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/30"
                        : isFuture
                        ? "border-dashed border-border/50 bg-muted/10 opacity-70"
                        : "border-border/70 bg-card hover:border-border hover:shadow-xs"
                    )}
                  >
                    {/* Top Row: Date Number and Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        isToday ? "bg-amber-500 font-bold text-black" : "text-foreground"
                      )}>
                        {dayNumber}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                          Today
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-[9px] font-medium text-muted-foreground/70">
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Middle Section: Status & Hours */}
                    <div className="space-y-1">
                      {isPresent && (
                        <div className="flex items-center justify-between rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-emerald-800 dark:text-emerald-200">
                          <span>Present</span>
                          <span className="font-semibold">{durationLabel}</span>
                        </div>
                      )}

                      {isAbsent && (
                        <div className="flex items-center justify-between rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-rose-800 dark:text-rose-200">
                          <span>Absent</span>
                          <span className="font-semibold">0h 0m</span>
                        </div>
                      )}

                      {isFuture && (
                        <div className="flex items-center justify-between rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/60">
                          <span>Scheduled</span>
                          <span className="font-semibold">0h 0m</span>
                        </div>
                      )}

                      {/* In - Out Breakdown / Time range */}
                      <div className="pt-0.5 text-[9px] text-muted-foreground font-mono leading-tight">
                        {isPresent ? (
                          <p className="truncate text-foreground/80 font-medium" title={`${logTime(firstIn, timeZone)} - ${lastOut ? logTime(lastOut, timeZone) : "Active"}`}>
                            {logTime(firstIn, timeZone)}{lastOut ? ` - ${logTime(lastOut, timeZone)}` : " (Active)"}
                          </p>
                        ) : (
                          <p className="truncate text-muted-foreground/60">{isFuture ? "Scheduled" : "No record"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4"><span className="text-[11px] text-muted-foreground">Read-only view · corrections go through the approval inbox</span><Button variant="outline" size="sm" onClick={onClose}>Close log</Button></div>
  </>}
  
  <ViewAttendanceMapModal
    open={showMapModal}
    onClose={() => setShowMapModal(false)}
    employeeName={record?.employee.name || "Employee"}
    date={record ? dateLabel(record.date, true) : ""}
    checkIn={{
      time: record ? logTime(record.check_in, timeZone) : undefined,
      lat: (record as any)?.latitude,
      lng: (record as any)?.longitude,
      address: (record as any)?.location_address,
    }}
    checkOut={{
      time: record?.check_out ? logTime(record.check_out, timeZone) : undefined,
      lat: (events as any[]).find(e => e.action === "OUT")?.latitude || (record as any)?.latitude,
      lng: (events as any[]).find(e => e.action === "OUT")?.longitude || (record as any)?.longitude,
      address: (events as any[]).find(e => e.action === "OUT")?.location_address,
    }}
    assignedLocation={{
      name: (record as any)?.location_name,
      address: (record as any)?.location_address,
    }}
  />
  </DialogContent></Dialog>;
}

function EmptyState({ invalidRange, onClear }: { invalidRange: boolean; onClear: () => void }) {
  return <div className="flex flex-col items-center gap-3 px-4 py-14 text-center"><FileClock className="size-9 text-muted-foreground/40" /><div><p className="text-sm font-medium">{invalidRange ? "Check your date range" : "No records match these filters"}</p><p className="mt-1 text-xs text-muted-foreground">{invalidRange ? "Choose a start date on or before the end date." : "Try another employee, location, status or date range."}</p></div><Button variant="outline" size="sm" onClick={onClear}>Reset filters</Button></div>;
}
