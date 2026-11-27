"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Filter,
  Info,
  Layers,
  Mail,
  Phone,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  usePrivilegeMasters,
  useUpdateUserPrivileges,
  useUserDetail,
} from "@/hooks/useTypesMaster";
import type {
  PrivilegeMasterChildSection,
  PrivilegeMasterEntry,
  PrivilegeMasterGroup,
  PrivilegeMasterSection,
  PrivilegeMasterTab,
} from "@/api/typesMasterApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface UserPrivilegesManagementProps {
  userId: number;
  vendorIdOverride?: number;
}

function normalizeNumberArray(arr: number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function areNumberArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

function formatUserTypeLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  if (normalized.toLowerCase().replace(/[-_]+/g, " ") === "hrms admin") {
    return "HRMS Admin";
  }

  return normalized
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function UserPrivilegesManagement({
  userId,
  vendorIdOverride,
}: UserPrivilegesManagementProps) {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const vendorId = vendorIdOverride ?? authUser?.vendor_id;

  const [privilegeSearch, setPrivilegeSearch] = React.useState("");
  const deferredPrivilegeSearch = React.useDeferredValue(privilegeSearch);

  const [activeModuleId, setActiveModuleId] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<
    "all" | "granted" | "ungranted"
  >("all");
  const [activeGeneralTab, setActiveGeneralTab] =
    React.useState<string>("general_tools");
  const [expandedSections, setExpandedSections] = React.useState<
    Record<string, boolean>
  >({});

  const [selectedPrivilegeIds, setSelectedPrivilegeIds] = React.useState<
    number[]
  >([]);

  // 1. Fetch User Detail
  const {
    data: userDetailResponse,
    isLoading: isLoadingUser,
    isError: isUserError,
    error: userError,
  } = useUserDetail(userId, vendorId);

  const userData = userDetailResponse?.data;
  const isCustomUser =
    userData?.user_type?.user_type?.trim().toLowerCase() === "custom";

  // 2. Fetch Privilege Masters
  const {
    data: privilegeMastersData,
    isLoading: isLoadingPrivileges,
    isError: isPrivilegesError,
    refetch: refetchPrivileges,
  } = usePrivilegeMasters({
    enabled: !!vendorId && !!userId,
    search: deferredPrivilegeSearch,
    userId,
    vendorIdOverride: vendorId,
  });

  const sections: PrivilegeMasterSection[] = privilegeMastersData?.data ?? [];

  // Extract flat list of all privileges
  const allPrivilegesList = React.useMemo(() => {
    const list: PrivilegeMasterEntry[] = [];
    sections.forEach((sec) => {
      sec.children?.forEach((ch) => list.push(...ch.privileges));
      sec.tabs?.forEach((tab) =>
        tab.groups?.forEach((grp) => list.push(...grp.privileges)),
      );
    });
    return list;
  }, [sections]);

  // Server selected privileges
  const serverSelectedPrivilegeIds = React.useMemo(() => {
    return normalizeNumberArray(
      allPrivilegesList
        .filter((privilege) => privilege.is_selected)
        .map((privilege) => privilege.id),
    );
  }, [allPrivilegesList]);

  // Synchronize initial server selected IDs
  React.useEffect(() => {
    if (!deferredPrivilegeSearch.trim()) {
      setSelectedPrivilegeIds(serverSelectedPrivilegeIds);
    }
  }, [serverSelectedPrivilegeIds, deferredPrivilegeSearch]);

  // Normalized local selection
  const normalizedSelectedIds = React.useMemo(
    () => normalizeNumberArray(selectedPrivilegeIds),
    [selectedPrivilegeIds],
  );

  const hasChanges = !areNumberArraysEqual(
    normalizedSelectedIds,
    serverSelectedPrivilegeIds,
  );

  const addedCount = React.useMemo(() => {
    const serverSet = new Set(serverSelectedPrivilegeIds);
    return normalizedSelectedIds.filter((id) => !serverSet.has(id)).length;
  }, [normalizedSelectedIds, serverSelectedPrivilegeIds]);

  const removedCount = React.useMemo(() => {
    const currentSet = new Set(normalizedSelectedIds);
    return serverSelectedPrivilegeIds.filter((id) => !currentSet.has(id)).length;
  }, [normalizedSelectedIds, serverSelectedPrivilegeIds]);

  // Mutation to update privileges
  const updateUserPrivilegesMutation = useUpdateUserPrivileges(vendorId);

  const handleSave = () => {
    if (!userId || !vendorId || !hasChanges) return;

    updateUserPrivilegesMutation.mutate({
      userId,
      payload: {
        vendor_id: vendorId,
        privilege_ids: normalizedSelectedIds,
      },
    });
  };

  const handleReset = () => {
    setSelectedPrivilegeIds(serverSelectedPrivilegeIds);
  };

  // Helper: toggle individual privilege
  const handleTogglePrivilege = (privilegeId: number) => {
    setSelectedPrivilegeIds((current) => {
      if (current.includes(privilegeId)) {
        return current.filter((id) => id !== privilegeId);
      }
      return [...current, privilegeId];
    });
  };

  // Helper: toggle multiple privileges
  const handleToggleMultiple = (ids: number[], select: boolean) => {
    setSelectedPrivilegeIds((current) => {
      const currentSet = new Set(current);
      if (select) {
        ids.forEach((id) => currentSet.add(id));
      } else {
        ids.forEach((id) => currentSet.delete(id));
      }
      return Array.from(currentSet);
    });
  };

  // Stats calculation
  const totalPrivilegesCount = allPrivilegesList.length;
  const grantedPrivilegesCount = allPrivilegesList.filter((p) =>
    selectedPrivilegeIds.includes(p.id),
  ).length;
  const grantedPercentage =
    totalPrivilegesCount > 0
      ? Math.round((grantedPrivilegesCount / totalPrivilegesCount) * 100)
      : 0;

  // Filter privileges helper based on search and status
  const filterPrivileges = (privileges: PrivilegeMasterEntry[]) => {
    return privileges.filter((p) => {
      const isGranted = selectedPrivilegeIds.includes(p.id);
      if (filterStatus === "granted" && !isGranted) return false;
      if (filterStatus === "ungranted" && isGranted) return false;

      if (deferredPrivilegeSearch.trim()) {
        const query = deferredPrivilegeSearch.toLowerCase();
        const matchesAction = p.action.toLowerCase().includes(query);
        const matchesCode = p.code.toLowerCase().includes(query);
        const matchesModule =
          p.parent_module?.toLowerCase().includes(query) ||
          p.child_module?.toLowerCase().includes(query);
        if (!matchesAction && !matchesCode && !matchesModule) return false;
      }
      return true;
    });
  };

  // Check if a section has any visible privileges
  const getSectionStats = (section: PrivilegeMasterSection) => {
    const list: PrivilegeMasterEntry[] = [];
    section.children?.forEach((ch) => list.push(...ch.privileges));
    section.tabs?.forEach((tab) =>
      tab.groups?.forEach((grp) => list.push(...grp.privileges)),
    );

    const total = list.length;
    const granted = list.filter((p) => selectedPrivilegeIds.includes(p.id)).length;
    const allIds = list.map((p) => p.id);
    const isAllGranted = total > 0 && granted === total;

    return { total, granted, allIds, isAllGranted };
  };

  const backUrl = `/dashboard/masters-management/user-master${
    vendorIdOverride ? `?vendor_id=${vendorIdOverride}` : ""
  }`;

  return (
    <div className="flex flex-1 flex-col gap-6 pb-20">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to User Master</span>
        </Button>

        {/* Global Save / Discard Bar */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Unsaved Changes ({addedCount > 0 ? `+${addedCount}` : ""}{" "}
                {removedCount > 0 ? `-${removedCount}` : ""})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={updateUserPrivilegesMutation.isPending}
                className="h-8 gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Discard
              </Button>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateUserPrivilegesMutation.isPending}
            className="h-8 gap-1.5 text-xs font-medium bg-primary text-primary-foreground shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {updateUserPrivilegesMutation.isPending
              ? "Saving..."
              : "Save Privileges"}
          </Button>
        </div>
      </div>

      {/* User Information & Privileges Stats Banner */}
      <Card className="overflow-hidden border border-border/60 bg-gradient-to-br from-background via-muted/10 to-muted/30 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* User Profile Details */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs font-bold text-lg">
                {userData?.user_name
                  ? userData.user_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {userData?.user_name || (isLoadingUser ? "Loading user..." : "User Privileges")}
                  </h1>

                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 font-medium text-xs py-0.5",
                      isCustomUser
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    <Shield className="h-3 w-3" />
                    {formatUserTypeLabel(userData?.user_type?.user_type)}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs py-0.5 capitalize",
                      userData?.status === "active"
                        ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                        : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                    )}
                  >
                    <span
                      className={cn(
                        "mr-1.5 h-1.5 w-1.5 rounded-full inline-block",
                        userData?.status === "active"
                          ? "bg-emerald-500"
                          : "bg-zinc-400",
                      )}
                    />
                    {userData?.status || "—"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-0.5">
                  {userData?.user_email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{userData.user_email}</span>
                    </div>
                  )}

                  {userData?.user_contact && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{userData.user_contact}</span>
                    </div>
                  )}

                  {userData?.designation && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{userData.designation}</span>
                    </div>
                  )}

                  {userData?.franchises && userData.franchises.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>
                        {userData.franchises.map((f) => f.franchise_name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privilege Stats / Overview */}
            <div className="flex items-center gap-6 self-start lg:self-center border-t lg:border-t-0 lg:border-l border-border/60 pt-4 lg:pt-0 lg:pl-6">
              <div className="space-y-1.5 min-w-[180px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Permissions Granted
                  </span>
                  <span className="font-semibold text-foreground">
                    {grantedPrivilegesCount} / {totalPrivilegesCount}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      grantedPercentage === 100
                        ? "bg-emerald-500"
                        : grantedPercentage > 50
                          ? "bg-primary"
                          : grantedPercentage > 0
                            ? "bg-amber-500"
                            : "bg-zinc-400",
                    )}
                    style={{ width: `${grantedPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{grantedPercentage}% active access</span>
                  <span>
                    {sections.length} module{sections.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isCustomUser && !isLoadingUser && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-500/10 p-3 text-xs text-amber-800 dark:border-amber-800/50 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold">Role-Governed User Account</p>
                <p className="text-muted-foreground mt-0.5 text-amber-700 dark:text-amber-300/80">
                  This user is assigned the standard role &ldquo;
                  {formatUserTypeLabel(userData?.user_type?.user_type)}&rdquo;.
                  Custom privilege overrides can only be applied to users with
                  the <strong>Custom</strong> user role.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Toolbar: Search, Filters, Bulk Actions */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 backdrop-blur-md p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={privilegeSearch}
            onChange={(e) => setPrivilegeSearch(e.target.value)}
            placeholder="Search privileges by action or code..."
            className="pl-9 pr-9 h-9 bg-background text-sm"
          />
          {privilegeSearch && (
            <button
              onClick={() => setPrivilegeSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right side controls: Filter Switch Tabs and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Switch Tabs */}
          <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
            <button
              onClick={() => setFilterStatus("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filterStatus === "all"
                   ? "!bg-black !text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All ({totalPrivilegesCount})
            </button>
            <button
              onClick={() => setFilterStatus("granted")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filterStatus === "granted"
                  ? "!bg-black !text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Granted ({grantedPrivilegesCount})
            </button>
            <button
              onClick={() => setFilterStatus("ungranted")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filterStatus === "ungranted"
                  ? "!bg-black !text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Ungranted ({totalPrivilegesCount - grantedPrivilegesCount})
            </button>
          </div>

          {/* Global Bulk Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleToggleMultiple(
                  allPrivilegesList.map((p) => p.id),
                  true,
                )
              }
              className="h-8 gap-1.5 text-xs"
              disabled={!isCustomUser}
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              Grant All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleToggleMultiple(
                  allPrivilegesList.map((p) => p.id),
                  false,
                )
              }
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              disabled={!isCustomUser}
            >
              <XCircle className="h-3.5 w-3.5" />
              Revoke All
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Module Navigation + Categorized Privilege Grids */}
      {isLoadingPrivileges ? (
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      ) : isPrivilegesError ? (
        <Card className="p-8 text-center border-dashed">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">Failed to load privileges</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            There was an issue fetching privilege masters for this user. Please
            verify your network or try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPrivileges()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      ) : sections.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            No privilege masters found for this vendor.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Sticky Module Nav */}
          <div className="lg:col-span-1 space-y-2 lg:sticky lg:top-20">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Modules
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setActiveModuleId("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                  activeModuleId === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-muted/60",
                )}
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  All Modules
                </span>
                <Badge
                  variant={activeModuleId === "all" ? "secondary" : "outline"}
                  className="text-[11px] h-5 px-1.5"
                >
                  {grantedPrivilegesCount}/{totalPrivilegesCount}
                </Badge>
              </button>

              {sections.map((section) => {
                const { total, granted, isAllGranted } = getSectionStats(section);
                const isActive = activeModuleId === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveModuleId(section.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="truncate pr-2">{section.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAllGranted && (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "text-[10px] h-5 px-1.5",
                          !isActive &&
                            granted === total &&
                            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                        )}
                      >
                        {granted}/{total}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Privilege Modules and Groups */}
          <div className="lg:col-span-3 space-y-6">
            {sections
              .filter(
                (sec) => activeModuleId === "all" || activeModuleId === sec.id,
              )
              .map((section) => {
                const { total, granted, allIds, isAllGranted } =
                  getSectionStats(section);

                return (
                  <div
                    key={section.id}
                    className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold text-foreground tracking-tight">
                            {section.title}
                          </h2>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-normal",
                              isAllGranted
                                ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                                : granted > 0
                                  ? "border-primary/20 bg-primary/10 text-primary"
                                  : "text-muted-foreground",
                            )}
                          >
                            {granted} of {total} granted
                          </Badge>
                        </div>
                        {section.description && (
                          <p className="text-xs text-muted-foreground">
                            {section.description}
                          </p>
                        )}
                      </div>

                      {/* Quick Module Level Grant/Revoke */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleMultiple(allIds, !isAllGranted)}
                          disabled={!isCustomUser || allIds.length === 0}
                          className="h-8 gap-1.5 text-xs font-medium"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {isAllGranted ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                    </div>

                    {/* Section Body: Children or Tabs */}
                    <div className="p-5 space-y-5">
                      {/* 1. If Section has Tabs (e.g. General Privileges) */}
                      {section.tabs && section.tabs.length > 0 ? (
                        <Tabs
                          value={activeGeneralTab}
                          onValueChange={setActiveGeneralTab}
                          className="space-y-4"
                        >
                          <TabsList className="h-9 gap-1 bg-muted/50 p-1 border">
                            {section.tabs.map((tab) => (
                              <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="text-xs px-3.5 h-7 font-medium transition-all data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:shadow-xs hover:text-foreground"
                              >
                                {tab.title}
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {section.tabs.map((tab) => (
                            <TabsContent
                              key={tab.id}
                              value={tab.id}
                              className="space-y-5 mt-0"
                            >
                              {tab.groups.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                                  No {tab.title.toLowerCase()} privileges found.
                                </div>
                              ) : (
                                tab.groups.map((group) => {
                                  const filteredPrivileges = filterPrivileges(
                                    group.privileges,
                                  );
                                  const groupAllIds = group.privileges.map(
                                    (p) => p.id,
                                  );
                                  const groupSelectedCount = groupAllIds.filter(
                                    (id) => selectedPrivilegeIds.includes(id),
                                  ).length;
                                  const isGroupAllSelected =
                                    groupAllIds.length > 0 &&
                                    groupSelectedCount === groupAllIds.length;

                                  if (
                                    filteredPrivileges.length === 0 &&
                                    (deferredPrivilegeSearch || filterStatus !== "all")
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={group.id}
                                      className="space-y-3 rounded-lg border bg-muted/10 p-4"
                                    >
                                      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-semibold text-foreground">
                                            {group.title}
                                          </h4>
                                          <span className="text-xs text-muted-foreground">
                                            ({groupSelectedCount}/
                                            {groupAllIds.length})
                                          </span>
                                        </div>

                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleToggleMultiple(
                                              groupAllIds,
                                              !isGroupAllSelected,
                                            )
                                          }
                                          disabled={!isCustomUser}
                                          className="h-7 text-xs px-2"
                                        >
                                          {isGroupAllSelected
                                            ? "Deselect Group"
                                            : "Select Group"}
                                        </Button>
                                      </div>

                                      {/* Grid of Privilege Cards */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                                        {filteredPrivileges.map((privilege) => {
                                          const isChecked =
                                            selectedPrivilegeIds.includes(
                                              privilege.id,
                                            );

                                          return (
                                            <div
                                              key={privilege.id}
                                              onClick={() => {
                                                if (isCustomUser) {
                                                  handleTogglePrivilege(
                                                    privilege.id,
                                                  );
                                                }
                                              }}
                                              className={cn(
                                                "group flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer select-none",
                                                isChecked
                                                  ? "border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-2xs"
                                                  : "border-border/60 bg-background hover:bg-muted/40",
                                                !isCustomUser &&
                                                  "opacity-60 cursor-not-allowed",
                                              )}
                                            >
                                              <Checkbox
                                                checked={isChecked}
                                                disabled={!isCustomUser}
                                                onCheckedChange={() =>
                                                  handleTogglePrivilege(
                                                    privilege.id,
                                                  )
                                                }
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                className="mt-0.5"
                                              />

                                              <div className="space-y-1 min-w-0 flex-1">
                                                <p
                                                  className={cn(
                                                    "text-xs font-semibold leading-snug",
                                                    isChecked
                                                      ? "text-foreground"
                                                      : "text-muted-foreground group-hover:text-foreground",
                                                  )}
                                                >
                                                  {privilege.action}
                                                </p>
                                                <p className="font-mono text-[11px] text-muted-foreground/80 truncate">
                                                  {privilege.code}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : section.children && section.children.length > 0 ? (
                        /* 2. If Section has Children (e.g. Lead Management, Production, etc.) */
                        <div className="space-y-4">
                          {section.children.map((child) => {
                            const childPrivileges = child.privileges;
                            const filteredPrivileges =
                              filterPrivileges(childPrivileges);
                            const allChildIds = childPrivileges.map((p) => p.id);
                            const childSelectedCount = allChildIds.filter(
                              (id) => selectedPrivilegeIds.includes(id),
                            ).length;
                            const isAllSelected =
                              allChildIds.length > 0 &&
                              childSelectedCount === allChildIds.length;

                            if (
                              filteredPrivileges.length === 0 &&
                              (deferredPrivilegeSearch || filterStatus !== "all")
                            ) {
                              return null;
                            }

                            return (
                              <div
                                key={child.id}
                                className="space-y-3 rounded-lg border bg-muted/10 p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-foreground">
                                      {child.title}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[11px] font-normal h-5 px-1.5",
                                        isAllSelected
                                          ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                                          : childSelectedCount > 0
                                            ? "border-primary/20 bg-primary/10 text-primary"
                                            : "text-muted-foreground",
                                      )}
                                    >
                                      {childSelectedCount} of {allChildIds.length}{" "}
                                      granted
                                    </Badge>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleMultiple(
                                        allChildIds,
                                        !isAllSelected,
                                      )
                                    }
                                    disabled={!isCustomUser}
                                    className="h-7 text-xs px-2.5"
                                  >
                                    {isAllSelected ? "Deselect Sub-module" : "Select Sub-module"}
                                  </Button>
                                </div>

                                {/* Grid of Privilege Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                                  {filteredPrivileges.map((privilege) => {
                                    const isChecked =
                                      selectedPrivilegeIds.includes(privilege.id);

                                    return (
                                      <div
                                        key={privilege.id}
                                        onClick={() => {
                                          if (isCustomUser) {
                                            handleTogglePrivilege(privilege.id);
                                          }
                                        }}
                                        className={cn(
                                          "group flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer select-none",
                                          isChecked
                                            ? "border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-2xs"
                                            : "border-border/60 bg-background hover:bg-muted/40",
                                          !isCustomUser &&
                                            "opacity-60 cursor-not-allowed",
                                        )}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          disabled={!isCustomUser}
                                          onCheckedChange={() =>
                                            handleTogglePrivilege(privilege.id)
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-0.5"
                                        />

                                        <div className="space-y-1 min-w-0 flex-1">
                                          <p
                                            className={cn(
                                              "text-xs font-semibold leading-snug",
                                              isChecked
                                                ? "text-foreground"
                                                : "text-muted-foreground group-hover:text-foreground",
                                            )}
                                          >
                                            {privilege.action}
                                          </p>
                                          <p className="font-mono text-[11px] text-muted-foreground/80 truncate">
                                            {privilege.code}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                          Privilege options for {section.title.toLowerCase()} will
                          be added here.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

