"use client";

import { useState, useMemo } from "react";
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
import { useAppSelector } from "@/redux/store";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { useBackendUsers, useTechCheckUsers } from "@/api/client-approval";
import { useFactoryUsers } from "@/api/production/order-login";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

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
  userType: string;
  userId: string;
  fromDate: string;
  toDate: string;
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
}

export function ReportFilterModal({
  open,
  onOpenChange,
  reportTitle,
  userTypes,
  onApply,
}: Props) {
  const user = useAppSelector((state) => state.auth.user);
  const reduxFranchiseId = useAppSelector((state) => state.auth.franchise_id);

  const vendorId = user?.vendor_id ?? 0;
  const userType = user?.user_type?.user_type?.toLowerCase();
  const isSuperAdmin = userType === "super-admin";

  const adminFranchiseId = reduxFranchiseId ?? user?.franchise_id ?? null;

  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("");
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);

  const activeFranchiseId = isSuperAdmin
    ? selectedFranchiseId ? Number(selectedFranchiseId) : undefined
    : adminFranchiseId ?? undefined;

  const selectedUserType = filters.userType;
  const isVendorLevel = VENDOR_LEVEL_TYPES.includes(selectedUserType);

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

  const showFranchiseSelect = isSuperAdmin && !isVendorLevel;
  const userSelectDisabled =
    isUsersLoading ||
    !selectedUserType ||
    (showFranchiseSelect && !selectedFranchiseId);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    if (isSuperAdmin) setSelectedFranchiseId("");
  };

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

        {/* Franchise Select — super-admin only, hidden for vendor-level user types */}
        {showFranchiseSelect && (
          <div className="space-y-1">
            <Label className="text-xs">Filter by Franchise</Label>
            <Select
              value={selectedFranchiseId}
              onValueChange={(val) => {
                setSelectedFranchiseId(val);
                setFilters((prev) => ({ ...prev, userId: "" }));
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select franchise" />
              </SelectTrigger>
              <SelectContent>
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
            onValueChange={(val) =>
              setFilters((prev) => ({ ...prev, userType: val, userId: "" }))
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

        {/* Filter by User */}
        <div className="space-y-1">
          <Label className="text-xs">Filter by User</Label>
          <Select
            value={filters.userId}
            onValueChange={(val) =>
              setFilters((prev) => ({ ...prev, userId: val }))
            }
            disabled={userSelectDisabled}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue
                placeholder={
                  !selectedUserType
                    ? "Select a user type first"
                    : isUsersLoading
                    ? "Loading users..."
                    : showFranchiseSelect && !selectedFranchiseId
                    ? "Select a franchise first"
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
