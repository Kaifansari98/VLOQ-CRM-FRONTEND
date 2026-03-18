"use client";

import React from "react";
import { RefreshCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionHeaderProps {
  /** Section title (e.g., "Quotation", "Design Documents") */
  title: string;

  /** Optional icon (defaults to FileText) */
  icon?: React.ReactNode;

  /** Optional refresh handler function */
  onRefresh?: () => void;

  /** Optional document count to display */
  docCount?: number;
}

/**
 * Reusable section header:
 * Displays title, icon, document count, and optional refresh button.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  onRefresh,
  docCount,
}) => {
  const hasRefresh = !!onRefresh;

  return (
    <div className="px-6 py-4 border-b flex items-center justify-between bg-[#fff] dark:bg-[#0a0a0a]">
      {/* Left Section: Icon + Title + Count (if refresh is present) */}
      <div className="flex items-center gap-2">
        {icon || <FileText className="w-5 h-5 text-primary" />}
        <h2 className="text-sm font-semibold">{title}</h2>

        {/* Show count next to title only if refresh button exists */}
        {hasRefresh && docCount !== undefined && (
          <span className="text-sm text-muted-foreground">({docCount})</span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {docCount !== undefined && (
          <span className="text-sm text-muted-foreground font-medium">
            {docCount} Documents
          </span>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
