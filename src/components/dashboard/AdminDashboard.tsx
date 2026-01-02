"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminProjectsOverview,
  useAdminStageCounts,
  useAdminTotalRevenue,
} from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  helper?: React.ReactNode;
  isLoading: boolean;
  sparkline?: number[];
  filterValue: "week" | "month" | "year";
  onFilterChange: (value: "week" | "month" | "year") => void;
  formatValue?: (value: number) => string;
}

function StatCard({
  label,
  value,
  helper,
  isLoading,
  sparkline,
  filterValue,
  onFilterChange,
  formatValue,
}: StatCardProps) {
  const sparklineData =
    sparkline?.map((point, index) => ({ index, value: point })) ?? [];
  const gradientId = `spark-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const displayValue = formatValue ? formatValue(value) : value.toLocaleString();

  return (
    <Card className="border py-4 -px-4 gap-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            {helper ? (
              <p className="text-xs text-muted-foreground">{helper}</p>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Select timeframe"
                className="h-7 w-7 rounded-full border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ArrowUpRight className="h-6 w-4 mx-auto" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={filterValue}
                onValueChange={(value) =>
                  onFilterChange(value as "week" | "month" | "year")
                }
              >
                <DropdownMenuRadioItem value="week">
                  This Week
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="month">
                  This Month
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="year">
                  This Year
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex flex-row items-end gap-4">
        {isLoading ? (
          <div className="h-7 w-20 rounded bg-muted animate-pulse" />
        ) : (
          <div className="text-3xl font-semibold">{displayValue}</div>
        )}
        <div className="h-17 w-full">
          {sparklineData.length > 0 && !isLoading ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Tooltip
                  formatter={(val) =>
                    typeof val === "number" ? val.toLocaleString() : ""
                  }
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(142.09, 70.56%, 45.29%)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(142.09, 70.56%, 45.29%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(142.09, 70.56%, 45.29%)"
                  fill={`url(#${gradientId})`}
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded bg-muted/40" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StageCountsCardProps {
  title: string;
  description: string;
  items: { label: string; count: number; amount: number }[];
  isLoading: boolean;
}

function StageCountsCard({
  title,
  description,
  items,
  isLoading,
}: StageCountsCardProps) {
  const formatAmount = (value: number) => value.toLocaleString("en-IN");
  const gridCols = items.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-4";

  return (
    <Card className="border py-4 lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            aria-label="Open details"
            className="h-7 w-7 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowUpRight className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-16 rounded bg-muted/40 animate-pulse" />
        ) : (
          <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
            {items.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="text-sm font-semibold">
                  {item.count.toLocaleString()} {item.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  ₹ {formatAmount(item.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: projectsOverview,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useAdminProjectsOverview(vendorId);
  const {
    data: totalRevenue,
    isLoading: isRevenueLoading,
    error: revenueError,
  } = useAdminTotalRevenue(vendorId);
  const {
    data: stageCounts,
    isLoading: isStageCountsLoading,
    error: stageCountsError,
  } = useAdminStageCounts(vendorId);
  const errorMessage =
    projectsError || revenueError || stageCountsError
      ? "Failed to load admin stats."
      : null;
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("year");

  const formatCompact = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue < 1000) return value.toLocaleString();

    const units = [
      { value: 1_000_000_000, suffix: "b" },
      { value: 1_000_000, suffix: "m" },
      { value: 1_000, suffix: "k" },
    ];

    const unit = units.find((u) => absValue >= u.value);
    if (!unit) return value.toLocaleString();

    const raw = value / unit.value;
    const rounded =
      raw >= 100 ? Math.round(raw) : Math.round(raw * 10) / 10;

    return `${rounded}${unit.suffix}`;
  };

  const stats = [
    {
      label: "Total Revenue",
      value: totalRevenue?.overall ?? 0,
      helper: "Excludes lost/on-hold.",
      sparkline:
        timeframe === "week"
          ? totalRevenue?.thisWeekArray ?? []
          : timeframe === "month"
            ? totalRevenue?.thisMonthArray ?? []
            : totalRevenue?.thisYearArray ?? [],
      isLoading: isRevenueLoading,
      formatValue: formatCompact,
    },
    {
      label: "Active Projects",
      value: projectsOverview?.overall ?? 0,
      helper: (
        <span className="inline-flex items-center gap-1">
          Booking <ArrowRight className="h-3.5 w-3.5" /> Under Installation
        </span>
      ),
      sparkline:
        timeframe === "week"
          ? projectsOverview?.thisWeekArray ?? []
          : timeframe === "month"
            ? projectsOverview?.thisMonthArray ?? []
            : projectsOverview?.thisYearArray ?? [],
      isLoading: isProjectsLoading,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 px-5">
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
            isLoading={stat.isLoading}
            sparkline={stat.sparkline}
            filterValue={timeframe}
            onFilterChange={setTimeframe}
            formatValue={stat.formatValue}
          />
        ))}
        <StageCountsCard
          title="Pipeline Summary"
          description="Lead stages grouped across teams."
          items={[
            {
              label: "Leads",
              count: stageCounts?.leads ?? 0,
              amount: stageCounts?.leadsAmount ?? 0,
            },
            {
              label: "Projects",
              count: stageCounts?.project ?? 0,
              amount: stageCounts?.projectAmount ?? 0,
            },
            {
              label: "Production",
              count: stageCounts?.production ?? 0,
              amount: stageCounts?.productionAmount ?? 0,
            },
            {
              label: "Installation",
              count: stageCounts?.installation ?? 0,
              amount: stageCounts?.installationAmount ?? 0,
            },
          ]}
          isLoading={isStageCountsLoading}
        />
      </div>

      {errorMessage ? (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
