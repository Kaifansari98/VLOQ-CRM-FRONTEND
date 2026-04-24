"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAdminProjectsOverview,
  useAdminCompletedOverview,
  useAdminLostApprovalOverview,
  useAdminStageCounts,
  useAdminTotalRevenue,
  usePriorityLeadCounts,
  useAdminLostApprovalLeads,
} from "@/api/dashboard/useDashboard";
import type { PriorityLeadCounts } from "@/api/dashboard/dashboard.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminTaskTable } from "@/components/dashboard/AdminTaskTable";
import { useAppSelector } from "@/redux/store";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  TrendingUp,
  Activity,
  ChevronDown,
  ClipboardList,
  Layers,
  Cpu,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Timeframe = "week" | "month" | "year";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRevenue(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)} Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)} L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)} K`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function formatCount(v: number) {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString();
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  timeframeTitles?: Partial<Record<Timeframe, string>>;
  value: string;
  timeframeValues?: Partial<Record<Timeframe, string>>;
  sub: string;
  icon: React.ElementType;
  accent: string;
  strokeColor: string;
  gradientColor: string;
  isLoading: boolean;
  weekData: number[];
  monthData: number[];
  yearData: number[];
  onClick?: () => void;
}

function StatCard({
  title,
  timeframeTitles,
  value,
  timeframeValues,
  sub,
  icon: Icon,
  accent,
  strokeColor,
  gradientColor,
  isLoading,
  weekData,
  monthData,
  yearData,
  onClick,
}: StatCardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("year");

  const sparkline =
    timeframe === "week" ? weekData : timeframe === "month" ? monthData : yearData;
  const timeframeLabel =
    timeframe === "week" ? "Week" : timeframe === "month" ? "Month" : "Year";
  const displayTitle = timeframeTitles?.[timeframe] ?? title;
  const displayValue = timeframeValues?.[timeframe] ?? value;

  const gradientId = `grad-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const sparkData = sparkline.map((v, i) => ({ i, v }));

  return (
    <div
      className={`border rounded-2xl py-4 px-5 flex flex-col gap-3 bg-background ${onClick ? "cursor-pointer hover:shadow-md hover:border-foreground/20 transition-all duration-200" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{displayTitle}</span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 gap-1 text-xs text-muted-foreground"
                disabled={isLoading}
              >
                {timeframeLabel}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setTimeframe("week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("year")}>This Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-3xl font-semibold">{displayValue}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <Icon className={`h-3 w-3 ${accent}`} />
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
      </div>

      <div className="h-14 w-full">
        {!isLoading && sparkData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                formatter={(val) => (typeof val === "number" ? val.toLocaleString() : "")}
                contentStyle={{
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={() =>
                  timeframe === "week" ? "Day" : timeframe === "month" ? "Week" : "Month"
                }
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={strokeColor}
                fill={`url(#${gradientId})`}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-lg bg-muted/30" />
        )}
      </div>
    </div>
  );
}

// ─── Pipeline Summary Card ────────────────────────────────────────────────────

interface PipelineItem {
  label: string;
  count: number;
  amount: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface PipelineSummaryCardProps {
  items: PipelineItem[];
  isLoading: boolean;
}

function PipelineSummaryCard({ items, isLoading }: PipelineSummaryCardProps) {
  return (
    <div className="border rounded-2xl py-4 px-5 bg-background h-full flex flex-col gap-4 justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">Pipeline Summary</p>
        <p className="text-xs text-muted-foreground">Lead stages grouped across teams</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-full min-h-[80px] rounded-xl bg-muted animate-pulse" />
            ))
          : items.map((item) => (
              <div
                key={item.label}
                className={`flex flex-col gap-2 rounded-xl px-3 py-3 ${item.bg}`}
              >
                <span className={`flex items-center justify-center h-8 w-8 rounded-lg ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold tabular-nums leading-tight">
                    {item.count.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ₹{item.amount >= 100_000
                      ? `${(item.amount / 100_000).toFixed(1)} L`
                      : item.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

// ─── Priority Leads Card ─────────────────────────────────────────────────────

const PRIORITY_CONFIG = [
  { key: "high",   label: "High",   badge: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",   dot: "bg-rose-500" },
  { key: "medium", label: "Medium", badge: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", dot: "bg-amber-500" },
  { key: "low",    label: "Low",    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400", dot: "bg-emerald-500" },
] as const;

const STAGE_COLS = [
  { key: "open",      label: "Open",      accent: "border-violet-200 dark:border-violet-500/30", header: "bg-violet-50 dark:bg-violet-500/10" },
  { key: "ism",       label: "ISM",       accent: "border-sky-200 dark:border-sky-500/30",    header: "bg-sky-50 dark:bg-sky-500/10" },
  { key: "designing", label: "Designing", accent: "border-amber-200 dark:border-amber-500/30",  header: "bg-amber-50 dark:bg-amber-500/10" },
] as const;

function PriorityLeadsCard({
  data,
  isLoading,
}: {
  data?: PriorityLeadCounts;
  isLoading: boolean;
}) {
  return (
    <div className="border rounded-2xl py-4 px-5 bg-background flex flex-col gap-4 h-full">
      <div>
        <p className="text-sm font-medium text-foreground">Priority Leads</p>
        <p className="text-xs text-muted-foreground">Open · ISM · Designing — by priority</p>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs text-muted-foreground font-medium py-2 pr-4 w-[30%]" />
            {PRIORITY_CONFIG.map((p) => (
              <th key={p.key} className="text-center text-xs font-medium py-2 px-3">
                <span className={`inline-flex items-center gap-1.5`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                  <span className="text-muted-foreground">{p.label}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {STAGE_COLS.map((stage) => (
            <tr key={stage.key}>
              <td className="py-3 pr-4">
                <span className="text-xs font-semibold text-foreground">{stage.label}</span>
              </td>
              {PRIORITY_CONFIG.map((p) => {
                const count = data?.[stage.key]?.[p.key] ?? 0;
                return (
                  <td key={p.key} className="text-center py-3 px-3">
                    {isLoading ? (
                      <div className="h-5 w-8 bg-muted animate-pulse rounded mx-auto" />
                    ) : (
                      <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-md text-xs font-semibold ${p.badge}`}>
                        {count}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Lost Approval Modal ─────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, string> = {
  High:   "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  Low:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

function LostApprovalModal({
  open,
  onClose,
  vendorId,
  franchiseId,
}: {
  open: boolean;
  onClose: () => void;
  vendorId?: number;
  franchiseId?: number;
}) {
  const router = useRouter();
  const { data = [], isLoading, refetch } = useAdminLostApprovalLeads(vendorId, franchiseId);

  // Fetch on first open
  const [fetched, setFetched] = useState(false);
  if (open && !fetched) {
    setFetched(true);
    refetch();
  }
  if (!open && fetched) setFetched(false);

  function handleRowDoubleClick(row: (typeof data)[number]) {
    router.push(
      `/dashboard/leads/leadstable/pendingleaddetails/${row.id}?accountId=${row.account_id}&tab=lostApproval`
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="min-w-4xl w-full">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold">Lost Approval — Leads</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {!isLoading && `${data.length} lead${data.length !== 1 ? "s" : ""} currently in lost-approval`}
          </p>
        </DialogHeader>

        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Lead Code</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Client</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Contact</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Furniture Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Sales Executive</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Priority</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No lost-approval leads found
                      </td>
                    </tr>
                  )
                : data.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer select-none"
                      onDoubleClick={() => handleRowDoubleClick(row)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">{row.lead_code}</td>
                      <td className="px-4 py-3 font-medium text-sm">{row.name || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.contact || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.furniture_type || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.sales_executive || "—"}</td>
                      <td className="px-4 py-3">
                        {row.priority ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${PRIORITY_BADGE[row.priority] ?? "bg-muted text-muted-foreground"}`}>
                            {row.priority}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const franchiseId = useAppSelector((state) => state.auth.franchise_id);

  const {
    data: projectsOverview,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useAdminProjectsOverview(vendorId, franchiseId ?? undefined);
  const {
    data: totalRevenue,
    isLoading: isRevenueLoading,
    error: revenueError,
  } = useAdminTotalRevenue(vendorId, franchiseId ?? undefined);
  const {
    data: completedOverview,
    isLoading: isCompletedLoading,
    error: completedError,
  } = useAdminCompletedOverview(vendorId, franchiseId ?? undefined);
  const {
    data: stageCounts,
    isLoading: isStageCountsLoading,
    error: stageCountsError,
  } = useAdminStageCounts(vendorId, franchiseId ?? undefined);
  const {
    data: lostApprovalOverview,
    isLoading: isLostApprovalLoading,
    error: lostApprovalError,
  } = useAdminLostApprovalOverview(vendorId, franchiseId ?? undefined);

  const {
    data: priorityData,
    isLoading: isPriorityLoading,
  } = usePriorityLeadCounts(vendorId, franchiseId ?? undefined);

  const [showLostApprovalModal, setShowLostApprovalModal] = useState(false);

  const errorMessage =
    projectsError || revenueError || completedError || lostApprovalError || stageCountsError
      ? "Failed to load admin stats."
      : null;

  const pipelineItems: PipelineItem[] = [
    {
      label: "Leads",
      count: stageCounts?.leads ?? 0,
      amount: stageCounts?.leadsAmount ?? 0,
      icon: ClipboardList,
      color: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      bg: "hover:bg-violet-50 dark:hover:bg-violet-500/5",
    },
    {
      label: "Projects",
      count: stageCounts?.project ?? 0,
      amount: stageCounts?.projectAmount ?? 0,
      icon: Layers,
      color: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      bg: "hover:bg-sky-50 dark:hover:bg-sky-500/5",
    },
    {
      label: "Production",
      count: stageCounts?.production ?? 0,
      amount: stageCounts?.productionAmount ?? 0,
      icon: Cpu,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      bg: "hover:bg-amber-50 dark:hover:bg-amber-500/5",
    },
    {
      label: "Installation",
      count: stageCounts?.installation ?? 0,
      amount: stageCounts?.installationAmount ?? 0,
      icon: Wrench,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      bg: "hover:bg-emerald-50 dark:hover:bg-emerald-500/5",
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      {/* Top row: 4 stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatRevenue(totalRevenue?.overall ?? 0)}
          sub="Excludes lost / on-hold"
          icon={TrendingUp}
          accent="text-emerald-500 border-emerald-200 dark:border-emerald-500/30"

          strokeColor="hsl(142, 71%, 45%)"
          gradientColor="hsl(142, 71%, 45%)"
          isLoading={isRevenueLoading}
          weekData={totalRevenue?.thisWeekArray ?? []}
          monthData={totalRevenue?.thisMonthArray ?? []}
          yearData={totalRevenue?.thisYearArray ?? []}
        />
        <StatCard
          title="Active Projects"
          value={formatCount(projectsOverview?.overall ?? 0)}
          sub="Booking → Under Installation"
          icon={Activity}
          accent="text-sky-500 border-sky-200 dark:border-sky-500/30"

          strokeColor="hsl(200, 98%, 39%)"
          gradientColor="hsl(200, 98%, 39%)"
          isLoading={isProjectsLoading}
          weekData={projectsOverview?.thisWeekArray ?? []}
          monthData={projectsOverview?.thisMonthArray ?? []}
          yearData={projectsOverview?.thisYearArray ?? []}
        />
        <StatCard
          title="Completed This Month"
          timeframeTitles={{
            week: "Completed This Week",
            month: "Completed This Month",
            year: "Completed This Year",
          }}
          value={formatCount(completedOverview?.thisYearTotal ?? 0)}
          timeframeValues={{
            week: formatCount(completedOverview?.thisWeekTotal ?? 0),
            month: formatCount(completedOverview?.thisMonthTotal ?? 0),
            year: formatCount(completedOverview?.thisYearTotal ?? 0),
          }}
          sub="Type 17 completed leads"
          icon={CheckCircle2}
          accent="text-teal-500 border-teal-200 dark:border-teal-500/30"

          strokeColor="hsl(174, 72%, 40%)"
          gradientColor="hsl(174, 72%, 40%)"
          isLoading={isCompletedLoading}
          weekData={completedOverview?.thisWeekArray ?? []}
          monthData={completedOverview?.thisMonthArray ?? []}
          yearData={completedOverview?.thisYearArray ?? []}
        />
        <StatCard
          title="Lost Approval"
          timeframeTitles={{
            week: "Lost Approval This Week",
            month: "Lost Approval This Month",
            year: "Lost Approval This Year",
          }}
          value={formatCount(lostApprovalOverview?.thisYearTotal ?? 0)}
          timeframeValues={{
            week: formatCount(lostApprovalOverview?.thisWeekTotal ?? 0),
            month: formatCount(lostApprovalOverview?.thisMonthTotal ?? 0),
            year: formatCount(lostApprovalOverview?.thisYearTotal ?? 0),
          }}
          sub="Current lost-approval leads"
          icon={XCircle}
          accent="text-rose-500 border-rose-200 dark:border-rose-500/30"

          strokeColor="hsl(346, 87%, 54%)"
          gradientColor="hsl(346, 87%, 54%)"
          isLoading={isLostApprovalLoading}
          weekData={lostApprovalOverview?.thisWeekArray ?? []}
          monthData={lostApprovalOverview?.thisMonthArray ?? []}
          yearData={lostApprovalOverview?.thisYearArray ?? []}
          onClick={() => setShowLostApprovalModal(true)}
        />
      </div>

      {/* Bottom row: Priority Leads + Pipeline Summary */}
      <div className="flex gap-4">
        <div className="w-1/2">
          <PriorityLeadsCard data={priorityData} isLoading={isPriorityLoading} />
        </div>
        <div className="w-1/2">
          <PipelineSummaryCard items={pipelineItems} isLoading={isStageCountsLoading} />
        </div>
      </div>

      <AdminTaskTable />

      <LostApprovalModal
        open={showLostApprovalModal}
        onClose={() => setShowLostApprovalModal(false)}
        vendorId={vendorId}
        franchiseId={franchiseId ?? undefined}
      />

      {errorMessage && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-xl text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
