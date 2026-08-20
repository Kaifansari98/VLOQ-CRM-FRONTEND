"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableMonthFilter } from "@/components/data-table/data-table-month-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ListFilter, XCircle } from "lucide-react";

import {
  UniversalStagePostPayload,
  useUnderInstallationLeadsWithMiscellaneous,
  useUniversalStageLeadsPost,
  useVendorLeadsByTagPost,
  VendorLeadsByTagPostPayload,
} from "@/api/universalstage";
import { useFranchisesByVendorId } from "@/api/franchise";

import { getUniversalTableColumns } from "../utils/column/Universal-column";
import { LeadColumn } from "../utils/column/column-type";
import { mapTableFiltersToPayload } from "@/lib/utils";

// -------------------------------------------------------
// 🟣 COMPONENT PROPS
// -------------------------------------------------------

export interface UniversalTableProps {
  getRowId?: (row: LeadColumn) => string;
  onRowNavigate: (row: LeadColumn) => string;
  type: string;
  title?: string;
  description?: string;
  enableAdminTabs?: boolean;
  enableOverallData?: boolean;
  showStageColumn?: boolean;
  defaultViewType?: "my" | "overall";
  dataMode?: "universal" | "misc";
  activityStatus?: string;
  pendingServicesOnly?: boolean;
  showServicingColumn?: boolean;
  initialProductionStatusFilter?: string;
}

// -------------------------------------------------------
// 🔵 PRODUCTION STATUS FILTER
// -------------------------------------------------------

const PRODUCTION_STATUS_OPTIONS = [
  { value: "all", label: "All Leads", dot: null },
  { value: "Pending", label: "Pending", dot: "bg-blue-500" },
  { value: "Pre Prod Done", label: "Pre Prod Done", dot: "bg-yellow-400" },
  {
    value: "Under Production",
    label: "Under Production",
    dot: "bg-orange-500",
  },
  { value: "Post Production", label: "Post Production", dot: "bg-violet-500" },
  { value: "Completed", label: "Completed", dot: "bg-green-500" },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: "all", label: "All Priorities", dot: null },
  { value: "High", label: "High", dot: "bg-red-500" },
  { value: "Medium", label: "Medium", dot: "bg-orange-500" },
  { value: "Low", label: "Low", dot: "bg-yellow-500" },
];

const STATUS_LOG_SORTED_STAGE_TYPES = new Set([
  "type 2",
  "type 3",
  "type 4",
  "type 5",
  "type 6",
  "type 7",
  "type 8",
  "type 11",
  "type 12",
  "type 13",
  "type 14",
  "type 15",
  "type 16",
  "type 17",
]);

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeRole(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function getProductionStatusFromInstance(instance: any) {
  if (instance?.is_production_completed) return "Completed";
  if (instance?.is_post_production) return "Post Production";
  if (instance?.is_under_production) return "Under Production";
  if (instance?.is_pre_prod_done) return "Pre Prod Done";
  return "Pending";
}

function isType7SmallOrderLead(lead: any) {
  if (lead?.is_small_order_request === true) {
    return true;
  }

  const productMappings = Array.isArray(lead?.productMappings)
    ? lead.productMappings
    : [];

  return productMappings.some((mapping: any) => {
    const productTag = String(mapping?.productType?.tag ?? "")
      .trim()
      .toLowerCase();
    const productType = String(mapping?.productType?.type ?? "")
      .trim()
      .toLowerCase();

    return productTag === "type 7" || productType === "small order";
  });
}

function compareOrderLoginCompletedAtDesc(
  a?: string | null,
  b?: string | null,
) {
  const aTime = a ? new Date(a).getTime() : Number.NEGATIVE_INFINITY;
  const bTime = b ? new Date(b).getTime() : Number.NEGATIVE_INFINITY;
  return bTime - aTime;
}

function compareTechCheckCompletedAtDesc(a?: string | null, b?: string | null) {
  const aTime = a ? new Date(a).getTime() : Number.NEGATIVE_INFINITY;
  const bTime = b ? new Date(b).getTime() : Number.NEGATIVE_INFINITY;
  return bTime - aTime;
}

function getLeadStageSortFallbackTimestamp(lead: any) {
  return (
    lead?.status_updated_at ??
    lead?.stage_updated_at ??
    lead?.latest_status_log_created_at ??
    lead?.latestStatusLogCreatedAt ??
    lead?.updated_at ??
    lead?.created_at ??
    null
  );
}

function extractLatestStatusLogCreatedAtForTag(lead: any, tag: string) {
  const statusLogs = Array.isArray(lead?.leadStatusLogs)
    ? lead.leadStatusLogs
    : Array.isArray(lead?.statusLogs)
      ? lead.statusLogs
      : Array.isArray(lead?.lead_status_logs)
        ? lead.lead_status_logs
        : [];

  const targetTag = tag.trim().toLowerCase();

  const matchingLogs = statusLogs.filter((log: any) => {
    const logTag =
      log?.statusTypeMaster?.tag ??
      log?.statusType?.tag ??
      log?.status_type_master?.tag ??
      log?.status_type?.tag ??
      "";

    return String(logTag).trim().toLowerCase() === targetTag;
  });

  if (matchingLogs.length === 0) {
    return getLeadStageSortFallbackTimestamp(lead);
  }

  const latestMatchingLog = matchingLogs.reduce((latest: string | null, log: any) => {
    const createdAt = log?.created_at ?? null;
    if (!createdAt) return latest;
    if (!latest) return createdAt;
    return new Date(createdAt).getTime() > new Date(latest).getTime()
      ? createdAt
      : latest;
  }, null);

  return latestMatchingLog ?? getLeadStageSortFallbackTimestamp(lead);
}

function compareType8StatusLoggedAtDesc(aRow: any, bRow: any) {
  const getMostRecentTimestamp = (row: any) => {
    const logTime = row?.type8StatusLoggedAt ? new Date(row.type8StatusLoggedAt).getTime() : 0;
    const updateTime = row?.updatedAt || row?.updated_at ? new Date(row.updatedAt || row.updated_at).getTime() : 0;
    const createTime = row?.createdAt || row?.created_at ? new Date(row.createdAt || row.created_at).getTime() : 0;
    return Math.max(
      isNaN(logTime) ? 0 : logTime,
      isNaN(updateTime) ? 0 : updateTime,
      isNaN(createTime) ? 0 : createTime,
      Number(row?.id || 0)
    );
  };

  const aTime = getMostRecentTimestamp(aRow);
  const bTime = getMostRecentTimestamp(bRow);

  if (bTime !== aTime) {
    return bTime - aTime;
  }
  return Number(bRow?.id || 0) - Number(aRow?.id || 0);
}

function compareCreatedAt(a?: string | number | null, b?: string | number | null) {
  const aTime =
    typeof a === "number"
      ? a
      : a
        ? new Date(a).getTime()
        : Number.NEGATIVE_INFINITY;
  const bTime =
    typeof b === "number"
      ? b
      : b
        ? new Date(b).getTime()
        : Number.NEGATIVE_INFINITY;
  return aTime - bTime;
}

function prioritizeFastProductionRows<T extends { isFastProduction?: boolean }>(
  rows: T[],
) {
  return [...rows].sort((a, b) => {
    if (a.isFastProduction === b.isFastProduction) return 0;
    return a.isFastProduction ? -1 : 1;
  });
}

function matchesProductionStatusFilter(
  status: string | undefined,
  filterValue: string,
) {
  if (filterValue === "all") return true;
  return (
    (status ?? "").trim().toLowerCase() === filterValue.trim().toLowerCase()
  );
}

function ProductionStatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "all";
  const selectedOption = PRODUCTION_STATUS_OPTIONS.find(
    (o) => o.value === value,
  );
  const selectedLabel = selectedOption?.label;
  const selectedDot = selectedOption?.dot ?? null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {isFiltered ? (
            <div
              role="button"
              aria-label="Clear Production Status filter"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <ListFilter className="h-4 w-4 shrink-0" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Production Status</span>
            {isFiltered && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[110px] flex items-center gap-1"
                >
                  {selectedDot && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedDot}`}
                    />
                  )}
                  {selectedLabel}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        {PRODUCTION_STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
              value === option.value
                ? "bg-accent text-accent-foreground font-medium"
                : ""
            }`}
          >
            {option.dot && (
              <span className={`h-2 w-2 rounded-full shrink-0 ${option.dot}`} />
            )}
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function PriorityQuickFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isFiltered = value !== "all";
  const selectedOption = PRIORITY_FILTER_OPTIONS.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label;
  const selectedDot = selectedOption?.dot ?? null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {isFiltered ? (
            <div
              role="button"
              aria-label="Clear Priority filter"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <ListFilter className="h-4 w-4 shrink-0" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Priority</span>
            {isFiltered && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[110px] flex items-center gap-1"
                >
                  {selectedDot && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedDot}`}
                    />
                  )}
                  {selectedLabel}
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        {PRIORITY_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2 ${
              value === option.value
                ? "bg-accent text-accent-foreground font-medium"
                : ""
            }`}
          >
            {option.dot && (
              <span className={`h-2 w-2 rounded-full shrink-0 ${option.dot}`} />
            )}
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// -------------------------------------------------------
// 🟩 COMPONENT
// -------------------------------------------------------

export function UniversalTable({
  getRowId,
  onRowNavigate,
  title,
  description,
  enableAdminTabs = true,
  showStageColumn = false,
  defaultViewType = "my",
  type,
  dataMode = "universal",
  pendingServicesOnly = false,
  showServicingColumn = false,
  initialProductionStatusFilter,
}: UniversalTableProps) {
  // -------------------- GLOBAL STATE --------------------

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const isCustomUserTypeOnlyVendor = useAppSelector(
    (s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const franchiseId = useAppSelector(
    (s) => s.auth.franchise_id ?? s.auth.user?.franchise_id,
  );
  const reduxModuledForB2b = useAppSelector(
    (s) => s.auth.moduled_for_b2b ?? s.auth.user?.moduled_for_b2b ?? false,
  );
  const handlesLargeScaleProjectsFromAuth = useAppSelector(
    (s) => s.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const isB2b = useMemo(() => {
    if (!franchiseId) return reduxModuledForB2b;
    const activeFranchise = franchisesForB2b.find((f: any) => f.id === franchiseId);
    return activeFranchise?.moduled_for_b2b ?? reduxModuledForB2b;
  }, [franchisesForB2b, franchiseId, reduxModuledForB2b]);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const isHOUser = useAppSelector(
    (s) => s.auth.is_ho_user ?? s.auth.user?.is_ho_user ?? false,
  );
  const userType = useAppSelector((s) => {
    const u = s.auth.user as any;
    if (!u) return "";
    if (typeof u.user_type === "string") return u.user_type;
    if (typeof u.user_role === "string") return u.user_role;
    if (typeof u.role === "string") return u.role;
    return (
      u.user_type?.user_type ||
      u.user_type?.user_type_name ||
      u.user_type?.name ||
      u.user_type?.title ||
      u.user_type?.role ||
      u.user_role ||
      u.role ||
      ""
    );
  });

  const router = useRouter();
  const normalizedUserType = normalizeRole(userType);
  const isAdmin =
    normalizedUserType === "admin" ||
    normalizedUserType === "super-admin" ||
    normalizedUserType === "auditor";
  const shouldIncludeFranchise =
    normalizedUserType === "admin" ||
    normalizedUserType === "super-admin" ||
    normalizedUserType === "auditor" ||
    normalizedUserType === "sales-executive" ||
    normalizedUserType === "head-site-supervisor";
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  const canSeeMyOverallTabs = normalizedUserType === "sales-executive";
  const hideOverallToggle =
    !canSeeMyOverallTabs ||
    (normalizedType === "type 8" && normalizedUserType === "sales-executive");
  const shouldShowLeadCodeFranchiseFilter = false;

  // -------------------- LOCAL UI STATE --------------------

  const [viewType, setViewType] = useState<"my" | "overall">(defaultViewType);
  const effectiveViewType = isAdmin ? "overall" : viewType;

  // ✅ SEPARATE PAGINATION FOR BOTH VIEWS
  const [myPagination, setMyPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const [overallPagination, setOverallPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  // ✅ SEPARATE GLOBAL FILTER FOR BOTH VIEWS
  const [myGlobalFilter, setMyGlobalFilter] = useState("");
  const [overallGlobalFilter, setOverallGlobalFilter] = useState("");

  // ✅ SEPARATE SORTING FOR BOTH VIEWS
  const [mySorting, setMySorting] = useState<SortingState>([
    ...(STATUS_LOG_SORTED_STAGE_TYPES.has(normalizedType) ||
    ["type 9", "type 10"].includes(normalizedType)
      ? []
      : [{ id: "createdAt", desc: true }]),
  ]);

  const [overallSorting, setOverallSorting] = useState<SortingState>([
    ...(STATUS_LOG_SORTED_STAGE_TYPES.has(normalizedType) ||
    ["type 9", "type 10"].includes(normalizedType)
      ? []
      : [{ id: "createdAt", desc: true }]),
  ]);

  // ✅ SEPARATE COLUMN FILTERS FOR BOTH VIEWS
  const [myColumnFilters, setMyColumnFilters] = useState<ColumnFiltersState>(
    [],
  );
  const [overallColumnFilters, setOverallColumnFilters] =
    useState<ColumnFiltersState>([]);

  // ✅ SEPARATE FRANCHISES FILTER FOR BOTH VIEWS
  const [myFranchisesFilter, setMyFranchisesFilter] = useState<number[]>([]);
  const [overallFranchisesFilter, setOverallFranchisesFilter] = useState<number[]>([]);

  const resolvedInitialProductionStatusFilter = useMemo(() => {
    const requestedValue = String(
      initialProductionStatusFilter ?? "all",
    ).trim();
    const matchedOption = PRODUCTION_STATUS_OPTIONS.find(
      (option) =>
        option.value.trim().toLowerCase() === requestedValue.toLowerCase(),
    );

    if (
      normalizedUserType === "pre-prod" &&
      requestedValue.toLowerCase() === "all"
    ) {
      return "Pending";
    }

    return matchedOption?.value ?? "all";
  }, [initialProductionStatusFilter, normalizedUserType]);

  const [productionStatusFilter, setProductionStatusFilter] = useState<string>(
    resolvedInitialProductionStatusFilter,
  );
  const [servicingMonthFilter, setServicingMonthFilter] = useState<
    { month: number; year: number } | undefined
  >(undefined);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    architechName: false,
    source: false,
    createdAt: false,
    altContact: false,
    email: false,
    designerRemark: false,
  });

  // ✅ DETERMINE ACTIVE STATE BASED ON VIEW TYPE
  const activePagination =
    effectiveViewType === "my" ? myPagination : overallPagination;
  const activeGlobalFilter =
    effectiveViewType === "my" ? myGlobalFilter : overallGlobalFilter;
  const activeSorting = effectiveViewType === "my" ? mySorting : overallSorting;
  const activeColumnFilters =
    effectiveViewType === "my" ? myColumnFilters : overallColumnFilters;
  const activeFranchisesFilter =
    effectiveViewType === "my" ? myFranchisesFilter : overallFranchisesFilter;

  const setActiveFranchisesFilter = (val: number[]) => {
    if (effectiveViewType === "my") {
      setMyFranchisesFilter(val);
      setMyPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      setOverallFranchisesFilter(val);
      setOverallPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  const showFranchiseFilter = useMemo(() => {
    if (isHOUser) return true;
    const cleanRole = (userType || "")
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-");
    const allowedRoles = [
      "factory",
      "backend",
      "tech-check",
      "head-site-supervisor",
      "super-admin",
      "site-supervisor",
    ];
    return allowedRoles.includes(cleanRole);
  }, [isHOUser, userType]);


  const servicingDateRange = useMemo(() => {
    if (!showServicingColumn || !pendingServicesOnly || !servicingMonthFilter) {
      return undefined;
    }

    const from = new Date(
      servicingMonthFilter.year,
      servicingMonthFilter.month,
      1,
    );
    const to = new Date(
      servicingMonthFilter.year,
      servicingMonthFilter.month + 1,
      0,
    );

    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      from: formatLocalDate(from),
      to: formatLocalDate(to),
    };
  }, [pendingServicesOnly, servicingMonthFilter, showServicingColumn]);

  // -------------------- MY LEADS POST PAYLOAD --------------------

  const myPostPayload: UniversalStagePostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = mySorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(myColumnFilters);
    const normalizedType = String(type || "")
      .trim()
      .toLowerCase();
    const enforceAssignedToForTechCheckSales =
      normalizedType === "type 8" &&
      userType?.toLowerCase() === "sales-executive";
    const assignTo =
      enforceAssignedToForTechCheckSales && userId
        ? [userId]
        : (mappedFilters.assign_to ?? []);
    const assignToFilter = assignTo.length > 0 ? assignTo : [];

    return {
      userId: userId!,
      franchise_id: shouldIncludeFranchise ? franchiseId! : undefined,
      tag: type,
      page: myPagination.pageIndex + 1,
      limit: myPagination.pageSize,
      global_search: myGlobalFilter || "",

      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,
      status: mappedFilters.status,
      assign_to: assignToFilter,
      priority:
        Array.isArray(mappedFilters.priority) &&
        mappedFilters.priority.length > 0
          ? mappedFilters.priority
          : undefined,
      siteType: mappedFilters.siteType,
      architectName: mappedFilters.architectName,
      created_at: sortOrder,
      stagetag: mappedFilters.stagetag,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      furnitue_structures: mappedFilters.furnitue_structures,
      site_type: mappedFilters.site_type,
      site_map_link: mappedFilters.site_map_link,
      date_range: servicingDateRange ?? mappedFilters.date_range,
      production_status:
        normalizedType === "type 10" && productionStatusFilter !== "all"
          ? productionStatusFilter
          : undefined,
      pending_services: pendingServicesOnly || undefined,
      franchises: myFranchisesFilter.length > 0 ? myFranchisesFilter : undefined,
    };
  }, [
    userId,
    userType,
    shouldIncludeFranchise,
    type,
    franchiseId,
    myPagination,
    mySorting,
    myColumnFilters,
    myGlobalFilter,
    productionStatusFilter,
    normalizedType,
    pendingServicesOnly,
    servicingDateRange,
    myFranchisesFilter,
  ]);

  // -------------------- OVERALL LEADS POST PAYLOAD --------------------

  const overallPostPayload: VendorLeadsByTagPostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = overallSorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(overallColumnFilters);
    const normalizedType = String(type || "")
      .trim()
      .toLowerCase();
    const enforceAssignedToForTechCheckSales =
      normalizedType === "type 8" &&
      userType?.toLowerCase() === "sales-executive";
    const assignTo =
      enforceAssignedToForTechCheckSales && userId
        ? [userId]
        : (mappedFilters.assign_to ?? []);
    const assignToFilter = assignTo.length > 0 ? assignTo : undefined;
    const overallUserId = isAdmin ? undefined : userId;

    return {
      userId: overallUserId,
      franchise_id: shouldIncludeFranchise ? franchiseId! : undefined,
      tag: type,

      page: overallPagination.pageIndex + 1,
      limit: overallPagination.pageSize,

      global_search: overallGlobalFilter || "",

      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,

      assign_to: assignToFilter,
      priority:
        Array.isArray(mappedFilters.priority) &&
        mappedFilters.priority.length > 0
          ? mappedFilters.priority
          : undefined,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      stagetag: mappedFilters.stagetag,

      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,

      site_map_link: mappedFilters.site_map_link,
      date_range: servicingDateRange ?? mappedFilters.date_range,
      created_at: sortOrder,
      // activity_status: activityStatus, // TODO: enable once backend supports this filter
      production_status:
        normalizedType === "type 10" && productionStatusFilter !== "all"
          ? productionStatusFilter
          : undefined,
      pending_services: pendingServicesOnly || undefined,
      franchises: overallFranchisesFilter.length > 0 ? overallFranchisesFilter : undefined,
    };
  }, [
    userId,
    userType,
    isAdmin,
    shouldIncludeFranchise,
    type,
    franchiseId,
    overallPagination,
    overallSorting,
    overallColumnFilters,
    overallGlobalFilter,
    productionStatusFilter,
    normalizedType,
    pendingServicesOnly,
    servicingDateRange,
    overallFranchisesFilter,
  ]);

  // -------------------- API CALLS --------------------

  const { data: myData, isLoading: isMyLoading } = useUniversalStageLeadsPost(
    vendorId!,
    myPostPayload,
  );

  const { data: overallData, isLoading: isOverallLoading } =
    useVendorLeadsByTagPost(vendorId!, overallPostPayload);

  // -------------------- MISCELLANEOUS LEADS POST PAYLOAD --------------------

  const miscPayload: UniversalStagePostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = mySorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(myColumnFilters);

    return {
      userId: userId!,
      franchise_id: shouldIncludeFranchise ? franchiseId! : undefined,
      page: myPagination.pageIndex + 1,
      limit: myPagination.pageSize,

      global_search: myGlobalFilter || "",
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,

      assign_to: Array.isArray(mappedFilters.assign_to)
        ? mappedFilters.assign_to
        : [],
      priority:
        Array.isArray(mappedFilters.priority) &&
        mappedFilters.priority.length > 0
          ? mappedFilters.priority
          : undefined,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      stagetag: mappedFilters.stagetag,

      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,

      site_map_link: mappedFilters.site_map_link,
      date_range: servicingDateRange ?? mappedFilters.date_range,
      created_at: sortOrder,
    };
  }, [
    userId,
    shouldIncludeFranchise,
    franchiseId,
    myPagination,
    mySorting,
    myColumnFilters,
    myGlobalFilter,
    servicingDateRange,
  ]);

  const { data: miscData, isLoading: isMiscLoading } =
    useUnderInstallationLeadsWithMiscellaneous(vendorId!, miscPayload);

  React.useEffect(() => {
    // console.log("[UniversalTable] admin view debug", {
    //   isAdmin,
    //   normalizedUserType,
    //   effectiveViewType,
    //   dataMode,
    //   type,
    //   vendorId,
    //   franchiseId,
    //   userId,
    //   isMyLoading,
    //   isOverallLoading,
    //   isMiscLoading,
    //   myPayload: myPostPayload,
    //   overallPayload: overallPostPayload,
    //   miscPayload,
    //   myData: {
    //     count: myData?.count,
    //     dataLen: myData?.data?.length,
    //     totalPages: myData?.pagination?.totalPages,
    //   },
    //   overallData: {
    //     count: overallData?.count,
    //     dataLen: overallData?.data?.length,
    //     totalPages: overallData?.pagination?.totalPages,
    //   },
    //   miscData: {
    //     count: miscData?.count,
    //     dataLen: miscData?.data?.length,
    //     totalPages: miscData?.pagination?.totalPages,
    //   },
    // });
  }, [
    isAdmin,
    normalizedUserType,
    effectiveViewType,
    dataMode,
    type,
    vendorId,
    franchiseId,
    userId,
    isMyLoading,
    isOverallLoading,
    isMiscLoading,
    myPostPayload,
    overallPostPayload,
    miscPayload,
    myData,
    overallData,
    miscData,
  ]);

  //
  // 🔵 Active Dataset
  //
  const activeData =
    dataMode === "misc"
      ? (miscData?.data ?? [])
      : effectiveViewType === "overall"
        ? (overallData?.data ?? [])
        : (myData?.data ?? []);

  const totalPages =
    dataMode === "misc"
      ? (miscData?.pagination?.totalPages ?? 1)
      : effectiveViewType === "overall"
        ? (overallData?.pagination?.totalPages ?? 1)
        : (myData?.pagination?.totalPages ?? 1);

  const myCount =
    dataMode === "misc" ? (miscData?.count ?? 0) : (myData?.count ?? 0);
  const overallCount = dataMode === "misc" ? 0 : (overallData?.count ?? 0);

  const formatOrdinal = (value: number) => {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) return `${value}st`;
    if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
    if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
    return `${value}th`;
  };

  const formatServiceDate = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const day = formatOrdinal(date.getDate());
    const monthYear = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
      .format(date)
      .replace(/^\d+\s/, "");

    return `${day} ${monthYear}`;
  };

  // Returns the next pending (open) service for a lead, ordered as:
  // Free 1 → Free 2 → Free 3 → AMC 1 (treated as 4th) → AMC 2 → …
  const getNextPendingService = (lead: any) => {
    const allSchedules = Array.isArray(lead?.serviceSchedules)
      ? lead.serviceSchedules
      : [];

    // If the backend already pre-filters (pending_services: true), items may have
    // no status field. Only exclude explicitly completed/rejected entries.
    const openSchedules = allSchedules.filter(
      (s: any) => !s?.status || s?.status === "open",
    );

    openSchedules.sort((a: any, b: any) => {
      const getOrder = (s: any) => {
        const isAmc = String(s?.service_type ?? "").toLowerCase() === "amc";
        return isAmc ? 3 + (s?.service_no ?? 0) : (s?.service_no ?? 0);
      };
      return getOrder(a) - getOrder(b);
    });

    return openSchedules[0] ?? null;
  };

  const getPendingServicingLabel = (lead: any) => {
    const nextPending = getNextPendingService(lead);

    if (
      !nextPending?.service_no ||
      !nextPending?.service_type ||
      !nextPending?.scheduled_for
    ) {
      return "";
    }

    const serviceTypeLabel =
      String(nextPending.service_type).toLowerCase() === "amc" ? "AMC" : "Free";

    const scheduledFor = formatServiceDate(nextPending.scheduled_for);
    return `${formatOrdinal(nextPending.service_no)} ${serviceTypeLabel} Servicing${scheduledFor ? ` - ${scheduledFor}` : ""}`;
  };

  // -------------------- ROW MAPPER --------------------

  const mapUniversalRow = (
    lead: any,
    index: number,
    options?: {
      rowKey?: string;
      instanceId?: number;
      leadCodeSuffix?: string;
      furnitureStructureOverride?: string;
      productionStatus?: string;
      type8StatusLoggedAt?: string | null;
      techCheckCompletedAt?: string | null;
      orderLoginCompletedAt?: string | null;
      instanceTitle?: string;
      instanceDescription?: string;
    },
  ): LeadColumn => {
    const designerMapping = Array.isArray(lead.userMappings)
      ? lead.userMappings.find(
          (mapping: any) =>
            String(mapping?.type ?? "designer").toLowerCase() === "designer" &&
            String(mapping?.status ?? "active").toLowerCase() === "active",
        )
      : undefined;

    const designerName =
      designerMapping?.user?.user_name ??
      designerMapping?.userMaster?.user_name ??
      "";

    const requirementTypes = Array.from(
      new Set(
        [
          ...(Array.isArray(lead.leadB2BReqMappings)
            ? lead.leadB2BReqMappings.map(
                (mapping: any) => mapping.b2bRequirementType?.type,
              )
            : []),
          ...(Array.isArray(lead.leadProcessBriefs)
            ? lead.leadProcessBriefs.map(
                (mapping: any) => mapping.b2bRequirementType?.type,
              )
            : []),
        ].filter(Boolean),
      ),
    ).join(", ");

    return {
      rowKey: options?.rowKey,
      instanceId: options?.instanceId,
      id: lead.id,
      srNo: index + 1,
      lead_code: `${lead.lead_code ?? ""}${options?.leadCodeSuffix ?? ""}`,
      name: toTitleCase(`${lead.firstname ?? ""} ${lead.lastname ?? ""}`),
      clientName: toTitleCase(
        lead.firstname ||
        lead.clientMaster?.company_name ||
        lead.clientMaster?.name ||
        lead.client?.company_name ||
        ""
      ),
      projectName: toTitleCase(lead.lastname ?? ""),
      email: lead.email ?? "",
      contact: `${lead.country_code ?? ""}${lead.contact_no ?? ""}`,
      siteAddress: lead.site_address ?? "",
      site_map_link: lead.site_map_link ?? "",
      architechName: lead.archetech_name ?? "",
      designerRemark: lead.designer_remark ?? "",
      furnitureType: isB2b
        ? requirementTypes
        : (Array.isArray(lead.productMappings)
            ? lead.productMappings
                .map((p: any) => p.productType?.type)
                .filter(Boolean)
                .join(", ")
            : ""),
      furnitueStructures: isB2b
        ? (Array.isArray(lead.leadProcessBriefs)
            ? lead.leadProcessBriefs
                .map((p: any) => {
                  const reqType = p.b2bRequirementType?.type;
                  const briefName = p.processBrief?.name;
                  if (reqType && briefName) {
                    return `${reqType} - ${briefName}`;
                  }
                  return briefName || reqType;
                })
                .filter(Boolean)
            : [])
        : (options?.furnitureStructureOverride
            ? [options.furnitureStructureOverride]
            : (lead.leadProductStructureMapping
                ?.map((p: any) => p.productStructure?.type)
                .filter(Boolean) ?? [])),
      productionStatus: options?.productionStatus,
      type8StatusLoggedAt: options?.type8StatusLoggedAt,
      techCheckCompletedAt: options?.techCheckCompletedAt,
      orderLoginCompletedAt: options?.orderLoginCompletedAt,
      instanceTitle: options?.instanceTitle,
      instanceDescription: options?.instanceDescription,
      source: lead.source?.type ?? "",
      siteType: lead.siteType?.type ?? "",
      createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
      updatedAt: lead.updated_at ?? "",
      altContact: lead.alt_contact_no ?? "",
      status: lead.statusType?.type ?? "",
      statusTag: lead.statusType?.tag ?? "",
      sales_executive: lead.assignedTo?.user_name ?? "",
      designer: designerName,
      assignedToId: lead.assignedTo?.id ?? "",
      isDraft: lead.is_draft === true,
      isFastProduction: lead.is_fast_production === true,
      accountId: lead.account?.id ?? lead.account_id ?? 0,
      priority: lead.priority ?? "",
      servicing: getPendingServicingLabel(lead),
      scheduledAt: getNextPendingService(lead)?.scheduled_for ?? "",
    };
  };

  // -------------------- TABLE DATA --------------------

  const tableData = useMemo<LeadColumn[]>(() => {
    const isType8 = normalizedType === "type 8";
    const isType9 = normalizedType === "type 9";
    const isType10 = normalizedType === "type 10";
    const primarySort = activeSorting[0];
    const shouldSortByCreatedAt = primarySort?.id === "createdAt";
    const createdAtDirection = primarySort?.desc ? "desc" : "asc";
    const filteredActiveData = activeData.filter((lead: any) => {
      if (normalizedType === "type 1" && lead?.is_draft === true) {
        return false;
      }

      if (
        normalizedType === "type 17" &&
        showServicingColumn &&
        pendingServicesOnly &&
        isType7SmallOrderLead(lead)
      ) {
        return false;
      }

      if (lead?.is_small_order_request !== true) {
        return true;
      }

      const requestSource = String(
        lead?.smallOrderRequest?.request_source ?? "",
      ).toLowerCase();

      if (requestSource === "post_dispatch") {
        return !["type 15", "type 16", "type 17"].includes(normalizedType);
      }

      if (requestSource === "final_handover") {
        return !["type 16", "type 17"].includes(normalizedType);
      }

      return true;
    });

    let rows: LeadColumn[];

    if (!isType8 && !isType9 && !isType10) {
      const isDesc = primarySort ? createdAtDirection === "desc" : true;
      const baseData = [...filteredActiveData].sort((a, b) => {
        const getLeadActivityTime = (lead: any) => {
          const uTime = lead?.updated_at || lead?.updatedAt ? new Date(lead.updated_at || lead.updatedAt).getTime() : 0;
          const cTime = lead?.created_at || lead?.createdAt ? new Date(lead.created_at || lead.createdAt).getTime() : 0;
          return Math.max(
            isNaN(uTime) ? 0 : uTime,
            isNaN(cTime) ? 0 : cTime,
            Number(lead?.id || 0)
          );
        };
        const aTime = getLeadActivityTime(a);
        const bTime = getLeadActivityTime(b);
        if (bTime !== aTime) {
          return isDesc ? bTime - aTime : aTime - bTime;
        }
        return isDesc ? Number(b?.id || 0) - Number(a?.id || 0) : Number(a?.id || 0) - Number(b?.id || 0);
      });

      rows = baseData.map((item, idx) => {
        const type8StatusLoggedAt = STATUS_LOG_SORTED_STAGE_TYPES.has(
          normalizedType,
        )
          ? extractLatestStatusLogCreatedAtForTag(item, type)
          : null;

        return mapUniversalRow(item, idx, {
          rowKey: String(item.id),
          type8StatusLoggedAt,
        });
      });
    } else {
      const expanded: LeadColumn[] = [];

      filteredActiveData.forEach((lead) => {
        const handlesLargeScaleProjects =
          handlesLargeScaleProjectsFromAuth ||
          (lead as any)?.createdBy?.vendor?.handlesLargeScaleProjects === true ||
          (lead as any)?.assignedTo?.vendor?.handlesLargeScaleProjects === true;

        const type8StatusLoggedAt = STATUS_LOG_SORTED_STAGE_TYPES.has(
          normalizedType,
        )
          ? extractLatestStatusLogCreatedAtForTag(lead, type)
          : null;
        const instances = Array.isArray(lead?.productStructureInstances)
          ? lead.productStructureInstances
          : [];

        if (handlesLargeScaleProjects) {
          const structureTypes = Array.from(
            new Set(
              instances
                .map(
                  (inst: any) =>
                    inst?.title ||
                    inst?.productType?.type ||
                    inst?.product_type?.name ||
                    inst?.productStructure?.type
                )
                .filter(Boolean)
            )
          ).join(", ");

          expanded.push(
            mapUniversalRow(lead, expanded.length, {
              rowKey: String(lead.id),
              leadCodeSuffix: "",
              furnitureStructureOverride: structureTypes || undefined,
              type8StatusLoggedAt,
            })
          );
          return;
        }

        let instanceRows = instances;
        if (isType8) {
          instanceRows = instances.filter(
            (instance: any) => instance?.is_tech_check_completed !== true,
          );
        } else if (isType9) {
          instanceRows = instances.filter(
            (instance: any) =>
              instance?.is_tech_check_completed === true &&
              instance?.is_order_login_completed !== true,
          );
        } else if (isType10) {
          instanceRows = instances.filter(
            (instance: any) =>
              instance?.is_tech_check_completed === true &&
              instance?.is_order_login_completed === true,
          );
        }

        if (instanceRows.length === 0) {
          return;
        }

        if (instanceRows.length <= 1) {
          const onlyInstance = instanceRows[0];
          const structureType =
            onlyInstance?.productStructure?.type ??
            lead.leadProductStructureMapping?.[0]?.productStructure?.type ??
            "";
          const suffix =
            instances.length > 1 ? `.${onlyInstance?.quantity_index ?? 1}` : "";
          expanded.push(
            mapUniversalRow(lead, expanded.length, {
              rowKey: String(lead.id),
              instanceId: onlyInstance?.id,
              leadCodeSuffix: suffix,
              furnitureStructureOverride: structureType,
              type8StatusLoggedAt,
              productionStatus: isType10
                ? getProductionStatusFromInstance(onlyInstance)
                : undefined,
              techCheckCompletedAt:
                onlyInstance?.tech_check_completed_at ?? null,
              orderLoginCompletedAt:
                onlyInstance?.order_login_completed_at ?? null,
              instanceTitle: onlyInstance?.title ?? undefined,
              instanceDescription: onlyInstance?.description ?? undefined,
            }),
          );
          return;
        }

        instanceRows.forEach((instance: any, instanceIndex: number) => {
          const structureType =
            instance?.productStructure?.type ??
            lead.leadProductStructureMapping?.find(
              (item: any) =>
                item?.productStructure?.id === instance?.product_structure_id,
            )?.productStructure?.type ??
            "";
          const suffixIndex = instance?.quantity_index ?? instanceIndex + 1;
          expanded.push(
            mapUniversalRow(lead, expanded.length, {
              rowKey: `${lead.id}-${instance?.id ?? instanceIndex + 1}`,
              instanceId: instance?.id,
              leadCodeSuffix: instances.length > 1 ? `.${suffixIndex}` : "",
              furnitureStructureOverride: structureType,
              type8StatusLoggedAt,
              productionStatus: isType10
                ? getProductionStatusFromInstance(instance)
                : undefined,
              techCheckCompletedAt: instance?.tech_check_completed_at ?? null,
              orderLoginCompletedAt: instance?.order_login_completed_at ?? null,
              instanceTitle: instance?.title ?? undefined,
              instanceDescription: instance?.description ?? undefined,
            }),
          );
        });
      });

      rows = expanded;
    }

    if (isType10 && productionStatusFilter !== "all") {
      rows = rows.filter((row) =>
        matchesProductionStatusFilter(
          row.productionStatus,
          productionStatusFilter,
        ),
      );
    }

    if (STATUS_LOG_SORTED_STAGE_TYPES.has(normalizedType)) {
      rows = [...rows].sort((a, b) => compareType8StatusLoggedAtDesc(a, b));
    }

    if (isType9) {
      rows = [...rows].sort((a, b) =>
        compareTechCheckCompletedAtDesc(
          a.techCheckCompletedAt,
          b.techCheckCompletedAt,
        ),
      );
    }

    if (isType10) {
      rows = [...rows].sort((a, b) =>
        compareOrderLoginCompletedAtDesc(
          a.orderLoginCompletedAt,
          b.orderLoginCompletedAt,
        ),
      );
    }

    // Client-side month filter for the servicing table.
    // The backend receives date_range but may not filter reliably, so we
    // enforce it here using the already-resolved next-pending service date.
    if (showServicingColumn && pendingServicesOnly && servicingMonthFilter) {
      rows = rows.filter((row) => {
        if (!row.scheduledAt) return false;
        const date = new Date(row.scheduledAt as string);
        if (isNaN(date.getTime())) return false;
        return (
          date.getMonth() === servicingMonthFilter.month &&
          date.getFullYear() === servicingMonthFilter.year
        );
      });
    }

    rows = prioritizeFastProductionRows(rows);

    return rows.map((row, index) => ({
      ...row,
      srNo: index + 1,
    }));
  }, [
    activeData,
    activeSorting,
    normalizedType,
    pendingServicesOnly,
    productionStatusFilter,
    servicingMonthFilter,
    showServicingColumn,
  ]);

  React.useEffect(() => {
    // console.log("[UniversalTable] data pipeline", {
    //   isAdmin,
    //   effectiveViewType,
    //   dataMode,
    //   activeDataLen: activeData?.length ?? 0,
    //   tableDataLen: tableData?.length ?? 0,
    //   normalizedType,
    // });
  }, [
    isAdmin,
    effectiveViewType,
    dataMode,
    activeData,
    tableData,
    normalizedType,
  ]);
  // -------------------- COLUMNS --------------------

  const showProductionStatusColumn = useMemo(() => {
    return normalizedType === "type 10";
  }, [normalizedType]);

  const showPriorityColumn = useMemo(() => {
    return ["type 1", "type 2", "type 3"].includes(normalizedType);
  }, [normalizedType]);

  const columns = useMemo(
    () =>
      getUniversalTableColumns({
        showStageColumn,
        showProductionStatusColumn,
        showPriorityColumn,
        showServicingColumn,
        showDesignerColumn: isCustomUserTypeOnlyVendor,
        isB2b,
      }),
    [
      showStageColumn,
      showProductionStatusColumn,
      showPriorityColumn,
      showServicingColumn,
      isCustomUserTypeOnlyVendor,
      isB2b,
    ],
  );

  // -------------------- TABLE INSTANCE --------------------

  const table = useReactTable<LeadColumn>({
    data: tableData,
    columns,

    manualPagination: true,
    manualFiltering: false,
    pageCount: totalPages,

    state: {
      pagination: activePagination,
      sorting: activeSorting,
      columnFilters: activeColumnFilters,
      globalFilter: activeGlobalFilter,
      columnVisibility,
      rowSelection,
    },
    meta: {
      showFranchiseFilter,
      franchisesFilter: activeFranchisesFilter,
      setFranchisesFilter: setActiveFranchisesFilter,
      isB2b,
    },

    onPaginationChange:
      effectiveViewType === "my" ? setMyPagination : setOverallPagination,
    onSortingChange:
      effectiveViewType === "my" ? setMySorting : setOverallSorting,
    onColumnFiltersChange:
      effectiveViewType === "my" ? setMyColumnFilters : setOverallColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange:
      effectiveViewType === "my" ? setMyGlobalFilter : setOverallGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: getRowId ?? ((row) => row.rowKey ?? row.id.toString()),
  });

  const priorityFilterValue = useMemo(() => {
    const priorityFilter = activeColumnFilters.find(
      (filter) => filter.id === "priority",
    );
    if (!priorityFilter) return "all";

    const value = priorityFilter.value;
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }

    return "all";
  }, [activeColumnFilters]);

  const handlePriorityFilterChange = (value: string) => {
    const column = table.getColumn("priority");
    if (!column) return;

    column.setFilterValue(value === "all" ? [] : [value]);

    if (effectiveViewType === "my") {
      setMyPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      setOverallPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  const handleProductionStatusFilterChange = (value: string) => {
    setProductionStatusFilter(value);

    if (effectiveViewType === "my") {
      setMyPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      setOverallPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  React.useEffect(() => {
    setProductionStatusFilter(resolvedInitialProductionStatusFilter);
  }, [resolvedInitialProductionStatusFilter]);

  // -------------------- ROW NAVIGATION --------------------
  const withInstanceId = (path: string, instanceId?: number) => {
    if (!instanceId) return path;
    const [baseAndQuery, hash = ""] = path.split("#");
    const [basePath, queryString = ""] = baseAndQuery.split("?");
    const params = new URLSearchParams(queryString);
    params.set("instance_id", String(instanceId));
    const next = `${basePath}?${params.toString()}`;
    return hash ? `${next}#${hash}` : next;
  };

  const handleRowClick = (row: LeadColumn) => {
    const targetPath = onRowNavigate(row);
    router.push(withInstanceId(targetPath, row.instanceId));
  };

  // ✅ HANDLE VIEW SWITCH
  const handleViewSwitch = (newView: "my" | "overall") => {
    if (isAdmin) return;
    setViewType(newView);
    // Reset pagination when switching views
    if (newView === "my") {
      setMyPagination({ ...myPagination, pageIndex: 0 });
    } else {
      setOverallPagination({ ...overallPagination, pageIndex: 0 });
    }
  };

  // -------------------- UI --------------------

  return (
    <div className="py-2">
      {/* 📱 MOBILE & DESKTOP HEADER */}
      <div className="px-4 space-y-3">
        {/* Title & Description */}
        <div className="flex flex-col gap-2 md:flex-row items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              {description}
            </p>
          </div>

          {/* My Leads / Overall Leads Buttons */}
          {enableAdminTabs && !isAdmin && !hideOverallToggle && (
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant={effectiveViewType === "my" ? "default" : "secondary"}
                onClick={() => handleViewSwitch("my")}
                className="flex-1 md:flex-none"
              >
                My Leads ({myCount})
              </Button>

              <Button
                size="sm"
                variant={
                  effectiveViewType === "overall" ? "default" : "secondary"
                }
                onClick={() => handleViewSwitch("overall")}
                className="flex-1 md:flex-none"
              >
                Overall Leads ({overallCount})
              </Button>
            </div>
          )}
        </div>

        {/* 📱 MOBILE FILTERS (4 components in a row) */}
        <div className="flex md:hidden gap-2 flex-wrap">
          {showServicingColumn && pendingServicesOnly ? (
            <DataTableMonthFilter
              title="Filter By Month"
              value={servicingMonthFilter}
              onChange={setServicingMonthFilter}
            />
          ) : (
            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
          )}
          {showPriorityColumn && (
            <PriorityQuickFilter
              value={priorityFilterValue}
              onChange={handlePriorityFilterChange}
            />
          )}
          {normalizedType === "type 10" && (
            <ProductionStatusFilter
              value={productionStatusFilter}
              onChange={handleProductionStatusFilterChange}
            />
          )}
          {/* <DataTableSortList table={table} />
          <DataTableFilterList table={table} /> */}
          <DataTableViewOptions table={table} />
        </div>

        {/* 📱 MOBILE SEARCH BAR (Full Width) */}
        <div className="md:hidden w-full">
          <ClearInput
            value={activeGlobalFilter}
            onChange={(e) => {
              if (effectiveViewType === "my") {
                setMyGlobalFilter(e.target.value);
                setMyPagination({ ...myPagination, pageIndex: 0 });
              } else {
                setOverallGlobalFilter(e.target.value);
                setOverallPagination({ ...overallPagination, pageIndex: 0 });
              }
            }}
            placeholder="Search..."
            className="h-8 w-full"
          />
        </div>
      </div>

        <DataTable
          table={table}
          onRowDoubleClick={handleRowClick}
          rowClassName={(row) =>
            row.isFastProduction
              ? "relative border-l-4 border-l-orange-500 bg-[linear-gradient(90deg,rgba(255,237,213,0.96)_0%,rgba(255,244,230,0.92)_38%,rgba(255,255,255,1)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_34px_-24px_rgba(234,88,12,0.58)] hover:bg-[linear-gradient(90deg,rgba(255,224,178,0.72)_0%,rgba(255,237,213,0.78)_42%,rgba(255,255,255,1)_100%)] dark:border-l-orange-400 dark:bg-[linear-gradient(90deg,rgba(124,45,18,0.5)_0%,rgba(67,20,7,0.28)_36%,rgba(15,23,42,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(251,146,60,0.08),0_18px_38px_-24px_rgba(249,115,22,0.45)] dark:hover:bg-[linear-gradient(90deg,rgba(154,52,18,0.62)_0%,rgba(88,28,12,0.34)_38%,rgba(15,23,42,0.98)_100%)]"
              : undefined
        }
        className="pt-3 px-4"
      >
        {/* 🖥️ DESKTOP FILTERS (Horizontal Layout) */}
        <div className="hidden md:flex justify-between items-end">
          <div className="flex gap-3">
            <ClearInput
              value={activeGlobalFilter}
              onChange={(e) => {
                if (effectiveViewType === "my") {
                  setMyGlobalFilter(e.target.value);
                  setMyPagination({ ...myPagination, pageIndex: 0 });
                } else {
                  setOverallGlobalFilter(e.target.value);
                  setOverallPagination({ ...overallPagination, pageIndex: 0 });
                }
              }}
              placeholder="Search..."
              className="h-8 w-64"
            />

            {showServicingColumn && pendingServicesOnly ? (
              <DataTableMonthFilter
                title="Filter By Month"
                value={servicingMonthFilter}
                onChange={setServicingMonthFilter}
              />
            ) : (
              <DataTableDateFilter
                column={table.getColumn("createdAt")!}
                title="Created At"
                multiple
              />
            )}
            {showPriorityColumn && (
              <PriorityQuickFilter
                value={priorityFilterValue}
                onChange={handlePriorityFilterChange}
              />
            )}
            {normalizedType === "type 10" && (
              <ProductionStatusFilter
                value={productionStatusFilter}
                onChange={handleProductionStatusFilterChange}
              />
            )}
          </div>

          <div className="flex gap-2">
            {/* <DataTableSortList table={table} />
            <DataTableFilterList table={table} /> */}
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </DataTable>
    </div>
  );
}

export default UniversalTable;
