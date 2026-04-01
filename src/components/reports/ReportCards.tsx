"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Funnel, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportFilterModal, type ReportFilters } from "./ReportFilterModal";
import { useAppSelector } from "@/redux/store";
import { useFranchisesByVendorId } from "@/api/franchise";
import { generateEmployeeTaskReport } from "@/lib/reports/employeeTaskReport";
import { generateInstallationReport } from "@/lib/reports/installationReport";
import { generateMiscIssueLogReport } from "@/lib/reports/miscIssueLogReport";
import { toast } from "sonner";

const REPORTS = [
  {
    id: "employee-task",
    title: "Employee Task Report",
    description: "Track task assignments, completion status, and employee-wise performance.",
    userTypes: ["sales-executive", "site-supervisor", "factory", "backend", "pre-prod", "tech-check"],
  },
  {
    id: "lead-tracking",
    title: "Lead Tracking Reports",
    description: "Monitor lead movement across all pipeline stages from open to closure.",
    active: false,
    userTypes: [],
  },
  {
    id: "installation",
    title: "Installation Report",
    description: "Summarise dispatch, on-site progress, and final handover records.",
    userTypes: [],
  },
  {
    id: "misc-issue-log",
    title: "Miscl + Issue Log Report",
    description: "Consolidated log of miscellaneous leads and open issues raised on-site.",
    userTypes: [],
  },
  {
    id: "leads-overview",
    title: "Leads Overview Report",
    description: "High-level snapshot of total leads, conversions, and pipeline health.",
    userTypes: ["sales-executive"],
  },
  {
    id: "techcheck-stage",
    title: "TechCheck Stage Report",
    description: "Review technical verification outcomes and pending tech-check items.",
    userTypes: ["tech-check", "sales-executive"],
  },
  {
    id: "payments",
    title: "Payments Report",
    description: "Detailed view of payment transactions between clients and the store.",
    active: false,
    userTypes: [],
  },
  {
    id: "erd",
    title: "ERD Report",
    description: "Entity-relationship data export for system analysis and auditing.",
    userTypes: ["factory", "sales-executive"],
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function ReportCards() {
  const user = useAppSelector((state) => state.auth.user);
  const reduxFranchiseId = useAppSelector((state) => state.auth.franchise_id);
  const vendorId = user?.vendor_id ?? 0;
  const isSuperAdmin = user?.user_type?.user_type?.toLowerCase() === "super-admin";
  const adminFranchiseId = reduxFranchiseId ?? user?.franchise_id ?? null;

  const { data: franchises = [] } = useFranchisesByVendorId(vendorId, true);

  const [activeFilter, setActiveFilter] = useState<{
    id: string;
    title: string;
    userTypes: string[];
  } | null>(null);

  // Per-report applied filters — persists until page reload
  const [appliedFilters, setAppliedFilters] = useState<Record<string, ReportFilters>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, ReportFilters>>({});
  // { [reportId]: stage message } — present means downloading
  const [downloadStatus, setDownloadStatus] = useState<Record<string, string>>({});

  const setStage = (reportId: string, stage: string) =>
    setDownloadStatus((prev) => ({ ...prev, [reportId]: stage }));
  const clearStage = (reportId: string) =>
    setDownloadStatus((prev) => { const next = { ...prev }; delete next[reportId]; return next; });

  const handleApply = (filters: ReportFilters) => {
    if (!activeFilter) return;
    setAppliedFilters((prev) => ({ ...prev, [activeFilter.id]: filters }));
    setDraftFilters((prev) => ({ ...prev, [activeFilter.id]: filters }));
  };

  const handleDraftChange = (filters: ReportFilters) => {
    if (!activeFilter) return;
    setDraftFilters((prev) => ({ ...prev, [activeFilter.id]: filters }));
  };

  const clearFiltersForReport = (reportId: string) => {
    setAppliedFilters((prev) => {
      const next = { ...prev };
      delete next[reportId];
      return next;
    });
    setDraftFilters((prev) => {
      const next = { ...prev };
      delete next[reportId];
      return next;
    });
  };

  const openFilterModal = (reportId: string) => {
    const report = REPORTS.find((r) => r.id === reportId);
    if (report) setActiveFilter({ id: report.id, title: report.title, userTypes: report.userTypes });
  };

  const handleDownload = async (reportId: string) => {
    if (reportId === "installation") {
      const filters = appliedFilters[reportId];
      // Super-admin must pick a franchise via the filter modal
      if (isSuperAdmin && !filters?._franchiseId) {
        toast.error("Please apply filters before downloading.");
        openFilterModal(reportId);
        return;
      }
      const rawFranchiseId = filters?._franchiseId ?? adminFranchiseId ?? "all";
      const franchiseId = rawFranchiseId === "all" ? "all" : Number(rawFranchiseId);
      const franchise = franchiseId !== "all" ? franchises.find((f) => f.id === franchiseId) : null;
      const franchiseName = franchiseId === "all" ? "All Franchises" : (franchise?.franchise_name ?? "Unknown");

      setStage(reportId, "Fetching leads...");
      try {
        await generateInstallationReport({
          vendorId,
          franchiseId,
          franchiseName,
          fromDate: filters?.fromDate ?? "",
          toDate: filters?.toDate ?? "",
          allFranchises: franchises.map((f) => ({ id: f.id, name: f.franchise_name })),
          onProgress: (stage) => setStage(reportId, stage),
        });
        toast.success("Report downloaded successfully.");
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Failed to generate report.";
        toast.error(msg);
      } finally {
        clearStage(reportId);
      }
      return;
    }

    if (reportId === "misc-issue-log") {
      const filters = appliedFilters[reportId];
      if (isSuperAdmin && !filters?._franchiseId) {
        toast.error("Please apply filters before downloading.");
        openFilterModal(reportId);
        return;
      }

      const rawFranchiseId = filters?._franchiseId ?? adminFranchiseId ?? "all";
      const franchiseId = rawFranchiseId === "all" ? "all" : Number(rawFranchiseId);

      setStage(reportId, "Fetching logs...");
      try {
        await generateMiscIssueLogReport({
          vendorId,
          franchiseId,
          fromDate: filters?.fromDate ?? "",
          toDate: filters?.toDate ?? "",
          onProgress: (stage) => setStage(reportId, stage),
        });
        toast.success("Report downloaded successfully.");
      } catch (err: unknown) {
        console.error(err);
        const msg =
          err instanceof Error ? err.message : "Failed to generate report.";
        toast.error(msg);
      } finally {
        clearStage(reportId);
      }
      return;
    }

    if (reportId !== "employee-task") return;

    const filters = appliedFilters[reportId];
    if (!filters?.userId) {
      toast.error("Please apply filters before downloading.");
      openFilterModal(reportId);
      return;
    }

    const rawFranchiseId = filters._franchiseId ?? adminFranchiseId ?? "all";
    const franchiseId = rawFranchiseId === "all" ? "all" : Number(rawFranchiseId);
    const userId = filters.userId === "all" ? "all" : Number(filters.userId);
    const franchise = franchiseId !== "all" ? franchises.find((f) => f.id === franchiseId) : null;
    const franchiseName = franchiseId === "all" ? "All Franchises" : (franchise?.franchise_name ?? "Unknown");

    setStage(reportId, "Fetching data...");
    try {
      await generateEmployeeTaskReport({
        vendorId,
        userId,
        franchiseId,
        franchiseName,
        employeeName: filters._employeeName ?? "All",
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        allFranchises: franchises.map((f) => ({ id: f.id, name: f.franchise_name })),
        onProgress: (stage) => setStage(reportId, stage),
      });
      toast.success("Report downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report.");
    } finally {
      clearStage(reportId);
    }
  };

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-6 py-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {REPORTS.filter((report) => report.active !== false).map((report) => (
          <motion.div
            key={report.id}
            variants={cardVariants}
            className="flex flex-col rounded-2xl border bg-card p-5 gap-3 h-52"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold leading-snug tracking-tight">
                {report.title}
              </h2>
              <button
                className="mt-0.5 shrink-0 relative transition-colors"
                aria-label="Filter"
                onClick={() => {
                  setActiveFilter({ id: report.id, title: report.title, userTypes: report.userTypes });
                }}
              >
                <Funnel
                  className={`size-4 transition-colors ${
                    appliedFilters[report.id]
                      ? "text-purple-500 fill-purple-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                />
                {appliedFilters[report.id] && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-purple-500" />
                )}
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {report.description}
            </p>

            {/* Download button */}
            <Button
              size="sm"
              className="w-full gap-2 mt-auto"
              disabled={!!downloadStatus[report.id]}
              onClick={() => handleDownload(report.id)}
            >
              {downloadStatus[report.id] ? (
                <>
                  <Loader2 className="size-3.5 animate-spin shrink-0" />
                  <span className="truncate text-xs">{downloadStatus[report.id]}</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  Download
                </>
              )}
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {activeFilter && (
        <ReportFilterModal
          open={!!activeFilter}
          onOpenChange={(open) => !open && setActiveFilter(null)}
          reportTitle={activeFilter.title}
          userTypes={activeFilter.userTypes}
          onApply={handleApply}
          initialFilters={draftFilters[activeFilter.id] ?? appliedFilters[activeFilter.id]}
          onDraftChange={handleDraftChange}
          onResetDraft={() => clearFiltersForReport(activeFilter.id)}
        />
      )}
    </>
  );
}
