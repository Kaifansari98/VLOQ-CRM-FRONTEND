"use client";

import DefectsTable from "@/components/track-trace/DefectsTable";

import {
  getDefectSummary,
  DefectSummaryData,
} from "@/api/track-trace/defect-dashboard.api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PackageX,
  RefreshCw,
  Timer,
  TrendingUp,
  Wrench,
  Cpu,
  FolderKanban,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold capitalize text-foreground truncate">
          {label}
        </p>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-foreground">
          <Icon size={12} className={iconColor} />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground font-medium truncate">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Bar List ─────────────────────────────────────────────────────────────────

function BarList({
  title,
  subtitle,
  items,
  Icon,
}: {
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No data reported yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground truncate max-w-[200px]" title={item.label}>
                  {item.label}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {item.count}
                </Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{
                    width: `${Math.round((item.count / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DefectDashboardPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const [summary, setSummary] = useState<DefectSummaryData | null>(null);
  const [summaryLoading, setSumLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    if (!vendorId) return;
    setSumLoading(true);
    getDefectSummary(Number(vendorId))
      .then(setSummary)
      .catch(console.error)
      .finally(() => setSumLoading(false));
  }, [vendorId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track & Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Defect Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            className="h-8 gap-1.5 text-xs rounded-lg"
          >
            <RefreshCw
              size={13}
              className={cn(summaryLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-6">
        {/* ── Page Title Header ── */}
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Defect Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Track cut-list defects, rework, replacements, and resolution photos.
          </p>
        </div>

        {/* ── Summary stat cards ── */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard
                label="Total Defects"
                value={summary.summary.total}
                Icon={AlertTriangle}
              />
              <StatCard
                label="Pending"
                value={summary.summary.pending}
                Icon={Clock}
                iconColor="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="Resolved"
                value={summary.summary.completed}
                Icon={CheckCircle2}
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Rework"
                value={summary.summary.rework}
                Icon={Wrench}
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatCard
                label="Replace"
                value={summary.summary.replace}
                Icon={PackageX}
                iconColor="text-red-600 dark:text-red-400"
              />
              <StatCard
                label="Resolution Rate"
                value={`${summary.summary.completion_rate}%`}
                Icon={TrendingUp}
                iconColor="text-primary"
              />
              <StatCard
                label="Avg Resolution"
                value={
                  summary.summary.avg_resolution_hours !== null
                    ? `${summary.summary.avg_resolution_hours}h`
                    : "—"
                }
                Icon={Timer}
              />
            </div>

            {/* ── Bar charts ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BarList
                title="By Defect Type"
                subtitle="Defect counts broken down by issue category."
                Icon={AlertTriangle}
                items={summary.by_defect_type.slice(0, 8).map((d) => ({
                  label: d.defect_name,
                  count: d.count,
                }))}
              />
              <BarList
                title="By Machine"
                subtitle="Defects reported across factory machines."
                Icon={Cpu}
                items={summary.by_machine.slice(0, 8).map((m) => ({
                  label: m.machine_name,
                  count: m.count,
                }))}
              />
              <BarList
                title="Top Projects"
                subtitle="Projects with highest reported defect items."
                Icon={FolderKanban}
                items={summary.by_project.slice(0, 8).map((p) => ({
                  label: p.project_name,
                  count: p.count,
                }))}
              />
            </div>
          </>
        ) : null}

        {/* ── Tabs ── */}
        {vendorId && (
          <Tabs defaultValue="pending" className="w-full space-y-4">
            <TabsList className="w-full max-w-xs h-10 p-1 bg-muted rounded-xl">
              <TabsTrigger value="pending" className="flex-1 gap-1.5 rounded-lg text-xs font-semibold">
                <Clock size={13} />
                Pending
                {summary && (
                  <Badge variant="outline" className="ml-1 text-[10px] font-bold px-1.5 py-0">
                    {summary.summary.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 gap-1.5 rounded-lg text-xs font-semibold">
                <CheckCircle2 size={13} />
                Resolved
                {summary && (
                  <Badge variant="outline" className="ml-1 text-[10px] font-bold px-1.5 py-0">
                    {summary.summary.completed}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <DefectsTable vendorId={Number(vendorId)} type="pending" />
            </TabsContent>

            <TabsContent value="resolved">
              <DefectsTable vendorId={Number(vendorId)} type="resolved" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}