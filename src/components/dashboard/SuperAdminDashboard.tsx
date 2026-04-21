"use client";

import { useMemo, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  TrendingUp,
  Users,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useAdminTotalRevenue, useActiveFranchiseeCount, useLeadsThisMonth, useLeadsByFranchise } from "@/api/dashboard/useDashboard";
import type { FranchiseLeadCount } from "@/api/dashboard/dashboard.api";
import type { AdminTotalRevenue } from "@/api/dashboard/dashboard.api";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_LABELS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const YEAR_LABELS  = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRevenue(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function toChartData(arr: number[], labels: string[]) {
  return arr.map((value, i) => ({ name: labels[i] ?? `${i + 1}`, value }));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  sub: React.ReactNode;
  positive: boolean;
  icon: React.ElementType;
  accent: string;
  dot: string;
  isLoading?: boolean;
}

function StatCard({ title, value, sub, positive, icon: Icon, accent, dot, isLoading }: StatCardProps) {
  return (
    <div className="border rounded-2xl py-4 px-5 flex flex-col justify-between gap-3 bg-background">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className={`flex items-center justify-center h-8 w-8 rounded-full border ${accent} bg-muted/40`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-3xl font-semibold">{value}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className={`text-xs ${positive ? "text-muted-foreground" : "text-rose-500"}`}>
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Area Chart ───────────────────────────────────────────────────────

type Filter = "week" | "month" | "year";

interface RevenueChartProps {
  data?: AdminTotalRevenue;
  isLoading?: boolean;
}

function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const [mode, setMode] = useState<Filter>("year");

  const chartData = useMemo(() => {
    if (!data) return [];
    if (mode === "week")  return toChartData(data.thisWeekArray,  WEEK_LABELS);
    if (mode === "month") return toChartData(data.thisMonthArray, MONTH_LABELS);
    return toChartData(data.thisYearArray, YEAR_LABELS);
  }, [mode, data]);

  const total = mode === "week"
    ? (data?.thisWeekTotal  ?? 0)
    : mode === "month"
    ? (data?.thisMonthTotal ?? 0)
    : (data?.thisYearTotal  ?? 0);

  const label = mode === "week" ? "This Week" : mode === "month" ? "This Month" : "This Year";

  return (
    <Card className="w-full h-full border flex flex-col bg-[#fff] dark:bg-[#0a0a0a]">
      <CardHeader className="flex flex-row justify-between items-start pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          {isLoading ? (
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{formatRevenue(total)}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={isLoading}>
              {mode === "week" ? "Week" : mode === "month" ? "Month" : "Year"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => setMode("week")}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("month")}>This Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("year")}>This Year</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="h-[220px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => formatRevenue(v)} tick={{ fill: "var(--foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v) => typeof v === "number" ? formatRevenue(v) : v}
                contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0,0,0,0.15)" }}
                labelStyle={{ fontSize: "12px", fontWeight: 500 }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Franchise Bar Chart ──────────────────────────────────────────────────────

interface FranchiseChartProps {
  data?: FranchiseLeadCount[];
  isLoading?: boolean;
}

function FranchiseChart({ data = [], isLoading }: FranchiseChartProps) {
  const chartData = data.slice(0, 6);

  return (
    <Card className="w-full h-full border flex flex-col bg-[#fff] dark:bg-[#0a0a0a]">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-sm font-medium">Leads by Franchise</CardTitle>
        <p className="text-xs text-muted-foreground">Top {chartData.length} franchises</p>
      </CardHeader>

      <CardContent className="h-[220px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "var(--foreground)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: "10px", boxShadow: "0px 4px 12px rgba(0,0,0,0.15)" }}
              labelStyle={{ fontSize: "12px", fontWeight: 500 }}
              itemStyle={{ fontSize: "12px" }}
            />
            <Bar dataKey="leads" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const vendorId   = useAppSelector((s) => s.auth.user?.vendor_id);
  const franchiseId = useAppSelector((s) => s.auth.franchise_id) ?? undefined;

  const { data: revenueData, isLoading: revenueLoading } = useAdminTotalRevenue(vendorId, franchiseId);
  const { data: franchiseeData, isLoading: franchiseeLoading } = useActiveFranchiseeCount(vendorId);
  const { data: leadsThisMonthData, isLoading: leadsThisMonthLoading } = useLeadsThisMonth(vendorId);
  const { data: franchiseLeadsData, isLoading: franchiseLeadsLoading } = useLeadsByFranchise(vendorId);

  const revenueValue = revenueData ? formatRevenue(revenueData.overall) : "—";

  const revenueMoM = useMemo(() => {
    if (!revenueData) return null;
    const { thisMonthTotal, lastSixMonthsAvg } = revenueData;
    if (!lastSixMonthsAvg) return null;
    const pct = ((thisMonthTotal - lastSixMonthsAvg) / lastSixMonthsAvg) * 100;
    return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
  }, [revenueData]);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={revenueValue}
          sub={
            revenueMoM
              ? `${revenueMoM.up ? "+" : "-"}${revenueMoM.pct}% vs 6-month avg`
              : "vs 6-month avg"
          }
          positive={revenueMoM ? revenueMoM.up : true}
          icon={TrendingUp}
          accent="text-emerald-500"
          dot="bg-emerald-500"
          isLoading={revenueLoading}
        />
        <StatCard
          title="Active Franchisees"
          value={franchiseeData ? String(franchiseeData.count) : "—"}
          sub="Total active franchisees"
          positive
          icon={Users}
          accent="text-sky-500"
          dot="bg-sky-500"
          isLoading={franchiseeLoading}
        />
        <StatCard
          title="Leads This Month"
          value={leadsThisMonthData ? leadsThisMonthData.count.toLocaleString("en-IN") : "—"}
          sub="New leads created this month"
          positive
          icon={ClipboardList}
          accent="text-violet-500"
          dot="bg-violet-500"
          isLoading={leadsThisMonthLoading}
        />
        <StatCard
          title="Overdue Projects"
          value="17"
          sub="Needs immediate attention"
          positive={false}
          icon={AlertTriangle}
          accent="text-rose-500"
          dot="bg-rose-500"
        />
      </div>

      {/* Charts row */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="lg:w-[60%]">
          <RevenueChart data={revenueData} isLoading={revenueLoading} />
        </div>
        <div className="lg:w-[40%]">
          <FranchiseChart data={franchiseLeadsData} isLoading={franchiseLeadsLoading} />
        </div>
      </div>
    </div>
  );
}
