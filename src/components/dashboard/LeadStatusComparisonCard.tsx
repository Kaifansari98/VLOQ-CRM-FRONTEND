"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import type { LeadStatusCounts } from "@/api/dashboard/dashboard.api";

interface LeadStatusComparisonCardProps {
  overall?: LeadStatusCounts | null;
  mine?: LeadStatusCounts | null;
  isLoading?: boolean;
}

type Category = "leads" | "project" | "production" | "installation";

const CATEGORIES: Record<
  Category,
  { key: keyof LeadStatusCounts; label: string }[]
> = {
  leads: [
    { key: "total_open_leads", label: "Open" },
    { key: "total_initial_site_measurement_leads", label: "Initial Site Measurements" },
    { key: "total_designing_stage_leads", label: "Booking" },
    { key: "total_booking_stage_leads", label: "Designing" },
  ],
  project: [
    { key: "total_final_measurement_leads", label: "Final Measurements" },
    { key: "total_client_documentation_leads", label: "Client Documentation" },
    { key: "total_client_approval_leads", label: "Client Approval" },
  ],
  production: [
    { key: "total_tech_check_leads", label: "Tech Check" },
    { key: "total_order_login_leads", label: "Order Login" },
    { key: "total_production_stage_leads", label: "Production" },
    { key: "total_ready_to_dispatch_leads", label: "Ready To Dispatch" },
  ],
  installation: [
    { key: "total_site_readiness_stage_leads", label: "Site Readiness" },
    { key: "total_dispatch_planning_stage_leads", label: "Dispatch Planning" },
    { key: "total_dispatch_stage_leads", label: "Dispatch" },
    { key: "total_under_installation_stage_leads", label: "Under Installation" },
    { key: "total_final_handover_stage_leads", label: "Final Handover" },
    { key: "total_project_completed_stage_leads", label: "Completed Projects" },
  ],
};

const chartColors = {
  grid: "hsl(var(--border))",
  tick: "hsl(var(--muted-foreground))",
  barOverall: "hsl(var(--primary))",
  barMine: "#737373",
  tooltipBg: "hsl(var(--popover))",
  tooltipBorder: "hsl(var(--border))",
  tooltipText: "hsl(var(--foreground))",
  cursor: "hsl(var(--muted))",
};

export default function LeadStatusComparisonCard({
  overall,
  mine,
  isLoading = false,
}: LeadStatusComparisonCardProps) {
  const [category, setCategory] = useState<Category>("leads");

  const chartData = useMemo(() => {
    const labels = CATEGORIES[category];
    return labels.map(({ key, label }) => ({
      label,
      overall: overall ? (overall[key] as number) : 0,
      mine: mine ? (mine[key] as number) : 0,
    }));
  }, [category, overall, mine]);

  const totalOverall =
    chartData.reduce((acc, item) => acc + (item.overall || 0), 0) || 0;
  const totalMine =
    chartData.reduce((acc, item) => acc + (item.mine || 0), 0) || 0;

  const categoryLabel =
    category === "leads"
      ? "Leads"
      : category === "project"
      ? "Project"
      : category === "production"
      ? "Production"
      : "Installation";

  return (
    <Card className="w-full h-full border flex flex-col justify-between rounded-2xl pb-4">
      <CardHeader className="flex flex-row justify-between items-start space-y-0">
        <div className="space-y-0">
          <CardTitle className="text-sm font-medium">
            Leads Overview
          </CardTitle>
          {isLoading ? (
            <div className="flex gap-3">
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <div className="flex gap-4 text-xs text-muted-foreground">
                <p className="flex flex-col">
              <span>
                My Leads
              </span>
                <span className="text-foreground font-semibold">
                  {totalMine}
                </span>
                </p>

                <p className="flex flex-col">

              <span>
                Overall Leads
              </span>
                <span className="text-foreground font-semibold">
                  {totalOverall}
                </span>
                </p>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              disabled={isLoading}
            >
              {categoryLabel}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setCategory("leads")}>
              Leads
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategory("project")}>
              Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategory("production")}>
              Production
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCategory("installation")}>
              Installation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="py-0">
        {isLoading ? (
          <div className="h-[220px] flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-[240px] overflow-x-auto">
            <div className="min-w-[500px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ left: -10, right: 8, top: 8, bottom: 18 }}
                  barCategoryGap={12}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.grid}
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    tick={{ fill: chartColors.tick, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  {/* <YAxis
                    tick={{ fill: chartColors.tick, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  /> */}
                  <Tooltip
                    formatter={(value: number, name, entry) => [
                      value.toLocaleString(),
                      name === "overall" ? "Overall" : "My Leads",
                    ]}
                    contentStyle={{
                      color: chartColors.tooltipText,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: "10px",
                      boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                    cursor={{ fill: chartColors.cursor, opacity: 0.12 }}
                  />
                  {/* <Legend
                    verticalAlign="top"
                    height={24}
                    wrapperStyle={{
                      fontSize: 12,
                      color: chartColors.tick,
                    }}
                    formatter={(value) =>
                      value === "overall" ? "Overall" : "My Leads"
                    }
                  /> */}
                    <Bar
                      dataKey="mine"
                      name="mine"
                      fill={chartColors.barMine}
                      radius={[6, 6, 0, 0]}
                      // barSize={18}
                    />
                  <Bar
                    dataKey="overall"
                    name="overall"
                    fill={chartColors.barOverall}
                    radius={[6, 6, 0, 0]}
                    // barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
