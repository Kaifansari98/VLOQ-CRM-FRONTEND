"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartMode = "week" | "month" | "year";

interface PerformanceBarChartProps {
  data?: {
    bookedThisWeek: number[];
    bookedThisMonth: number[];
    bookedThisYear: number[];
    bookedOverall?: number;
    bookedThisWeekTotal?: number;
    bookedThisMonthTotal?: number;
    bookedThisYearTotal?: number;
  };
  isLoading?: boolean;
}

export default function PerformanceLineChart({
  data,
  isLoading = false,
}: PerformanceBarChartProps) {
  const [mode, setMode] = useState<ChartMode>("year");

  const weekly = data?.bookedThisWeek || [45, 52, 38, 65, 48, 55, 42];
  const monthly = data?.bookedThisMonth || [80, 220, 145, 240];
  const yearly = data?.bookedThisYear || [
    850, 190, 880, 350, 450, 750, 920, 1150, 1480, 1200, 1140, 1280,
  ];

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const totalsByMode = {
    week: data?.bookedThisWeekTotal ?? sum(weekly),
    month: data?.bookedThisMonthTotal ?? sum(monthly),
    year: data?.bookedThisYearTotal ?? sum(yearly),
  };
  const selectedTotal = totalsByMode[mode];
  const selectedLabel =
    mode === "week"
      ? "This Week"
      : mode === "month"
      ? "This Month"
      : "This Year";

  const chartData = useMemo(() => {
    if (mode === "week")
      return weekly.map((value, i) => ({
        name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        bookings: value,
      }));
    if (mode === "month")
      return monthly.map((value, i) => ({
        name: `Week ${i + 1}`,
        bookings: value,
      }));
    return yearly.map((value, i) => ({
      name: [
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
      ][i],
      bookings: value,
    }));
  }, [mode, weekly, monthly, yearly]);

  const totalBookings = selectedTotal;
  const avgBookings = Math.round(totalBookings / chartData.length);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      setIsDark(root.classList.contains("dark"));
    }
  }, []);

  return (
    <Card className="w-full border flex flex-col justify-between bg-[#fff] dark:bg-[#0a0a0a]">
      <CardHeader className="flex flex-row justify-between items-start pb-2 space-y-0">
        <div className="space-y-0">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>

          <div className="flex items-baseline gap-2">
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <span className="text-2xl font-semibold">
                    {selectedTotal}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedLabel}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

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
      </CardHeader>

      <CardContent className="h-[200px]">
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
    
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ left: 15, right: 5, top: 5, bottom: 0 }}
              >
                <defs>
                  {/* Light Mode – Neutral */}
                  <linearGradient
                    id="lightGrayGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(240, 5%, 75%)"
                      stopOpacity={0.55}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(240, 5%, 92%)"
                      stopOpacity={0.15}
                    />
                  </linearGradient>

                  {/* Dark Mode – Neutral */}
                  <linearGradient
                    id="darkGrayGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(0, 0%, 90%)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(240, 6%, 10%)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  // fill="var(--border)"
                  opacity={0.3}
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    color: "hsl(var(--tooltip-text)",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  cursor={{ stroke: "hsl(240, 6%, 10%)", strokeWidth: 1 }}
                />

                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill={`url(#${
                    isDark ? "darkGrayGradient" : "lightGrayGradient"
                  })`}
                  dot={{ r: 3, fill: "hsl(240, 6%, 10%)" }}
                  activeDot={{ r: 5, fill: "" }}
                />
              </AreaChart>
            </ResponsiveContainer>
         
        )}
      </CardContent>
    </Card>
  );
}
