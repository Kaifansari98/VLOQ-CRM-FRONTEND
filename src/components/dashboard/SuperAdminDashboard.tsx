"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChevronDown,
  TrendingUp,
  Users,
  ClipboardList,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import {
  useAdminTotalRevenue,
  useActiveFranchiseeCount,
  useLeadsThisMonth,
  useLeadsByFranchise,
  useOverdueProjectsCount,
  useFranchisePerformance,
  useAvgDaysPerStage,
  useOverdueInstallations,
  useStageWiseCounts,
  useFranchiseLeads,
  useStageLeads,
  useOverdueProductionCount,
  useOverdueProduction,
} from "@/api/dashboard/useDashboard";
import type { OverdueProduction } from "@/api/dashboard/dashboard.api";
import type {
  FranchiseLeadCount,
  FranchisePerformanceRow,
} from "@/api/dashboard/dashboard.api";
import {
  useFranchisesByVendorId,
  type FranchiseSummary,
} from "@/api/franchise";
import BaseModal from "@/components/utils/baseModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const YEAR_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STAGE_PATH_BY_TAG: Record<string, string> = {
  "Type 1": "/dashboard/leads/leadstable/details",
  "Type 2": "/dashboard/leads/initial-site-measurement/details",
  "Type 3": "/dashboard/leads/designing-stage/details",
  "Type 4": "/dashboard/leads/booking-stage/details",
  "Type 5": "/dashboard/project/final-measurement/details",
  "Type 6": "/dashboard/project/client-documentation/details",
  "Type 7": "/dashboard/project/client-approval/details",
  "Type 8": "/dashboard/production/tech-check/details",
  "Type 9": "/dashboard/production/order-login/details",
  "Type 10": "/dashboard/production/pre-post-prod/details",
  "Type 11": "/dashboard/production/ready-to-dispatch/details",
  "Type 12": "/dashboard/installation/site-readiness/details",
  "Type 13": "/dashboard/installation/dispatch-planning/details",
  "Type 14": "/dashboard/installation/dispatch-stage/details",
  "Type 15": "/dashboard/installation/under-installation/details",
  "Type 16": "/dashboard/installation/final-handover/details",
  "Type 17": "/dashboard/installation/final-handover/details",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRevenue(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
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
  onClick?: () => void;
}

function StatCard({
  title,
  value,
  sub,
  positive,
  icon: Icon,
  accent,
  dot,
  isLoading,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`border rounded-2xl py-4 px-5 flex flex-col justify-between gap-3 bg-background ${onClick ? "cursor-pointer hover:shadow-md hover:border-foreground/20 transition-all duration-200" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span
          className={`flex items-center justify-center h-8 w-8 rounded-full border ${accent} bg-muted/40`}
        >
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
          <span
            className={`text-xs ${positive ? "text-muted-foreground" : "text-rose-500"}`}
          >
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
  vendorId?: number;
  franchises: FranchiseSummary[];
}

function RevenueChart({ vendorId, franchises }: RevenueChartProps) {
  const [mode, setMode] = useState<Filter>("year");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<
    number | undefined
  >(undefined);

  const { data, isLoading } = useAdminTotalRevenue(
    vendorId,
    selectedFranchiseId,
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    if (mode === "week") return toChartData(data.thisWeekArray, WEEK_LABELS);
    if (mode === "month") return toChartData(data.thisMonthArray, MONTH_LABELS);
    return toChartData(data.thisYearArray, YEAR_LABELS);
  }, [mode, data]);

  const total =
    mode === "week"
      ? (data?.thisWeekTotal ?? 0)
      : mode === "month"
        ? (data?.thisMonthTotal ?? 0)
        : (data?.thisYearTotal ?? 0);

  const label =
    mode === "week"
      ? "This Week"
      : mode === "month"
        ? "This Month"
        : "This Year";

  const selectedFranchiseName = selectedFranchiseId
    ? (franchises.find((f) => f.id === selectedFranchiseId)?.franchise_name ??
      "Overall")
    : "Overall";

  return (
    <Card className="w-full h-full border flex flex-col bg-[#fff] dark:bg-[#0a0a0a]">
      <CardHeader className="flex flex-row justify-between items-start pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          {isLoading ? (
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {formatRevenue(total)}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Franchise filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs max-w-[130px] truncate"
                disabled={isLoading}
              >
                <span className="truncate">{selectedFranchiseName}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 max-h-60 overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => setSelectedFranchiseId(undefined)}
              >
                Overall
              </DropdownMenuItem>
              {franchises.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => setSelectedFranchiseId(f.id)}
                >
                  {f.franchise_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                disabled={isLoading}
              >
                {mode === "week" ? "Week" : mode === "month" ? "Month" : "Year"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setMode("week")}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("month")}>
                This Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("year")}>
                This Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="h-[220px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 0, top: 5, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatRevenue(v)}
                tick={{ fill: "var(--foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                formatter={(v) =>
                  typeof v === "number" ? formatRevenue(v) : v
                }
                contentStyle={{
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                }}
                labelStyle={{ fontSize: "12px", fontWeight: 500 }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Franchise Bar Chart ──────────────────────────────────────────────────────

// ─── Franchise Pie Chart ──────────────────────────────────────────────────────

const COLORS = [
  "var(--franchise-1)",
  "var(--franchise-2)",
  "var(--franchise-3)",
  "var(--franchise-4)",
  "var(--franchise-5)",
  "var(--franchise-6)",
  "var(--franchise-7)",
  "var(--franchise-8)",
  "var(--franchise-9)",
];

interface FranchiseChartProps {
  data?: FranchiseLeadCount[];
  isLoading?: boolean;
  onBarDoubleClick?: (franchise: FranchiseLeadCount) => void;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function FranchiseChart({
  data = [],
  isLoading,
  onBarDoubleClick,
}: FranchiseChartProps) {
  const chartData = data;
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="w-full h-full border flex flex-col bg-[#fff] dark:bg-[#0a0a0a]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Leads by Franchise
          </CardTitle>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors outline-hidden"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onClick={() => setIsOpen(!isOpen)}
              >
                <Info className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              align="end" 
              className="w-64 p-3"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <h4 className="font-semibold text-sm mb-2">All Franchises</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {chartData.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No data available</p>
                ) : (
                  chartData.map((entry: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="truncate pr-2 font-medium">{entry.name || entry.code}</span>
                      <span className="bg-muted px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                        {entry.leads} Leads
                      </span>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-muted-foreground">
          Top {chartData.length} franchises · Double-click a slice to view leads
        </p>
      </CardHeader>

      <CardContent className="h-[260px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="leads"
                nameKey="code"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={2}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{ cursor: onBarDoubleClick ? "pointer" : "default" }}
                    onDoubleClick={() => onBarDoubleClick?.(entry)}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value} Leads`,
                  props.payload?.name ?? name,
                ]}
                contentStyle={{
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                }}
                itemStyle={{ fontSize: "12px", color: "var(--foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Franchise Leads Modal ────────────────────────────────────────────────────

interface FranchiseLeadsModalProps {
  open: boolean;
  onClose: () => void;
  vendorId?: number;
  franchise: FranchiseLeadCount | null;
}

function FranchiseLeadsModal({
  open,
  onClose,
  vendorId,
  franchise,
}: FranchiseLeadsModalProps) {
  const router = useRouter();
  const { data = [], isLoading } = useFranchiseLeads(
    vendorId,
    franchise?.franchise_id,
  );

  function handleRowDoubleClick(row: (typeof data)[number]) {
    const basePath =
      row.stage_tag && STAGE_PATH_BY_TAG[row.stage_tag]
        ? `${STAGE_PATH_BY_TAG[row.stage_tag]}/${row.id}`
        : `/dashboard/leads/leadstable/details/${row.id}`;
    const params = new URLSearchParams();
    if (row.account_id) params.set("accountId", String(row.account_id));
    if (row.instance_id) params.set("instance_id", String(row.instance_id));
    router.push(`${basePath}?${params.toString()}`);
  }

  const STAGE_LABEL_FULL: Record<string, string> = {
    "Type 1": "Open Lead",
    "Type 2": "ISM",
    "Type 3": "Designing",
    "Type 4": "Booking",
    "Type 5": "Final Measurement",
    "Type 6": "Client Docs",
    "Type 7": "Client Approval",
    "Type 8": "Tech Check",
    "Type 9": "Order Login",
    "Type 10": "Production",
    "Type 11": "Ready to Dispatch",
    "Type 12": "Site Readiness",
    "Type 13": "Dispatch Planning",
    "Type 14": "Dispatch",
    "Type 15": "Under Installation",
    "Type 16": "Final Handover",
    "Type 17": "Completed",
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={`${franchise?.name ?? "Franchise"} — Leads`}
      description="Double-click a row to open lead details"
      size="lg"
    >
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Lead Code
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Client
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Stage
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No leads found for this franchise
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={`${row.id}-${row.instance_id ?? "lead"}`}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer select-none"
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    <td className="px-4 py-3 font-bold text-xs font-medium">
                      {row.lead_code ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                        {row.stage_tag
                          ? (STAGE_LABEL_FULL[row.stage_tag] ?? row.stage_tag)
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </BaseModal>
  );
}

// ─── Stage Leads Modal ───────────────────────────────────────────────────────

interface StageLeadsModalProps {
  open: boolean;
  onClose: () => void;
  vendorId?: number;
  tag: string | null;
  franchiseId?: number;
}

const STAGE_LABEL_FULL: Record<string, string> = {
  "Type 1": "Open Lead",
  "Type 2": "ISM",
  "Type 3": "Designing",
  "Type 4": "Booking",
  "Type 5": "Final Measurement",
  "Type 6": "Client Docs",
  "Type 7": "Client Approval",
  "Type 8": "Tech Check",
  "Type 9": "Order Login",
  "Type 10": "Production",
  "Type 11": "Ready to Dispatch",
  "Type 12": "Site Readiness",
  "Type 13": "Dispatch Planning",
  "Type 14": "Dispatch",
  "Type 15": "Under Installation",
  "Type 16": "Final Handover",
  "Type 17": "Completed",
};

function StageLeadsModal({
  open,
  onClose,
  vendorId,
  tag,
  franchiseId,
}: StageLeadsModalProps) {
  const router = useRouter();
  const { data = [], isLoading } = useStageLeads(
    vendorId,
    tag ?? undefined,
    franchiseId,
  );

  function handleRowDoubleClick(row: (typeof data)[number]) {
    const basePath =
      row.stage_tag && STAGE_PATH_BY_TAG[row.stage_tag]
        ? `${STAGE_PATH_BY_TAG[row.stage_tag]}/${row.id}`
        : `/dashboard/leads/leadstable/details/${row.id}`;
    const params = new URLSearchParams();
    if (row.account_id) params.set("accountId", String(row.account_id));
    if (row.instance_id) params.set("instance_id", String(row.instance_id));
    router.push(`${basePath}?${params.toString()}`);
  }

  const stageLabel = tag ? (STAGE_LABEL_FULL[tag] ?? tag) : "Stage";

  return (
    <BaseModal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={`${stageLabel} — Leads`}
      description="Double-click a row to open lead details"
      size="xl"
    >
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Lead Code
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Client
                </th>
                {!franchiseId && (
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                    Franchise
                  </th>
                )}
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Stage
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: franchiseId ? 3 : 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={franchiseId ? 3 : 4}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No leads found for this stage
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer select-none"
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {row.lead_code ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    {!franchiseId && (
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.franchise_name ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {row.stage_tag
                          ? (STAGE_LABEL_FULL[row.stage_tag] ?? row.stage_tag)
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </BaseModal>
  );
}

// ─── Franchise Performance Table ─────────────────────────────────────────────

interface FranchisePerformanceTableProps {
  data?: FranchisePerformanceRow[];
  isLoading?: boolean;
}

function FranchisePerformanceTable({
  data = [],
  isLoading,
}: FranchisePerformanceTableProps) {
  return (
    <Card className="w-full border bg-[#fff] dark:bg-[#0a0a0a]">
      <CardHeader className="pb-2 px-6 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-medium">
            Franchisee-wise Performance
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Leads, closures and revenue per franchise
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 w-[40%]">
                  Franchise
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">
                  Leads
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">
                  Closures
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="h-4 w-8 bg-muted animate-pulse rounded ml-auto" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-xs text-muted-foreground"
                  >
                    No franchise data available
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const closureRate =
                    row.leads > 0
                      ? ((row.closures / row.leads) * 100).toFixed(0)
                      : "0";
                  return (
                    <tr
                      key={row.franchise_id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-foreground truncate">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        {row.leads.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {row.closures.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-emerald-500">
                            {closureRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        {formatRevenue(row.revenue)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Avg Days Per Stage ───────────────────────────────────────────────────────

const STAGE_CONFIG = [
  {
    key: "lead" as const,
    label: "Leads → Booking",
    range: "Type 1 → 4",
    color: "bg-sky-500",
  },
  {
    key: "project" as const,
    label: "Final Measurement → Client Approval",
    range: "Type 5 → 7",
    color: "bg-violet-500",
  },
  {
    key: "production" as const,
    label: "Tech Check → Ready To Dispatch",
    range: "Type 8 → 11",
    color: "bg-amber-500",
  },
  {
    key: "installation" as const,
    label: "Site Readiness → Final Handover",
    range: "Type 12 → 17",
    color: "bg-emerald-500",
  },
];

interface AvgDaysPerStageCardProps {
  vendorId?: number;
  franchises: FranchiseSummary[];
}

function AvgDaysPerStageCard({
  vendorId,
  franchises,
}: AvgDaysPerStageCardProps) {
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<
    number | undefined
  >(undefined);

  const { data, isLoading } = useAvgDaysPerStage(vendorId, selectedFranchiseId);

  const selectedFranchiseName = selectedFranchiseId
    ? (franchises.find((f) => f.id === selectedFranchiseId)?.franchise_name ??
      "Overall")
    : "Overall";

  const maxDays = data
    ? Math.max(data.lead, data.project, data.production, data.installation, 1)
    : 1;

  return (
    <Card className="w-full h-full border bg-[#fff] dark:bg-[#0a0a0a] flex flex-col">
      <CardHeader className="pb-2 px-6 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-medium">
            Avg Days Taken per Stage
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Average time leads spend progressing through each pipeline stage
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs max-w-[130px] shrink-0"
              disabled={isLoading}
            >
              <span className="truncate">{selectedFranchiseName}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 max-h-60 overflow-y-auto"
          >
            <DropdownMenuItem onClick={() => setSelectedFranchiseId(undefined)}>
              Overall
            </DropdownMenuItem>
            {franchises.map((f) => (
              <DropdownMenuItem
                key={f.id}
                onClick={() => setSelectedFranchiseId(f.id)}
              >
                {f.franchise_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between px-6 pb-5 pt-1 gap-3">
        {STAGE_CONFIG.map(({ key, label, color }) => {
          const days = data?.[key] ?? 0;
          const pct = Math.round((days / maxDays) * 100);

          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                </div>
                {isLoading ? (
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <span className="text-xl font-semibold tabular-nums">
                    {days > 0 ? days : "—"}
                    {days > 0 && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        days
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                {isLoading ? (
                  <div className="h-full w-1/2 bg-muted-foreground/20 animate-pulse rounded-full" />
                ) : (
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Stage-wise Bar Chart ─────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  "Type 1": "Leads",
  "Type 2": "ISM",
  "Type 3": "Designing",
  "Type 4": "Booking",
  "Type 5": "FM",
  "Type 6": "Client Docs",
  "Type 7": "Approval",
  "Type 8": "TC",
  "Type 9": "OL",
  "Type 10": "Prod",
  "Type 11": "RTD",
  "Type 12": "SR",
  "Type 13": "Dispatch P.",
  "Type 14": "Dispatch",
  "Type 15": "Inst.",
  "Type 16": "FH",
  "Type 17": "Completed",
};

interface StageWiseBarChartProps {
  vendorId?: number;
  franchises: FranchiseSummary[];
}

function StageWiseBarChart({ vendorId, franchises }: StageWiseBarChartProps) {
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<
    number | undefined
  >(undefined);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useStageWiseCounts(vendorId, selectedFranchiseId);

  console.log(
    "[StageWiseBarChart] vendorId:",
    vendorId,
    "franchiseId:",
    selectedFranchiseId,
    "isLoading:",
    isLoading,
    "isError:",
    isError,
    "data:",
    data,
    "error:",
    error,
  );

  const chartData = data.map((s) => ({
    label: STAGE_LABEL[s.tag] ?? s.tag,
    count: s.count,
    tag: s.tag,
  }));

  console.log("[StageWiseBarChart] chartData:", chartData);

  const selectedFranchiseName = selectedFranchiseId
    ? (franchises.find((f) => f.id === selectedFranchiseId)?.franchise_name ??
      "Overall")
    : "Overall";

  function handleBarClick(entry: { tag: string }) {
    setSelectedTag(entry.tag);
  }

  return (
    <>
      <Card className="w-full border flex flex-col bg-[#fff] dark:bg-[#0a0a0a]">
        <CardHeader className="flex flex-row justify-between items-start pb-2 space-y-0">
          <div>
            <CardTitle className="text-sm font-medium">
              Leads by Stage
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total projects across all 17 stages
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs max-w-[160px]"
                disabled={isLoading}
              >
                <span className="truncate">{selectedFranchiseName}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 max-h-60 overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => setSelectedFranchiseId(undefined)}
              >
                Overall
              </DropdownMenuItem>
              {franchises.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => setSelectedFranchiseId(f.id)}
                >
                  {f.franchise_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="h-[260px] px-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="h-full flex items-center justify-center text-xs text-rose-500">
              Failed to load stage data. Check console for details.
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No stage data found. vendorId: {vendorId ?? "undefined"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof chartData)[number];
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{d.label}</p>
                        <p className="text-muted-foreground">
                          {d.count} lead{d.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  fill="var(--primary)"
                  onClick={(data) =>
                    handleBarClick(
                      data as unknown as (typeof chartData)[number],
                    )
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <StageLeadsModal
        open={!!selectedTag}
        onClose={() => setSelectedTag(null)}
        vendorId={vendorId}
        tag={selectedTag}
        franchiseId={selectedFranchiseId}
      />
    </>
  );
}

// ─── Overdue Installations Modal ─────────────────────────────────────────────

interface OverdueInstallationsModalProps {
  open: boolean;
  onClose: () => void;
  vendorId?: number;
  defaultFranchiseId?: number | null;
  franchises: FranchiseSummary[];
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDisplayLeadCode(
  leadCode: string | null | undefined,
  quantityIndex: number | null | undefined,
  hasMultipleInstances: boolean,
) {
  if (!leadCode) return "—";
  const normalizedLeadCode =
    quantityIndex !== null &&
    quantityIndex !== undefined &&
    leadCode.endsWith(`.${quantityIndex}`)
      ? leadCode.slice(0, -(`.${quantityIndex}`.length))
      : leadCode;
  if (
    hasMultipleInstances &&
    quantityIndex !== null &&
    quantityIndex !== undefined
  ) {
    return `${normalizedLeadCode}.${quantityIndex}`;
  }
  return normalizedLeadCode;
}

function OverdueInstallationsModal({
  open,
  onClose,
  vendorId,
  defaultFranchiseId,
  franchises,
}: OverdueInstallationsModalProps) {
  const router = useRouter();
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<
    number | undefined
  >(defaultFranchiseId ?? undefined);

  const { data = [], isLoading } = useOverdueInstallations(
    vendorId,
    selectedFranchiseId,
  );

  const selectedFranchiseName = selectedFranchiseId
    ? (franchises.find((f) => f.id === selectedFranchiseId)?.franchise_name ??
      "Overall")
    : "Overall";
  const instanceCountByLeadId = useMemo(() => {
    const counts = new Map<number, number>();
    data.forEach((row) => {
      counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
    });
    return counts;
  }, [data]);

  function handleRowDoubleClick(row: (typeof data)[number]) {
    const basePath =
      row.stage_tag && STAGE_PATH_BY_TAG[row.stage_tag]
        ? `${STAGE_PATH_BY_TAG[row.stage_tag]}/${row.id}`
        : `/dashboard/leads/leadstable/details/${row.id}`;
    const params = new URLSearchParams();
    if (row.account_id) params.set("accountId", String(row.account_id));
    if (row.instance_id) params.set("instance_id", String(row.instance_id));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="min-w-5xl w-full">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle className="text-base font-semibold">
              Overdue Installations
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Projects completed past their expected installation deadline
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs max-w-[160px] shrink-0 mr-6"
              >
                <span className="truncate">{selectedFranchiseName}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 max-h-60 overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => setSelectedFranchiseId(undefined)}
              >
                Overall
              </DropdownMenuItem>
              {franchises.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => setSelectedFranchiseId(f.id)}
                >
                  {f.franchise_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Lead Code
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Instance
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Client
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Franchise
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Expected End
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Days Overdue
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No overdue installations found
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer select-none"
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {getDisplayLeadCode(
                        row.lead_code,
                        row.quantity_index,
                        (instanceCountByLeadId.get(row.id) ?? 0) > 1,
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {row.instance_title?.trim() ||
                        (row.quantity_index
                          ? `Instance ${row.quantity_index}`
                          : "—")}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {row.franchise_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatDate(row.expected_end)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                        {row.days_overdue} Days
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Overdue Production Modal ────────────────────────────────────────────────

interface OverdueProductionModalProps {
  open: boolean;
  onClose: () => void;
  vendorId?: number;
  franchises: FranchiseSummary[];
}

function OverdueProductionModal({
  open,
  onClose,
  vendorId,
  franchises,
}: OverdueProductionModalProps) {
  const router = useRouter();
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<
    number | undefined
  >(undefined);
  const [activeTab, setActiveTab] = useState<"deadline-overrun" | "live-delay">(
    "deadline-overrun",
  );

  const { data = [], isLoading } = useOverdueProduction(
    vendorId,
    selectedFranchiseId,
  );

  const selectedFranchiseName = selectedFranchiseId
    ? (franchises.find((f) => f.id === selectedFranchiseId)?.franchise_name ??
      "Overall")
    : "Overall";

  function handleRowDoubleClick(row: OverdueProduction) {
    const basePath =
      row.stage_tag && STAGE_PATH_BY_TAG[row.stage_tag]
        ? `${STAGE_PATH_BY_TAG[row.stage_tag]}/${row.id}`
        : `/dashboard/leads/leadstable/details/${row.id}`;
    const params = new URLSearchParams();
    if (row.account_id) params.set("accountId", String(row.account_id));
    if (row.instance_id) params.set("instance_id", String(row.instance_id));
    router.push(`${basePath}?${params.toString()}`);
  }

  function getDaysFromToday(expectedReadyDate: string): number {
    return Math.ceil(
      (new Date(expectedReadyDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
  }

  const isDeadlineOverrun = activeTab === "deadline-overrun";
  const colCount = isDeadlineOverrun ? 6 : 5;
  const filteredData = isDeadlineOverrun
    ? data
    : data.filter((row) => getDaysFromToday(row.expected_ready_date) < 0);
  const instanceCountByLeadId = useMemo(() => {
    const counts = new Map<number, number>();
    data.forEach((row) => {
      counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
    });
    return counts;
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="min-w-5xl w-full">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle className="text-base font-semibold">
              Overdue Production
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Orders whose expected ready date exceeds the client required
              delivery date
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs max-w-[160px] shrink-0 mr-6"
              >
                <span className="truncate">{selectedFranchiseName}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 max-h-60 overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => setSelectedFranchiseId(undefined)}
              >
                Overall
              </DropdownMenuItem>
              {franchises.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => setSelectedFranchiseId(f.id)}
                >
                  {f.franchise_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="h-8 p-0.5 w-full grid grid-cols-2">
            <TabsTrigger value="deadline-overrun" className="h-7 text-xs">
              Deadline Overrun
            </TabsTrigger>
            <TabsTrigger value="live-delay" className="h-7 text-xs">
              Live Delay
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/60">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Lead Code
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Client
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Franchise
                </th>
                {isDeadlineOverrun && (
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                    Client Required By
                  </th>
                )}
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                  Expected Ready
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                  {isDeadlineOverrun ? "Overrun" : "From Today"}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: colCount }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {isDeadlineOverrun
                      ? "No production orders exceeding client delivery date found"
                      : "No overdue production orders found"}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const daysFromToday = getDaysFromToday(row.expected_ready_date);
                  return (
                    <tr
                      key={`${row.id}-${row.instance_id ?? "lead"}`}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer select-none"
                      onDoubleClick={() => handleRowDoubleClick(row)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">
                        {getDisplayLeadCode(
                          row.lead_code,
                          row.quantity_index,
                          (instanceCountByLeadId.get(row.id) ?? 0) > 1,
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {row.franchise_name ?? "—"}
                      </td>
                      {isDeadlineOverrun && (
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {formatDate(row.client_required_date)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {formatDate(row.expected_ready_date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isDeadlineOverrun ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                            {row.days_overdue} Days
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                            {daysFromToday > 0
                              ? `${daysFromToday} Days Left`
                              : daysFromToday < 0
                                ? `${Math.abs(daysFromToday)} Days Past`
                                : "Today"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Overdue Alerts Combined Card ─────────────────────────────────────────────

interface OverdueAlertsCardProps {
  installationCount: number;
  productionCount: number;
  isLoadingInstallation: boolean;
  isLoadingProduction: boolean;
  onInstallationClick: () => void;
  onProductionClick: () => void;
}

function OverdueAlertsCard({
  installationCount,
  productionCount,
  isLoadingInstallation,
  isLoadingProduction,
  onInstallationClick,
  onProductionClick,
}: OverdueAlertsCardProps) {
  return (
    <div className="border rounded-2xl py-4 px-5 flex flex-col gap-4 bg-background">

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {/* Installation */}
        <button
          onClick={onInstallationClick}
          className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20 transition-all text-left"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-500/15 shrink-0">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Installation</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Past expected end date
            </p>
          </div>
          {isLoadingInstallation ? (
            <div className="h-7 w-8 bg-muted animate-pulse rounded" />
          ) : (
            <span className="text-xl font-bold text-rose-500 tabular-nums">
              {installationCount}
            </span>
          )}
        </button>

        <div className="border-t border-border/40 mx-1" />

        {/* Production */}
        <button
          onClick={onProductionClick}
          className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-500/10 dark:hover:border-orange-500/20 transition-all text-left"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 shrink-0">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Production</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Exceeds client delivery date
            </p>
          </div>
          {isLoadingProduction ? (
            <div className="h-7 w-8 bg-muted animate-pulse rounded" />
          ) : (
            <span className="text-xl font-bold text-orange-500 tabular-nums">
              {productionCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const franchiseId = useAppSelector((s) => s.auth.franchise_id) ?? undefined;
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showOverdueProductionModal, setShowOverdueProductionModal] =
    useState(false);
  const [selectedFranchise, setSelectedFranchise] =
    useState<FranchiseLeadCount | null>(null);

  const { data: revenueData, isLoading: revenueLoading } = useAdminTotalRevenue(
    vendorId,
    franchiseId,
  );
  const { data: franchiseeData, isLoading: franchiseeLoading } =
    useActiveFranchiseeCount(vendorId);
  const { data: leadsThisMonthData, isLoading: leadsThisMonthLoading } =
    useLeadsThisMonth(vendorId);
  const { data: franchiseLeadsData, isLoading: franchiseLeadsLoading } =
    useLeadsByFranchise(vendorId);
  const { data: overdueData, isLoading: overdueLoading } =
    useOverdueProjectsCount(vendorId);
  const { data: overdueProductionData, isLoading: overdueProductionLoading } =
    useOverdueProductionCount(vendorId);
  const { data: franchisePerfData, isLoading: franchisePerfLoading } =
    useFranchisePerformance(vendorId);
  const { data: franchisesData } = useFranchisesByVendorId(vendorId);

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
          value={
            leadsThisMonthData
              ? leadsThisMonthData.count.toLocaleString("en-IN")
              : "—"
          }
          sub="New leads created this month"
          positive
          icon={ClipboardList}
          accent="text-violet-500"
          dot="bg-violet-500"
          isLoading={leadsThisMonthLoading}
        />
        <OverdueAlertsCard
          installationCount={overdueData?.count ?? 0}
          productionCount={overdueProductionData?.count ?? 0}
          isLoadingInstallation={overdueLoading}
          isLoadingProduction={overdueProductionLoading}
          onInstallationClick={() => setShowOverdueModal(true)}
          onProductionClick={() => setShowOverdueProductionModal(true)}
        />
      </div>

      {/* Charts row */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="lg:w-[60%]">
          <RevenueChart vendorId={vendorId} franchises={franchisesData ?? []} />
        </div>
        <div className="lg:w-[40%]">
          <FranchiseChart
            data={franchiseLeadsData}
            isLoading={franchiseLeadsLoading}
            onBarDoubleClick={(f) => setSelectedFranchise(f)}
          />
        </div>
      </div>

      {/* Stage-wise bar chart */}
      <StageWiseBarChart
        vendorId={vendorId}
        franchises={franchisesData ?? []}
      />

      {/* Franchise performance + Avg days per stage */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="lg:w-[40%]">
          <FranchisePerformanceTable
            data={franchisePerfData}
            isLoading={franchisePerfLoading}
          />
        </div>
        <div className="lg:w-[60%]">
          <AvgDaysPerStageCard
            vendorId={vendorId}
            franchises={franchisesData ?? []}
          />
        </div>
      </div>

      <FranchiseLeadsModal
        open={!!selectedFranchise}
        onClose={() => setSelectedFranchise(null)}
        vendorId={vendorId}
        franchise={selectedFranchise}
      />

      <OverdueInstallationsModal
        open={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        vendorId={vendorId}
        franchises={franchisesData ?? []}
      />

      <OverdueProductionModal
        open={showOverdueProductionModal}
        onClose={() => setShowOverdueProductionModal(false)}
        vendorId={vendorId}
        franchises={franchisesData ?? []}
      />
    </div>
  );
}
