"use client";

import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import ReportAssignToPicker from "@/components/reports/ReportAssignToPicker";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppSelector } from "@/redux/store";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { getVendorLeads, type Lead } from "@/api/leads";
import { useBackendUsers, useTechCheckUsers } from "@/api/client-approval";
import { useFactoryUsers } from "@/api/production/order-login";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReportLeadAvailabilityRow {
  id?: number;
  lead_id?: number;
}

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

// User types that are vendor-level only (no franchise filter)
const VENDOR_LEVEL_TYPES = ["factory", "backend", "tech-check", "pre-prod"];

export interface ReportFilters {
  userType: string;       // specific type or "all"
  userId: string;         // specific id or "all"
  leadId?: string;
  fromDate: string;
  toDate: string;
  _franchiseId?: number | "all";
  _employeeName?: string;
  _leadName?: string;
}

const DEFAULT_FILTERS: ReportFilters = {
  userType: "",
  userId: "",
  fromDate: "",
  toDate: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle: string;
  userTypes: string[];
  onApply: (filters: ReportFilters) => void;
  initialFilters?: ReportFilters;
  onDraftChange?: (filters: ReportFilters) => void;
  onResetDraft?: () => void;
}

export function ReportFilterModal({
  open,
  onOpenChange,
  reportTitle,
  userTypes,
  onApply,
  initialFilters,
  onDraftChange,
  onResetDraft,
}: Props) {
  const user = useAppSelector((state) => state.auth.user);
  const reduxFranchiseId = useAppSelector((state) => state.auth.franchise_id);

  const vendorId = user?.vendor_id ?? 0;
  const userType = user?.user_type?.user_type?.toLowerCase();
  const isSuperAdmin = userType === "super-admin";
  const isAdmin = userType === "admin";

  const adminFranchiseId = reduxFranchiseId ?? user?.franchise_id ?? null;

  const defaultFilters = useMemo<ReportFilters>(() => ({
    ...DEFAULT_FILTERS,
    userType: isSuperAdmin || isAdmin ? "all" : "",
    userId: isSuperAdmin || isAdmin ? "all" : "",
    _franchiseId: isSuperAdmin ? "all" : (adminFranchiseId ?? undefined),
  }), [adminFranchiseId, isAdmin, isSuperAdmin]);

  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>(
    defaultFilters._franchiseId === "all"
      ? "all"
      : defaultFilters._franchiseId
      ? String(defaultFilters._franchiseId)
      : "",
  );
  const [filters, setFilters] = useState<ReportFilters>(initialFilters ?? defaultFilters);

  useEffect(() => {
    const nextFilters = initialFilters ?? defaultFilters;
    setFilters(nextFilters);
    setSelectedFranchiseId(
      nextFilters._franchiseId === "all"
        ? "all"
        : nextFilters._franchiseId
        ? String(nextFilters._franchiseId)
        : "",
    );
  }, [defaultFilters, initialFilters, open]);

  const selectedDateRange = useMemo<DateRange | undefined>(() => {
    if (!filters.fromDate && !filters.toDate) return undefined;

    return {
      from: filters.fromDate ? parseISO(filters.fromDate) : undefined,
      to: filters.toDate ? parseISO(filters.toDate) : undefined,
    };
  }, [filters.fromDate, filters.toDate]);

  const selectedUserType = filters.userType;
  const isInstallationReport = reportTitle === "Installation Report";
  const isMiscIssueLogReport = reportTitle === "Miscl + Issue Log Report";
  const supportsLeadFilter = isInstallationReport || isMiscIssueLogReport;
  const isAllFranchise = selectedFranchiseId === "all";
  const isAllUserType = selectedUserType === "all";
  const isVendorLevel = VENDOR_LEVEL_TYPES.includes(selectedUserType) || isAllFranchise;

  // For API calls: undefined when "all" or not selected, number when specific
  const activeFranchiseId = isSuperAdmin
    ? (selectedFranchiseId && !isAllFranchise) ? Number(selectedFranchiseId) : undefined
    : adminFranchiseId ?? undefined;

  const { data: franchises = [] } = useFranchisesByVendorId(vendorId, isSuperAdmin);

  const { data: vendorLeads = [], isLoading: isLeadsLoading } = useQuery({
    queryKey: ["report-filter-leads", vendorId],
    queryFn: () => getVendorLeads(vendorId),
    enabled: !!vendorId && supportsLeadFilter,
  });

  const { data: reportLeadRows = [] } = useQuery({
    queryKey: [
      "report-lead-availability",
      reportTitle,
      vendorId,
      activeFranchiseId ?? "all",
    ],
    queryFn: async () => {
      const params =
        activeFranchiseId !== undefined
          ? { params: { franchise_id: activeFranchiseId } }
          : undefined;

      if (isInstallationReport) {
        const { data } = await apiClient.get(
          `/leads/installation/under-installation/vendorId/${vendorId}/report/installation-data`,
          params,
        );
        return (data?.data ?? []) as ReportLeadAvailabilityRow[];
      }

      if (isMiscIssueLogReport) {
        const { data } = await apiClient.get(
          `/leads/installation/under-installation/vendorId/${vendorId}/report/misc-issue-log-data`,
          params,
        );
        return (data?.data ?? []) as ReportLeadAvailabilityRow[];
      }

      return [] as ReportLeadAvailabilityRow[];
    },
    enabled: !!vendorId && supportsLeadFilter,
  });

  // Sales Executive — franchise-aware
  const { data: salesData, isLoading: isSalesLoading } = useVendorSalesExecutiveUsers(
    vendorId,
    !isVendorLevel && activeFranchiseId ? activeFranchiseId : undefined,
  );

  // Site Supervisor — franchise-aware (reuse leads API)
  const { data: siteSuperData, isLoading: isSiteSuperLoading } = useQuery({
    queryKey: ["siteSupervisorUsers", vendorId, activeFranchiseId],
    queryFn: async () => {
      const params = !isVendorLevel && activeFranchiseId
        ? { params: { franchise_id: activeFranchiseId } }
        : undefined;
      const { data } = await apiClient.get(`/leads/site-supervisor/vendor/${vendorId}`, params);
      return (data?.data?.site_supervisors ?? data?.data ?? []) as { id: number; user_name: string }[];
    },
    enabled: !!vendorId && selectedUserType === "site-supervisor",
  });

  // Factory — vendor-level only
  const { data: factoryData, isLoading: isFactoryLoading } = useFactoryUsers(
    selectedUserType === "factory" ? vendorId : 0,
  );

  // Backend — vendor-level only
  const { data: backendData, isLoading: isBackendLoading } = useBackendUsers(
    selectedUserType === "backend" ? vendorId : 0,
  );

  // Tech Check — vendor-level only
  const { data: techCheckData, isLoading: isTechCheckLoading } = useTechCheckUsers(
    selectedUserType === "tech-check" ? vendorId : 0,
  );

  const userOptions = useMemo((): { id: number; user_name: string }[] => {
    switch (selectedUserType) {
      case "sales-executive":
        return salesData?.data?.sales_executives ?? [];
      case "site-supervisor":
        return Array.isArray(siteSuperData) ? siteSuperData : [];
      case "factory":
        return Array.isArray(factoryData) ? factoryData : [];
      case "backend":
        return Array.isArray(backendData) ? backendData : [];
      case "tech-check":
        return Array.isArray(techCheckData) ? techCheckData : [];
      default:
        return [];
    }
  }, [selectedUserType, salesData, siteSuperData, factoryData, backendData, techCheckData]);

  const eligibleLeadIds = useMemo(() => {
    return new Set(
      reportLeadRows
        .map((row) => row.id ?? row.lead_id)
        .filter((leadId): leadId is number => typeof leadId === "number"),
    );
  }, [reportLeadRows]);

  const leadOptions = useMemo(() => {
    if (!supportsLeadFilter) return [];

    return (vendorLeads as Lead[])
      .filter((lead) => {
        if (!eligibleLeadIds.has(lead.id)) return false;
        if (!selectedFranchiseId || selectedFranchiseId === "all") return true;
        return Number(lead.franchise_id) === Number(selectedFranchiseId);
      })
      .map((lead) => ({
        id: String(lead.id),
        label:
          `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim() ||
          lead.lead_code ||
          `Lead ${lead.id}`,
        description: lead.lead_code || `Lead ${lead.id}`,
        avatarText: `${lead.firstname?.[0] ?? ""}${lead.lastname?.[0] ?? ""}`.trim().toUpperCase() ||
          lead.lead_code?.slice(0, 2).toUpperCase() ||
          "LD",
      }));
  }, [eligibleLeadIds, selectedFranchiseId, supportsLeadFilter, vendorLeads]);

  const isUsersLoading =
    isSalesLoading || isSiteSuperLoading || isFactoryLoading || isBackendLoading || isTechCheckLoading;

  const showFranchiseSelect = isSuperAdmin;
  const franchiseChosen = !showFranchiseSelect || !!selectedFranchiseId;
  const userTypeChosen = !!selectedUserType;
  // User select is disabled when userType is "all" (userId auto-becomes "all") or nothing selected yet
  const userSelectDisabled =
    isUsersLoading ||
    !userTypeChosen ||
    !franchiseChosen ||
    isAllUserType ||
    isAllFranchise;
  const leadSelectDisabled = !supportsLeadFilter || (showFranchiseSelect ? isAllFranchise : false);

  const syncDraft = (nextFilters: ReportFilters, franchiseId: string = selectedFranchiseId) => {
    onDraftChange?.({
      ...nextFilters,
      _franchiseId: franchiseId === "all" ? "all" : franchiseId ? Number(franchiseId) : undefined,
    });
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSelectedFranchiseId(
      defaultFilters._franchiseId === "all"
        ? "all"
        : defaultFilters._franchiseId
        ? String(defaultFilters._franchiseId)
        : "",
    );
    onResetDraft?.();
  };

  const handleApply = () => {
    const resolvedUserId = isAllUserType || isAllFranchise ? "all" : filters.userId;
    const selectedUser = userOptions.find((u) => String(u.id) === filters.userId);
    const selectedLead = leadOptions.find(
      (lead) => String(lead.id) === filters.leadId,
    );
    const resolvedFranchiseId: ReportFilters["_franchiseId"] = isAllFranchise
      ? "all"
      : selectedFranchiseId
      ? Number(selectedFranchiseId)
      : activeFranchiseId;
    const nextFilters: ReportFilters = {
      ...filters,
      userId: resolvedUserId,
      _franchiseId: resolvedFranchiseId,
      _employeeName: resolvedUserId === "all" ? "All" : (selectedUser?.user_name ?? ""),
      _leadName: selectedLead?.label ?? "",
    };
    onApply(nextFilters);
    onDraftChange?.(nextFilters);
    onOpenChange(false);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const nextFilters = {
      ...filters,
      fromDate: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      toDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
    };
    setFilters(nextFilters);
    syncDraft(nextFilters);
  };

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters, franchiseId: string = selectedFranchiseId) => {
    setFilters((prev) => {
      const next = updater(prev);
      syncDraft(next, franchiseId);
      return next;
    });
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

        {/* Franchise Select — super-admin only */}
        {showFranchiseSelect && (
          <div className="space-y-1">
            <Label className="text-xs">Filter by Franchise</Label>
            <ReportAssignToPicker
              value={selectedFranchiseId}
              onChange={(val) => {
                const nextValue = String(val ?? "");
                setSelectedFranchiseId(nextValue);
                updateFilters(
                  (prev) => ({
                    ...prev,
                    userType: nextValue === "all" ? "all" : "",
                    userId: "all",
                    leadId: "",
                    _franchiseId: nextValue === "all" ? "all" : Number(nextValue),
                  }),
                  nextValue,
                );
              }}
              data={[
                { id: "all", label: "All Franchises" },
                ...franchises.map((f) => ({
                  id: String(f.id),
                  label: f.franchise_name,
                })),
              ]}
              emptyLabel="Select franchise"
              placeholder="Search franchise..."
            />
          </div>
        )}

        {supportsLeadFilter && (
          <div className="space-y-1">
            <Label className="text-xs">Filter by Leads</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block w-full">
                  <ReportAssignToPicker
                    value={filters.leadId}
                    onChange={(val) =>
                      updateFilters((prev) => ({
                        ...prev,
                        leadId: val ? String(val) : "",
                      }))
                    }
                    data={leadOptions}
                    disabled={leadSelectDisabled}
                    emptyLabel={
                      leadSelectDisabled
                        ? "Select a franchise first"
                        : isLeadsLoading
                          ? "Loading leads..."
                          : "Select lead"
                    }
                    placeholder="Search lead..."
                  />
                </span>
              </TooltipTrigger>
              {leadSelectDisabled && (
                <TooltipContent side="top">
                  Lead filter is enabled only when a specific franchise is selected.
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}

        {/* Filter by User Type + User — hidden when report has no user types */}
        {userTypes.length > 0 && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Filter by User Type</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full">
                    <ReportAssignToPicker
                      value={filters.userType}
                      disabled={showFranchiseSelect && !selectedFranchiseId}
                      onChange={(val) =>
                        updateFilters((prev) => ({
                          ...prev,
                          userType: String(val ?? ""),
                          userId: String(val) === "all" ? "all" : "",
                        }))
                      }
                      data={[
                        { id: "all", label: "All User Types" },
                        ...userTypes.map((value) => ({
                          id: value,
                          label: USER_TYPE_LABELS[value] ?? value,
                        })),
                      ]}
                      emptyLabel={
                        showFranchiseSelect && !selectedFranchiseId
                          ? "Select a franchise first"
                          : "Select user type"
                      }
                      placeholder="Search user type..."
                    />
                  </span>
                </TooltipTrigger>
                {showFranchiseSelect && !selectedFranchiseId && (
                  <TooltipContent side="top">Select a franchise first</TooltipContent>
                )}
              </Tooltip>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Filter by User</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full">
                    <ReportAssignToPicker
                      value={filters.userId}
                      onChange={(val) =>
                        updateFilters((prev) => ({
                          ...prev,
                          userId: val ? String(val) : "",
                        }))
                      }
                      disabled={userSelectDisabled}
                      data={userOptions.map((u) => ({
                        id: String(u.id),
                        label: u.user_name,
                      }))}
                      emptyLabel={
                        showFranchiseSelect && !selectedFranchiseId
                          ? "Select a franchise first"
                          : !selectedUserType
                            ? "Select a user type first"
                            : isAllUserType || isAllFranchise
                              ? "All Users"
                              : isUsersLoading
                                ? "Loading users..."
                                : "Select user"
                      }
                      placeholder="Search user..."
                    />
                  </span>
                </TooltipTrigger>
                {userSelectDisabled && (
                  <TooltipContent side="top">
                    {showFranchiseSelect && !selectedFranchiseId
                      ? "Select a franchise first"
                      : !selectedUserType
                      ? "Select a user type first"
                      : isAllUserType || isAllFranchise
                      ? "All users will be included"
                      : isUsersLoading
                      ? "Loading users..."
                      : null}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </>
        )}

        {/* Date Filter */}
        <div className="space-y-1">
          <Label className="text-xs">Date Filter</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="group h-9 w-full justify-between border-input bg-background px-3 text-xs font-normal hover:bg-background"
              >
                <span
                  className={cn(
                    "truncate text-left",
                    !selectedDateRange?.from && "text-muted-foreground",
                  )}
                >
                  {selectedDateRange?.from ? (
                    selectedDateRange.to ? (
                      `${format(selectedDateRange.from, "LLL dd, y")} - ${format(selectedDateRange.to, "LLL dd, y")}`
                    ) : (
                      format(selectedDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </span>
                <CalendarIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-2">
              <Calendar
                mode="range"
                selected={selectedDateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
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
