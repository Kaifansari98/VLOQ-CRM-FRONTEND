"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

type Filter = "week" | "month" | "year";

interface AvgDaysToBookingCardProps {
  avgDays: number;
  readable: { days: number; hours: number; minutes: number };
  isLoading?: boolean;
  onFilterChange?: (filter: Filter) => void;
}

export default function AvgDaysToBookingCard({
  avgDays,
  readable,
  isLoading = false,
  onFilterChange,
}: AvgDaysToBookingCardProps) {
  const [filter, setFilter] = useState<Filter>("month");

  const handleSelect = (value: Filter) => {
    setFilter(value);
    onFilterChange?.(value);
  };

  const readableLabel = `${readable?.days ?? 0}d ${readable?.hours ?? 0}h ${
    readable?.minutes ?? 0
  }m`;

  return (
    <div className="border py-4 w-1/2 rounded-2xl mt-4 flex flex-col justify-between">
      <div className="flex flex-row justify-between items-start px-5">
        <div>
          <CardTitle className="text-sm font-medium">
            Avg Days to Booking
          </CardTitle>
          <p className="text-xs text-muted-foreground">Lead → Booking</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button> */}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => handleSelect("week")}>
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelect("month")}>
              This Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSelect("year")}>
              This Year
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-5">
        {isLoading ? (
          <>
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-semibold">
              {avgDays ? avgDays.toFixed(2) : "0.00"} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">{readableLabel}</p>
          </>
        )}
      </div>
    </div>
  );
}
