"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableMonthFilter } from "@/components/data-table/data-table-month-filter";
import { useAppSelector } from "@/redux/store";
import { generateFactoryCalendarReport } from "@/lib/reports/factoryCalendarReport";
import { cn } from "@/lib/utils";
import type {
  FactoryERDCalendarItem,
  FactoryUpcomingDispatch,
} from "@/api/dashboard/dashboard.api";

type MonthFilterValue = { month: number; year: number };
type TabId = "pending" | "upcoming";

function getCurrentMonthFilter(): MonthFilterValue {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TABS: { id: TabId; label: string }[] = [
  { id: "pending", label: "Pending ERD" },
  { id: "upcoming", label: "Upcoming Dispatches" },
];

const TAB_META: Record<TabId, { title: string; subtitle: string; emptyText: string; dateCol: string }> = {
  pending: {
    title: "ERD Calendar",
    subtitle: "Instances by Expected Ready Date",
    emptyText: "No pending ERD entries for this month",
    dateCol: "ERD Date",
  },
  upcoming: {
    title: "Upcoming Dispatches",
    subtitle: "Upcoming Dispatches",
    emptyText: "No upcoming dispatches for this month",
    dateCol: "Dispatch Date",
  },
};

interface FactoryERDCalendarTableProps {
  erdData?: FactoryERDCalendarItem[];
  dispatchData?: FactoryUpcomingDispatch[];
  isLoadingERD?: boolean;
  isLoadingDispatches?: boolean;
}

export default function FactoryERDCalendarTable({
  erdData,
  dispatchData,
  isLoadingERD,
  isLoadingDispatches,
}: FactoryERDCalendarTableProps) {
  const user = useAppSelector((state) => state.auth.user);
  const vendorReportCode =
    user?.vendor?.vendor_report_code ||
    user?.vendor?.["vendor-report-code"] ||
    user?.vendor?.vendor_code ||
    `VENDOR_${user?.vendor_id ?? "REPORT"}`;
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [monthFilter, setMonthFilter] = useState<MonthFilterValue>(
    getCurrentMonthFilter
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const isLoading = activeTab === "pending" ? isLoadingERD : isLoadingDispatches;
  const meta = TAB_META[activeTab];

  const filteredERD = useMemo(() => {
    if (!erdData) return [];
    return erdData.filter((item) => {
      if (!item.production_erd_date) return false;
      const d = new Date(item.production_erd_date);
      if (Number.isNaN(d.getTime())) return false;
      return (
        d.getMonth() === monthFilter.month &&
        d.getFullYear() === monthFilter.year
      );
    });
  }, [erdData, monthFilter]);

  const filteredDispatches = useMemo(() => {
    if (!dispatchData) return [];
    return dispatchData.filter((item) => {
      if (!item.dispatch_date) return false;
      const d = new Date(item.dispatch_date);
      if (Number.isNaN(d.getTime())) return false;
      return (
        d.getMonth() === monthFilter.month &&
        d.getFullYear() === monthFilter.year
      );
    });
  }, [dispatchData, monthFilter]);

  const exportRows = activeTab === "pending" ? filteredERD : filteredDispatches;

  const handleDownload = async () => {
    if (exportRows.length === 0 || isDownloading) return;

    setIsDownloading(true);
    try {
      await generateFactoryCalendarReport({
        activeTab,
        month: monthFilter.month,
        year: monthFilter.year,
        vendorReportCode,
        rows: exportRows,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full border flex flex-col bg-background">
      <div className="flex items-start justify-between gap-3 pl-4 pr-3 pb-1">
        <div className="flex w-full flex-col gap-1">
          <span className="text-sm font-medium">{meta.title}</span>
          <span className="text-xs text-muted-foreground">{meta.subtitle}</span>
          <div className="mt-4 flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
          </div>
        </div>
        <div className="flex flex-col items-end">


        <DataTableMonthFilter
          title="Filter By Month"
          value={monthFilter}
          onChange={(value) => setMonthFilter(value ?? getCurrentMonthFilter())}
        />
        <Button
              size="sm"
              className="gap-2 shrink-0 mt-5"
              disabled={isDownloading || exportRows.length === 0}
              onClick={handleDownload}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin shrink-0" />
                  <span className="truncate text-xs">Preparing...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Download
                </>
              )}
            </Button>
        </div>
      </div>

      <CardContent className="p-0 flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : activeTab === "pending" ? (
          filteredERD.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              {meta.emptyText}
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs">Lead Code</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">{meta.dateCol}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredERD.map((item) => (
                    <TableRow key={item.id} className="text-xs">
                      <TableCell className="font-medium">{item.lead_code || "—"}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{item.name || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.production_erd_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : filteredDispatches.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            {meta.emptyText}
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs">Lead Code</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">{meta.dateCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="font-medium">{item.lead_code || "—"}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{item.name || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.dispatch_date)}
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
