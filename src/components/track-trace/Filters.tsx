"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterOptions } from "@/types/track-trace";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";
import {
  MachineFilterItem,
  ProjectFilterItem,
  UserFilterItem,
} from "@/types/track-trace/track-trace.types";
import { CalendarRange, ChevronDown, X, ListFilter } from "lucide-react";
import AssignToPicker from "../assign-to-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DateRange } from "react-day-picker";

interface FiltersProps {
  onFilterChange?: (filters: FilterOptions) => void;
}

const DATE_RANGE_OPTIONS = [
  { id: 1, label: "Today",        value: "today" },
  { id: 2, label: "Yesterday",    value: "yesterday" },
  { id: 3, label: "Last 7 Days",  value: "last7days" },
  { id: 4, label: "Last 30 Days", value: "last30days" },
  { id: 5, label: "This Month",   value: "thisMonth" },
  { id: 6, label: "Last Month",   value: "lastMonth" },
  { id: 7, label: "Custom Range", value: "custom" },
] as const;

const getDateRangeId    = (v: string) => DATE_RANGE_OPTIONS.find((o) => o.value === v)?.id ?? 1;
const getDateRangeValue = (id: number) => DATE_RANGE_OPTIONS.find((o) => o.id === id)?.value ?? "today";

const toLocalISO = (d: Date): string => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FilterField({
  label,
  isActive,
  onClear,
  children,
}: {
  label: string;
  isActive: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between h-4">
        <label
          className={`text-xs font-semibold capitalize tracking-widest transition-colors ${
            isActive ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </label>
        {isActive && (
          <button
            onClick={onClear}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
            Clear
          </button>
        )}
      </div>
      <div
        className={`rounded-md transition-all ${
          isActive ? "ring-1 ring-foreground shadow-sm" : "ring-1 ring-border"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    project:   "all",
    machine:   "all",
    operator:  "all",
    dateRange: "today",
    status:    "all",
    startDate: undefined,
    endDate:   undefined,
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);

  const [projectFilterData,  setProjectFilterData]  = useState<ProjectFilterItem[]>([]);
  const [machineFilterData,  setMachineFilterData]  = useState<MachineFilterItem[]>([]);
  const [userFilterData,     setUserFilterData]     = useState<UserFilterItem[]>([]);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  useEffect(() => { fetchFilter(); }, []);

  const fetchFilter = useCallback(async () => {
    if (!vendorId) return;
    const [resp] = await Promise.all([
      apiClient.get(`/track-trace/get-filter-track-trace/${vendorId}`),
    ]);
    setProjectFilterData(resp.data.data.project);
    setMachineFilterData(resp.data.data.machine);
    setUserFilterData(resp.data.data.user);
  }, [vendorId]);

  const updateFilters = (updated: Partial<FilterOptions>) => {
    const next = { ...filters, ...updated };
    setFilters(next);
    onFilterChange?.(next);
  };

  const clearFilter = (key: keyof FilterOptions) => {
    if (key === "dateRange") {
      setPendingRange(undefined);
      updateFilters({ dateRange: "today", startDate: undefined, endDate: undefined });
    } else {
      updateFilters({ [key]: "all" });
    }
  };

  const handleDateRangeChange = (value: string) => {
    if (value !== "custom") {
      setPendingRange(undefined);
      updateFilters({ dateRange: value as FilterOptions["dateRange"], startDate: undefined, endDate: undefined });
    } else {
      setFilters((prev) => ({ ...prev, dateRange: "custom", startDate: undefined, endDate: undefined }));
      setCalendarOpen(true);
    }
  };

  const handleApplyRange = () => {
    if (pendingRange?.from && pendingRange?.to) {
      updateFilters({
        dateRange: "custom",
        startDate: toLocalISO(pendingRange.from),
        endDate:   toLocalISO(pendingRange.to),
      });
    }
    setCalendarOpen(false);
  };

  const handleCancelCalendar = () => {
    setPendingRange(undefined);
    if (!filters.startDate || !filters.endDate) {
      updateFilters({ dateRange: "today", startDate: undefined, endDate: undefined });
    }
    setCalendarOpen(false);
  };

  const projectOptions  = projectFilterData.map((p) => ({ id: p.id, label: p.project_name }));
  const machineOptions  = machineFilterData.map((m) => ({ id: m.id, label: m.machine_name }));
  const operatorOptions = userFilterData.map((u)    => ({ id: u.id, label: u.user_name }));

  const isDateActive     = filters.dateRange !== "today";
  const isProjectActive  = filters.project   !== "all";
  const isMachineActive  = filters.machine   !== "all";
  const isOperatorActive = filters.operator  !== "all";
  const hasAnyActive     = isDateActive || isProjectActive || isMachineActive || isOperatorActive;

  const activeCount = [isDateActive, isProjectActive, isMachineActive, isOperatorActive].filter(Boolean).length;

  const calendarBtnLabel = (() => {
    if (filters.startDate && filters.endDate)
      return `${formatDisplayDate(filters.startDate)} → ${formatDisplayDate(filters.endDate)}`;
    if (pendingRange?.from && !pendingRange?.to)
      return `${formatDisplayDate(toLocalISO(pendingRange.from))} → ...`;
    return "Pick a date range";
  })();

  const dateRangeLabel = (() => {
    if (filters.dateRange === "custom" && filters.startDate && filters.endDate)
      return `${formatDisplayDate(filters.startDate)} → ${formatDisplayDate(filters.endDate)}`;
    return DATE_RANGE_OPTIONS.find((o) => o.value === filters.dateRange)?.label ?? "Today";
  })();

  return (
    <section className="bg-background no-print">
      <div className="max-w-400 mx-auto p-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between ">
          <div className="flex items-end gap-1">
            
            <span className="text-sm font-semibold text-foreground">
              Filter Operations
            </span>
            {!hasAnyActive && (
              <>
                <Separator orientation="vertical" className="h-3.5" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {activeCount} active
                </span>
              </>
            )}
          </div>

          {hasAnyActive && (
            <button
              onClick={() => {
                setPendingRange(undefined);
                updateFilters({
                  project: "all", machine: "all", operator: "all",
                  dateRange: "today", startDate: undefined, endDate: undefined,
                });
              }}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Reset all
            </button>
          )}
        </div>

        {/* ── Filter Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-start">

          {/* 1. Date Range */}
          <FilterField label="Date Range" isActive={isDateActive} onClear={() => clearFilter("dateRange")}>
            <AssignToPicker
              data={DATE_RANGE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
              value={getDateRangeId(filters.dateRange)}
              onChange={(id) => { if (id !== null) handleDateRangeChange(getDateRangeValue(id)); }}
              placeholder="Select date range..."
              emptyLabel={dateRangeLabel}
            />
          </FilterField>

          {/* 2. Custom Date Picker */}
          {filters.dateRange === "custom" && (
            <FilterField
              label="Select Dates"
              isActive={!!(filters.startDate && filters.endDate)}
              onClear={() => {
                setPendingRange(undefined);
                updateFilters({ startDate: undefined, endDate: undefined });
              }}
            >
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`w-full flex items-center justify-between text-left text-xs h-9 px-3 rounded-md transition-colors ${
                      filters.startDate && filters.endDate
                        ? "bg-foreground text-background"
                        : "text-muted-foreground bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{calendarBtnLabel}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-40" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 shadow-xl" align="start">
                  <div className="px-4 pt-3 pb-2 border-b">
                    <p className="text-sm font-semibold">Select Date Range</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pendingRange?.from && pendingRange?.to
                        ? `${formatDisplayDate(toLocalISO(pendingRange.from))} → ${formatDisplayDate(toLocalISO(pendingRange.to))}`
                        : pendingRange?.from
                        ? `From ${formatDisplayDate(toLocalISO(pendingRange.from))} — pick end date`
                        : "Click start date, then end date"}
                    </p>
                  </div>
                  <Calendar
                    mode="range"
                    selected={pendingRange}
                    onSelect={setPendingRange}
                    disabled={{ after: new Date() }}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t gap-3">
                    <button
                      onClick={handleCancelCalendar}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <Button
                      size="sm"
                      disabled={!pendingRange?.from || !pendingRange?.to}
                      onClick={handleApplyRange}
                      className="text-xs h-7 px-4"
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </FilterField>
          )}

          {/* 3. Project */}
          <FilterField label="Project" isActive={isProjectActive} onClear={() => clearFilter("project")}>
            <AssignToPicker
              data={projectOptions}
              value={isProjectActive ? Number(filters.project) : undefined}
              onChange={(id) => updateFilters({ project: id !== null ? String(id) : "all" })}
              placeholder="Search project..."
              emptyLabel="All Projects"
            />
          </FilterField>

          {/* 4. Machine */}
          <FilterField label="Machine" isActive={isMachineActive} onClear={() => clearFilter("machine")}>
            <AssignToPicker
              data={machineOptions}
              value={isMachineActive ? Number(filters.machine) : undefined}
              onChange={(id) => updateFilters({ machine: id !== null ? String(id) : "all" })}
              placeholder="Search machine..."
              emptyLabel="All Machines"
            />
          </FilterField>

          {/* 5. Operator */}
          <FilterField label="Operator" isActive={isOperatorActive} onClear={() => clearFilter("operator")}>
            <AssignToPicker
              data={operatorOptions}
              value={isOperatorActive ? Number(filters.operator) : undefined}
              onChange={(id) => updateFilters({ operator: id !== null ? String(id) : "all" })}
              placeholder="Search operator..."
              emptyLabel="All Operators"
            />
          </FilterField>

        </div>
      </div>
    </section>
  );
}