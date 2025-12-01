"use client";

import { useState } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";

interface LeadsSummaryCardProps {
  assigned: number;
  completed: number;
  pending: number;
  isLoading?: boolean;

  // optional callback when user selects filter
  onFilterChange?: (filter: "week" | "month" | "year") => void;
}

export default function LeadsSummaryCard({
  assigned,
  completed,
  pending,
  isLoading = false,
  onFilterChange,
}: LeadsSummaryCardProps) {
  const [filter, setFilter] = useState<"week" | "month" | "year">("month");

  const handleSelect = (value: "week" | "month" | "year") => {
    setFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="border py-4 w-1/2 h-full rounded-2xl mt-4 flex flex-col justify-between">
      <CardHeader className="flex flex-row justify-between items-start">

        {/* LEFT — Title */}
        <div>
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <p className="text-xs text-muted-foreground">Assigned</p>
        </div>

        {/* RIGHT — Dropdown Icon */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Button>
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
      </CardHeader>

      <div className="px-6 flex flex-col">
        {/* Total Assigned */}
        <div>
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-3xl font-semibold">{assigned}</div>
          )}
        </div>

        <div className="flex flex-row justify-between">
          {/* Completed */}
          <div className="flex flex-col pt-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>

            {isLoading ? (
              <div className="h-5 w-10 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-sm font-medium">{completed}</span>
            )}
          </div>

          {/* Pending */}
          <div className="flex flex-col pt-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>

            {isLoading ? (
              <div className="h-5 w-10 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-sm font-medium">{pending}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
