"use client";

import {
  fetchGRNSummary,
  fetchRejectionReport,
  fetchDelayReport,
  fetchVendorPerformanceReport,
  GRNSummaryReport,
  RejectionReportVendor,
  DelayReportRow,
  VendorPerformanceRow,
} from "@/api/grn/grn-reports";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  BarChart3,
  Clock,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ReportsHero } from "@/components/grn-reports/dashboard/ReportsHero";
import { KPIGrid } from "@/components/grn-reports/dashboard/KPIGrid";
import { InsightBanner } from "@/components/grn-reports/dashboard/InsightBanner";
import { ReportsFilters } from "@/components/grn-reports/filters/ReportsFilters";
import { SummaryOverview } from "@/components/grn-reports/summary/SummaryOverview";
import { RejectionReport } from "@/components/grn-reports/rejection/RejectionReport";
import { DelayReport } from "@/components/grn-reports/delay/DelayReport";
import { VendorPerformanceReport } from "@/components/grn-reports/performance/VendorPerformanceReport";
import { daysAgo, today } from "@/components/grn-reports/shared/reportUtils";

type ReportTab = "summary" | "rejection" | "delay" | "performance";

const TABS: {
  id: ReportTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "summary",
    label: "Summary",
    icon: BarChart3,
  },
  {
    id: "rejection",
    label: "Rejections",
    icon: XCircle,
  },
  {
    id: "delay",
    label: "Delivery Delays",
    icon: Clock,
  },
  {
    id: "performance",
    label: "Vendor Performance",
    icon: TrendingDown,
  },
];

export default function GRNReportsPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));

  const [tab, setTab] = useState<ReportTab>("summary");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<GRNSummaryReport | null>(null);
  const [rejection, setRejection] = useState<RejectionReportVendor[]>([]);
  const [delay, setDelay] = useState<DelayReportRow[]>([]);
  const [performance, setPerformance] = useState<VendorPerformanceRow[]>([]);

  const load = useCallback(async () => {
    if (!vendorId) return;

    setLoading(true);

    try {
      if (tab === "summary") {
        const data = await fetchGRNSummary(vendorId, from, to);
        setSummary(data);
      }

      if (tab === "rejection") {
        const data = await fetchRejectionReport(vendorId, from, to);
        setRejection(data);
      }

      if (tab === "delay") {
        const data = await fetchDelayReport(vendorId, from, to);
        setDelay(data);
      }

      if (tab === "performance") {
        const data = await fetchVendorPerformanceReport(vendorId, from, to);
        setPerformance(data);
      }
    } catch {
      toastManager.add({
        title: "Failed to load report",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [vendorId, tab, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/inventory/grn">
                  GRN
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Reports</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <ReportsHero from={from} to={to} />

          <ReportsFilters
            from={from}
            to={to}
            loading={loading}
            onFromChange={setFrom}
            onToChange={setTo}
            onRefresh={load}
          />

          {summary && <KPIGrid summary={summary} />}

          {summary && <InsightBanner summary={summary} />}

          <div className="overflow-x-auto rounded-[28px] border bg-background p-2 shadow-sm">
            <div className="flex min-w-max gap-1">
              {TABS.map((t) => {
                const Icon = t.icon;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
                      tab === t.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: tab === "summary" ? 5 : 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "rounded-[28px]",
                    tab === "summary" ? "h-28" : "h-32"
                  )}
                />
              ))}
            </div>
          ) : (
            <>
              {tab === "summary" && summary && <SummaryOverview data={summary} />}

              {tab === "rejection" && <RejectionReport data={rejection} />}

              {tab === "delay" && <DelayReport data={delay} />}

              {tab === "performance" && (
                <VendorPerformanceReport data={performance} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}