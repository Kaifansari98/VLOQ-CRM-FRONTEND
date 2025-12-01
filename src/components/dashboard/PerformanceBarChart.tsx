"use client";

import { useState, useMemo } from "react";
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
  LineChart,
  Line,
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

  // Dummy fallback values
  // const weekly = data?.bookedThisWeek || [45, 52, 38, 65, 48, 55, 42];
  const weekly = [45, 52, 38, 65, 48, 55, 42];
  // const monthly = data?.bookedThisMonth || [180, 220, 195, 240];
  const monthly = [80, 220, 145, 240];
  // const yearly = data?.bookedThisYear || [
  //   850, 920, 880, 1050, 980, 1100, 1020, 1150, 1080, 1200, 1140, 1280,
  // ];
  const yearly = [
    850, 190, 880, 350, 450, 750, 920, 1150, 1480, 1200, 1140, 1280,
  ];

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  console.log(data?.bookedThisWeek);

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

  return (
    <Card className="w-full h-full border flex flex-col justify-between">
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

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>
              Avg.{" "}
              <span className="font-medium text-foreground">{avgBookings}</span>{" "}
              per{" "}
              {mode === "year" ? "month" : mode === "month" ? "week" : "day"}
            </span>
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

      {/* Line Chart */}
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ left: 30, right: 10, top: 5, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
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
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  cursor={{ stroke: "hsl(240, 6%, 10%)", strokeWidth: 1 }}
                />

                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(240, 6%, 10%)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "hsl(240, 6%, 10%)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
