"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportFilterModal, type ReportFilters } from "./ReportFilterModal";

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
    userTypes: ["site-supervisor", "factory"],
  },
  {
    id: "misc-issue-log",
    title: "Miscl + Issue Log Report",
    description: "Consolidated log of miscellaneous leads and open issues raised on-site.",
    userTypes: ["site-supervisor", "factory"],
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
  const [activeFilter, setActiveFilter] = useState<{
    id: string;
    title: string;
    userTypes: string[];
  } | null>(null);

  const handleApply = (filters: ReportFilters) => {
    // filters are ready — wire to download/API logic here
    console.log("Applied filters for", activeFilter?.id, filters);
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
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Filter"
                onClick={() =>
                  setActiveFilter({ id: report.id, title: report.title, userTypes: report.userTypes })
                }
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {report.description}
            </p>

            {/* Download button */}
            <Button size="sm" className="w-full gap-2 mt-auto">
              <Download className="size-3.5" />
              Download
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
        />
      )}
    </>
  );
}
