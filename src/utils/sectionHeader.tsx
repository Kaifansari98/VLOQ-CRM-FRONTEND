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
}

/**
 * Simplified reusable section header:
 * Displays a title, optional icon, and optional refresh button.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  onRefresh,
}) => {
  return (
    <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
      {/* Left Section: Icon + Title */}
      <div className="flex items-center gap-2">
        {icon || <FileText size={20} className="text-muted-foreground" />}
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      {/* Right Section: Optional Refresh Button */}

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="flex items-center gap-1"
      >
        <RefreshCcw size={15} />
        Refresh
      </Button>
    </div>
  );
};

export default SectionHeader;
