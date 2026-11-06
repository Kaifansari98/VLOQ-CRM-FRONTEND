"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarDays, CheckCheck, ChevronLeft, ChevronRight, Clock3, Coffee, Download, FileClock, Info, LayoutGrid, List, LogIn, LogOut, MapPin, Plus, Search, ShieldCheck, Timer } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { attendanceCsv, attendanceDate, entryStatus, formatDuration, workMilliseconds, type AttendanceEntry, type AttendanceCorrection } from "@/lib/hrms/attendance";
import { useHrmsAttendance, useAttendanceAction } from "@/api/hrms-attendance";
import AttendanceCorrectionInbox from "./AttendanceCorrectionInbox";
import { MonthPicker } from "@/components/ui/month-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import CustomeDatePicker from "@/components/date-picker";

const emptyData = { entries: [] as AttendanceEntry[], corrections: [] as AttendanceCorrection[] };
const statusStyles = {
  Working: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "On break": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Completed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

function Status({ entry }: { entry: AttendanceEntry }) {
  const status = entryStatus(entry);
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap", statusStyles[status])}>
    <span className={cn("size-1.5 rounded-full bg-current", status === "Working" && "animate-pulse motion-reduce:animate-none")} />{status}
  </span>;
}

export default function EmployeesAttendance() {
  const user = useAppSelector(state => state.auth.user);
  const [month, setMonth] = useState("");
  const workspaceQuery = useHrmsAttendance(user?.vendor_id, user?.id, month || undefined);
  const actionMutation = useAttendanceAction(user?.vendor_id, user?.id);
  const workspace = workspaceQuery.data;
  const timeZone = workspace?.vendor_time_zone || user?.vendor?.time_zone_master?.time_zone_name || user?.vendor?.time_zone || "UTC";
  const [localNow, setLocalNow] = useState<Date | null>(null);
  const offset = workspace ? Date.parse(workspace.server_time) - workspaceQuery.dataUpdatedAt : 0;
  const now = localNow ? new Date(localNow.getTime() + offset) : null;
  const [location, setLocation] = useState("Office");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [page, setPage] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState("");
  const [reason, setReason] = useState("");
  const [requestedIn, setRequestedIn] = useState("");
  const [requestedOut, setRequestedOut] = useState("");
  const [detailDate, setDetailDate] = useState<string | null>(null);

  useEffect(() => {
    setLocalNow(new Date());
    const timer = window.setInterval(() => setLocalNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ready = !!workspace && !workspaceQuery.isError && !actionMutation.isPending && !!now;
  const data = workspace ? {
    entries: workspace.current && !workspace.entries.some(entry => entry.id === workspace.current?.id)
      ? [...workspace.entries, workspace.current] : workspace.entries,
    corrections: workspace.corrections,
  } : emptyData;
  const today = now ? attendanceDate(now, timeZone) : "";
  const selectedMonth = month || today.slice(0, 7);
  const todayEntry = data.entries.find(entry => entry.date === today);
  const activeEntry = todayEntry && !todayEntry.checkOut ? todayEntry : undefined;
  const currentEntry = todayEntry;
  const onBreak = !!currentEntry?.breaks.some(pause => !pause.end);
  const clock = (stamp?: string, zone = currentEntry?.timeZone || timeZone) => stamp ? new Intl.DateTimeFormat("en-IN", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(stamp)) : "—";
  const dateLabel = (date: string, long = false) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: long ? "long" : "short", ...(long ? { year: "numeric" as const } : { weekday: "short" as const }) }).format(new Date(`${date}T12:00:00Z`));
  const isTransitioningMonth = workspaceQuery.isFetching && !!workspace?.entries.length && !workspace.entries.some(e => e.date.startsWith(selectedMonth));
  const activeDataMonth = isTransitioningMonth
    ? (workspace?.entries[0]?.date ? workspace.entries[0].date.slice(0, 7) : selectedMonth)
    : selectedMonth;

  const monthEntries = data.entries.filter(entry => entry.date.startsWith(activeDataMonth)).sort((a, b) => b.date.localeCompare(a.date));
  const completedEntries = monthEntries.filter(entry => entry.checkOut);
  const totalWork = monthEntries.reduce((total, entry) => total + (now ? workMilliseconds(entry, now) : 0), 0);
  const completedWork = completedEntries.reduce((total, entry) => total + (now ? workMilliseconds(entry, now) : 0), 0);
  const filtered = monthEntries.filter(entry => (statusFilter === "all" || entryStatus(entry) === statusFilter) &&
    (!search.trim() || `${dateLabel(entry.date, true)} ${entry.date} ${entry.location} ${entryStatus(entry)}`.toLowerCase().includes(search.trim().toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const monthCorrections = data.corrections.filter(request => request.date.startsWith(activeDataMonth)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const details = data.entries.find(entry => entry.date === detailDate);
  const calendar = useMemo(() => {
    if (!selectedMonth) return [];
    const [year, monthNumber] = selectedMonth.split("-").map(Number);
    const start = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return Array.from({ length: Math.ceil((start + days) / 7) * 7 }, (_, index) => {
      const day = index - start + 1;
      return day > 0 && day <= days ? `${selectedMonth}-${String(day).padStart(2, "0")}` : null;
    });
  }, [selectedMonth]);

  const punch = async (action: "in" | "out" | "break" | "resume") => {
    if (!ready) return;
    try {
      const actions = { in: "IN", out: "OUT", break: "BREAK_START", resume: "BREAK_END" } as const;
      await actionMutation.mutateAsync({ kind: "punch", action: actions[action], work_location: location.toUpperCase() });
      toastManager.add({ title: ({ in: "Checked in successfully", out: "Checked out successfully", break: "Break started", resume: "Break ended" })[action], type: "success" });
      if (action === "out") setCheckoutOpen(false);
    } catch (error: any) { toastManager.add({ title: error?.response?.data?.message || "Could not record attendance. Please retry.", type: "error" }); }
  };

  const moveMonth = (offset: number) => {
    const [year, number] = selectedMonth.split("-").map(Number);
    const next = new Date(Date.UTC(year, number - 1 + offset, 1));
    setMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
    setPage(1);
  };

  const exportCsv = () => {
    if (!now || !filtered.length) return;
    const url = URL.createObjectURL(new Blob(["\uFEFF", attendanceCsv(filtered, timeZone, now)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `attendance-${selectedMonth}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const requestCorrection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || !correctionDate || correctionDate > today || reason.trim().length < 10) return;
    try {
      await actionMutation.mutateAsync({ kind: "request", attendance_date: correctionDate, reason: reason.trim(), requested_check_in: requestedIn || undefined, requested_check_out: requestedOut || undefined });
      setCorrectionOpen(false); setReason(""); setRequestedIn(""); setRequestedOut("");
      toastManager.add({ title: "Correction request submitted for approval", type: "success" });
    } catch (error: any) { toastManager.add({ title: error?.response?.data?.message || "Could not submit correction.", type: "error" }); }
  };
  const cancelCorrection = async (id: number) => {
    try {
      await actionMutation.mutateAsync({ kind: "decision", id, status: "CANCELLED" });
      toastManager.add({ title: "Correction request cancelled", type: "success" });
    } catch (error: any) { toastManager.add({ title: error?.response?.data?.message || "Could not cancel correction.", type: "error" }); }
  };

  const activity = useMemo(() => {
    if (!currentEntry) return [];
    const events: { label: string; time: string; icon: any }[] = [];
    if (currentEntry.checkIn) events.push({ label: "Checked in", time: currentEntry.checkIn, icon: LogIn });
    for (const pause of currentEntry.breaks) {
      if (pause.start) events.push({ label: "Break started", time: pause.start, icon: Coffee });
      if (pause.end) events.push({ label: "Returned from break", time: pause.end, icon: Timer });
    }
    if (currentEntry.checkOut) events.push({ label: "Checked out (latest)", time: currentEntry.checkOut, icon: LogOut });
    return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [currentEntry]);

  return <>
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb><BreadcrumbList><BreadcrumbItem className="hidden sm:block"><BreadcrumbPage>HRMS Management</BreadcrumbPage></BreadcrumbItem><BreadcrumbSeparator className="hidden sm:block" /><BreadcrumbItem><BreadcrumbPage>Employees Attendance</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      </div><div className="flex items-center gap-2"><NotificationBell /><AnimatedThemeToggler /></div>
    </header>
    <main className="flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your workday, at a glance</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Employees Attendance</h1><p className="mt-2 text-sm text-muted-foreground">Stay on top of your time, breaks, and attendance records.</p></div>
          <Button variant="outline" className="gap-2 bg-background" disabled={!ready} onClick={() => { setCorrectionDate(today); setCorrectionOpen(true); }}><Plus className="size-4" />Request correction</Button>
        </div>

        {workspaceQuery.isPending && !workspace && <p role="status" className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">Loading attendance records…</p>}
        {workspaceQuery.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><p>{(workspaceQuery.error as any)?.response?.data?.message || "Could not load attendance records."}</p><Button variant="outline" size="sm" onClick={() => workspaceQuery.refetch()}>Retry</Button></div>}
        <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm sm:p-7" aria-label="Mark your attendance">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-emerald-500/5 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl border bg-muted/30 text-foreground"><CalendarCheck2 className="size-5" /></div><div><h2 className="text-sm font-semibold">{activeEntry && activeEntry.date !== today ? "Open attendance session" : "Today’s attendance"}</h2><p className="mt-1 text-xs text-muted-foreground">{today ? dateLabel(currentEntry?.date || today, true) : "Loading your workday…"}</p></div></div>
              {currentEntry ? <Status entry={currentEntry} /> : <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{workspaceQuery.isPending ? "Loading…" : "Not checked in"}</span>}
            </div>
            <div className="relative mt-7 flex flex-wrap items-end justify-between gap-5">
              <div><p className="text-xs font-medium text-muted-foreground">Net working time</p><p role="timer" aria-label="Net working time" className="mt-2 font-mono text-5xl font-medium tracking-tight tabular-nums sm:text-6xl">{ready && now && currentEntry ? formatDuration(workMilliseconds(currentEntry, now), true) : "--:--:--"}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" /><span className="tabular-nums">{now ? new Intl.DateTimeFormat("en-IN", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now) : "—"}</span><span className="mx-1">·</span>{timeZone}</p></div>
              <div className="flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">{user?.user_name?.trim().split(/\s+/).slice(0, 2).map(name => name[0]).join("") || "—"}</span><div><p className="max-w-40 truncate text-xs font-semibold">{user?.user_name || "Your account"}</p><p className="mt-0.5 max-w-40 truncate text-[11px] text-muted-foreground">{user?.vendor?.vendor_name || "Employee workspace"}</p></div></div>
            </div>
            <div className="relative mt-6 grid grid-cols-3 divide-x rounded-xl border bg-muted/10 py-3">
              {[{ label: "Check in", value: clock(currentEntry?.checkIn) }, { label: "Check out (last)", value: clock(currentEntry?.checkOut) }, { label: "Breaks taken", value: String(currentEntry?.breaks.length || 0).padStart(2, "0") }].map(item => <div key={item.label} className="px-3 text-center"><p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p><p className="mt-1.5 text-sm font-semibold tabular-nums">{item.value}</p></div>)}
            </div>
            <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5"><Label htmlFor="attendance-location" className="text-xs text-muted-foreground">Work location</Label><Select value={currentEntry?.location || location} onValueChange={setLocation} disabled={!ready || !!currentEntry}><SelectTrigger id="attendance-location" className="w-full"><span className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><SelectValue /></span></SelectTrigger><SelectContent>{[...(currentEntry?.location === "Unspecified" ? ["Unspecified"] : []), "Office", "Factory", "Site", "Remote"].map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex gap-2">
                {!currentEntry ? (
                  <Button className="h-10 flex-1 gap-2 bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 sm:min-w-36" disabled={!ready} onClick={() => punch("in")}>
                    <LogIn className="size-4" />Check in
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="h-10 flex-1 gap-2" disabled={!ready} onClick={() => punch(onBreak ? "resume" : "break")}>
                      <Coffee className="size-4" />{onBreak ? "End break" : "Take a break"}
                    </Button>
                    <Button className="h-10 flex-1 gap-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 sm:min-w-32" disabled={!ready} onClick={() => setCheckoutOpen(true)}>
                      <LogOut className="size-4" />{currentEntry.checkOut ? "Check out again" : "Check out"}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" />Breaks are excluded from net working time. Check in is once per day; last check out counts as final check out.</p>
          </section>

          <section className="flex flex-col rounded-2xl border bg-background p-5 shadow-sm sm:p-6" aria-label="Attendance activity">
            <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">{activeEntry && activeEntry.date !== today ? "Session activity" : "Today’s activity"}</h2><p className="mt-1 text-xs text-muted-foreground">Every moment of your workday.</p></div><span className="rounded-lg bg-muted p-2"><FileClock className="size-4 text-muted-foreground" /></span></div>
            {activity.length ? <ol className="mt-6 max-h-64 flex-1 overflow-y-auto pr-1">{activity.map((item, index) => <li key={`${item.label}-${item.time}`} className="relative flex gap-3 pb-5 last:pb-0">{index < activity.length - 1 && <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-28px)] w-px bg-border" />}<span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background"><item.icon className="size-3.5 text-muted-foreground" /></span><div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-1.5"><p className="text-xs font-medium">{item.label}</p><time dateTime={item.time} className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">{clock(item.time)}</time></div></li>)}</ol> : <div className="flex min-h-52 flex-1 flex-col items-center justify-center gap-3 text-center"><div className="flex size-14 items-center justify-center rounded-full border border-dashed bg-muted/20"><LogIn className="size-6 text-muted-foreground/60" /></div><div><p className="text-sm font-medium">A fresh start to your day</p><p className="mx-auto mt-1 max-w-52 text-xs leading-relaxed text-muted-foreground">Check in when you’re ready. Your activity will appear here.</p></div></div>}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 text-[11px]"><span className="text-muted-foreground">Record source</span><span className="font-medium">Manual · server recorded</span></div>
          </section>
        </div>

        <section className={cn("space-y-4 transition-opacity duration-200", workspaceQuery.isFetching && "opacity-80")} aria-label="Monthly attendance">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Your attendance overview</h2><p className="mt-1 text-xs text-muted-foreground">A closer look at the month you’ve selected.</p></div><div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-xs"><Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" aria-label="Previous month" disabled={!selectedMonth} onClick={() => moveMonth(-1)}><ChevronLeft className="size-4" /></Button><MonthPicker value={selectedMonth} onChange={val => { setMonth(val); setPage(1); }} maxMonth={today.slice(0, 7)} isLoading={workspaceQuery.isFetching} /><Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" aria-label="Next month" disabled={!selectedMonth || selectedMonth >= today.slice(0, 7)} onClick={() => moveMonth(1)}><ChevronRight className="size-4" /></Button></div></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
            { label: "Days recorded", value: String(monthEntries.length).padStart(2, "0"), hint: "Days with a check-in", icon: CalendarDays, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
            { label: "Completed days", value: String(completedEntries.length).padStart(2, "0"), hint: "Checked in and out", icon: CheckCheck, color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
            { label: "Total work time", value: formatDuration(totalWork), hint: "After excluding breaks", icon: Timer, color: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
            { label: "Average workday", value: completedEntries.length ? formatDuration(completedWork / completedEntries.length) : "—", hint: "Based on completed days", icon: Clock3, color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
          ].map(metric => <div key={metric.label} className="rounded-xl border bg-background p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{metric.label}</p><span className={cn("rounded-lg p-2", metric.color)}><metric.icon className="size-4" /></span></div><p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{ready ? metric.value : "—"}</p><p className="mt-1 text-[11px] text-muted-foreground">{metric.hint}</p></div>)}</div>

          <Tabs defaultValue="history" className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><TabsList><TabsTrigger value="history" className="px-4">Attendance history</TabsTrigger><TabsTrigger value="requests" className="px-4">Correction requests <span className="ml-1 rounded bg-muted px-1.5 text-[10px]">{monthCorrections.length}</span></TabsTrigger></TabsList><Button variant="outline" size="sm" className="gap-2 bg-background" disabled={!ready || !filtered.length} onClick={exportCsv}><Download className="size-3.5" />Export CSV</Button></div>
            <TabsContent value="history" className="space-y-0 overflow-hidden rounded-xl border bg-background shadow-sm min-h-[360px]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div className="relative min-w-48 flex-1 sm:max-w-xs"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search attendance history" placeholder="Search date, location, or status…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="h-9 pl-9" /></div><div className="flex items-center gap-2"><Select value={statusFilter} onValueChange={value => { setStatusFilter(value); setPage(1); }}><SelectTrigger aria-label="Filter attendance status" className="h-9 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.keys(statusStyles).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select><div role="group" aria-label="History view" className="flex rounded-lg border p-0.5">{([{ value: "list", icon: List }, { value: "calendar", icon: LayoutGrid }] as const).map(option => <Button key={option.value} variant="ghost" size="icon" aria-label={`${option.value} view`} aria-pressed={view === option.value} className={cn("size-8", view === option.value && "bg-muted")} onClick={() => setView(option.value)}><option.icon className="size-4" /></Button>)}</div></div></div>
              {view === "list" ? <>
                <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b bg-muted/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><tr>{["Date", "Check in", "Check out", "Work time", "Location", "Status", ""].map((label, index) => <th key={index} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y">{visible.map(entry => <tr key={entry.date} className="hover:bg-muted/20"><td className="px-4 py-4"><p className="text-xs font-semibold">{dateLabel(entry.date)}</p>{entry.date === today && <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400">Today</p>}</td><td className="px-4 py-4 text-xs tabular-nums">{clock(entry.checkIn, entry.timeZone)}</td><td className="px-4 py-4 text-xs tabular-nums">{clock(entry.checkOut, entry.timeZone)}</td><td className="px-4 py-4 font-mono text-xs">{now ? formatDuration(workMilliseconds(entry, now)) : "—"}</td><td className="px-4 py-4 text-xs text-muted-foreground">{entry.location}</td><td className="px-4 py-4"><Status entry={entry} /></td><td className="px-4 py-4"><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDetailDate(entry.date)}>Details</Button></td></tr>)}</tbody></table></div>
                {!visible.length && <div className="flex flex-col items-center gap-3 px-4 py-14 text-center"><CalendarDays className="size-9 text-muted-foreground/40" /><div><p className="text-sm font-medium">{search || statusFilter !== "all" ? "No matching records" : "Your attendance story starts here"}</p><p className="mt-1 text-xs text-muted-foreground">{search || statusFilter !== "all" ? "Try a different search or status filter." : "Check in to create your first attendance record, or select another month."}</p></div>{(search || statusFilter !== "all") && <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear filters</Button>}</div>}
                <div className="flex items-center justify-between border-t px-4 py-3 text-[11px] text-muted-foreground"><span>{filtered.length} record{filtered.length === 1 ? "" : "s"} · Page {currentPage} of {pageCount}</span><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-7" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-4" /></Button><Button variant="ghost" size="icon" className="size-7" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-4" /></Button></div></div>
              </> : <div className="p-3 sm:p-5"><div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1 sm:gap-2">{calendar.map((date, index) => {
                const entry = date ? filtered.find(item => item.date === date) : undefined;
                const recordLabel = date && monthEntries.some(item => item.date === date) ? "Filtered out" : "No record";
                return date ? <button key={date} type="button" disabled={date > today} onClick={() => setDetailDate(date)} aria-label={`${dateLabel(date, true)}: ${entry ? entryStatus(entry) : recordLabel}`} className={cn("flex min-h-16 flex-col items-start gap-1 rounded-lg border p-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-35 sm:min-h-24 sm:p-3", date === today && "border-primary/50 bg-primary/5", entry && "border-emerald-500/20 bg-emerald-500/5")}><span className={cn("text-xs font-semibold", date === today && "text-primary")}>{Number(date.slice(-2))}</span>{entry ? <><span className="hidden text-[10px] font-medium text-emerald-700 dark:text-emerald-300 sm:block">{entryStatus(entry)}</span><span className="size-1.5 rounded-full bg-emerald-500 sm:hidden" /><span className="hidden text-[10px] text-muted-foreground sm:block">{now ? formatDuration(workMilliseconds(entry, now)) : ""}</span></> : <span className="hidden text-[10px] text-muted-foreground sm:block">{date <= today ? recordLabel : ""}</span>}</button> : <div key={`blank-${index}`} />;
              })}</div><p className="mt-4 text-[11px] text-muted-foreground">Calendar reflects the current filters. Days without a record are not marked absent.</p></div>}
            </TabsContent>
            <TabsContent value="requests" className="rounded-xl border bg-background p-5 shadow-sm"><div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><Info className="size-4 shrink-0" />Requests are reviewed by your HRMS administrator. Approved corrections update attendance with an audit trail.</div>{monthCorrections.length ? <div className="divide-y">{monthCorrections.map(request => <div key={request.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{dateLabel(request.date, true)}</p><p className="mt-1 max-w-2xl whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{request.reason}</p>{request.review_note && <p className="mt-2 break-words text-xs text-muted-foreground">Review: {request.review_note}{request.reviewedBy ? ` · ${request.reviewedBy.user_name}` : ""}</p>}</div><div className="flex items-center gap-2"><span className={cn("rounded-full px-3 py-1 text-[10px] font-medium", request.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : request.status === "REJECTED" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-muted text-muted-foreground")}>{request.status.charAt(0) + request.status.slice(1).toLowerCase()}</span>{request.status === "PENDING" && <Button variant="ghost" size="sm" disabled={!ready} onClick={() => cancelCorrection(request.id)}>Cancel request</Button>}</div></div>)}</div> : <div className="flex flex-col items-center gap-3 py-10 text-center"><FileClock className="size-9 text-muted-foreground/40" /><p className="text-sm font-medium">No correction requests this month</p><p className="text-xs text-muted-foreground">Missed a punch? Submit a correction request with the details.</p></div>}</TabsContent>
          </Tabs>
        </section>
        {workspace?.can_review && <AttendanceCorrectionInbox vendorId={user?.vendor_id} userId={user?.id} />}
      </div>
    </main>

    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Wrap up your workday?</DialogTitle><DialogDescription>Your check-out time will be recorded by the server.{onBreak ? " Your active break will also end." : ""}</DialogDescription></DialogHeader><div className="rounded-xl border bg-muted/20 p-5 text-center"><p className="text-xs text-muted-foreground">Net working time</p><p className="mt-2 font-mono text-3xl font-semibold">{currentEntry && now ? formatDuration(workMilliseconds(currentEntry, now)) : "—"}</p></div><DialogFooter><Button variant="outline" onClick={() => setCheckoutOpen(false)}>Keep working</Button><Button onClick={() => punch("out")} disabled={!ready}><LogOut className="mr-2 size-4" />Confirm check out</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Request an attendance correction</DialogTitle><DialogDescription>Describe the missing or incorrect punch. Times use the vendor timezone; attendance changes only after approval.</DialogDescription></DialogHeader><form onSubmit={requestCorrection} className="space-y-4"><div className="space-y-2"><Label htmlFor="correction-date">Attendance date</Label><CustomeDatePicker value={correctionDate} onChange={val => setCorrectionDate(val || "")} className="h-10 w-full" placeholder="Select attendance date" dateFormat="dd MMM yyyy" restriction="pastOnly" /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="requested-check-in">Actual check-in (optional)</Label><DateTimePicker id="requested-check-in" value={requestedIn} onChange={setRequestedIn} baseDate={correctionDate} placeholder="Select check-in time" /></div><div className="space-y-2"><Label htmlFor="requested-check-out">Actual check-out (optional)</Label><DateTimePicker id="requested-check-out" value={requestedOut} onChange={setRequestedOut} baseDate={correctionDate} placeholder="Select check-out time" /></div></div><p className="text-xs text-muted-foreground">Times in {timeZone}.</p><div className="space-y-2"><Label htmlFor="correction-reason">What needs correcting?</Label><Textarea id="correction-reason" required minLength={10} maxLength={1000} rows={4} value={reason} onChange={event => setReason(event.target.value)} placeholder="For example: I forgot to check out yesterday. My actual departure time was 6:30 PM." /><p className="text-[11px] text-muted-foreground">Include the actual time and reason. Minimum 10 characters.</p></div><DialogFooter><Button type="button" variant="outline" onClick={() => setCorrectionOpen(false)}>Cancel</Button><Button type="submit" disabled={!ready || !correctionDate || correctionDate > today || reason.trim().length < 10}>{actionMutation.isPending ? "Submitting…" : "Submit request"}</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={!!detailDate} onOpenChange={open => { if (!open) setDetailDate(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Attendance details</DialogTitle><DialogDescription>{detailDate ? dateLabel(detailDate, true) : ""} · {timeZone}</DialogDescription></DialogHeader>{details ? <div className="space-y-4"><div className="flex items-center justify-between"><Status entry={details} /><span className="text-xs text-muted-foreground">{details.location}</span></div><dl className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-4">{[{ label: "Check in", value: clock(details.checkIn, details.timeZone) }, { label: "Check out", value: clock(details.checkOut, details.timeZone) }, { label: "Net work time", value: now ? formatDuration(workMilliseconds(details, now)) : "—" }, { label: "Breaks", value: String(details.breaks.length) }].map(item => <div key={item.label}><dt className="text-[11px] text-muted-foreground">{item.label}</dt><dd className="mt-1 text-sm font-semibold">{item.value}</dd></div>)}</dl>{details.breaks.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold">Break history</p>{details.breaks.map((pause, index) => <p key={pause.start} className="flex justify-between text-xs text-muted-foreground"><span>Break {index + 1}</span><span>{clock(pause.start, details.timeZone)} – {pause.end ? clock(pause.end, details.timeZone) : "In progress"}</span></p>)}</div>}</div> : <div className="py-6 text-center"><CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No attendance recorded for this date.</p></div>}<DialogFooter><Button variant="outline" onClick={() => setDetailDate(null)}>Close</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
