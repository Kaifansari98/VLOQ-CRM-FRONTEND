"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartMode = "week" | "month" | "year";

interface BookingValueCardProps {
  data?: {
    bookingValueThisWeekArray: number[];
    bookingValueThisMonthArray: number[];
    bookingValueThisYearArray: number[];
    bookingValueThisWeek: number;
    bookingValueThisMonth: number;
    bookingValueThisYear: number;
  };
  isLoading?: boolean;
}

const sum = (arr: number[]) => arr.reduce((acc, v) => acc + v, 0);

export default function BookingValueCard({
  data,
  isLoading = false,
}: BookingValueCardProps) {
  const [mode, setMode] = useState<ChartMode>("year");

  const weekly = data?.bookingValueThisWeekArray || [
    980, 2400, 1930, 2900, 2500, 3900, 3200,
  ];
  const monthly = data?.bookingValueThisMonthArray || [1250, 920, 2000, 1400];
  const yearly = data?.bookingValueThisYearArray || [
    980, 2400, 1930, 2900, 2500, 3900, 3200, 2400, 1930, 2900, 2500, 3900,
  ];

  const totalsByMode: Record<ChartMode, number> = {
    week: data?.bookingValueThisWeek ?? sum(weekly),
    month: data?.bookingValueThisMonth ?? sum(monthly),
    year: data?.bookingValueThisYear ?? sum(yearly),
  };

  const chartData = useMemo(() => {
    if (mode === "week") {
      return weekly.map((value, i) => ({
        name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        value,
      }));
    }
    if (mode === "month") {
      return monthly.map((value, i) => ({
        name: `Week ${i + 1}`,
        value,
      }));
    }
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
      value,
    }));
  }, [mode, weekly, monthly, yearly]);

  const selectedTotal = totalsByMode[mode];
  const selectedLabel =
    mode === "week"
      ? "This Week"
      : mode === "month"
      ? "This Month"
      : "This Year";

  return (
    <Card className="w-full h-full border flex flex-col justify-between">
      <CardHeader className="flex flex-row justify-between items-start pb-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Booking Value</CardTitle>
          {isLoading ? (
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {selectedTotal?.toLocaleString() ?? "-"}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedLabel}
              </span>
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
                margin={{ left: 0, right: 0, top: 5, bottom: 0 }}
              >
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
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
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
