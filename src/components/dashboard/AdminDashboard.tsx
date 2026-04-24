"use client";

import { useState } from "react";
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
  useAdminStageCounts,
  useAdminTotalRevenue,
} from "@/api/dashboard/useDashboard";
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
  value: string;
  sub: string;
  icon: React.ElementType;
  accent: string;
  dot: string;
  strokeColor: string;
  gradientColor: string;
  isLoading: boolean;
  weekData: number[];
  monthData: number[];
  yearData: number[];
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  dot,
  strokeColor,
  gradientColor,
  isLoading,
  weekData,
  monthData,
  yearData,
}: StatCardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("year");

  const sparkline =
    timeframe === "week" ? weekData : timeframe === "month" ? monthData : yearData;
  const timeframeLabel =
    timeframe === "week" ? "Week" : timeframe === "month" ? "Month" : "Year";

  const gradientId = `grad-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const sparkData = sparkline.map((v, i) => ({ i, v }));

  return (
    <div className="border rounded-2xl py-4 px-5 flex flex-col gap-3 bg-background">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
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
          <span className={`flex items-center justify-center h-8 w-8 rounded-full border ${accent} bg-muted/40`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-3xl font-semibold">{value}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
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
    <div className="border rounded-2xl py-4 px-5 bg-background h-full flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Pipeline Summary</p>
        <p className="text-xs text-muted-foreground">Lead stages grouped across teams</p>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-1">
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
    data: stageCounts,
    isLoading: isStageCountsLoading,
    error: stageCountsError,
  } = useAdminStageCounts(vendorId, franchiseId ?? undefined);

  const errorMessage =
    projectsError || revenueError || stageCountsError
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

      {/* Single row: stat cards + pipeline */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatRevenue(totalRevenue?.overall ?? 0)}
          sub="Excludes lost / on-hold"
          icon={TrendingUp}
          accent="text-emerald-500 border-emerald-200 dark:border-emerald-500/30"
          dot="bg-emerald-500"
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
          dot="bg-sky-500"
          strokeColor="hsl(200, 98%, 39%)"
          gradientColor="hsl(200, 98%, 39%)"
          isLoading={isProjectsLoading}
          weekData={projectsOverview?.thisWeekArray ?? []}
          monthData={projectsOverview?.thisMonthArray ?? []}
          yearData={projectsOverview?.thisYearArray ?? []}
        />
        <div className="lg:col-span-2 h-full">
          <PipelineSummaryCard items={pipelineItems} isLoading={isStageCountsLoading} />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-xl text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
