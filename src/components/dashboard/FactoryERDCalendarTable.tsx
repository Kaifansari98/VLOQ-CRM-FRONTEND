"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableMonthFilter } from "@/components/data-table/data-table-month-filter";
import type { FactoryERDCalendarItem } from "@/api/dashboard/dashboard.api";

type MonthFilterValue = { month: number; year: number };

function getCurrentMonthFilter(): MonthFilterValue {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface FactoryERDCalendarTableProps {
  data?: FactoryERDCalendarItem[];
  isLoading?: boolean;
}

export default function FactoryERDCalendarTable({
  data,
  isLoading,
}: FactoryERDCalendarTableProps) {
  const [monthFilter, setMonthFilter] = useState<MonthFilterValue>(
    getCurrentMonthFilter
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      if (!item.production_erd_date) return false;
      const d = new Date(item.production_erd_date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getMonth() === monthFilter.month && d.getFullYear() === monthFilter.year;
    });
  }, [data, monthFilter]);

  return (
    <Card className="w-full border flex flex-col bg-background">
      <div className="flex items-start justify-between gap-3 pl-4 pr-3 pb-1">
        <p className="flex flex-col">
          <span className="text-sm font-medium">ERD Calendar</span>
          <span className="text-xs text-muted-foreground">
            Instances by Expected Ready Date
          </span>
        </p>
        <DataTableMonthFilter
          title="Filter By Month"
          value={monthFilter}
          onChange={(value) => setMonthFilter(value ?? getCurrentMonthFilter())}
        />
      </div>

      <CardContent className="p-0 flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No ERD entries for this month
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Lead Code</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">ERD Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="font-medium">
                      {item.lead_code || "—"}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {item.name || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.production_erd_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
