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
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import type { LeadStatusCounts } from "@/api/dashboard/dashboard.api";

type Mode = "overall" | "mine";

interface LeadStatusComparisonCardProps {
  overall?: LeadStatusCounts | null;
  mine?: LeadStatusCounts | null;
  isLoading?: boolean;
}

const LABELS: { key: keyof LeadStatusCounts; label: string }[] = [
  { key: "total_open_leads", label: "S-1" },
  { key: "total_initial_site_measurement_leads", label: "S-2" },
  { key: "total_designing_stage_leads", label: "S-3" },
  { key: "total_booking_stage_leads", label: "S-4" },
  { key: "total_final_measurement_leads", label: "S-5" },
  { key: "total_client_documentation_leads", label: "S-6" },
  { key: "total_client_approval_leads", label: "S-7" },
  { key: "total_tech_check_leads", label: "S-8" },
  { key: "total_order_login_leads", label: "S-9" },
  { key: "total_production_stage_leads", label: "S-10" },
  { key: "total_ready_to_dispatch_leads", label: "S-11" },
  { key: "total_site_readiness_stage_leads", label: "S-12" },
  { key: "total_dispatch_planning_stage_leads", label: "S-13" },
  { key: "total_dispatch_stage_leads", label: "S-14" },
  { key: "total_under_installation_stage_leads", label: "S-15" },
  { key: "total_final_handover_stage_leads", label: "S-16" },
  { key: "total_project_completed_stage_leads", label: "S-17" },
];

export default function LeadStatusComparisonCard({
  overall,
  mine,
  isLoading = false,
}: LeadStatusComparisonCardProps) {
  const [mode, setMode] = useState<Mode>("overall");

  const chartData = useMemo(() => {
    const source = mode === "overall" ? overall : mine;
    return LABELS.map(({ key, label }) => ({
      label,
      count: source ? (source[key] as number) : 0,
    }));
  }, [mode, overall, mine]);

  const total =
    chartData.reduce((acc, item) => acc + (item.count || 0), 0) || 0;

  return (
    <Card className="w-full h-full border flex flex-col justify-between rounded-2xl">
      <CardHeader className="flex flex-row justify-between items-start pb-2 space-y-0">
        <div className="space-y-0">
          <CardTitle className="text-sm font-medium">
            Lead Status Overview
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {mode === "overall" ? "Overall Vendor Leads" : "My Leads"}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-semibold">{total}</div>
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
              {mode === "overall" ? "Overall" : "My Leads"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => setMode("overall")}>
              Overall Leads
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("mine")}>
              My Leads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-[220px] flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ left: -10, right: 0, top: 5, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={50}
                />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
