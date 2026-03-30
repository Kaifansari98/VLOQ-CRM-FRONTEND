"use client";

import { useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const USER_TYPE_LABELS: Record<string, string> = {
  "sales-executive": "Sales Executive",
  "site-supervisor": "Site Supervisor",
  "factory": "Factory",
  "backend": "Backend",
  "pre-prod": "Pre-Prod",
  "tech-check": "Tech Check",
  "admin": "Admin",
  "super-admin": "Super Admin",
};

export interface ReportFilters {
  userType: string;
  userName: string;
  fromDate: string;
  toDate: string;
}

const DEFAULT_FILTERS: ReportFilters = {
  userType: "",
  userName: "",
  fromDate: "",
  toDate: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle: string;
  userTypes: string[];
  onApply: (filters: ReportFilters) => void;
}

export function ReportFilterModal({
  open,
  onOpenChange,
  reportTitle,
  userTypes,
  onApply,
}: Props) {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Filter — ${reportTitle}`}
      description="Narrow down the report data using the filters below."
      size="smd"
    >
      <div className="p-5 space-y-4">
        {/* Filter by User Type */}
        <div className="space-y-1">
          <Label className="text-xs">Filter by User Type</Label>
          <Select
            value={filters.userType}
            onValueChange={(val) =>
              setFilters((prev) => ({ ...prev, userType: val }))
            }
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              {userTypes.map((value) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {USER_TYPE_LABELS[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter by User Name */}
        <div className="space-y-1">
          <Label className="text-xs">Filter by User Name</Label>
          <Input
            className="h-8 text-xs"
            placeholder="Enter user name"
            value={filters.userName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, userName: e.target.value }))
            }
          />
        </div>

        {/* Date Filter */}
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background px-5 py-3">
        <Button size="sm" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" onClick={handleApply}>Apply</Button>
      </div>
    </BaseModal>
  );
}
