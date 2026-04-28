"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/redux/store";
import { useSiteSupervisorPendingServices } from "@/api/dashboard/useDashboard";
import { DataTableMonthFilter } from "@/components/data-table/data-table-month-filter";

type MonthFilterValue = {
  month: number;
  year: number;
};

function getCurrentMonthFilter(): MonthFilterValue {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
}

function formatServiceOrdinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SiteSupervisorPendingServicesTable() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendor_id ?? 0;
  const userId = user?.id ?? 0;
  const [serviceMonthFilter, setServiceMonthFilter] =
    useState<MonthFilterValue>(getCurrentMonthFilter);

  const { data, isLoading } = useSiteSupervisorPendingServices(
    vendorId,
    userId,
    "year"
  );

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      const scheduledDate = new Date(item.scheduled_for);
      if (Number.isNaN(scheduledDate.getTime())) return false;

      return (
        scheduledDate.getMonth() === serviceMonthFilter.month &&
        scheduledDate.getFullYear() === serviceMonthFilter.year
      );
    });
  }, [data, serviceMonthFilter]);

  return (
    <Card className="w-full border flex flex-col bg-background">
      <div className="flex items-start justify-between gap-3 pl-4 pr-3 pb-1">
        <p className="flex flex-col">
          <span className="text-sm font-medium">Due/Upcoming Services</span>
          <span className="text-xs text-muted-foreground">
            Scheduled services not yet completed
          </span>
        </p>
        <DataTableMonthFilter
          title="Filter By Month"
          value={serviceMonthFilter}
          onChange={(value) => {
            setServiceMonthFilter(value ?? getCurrentMonthFilter());
          }}
        />
      </div>

      <CardContent className="p-0 flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No pending services
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Lead Code</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Service</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Scheduled For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="text-xs cursor-pointer select-none"
                    onDoubleClick={() =>
                      router.push(
                        `/dashboard/installation/final-handover/details/${item.lead_id}?accountId=${item.account_id}&tab=servicing&source=servicing`
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {item.lead_code || "—"}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {item.client || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatServiceOrdinal(item.service_no)} Service
                    </TableCell>
                    <TableCell className="capitalize">
                      {item.service_type === "amc" ? "AMC" : "Free"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.scheduled_for)}
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
