"use client";
import { useEffect, useState } from "react";
import { Building2, CalendarCheck, CalendarDays, CheckCheck, ClipboardCheck, Clock3, Globe2, Info, Plus, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { toastManager } from "@/components/ui/toast";
import { attendanceDate } from "@/lib/hrms/attendance";
import { effectiveHolidays, effectiveWeeklyOffs, scopeName, type LeaveDraft } from "@/lib/hrms/leaves";
import { useLeaveActions, useLeaveWorkspace } from "@/api/hrms-leaves";
import LeaveCalendar, { WeeklyOffs } from "./LeaveCalendar";
import LeaveRequests, { LeaveRequestForm } from "./LeaveRequests";

function LeaveHeader({ title }: { title: string }) {
  return <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4"><div className="flex min-w-0 items-center gap-2"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" /><Breadcrumb><BreadcrumbList><BreadcrumbItem className="hidden sm:block"><BreadcrumbPage>HRMS Management</BreadcrumbPage></BreadcrumbItem><BreadcrumbSeparator className="hidden sm:block" /><BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb></div><div className="flex items-center gap-2"><NotificationBell /><AnimatedThemeToggler /></div></header>;
}
export default function LeaveWorkspace({ mode }: { mode: "admin" | "personal" }) {
  const user = useAppSelector(state => state.auth.user);
  const [today, setToday] = useState("");
  const configuredZone = user?.vendor?.time_zone_master?.time_zone_name || user?.vendor?.time_zone || "Asia/Kolkata";
  useEffect(() => { try { setToday(attendanceDate(new Date(), configuredZone)); } catch { setToday(attendanceDate(new Date(), "Asia/Kolkata")); } }, [configuredZone]);
  const title = mode === "admin" ? "Leaves Management" : "My Leaves";
  const role = String(user?.user_type?.user_type || user?.user_role || "").trim().toLowerCase().replace(/[ _]+/g, "-");
  const enabled = user?.vendor?.is_hrms_master_enabled === true || (user as any)?.vendorMaster?.is_hrms_master_enabled === true;
  return <><LeaveHeader title={title} />{!user || !today ? <p role="status" className="p-8 text-sm text-muted-foreground">Loading leave workspace…</p> : !enabled || (mode === "admin" && role !== "super-admin") ? <div className="m-6 rounded-2xl border bg-background p-10 text-center"><ShieldCheck className="mx-auto mb-4 size-9 text-muted-foreground" /><h1 className="text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{!enabled ? "HRMS must be enabled for your company to access this page." : "Company leave settings and approvals are available to super admins."}</p></div> : <LeaveWorkspaceContent key={`${user.vendor_id}:${user.id}:${mode}`} mode={mode} today={today} userId={user.id} vendorId={user.vendor_id} vendorName={user.vendor?.vendor_name || "Your company"} />}</>;
}

function LeaveWorkspaceContent({ mode, today, userId, vendorId, vendorName }: { mode: "admin" | "personal"; today: string; userId: number; vendorId: number; vendorName: string }) {
  const admin = mode === "admin", currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear), [scope, setScope] = useState("company"), [tab, setTab] = useState(admin ? "calendar" : "requests");
  const query = useLeaveWorkspace(vendorId, userId, { mode, year, scope });
  const action = useLeaveActions(vendorId);
  const workspace = query.data;
  const holidays = workspace?.holidays || [], policies = workspace?.policies || {}, locations = workspace?.franchises || [];
  const label = (scope: string) => scopeName(scope, locations);
  const [requestOpen, setRequestOpen] = useState(false);
  const locationScope = workspace?.scope || "company";
  const effective = effectiveHolidays(holidays, locationScope, year), weekly = effectiveWeeklyOffs(policies, locationScope);
  const pending = workspace?.summary.pending || 0, approved = workspace?.summary.approved || 0, rejected = workspace?.summary.rejected || 0;
  const metrics = admin ? [
    { label: "Paid calendar holidays", value: effective.length, hint: `${year} · ${label(scope)}`, icon: CalendarDays, color: "bg-teal-500/10 text-teal-700 dark:text-teal-300" },
    { label: "Weekly off days", value: weekly.length, hint: "Recurring days off each week", icon: CalendarCheck, color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
    { label: "Pending requests", value: pending, hint: "Awaiting super-admin review", icon: Clock3, color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    { label: "Approved requests", value: approved, hint: `${year} · Selected scope`, icon: CheckCheck, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  ] : [
    { label: "My requests", value: workspace?.summary.total || 0, hint: `${year} · Leave requests`, icon: ClipboardCheck, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    { label: "Pending", value: pending, hint: "Waiting for a decision", icon: Clock3, color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    { label: "Approved", value: approved, hint: "Approved by a super admin", icon: CheckCheck, color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    { label: "Rejected", value: rejected, hint: "Open a request to view the reason", icon: X, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
  ];
  const submit = async (input: LeaveDraft) => {
    await action.mutateAsync({ kind: "create", input });
    setYear(Number(input.startDate.slice(0, 4))); setTab("requests"); toastManager.add({ title: "Leave request submitted", type: "success" });
  };
  if (query.isError) return <main className="p-6"><div role="alert" className="rounded-xl border p-6"><h1 className="text-lg font-semibold">Could not load leave workspace</h1><p className="mt-2 text-sm text-muted-foreground">Please try again. If the problem continues, contact your administrator.</p><Button variant="outline" className="mt-4" onClick={() => query.refetch()}>Retry</Button></div></main>;
  if (!workspace) return <p role="status" className="p-8 text-sm text-muted-foreground">Loading leave workspace…</p>;
  return <main className="min-w-0 flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8"><div className="mx-auto flex max-w-[1440px] flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">People & time off</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{admin ? "Leaves Management" : "My Leaves"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{admin ? "Set your company’s time-off calendar, define weekly offs, and keep leave approvals moving." : "Plan your time off, submit a leave request, and follow every decision in one place."}</p></div>{!admin && <Button className="gap-2" onClick={() => setRequestOpen(true)}><Plus className="size-4" />Request leave</Button>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-primary/5 p-2"><Building2 className="size-4 text-muted-foreground" /></span><div><p className="break-words text-sm font-semibold">{workspace.company_name || vendorName}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{admin ? "Super admin workspace · Company & location policies" : "Employee workspace · Your leave requests"}</p></div></div><span className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium text-amber-800 dark:text-amber-200"><Sparkles className="size-3" />{workspace.time_zone}</span></div>
    {policies.company === undefined && <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200"><Info className="mt-0.5 size-4 shrink-0" /><p>{admin ? "Company weekly offs have not been configured. Choose Weekly offs to set your default working week." : "Your company has not configured its default weekly offs yet. Contact your administrator for the current schedule."}</p></div>}
    <section aria-label="Leave workspace scope" className="flex flex-col justify-between gap-4 rounded-xl border bg-background p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-2.5"><Globe2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs font-semibold">{admin ? "Choose where these settings apply" : "Your calendar & requests"}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{admin ? scope === "company" ? "Company holidays are shared. Weekly offs are the default for every location." : "Company holidays are inherited. Add local holidays and override weekly offs here." : "Your calendar follows your assigned location. Leave allowances and payroll are managed separately."}</p></div></div><div className="flex shrink-0 flex-wrap gap-2">{admin && <Select value={scope} onValueChange={setScope}><SelectTrigger aria-label="Leave policy scope" className="h-9 w-full sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="company">Company-wide</SelectItem>{locations.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select>}<Select value={String(year)} onValueChange={value => setYear(Number(value))}><SelectTrigger aria-label="Leave calendar year" className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent>{workspace.available_years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent></Select></div></section>
    <section aria-label="Leave overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(metric => <div key={metric.label} className="rounded-xl border bg-background p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{metric.label}</p><span className={`rounded-lg p-2 ${metric.color}`}><metric.icon className="size-4" /></span></div><p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{String(metric.value).padStart(2, "0")}</p><p className="mt-1 text-[11px] text-muted-foreground">{metric.hint}</p></div>)}</section>
    <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-5"><TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-fit">{admin ? <><TabsTrigger value="calendar" className="min-h-9 gap-1.5 px-2 text-xs sm:px-4"><CalendarDays className="size-3.5" />Paid leave calendar</TabsTrigger><TabsTrigger value="weekly" className="min-h-9 gap-1.5 px-2 text-xs sm:px-4"><CalendarCheck className="size-3.5" />Weekly offs</TabsTrigger><TabsTrigger value="approvals" className="min-h-9 gap-1.5 px-2 text-xs sm:px-4"><ClipboardCheck className="size-3.5" />Leave approvals{pending > 0 && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-800 dark:text-amber-200">{pending}</span>}</TabsTrigger></> : <><TabsTrigger value="requests" className="min-h-9 gap-2 px-4 text-xs"><UserRound className="size-3.5" />My requests</TabsTrigger><TabsTrigger value="calendar" className="min-h-9 gap-2 px-4 text-xs"><CalendarDays className="size-3.5" />Company calendar</TabsTrigger></>}</TabsList>
      <TabsContent value="calendar"><LeaveCalendar key={`${scope}:${year}`} year={year} scope={locationScope} holidays={holidays} vendorId={vendorId} locations={locations} policies={policies} readOnly={!admin} /></TabsContent>
      {admin && <TabsContent value="weekly"><WeeklyOffs key={scope} scope={scope} policies={policies} vendorId={vendorId} locations={locations} /></TabsContent>}
      <TabsContent value={admin ? "approvals" : "requests"}><LeaveRequests key={`${scope}:${year}`} vendorId={vendorId} admin={admin} userId={userId} year={year} scope={admin ? scope : "company"} /></TabsContent>
    </Tabs>
    <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /><p>{admin ? "Company defaults keep every location consistent. Franchise overrides let you account for local holidays and different working weeks. Only your company’s super admins can change policies or review requests. Your own requests require another super admin’s review." : "Requests start as pending. Your super admin can approve them or reject them with a reason. Supporting files are optional."}</p></div>
    {!admin && <LeaveRequestForm open={requestOpen} onOpenChange={setRequestOpen} onSubmit={submit} today={workspace.today} pending={action.isPending} />}
  </div></main>;
}
