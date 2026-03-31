"use client";

import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/redux/store";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { useBackendUsers, useTechCheckUsers } from "@/api/client-approval";
import { useFactoryUsers } from "@/api/production/order-login";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

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
  fromDate: string;
  toDate: string;
  _franchiseId?: number | "all";
  _employeeName?: string;
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
  const isAllFranchise = selectedFranchiseId === "all";
  const isAllUserType = selectedUserType === "all";
  const isVendorLevel = VENDOR_LEVEL_TYPES.includes(selectedUserType) || isAllFranchise;

  // For API calls: undefined when "all" or not selected, number when specific
  const activeFranchiseId = isSuperAdmin
    ? (selectedFranchiseId && !isAllFranchise) ? Number(selectedFranchiseId) : undefined
    : adminFranchiseId ?? undefined;

  const { data: franchises = [] } = useFranchisesByVendorId(vendorId, isSuperAdmin);

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
    const nextFilters = {
      ...filters,
      userId: resolvedUserId,
      _franchiseId: isAllFranchise ? "all" : (selectedFranchiseId ? Number(selectedFranchiseId) : activeFranchiseId),
      _employeeName: resolvedUserId === "all" ? "All" : (selectedUser?.user_name ?? ""),
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
            <Select
              value={selectedFranchiseId}
              onValueChange={(val) => {
                setSelectedFranchiseId(val);
                updateFilters((prev) => ({
                  ...prev,
                  userType: val === "all" ? "all" : "",
                  userId: "all",
                  _franchiseId: val === "all" ? "all" : Number(val),
                }), val);
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select franchise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  All Franchises
                </SelectItem>
                {franchises.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)} className="text-xs">
                    {f.franchise_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filter by User Type */}
        <div className="space-y-1">
          <Label className="text-xs">Filter by User Type</Label>
          <Select
            value={filters.userType}
            disabled={showFranchiseSelect && !selectedFranchiseId}
            onValueChange={(val) =>
              updateFilters((prev) => ({
                ...prev,
                userType: val,
                userId: val === "all" ? "all" : "",
              }))
            }
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder={showFranchiseSelect && !selectedFranchiseId ? "Select a franchise first" : "Select user type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">
                All User Types
              </SelectItem>
              {userTypes.map((value) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {USER_TYPE_LABELS[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter by User */}
        <div className="space-y-1">
          <Label className="text-xs">Filter by User</Label>
          <Select
            value={filters.userId}
            onValueChange={(val) =>
              updateFilters((prev) => ({ ...prev, userId: val }))
            }
            disabled={userSelectDisabled}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue
                placeholder={
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
              />
            </SelectTrigger>
            <SelectContent>
              {userOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No users found
                </div>
              ) : (
                userOptions.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                    {u.user_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

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
