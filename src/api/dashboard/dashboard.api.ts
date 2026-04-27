import { apiClient } from "@/lib/apiClient";

// -------------------------------
// 📌 TYPES
// -------------------------------

// 1️⃣ Sales Executive Task Stats
export interface ApiSalesExecutiveTaskStats {
  today: number;
  upcoming: number;
  overdue: number;
  isAdmin?: boolean;
}

export interface UiSalesExecutiveTaskStats {
  today: number;
  upcoming: number;
  overdue: number;
  isAdmin: boolean;
}

// 2️⃣ Performance Snapshot
export interface ApiPerformanceSnapshot {
  isAdmin: boolean;
  totalLeadsAssigned: number;
  totalCompletedLeads: number;
  totalPendingLeads: number;

  bookedToday: number;
  bookedThisWeek: number[];
  bookedThisMonth: number[];
  bookedThisYear: number[];
  bookedOverall: number;
  bookedThisWeekTotal: number;
  bookedThisMonthTotal: number;
  bookedThisYearTotal: number;

  // NEW booking value fields
  bookingValueThisWeek: number;
  bookingValueThisMonth: number;
  bookingValueThisYear: number;
  bookingValueOverall: number;
  bookingValueThisWeekArray: number[];
  bookingValueThisMonthArray: number[];
  bookingValueThisYearArray: number[];

  avgDaysToBooking: {
    avgDays: number;
    readable: {
      days: number;
      hours: number;
      minutes: number;
    };
  };
}

// Lead status counts (overall or my leads)
export interface LeadStatusCounts {
  total_open_leads: number;
  total_initial_site_measurement_leads: number;
  total_designing_stage_leads: number;
  total_booking_stage_leads: number;
  total_final_measurement_leads: number;
  total_client_documentation_leads: number;
  total_client_approval_leads: number;
  total_tech_check_leads: number;
  total_order_login_leads: number;
  total_production_stage_leads: number;
  total_ready_to_dispatch_leads: number;
  total_site_readiness_stage_leads: number;
  total_dispatch_planning_stage_leads: number;
  total_dispatch_stage_leads: number;
  total_under_installation_stage_leads: number;
  total_final_handover_stage_leads: number;
  total_project_completed_stage_leads: number;
}

export interface LeadStatusCountsResponse {
  mode: "overall_leads" | "my_leads";
  data: LeadStatusCounts;
  fromCache?: boolean;
}

export type UiPerformanceSnapshot = ApiPerformanceSnapshot;

// 3️⃣ Lead Status Wise Counts (Type 1–16)
export interface ApiLeadStatusCounts {
  [key: string]: number;
}

export interface UiLeadStatusCounts {
  total_open_leads: number;
  total_initial_site_measurement_leads: number;
  total_designing_stage_leads: number;
  total_booking_stage_leads: number;
  total_final_measurement_leads: number;
  total_client_documentation_leads: number;
  total_client_approval_leads: number;
  total_tech_check_leads: number;
  total_order_login_leads: number;
  total_production_stage_leads: number;
  total_ready_to_dispatch_leads: number;
  total_site_readiness_stage_leads: number;
  total_dispatch_planning_stage_leads: number;
  total_dispatch_stage_leads: number;
  total_under_installation_stage_leads: number;
  total_final_handover_stage_leads: number;
  total_project_completed_stage_leads: number;
}

// -------------------------------
// 📌 API FUNCTIONS
// -------------------------------

export const getSalesExecutiveTaskStats = async (
  vendorId: number,
  userId: number
): Promise<UiSalesExecutiveTaskStats> => {
  const res = await apiClient.get("/dashboard/sales-executive/tasks", {
    params: { vendor_id: vendorId, user_id: userId },
  });

  const data: ApiSalesExecutiveTaskStats = res.data.data;

  return {
    today: data.today,
    upcoming: data.upcoming,
    overdue: data.overdue,
    isAdmin: !!data.isAdmin,
  };
};

export const getPerformanceSnapshot = async (
  vendorId: number,
  userId: number,
  franchiseId?: number
): Promise<UiPerformanceSnapshot> => {
  const res = await apiClient.get(
    "/dashboard/sales-executive/performance-snapshot",
    {
      params: { vendor_id: vendorId, user_id: userId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
    }
  );

  return res.data.data as UiPerformanceSnapshot;
};

export const getLeadStatusWiseCounts = async (
  vendorId: number,
  userId?: number
): Promise<UiLeadStatusCounts> => {
  const res = await apiClient.get("/dashboard/lead-status-wise-counts", {
    params: { vendor_id: vendorId, user_id: userId },
  });

  return res.data.data as UiLeadStatusCounts;
};

export const getLeadStatusCounts = async (
  vendorId: number,
  userId?: number
): Promise<LeadStatusCountsResponse> => {
  const res = await apiClient.get("/dashboard/lead-status-wise-counts", {
    params: { vendor_id: vendorId, user_id: userId },
  });
  return res.data as LeadStatusCountsResponse;
};

// Admin projects overview
export interface AdminProjectsOverview {
  thisWeekArray: number[];
  thisMonthArray: number[];
  thisYearArray: number[];
  thisWeekTotal: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  overall: number;
}

export const getAdminProjectsOverview = async (
  vendorId: number,
  franchiseId?: number
): Promise<AdminProjectsOverview> => {
  const res = await apiClient.get("/dashboard/admin/projects-overview", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as AdminProjectsOverview;
};

export interface AdminCompletedOverview {
  thisWeekArray: number[];
  thisMonthArray: number[];
  thisYearArray: number[];
  thisWeekTotal: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  overall: number;
}

export const getAdminCompletedOverview = async (
  vendorId: number,
  franchiseId?: number
): Promise<AdminCompletedOverview> => {
  const res = await apiClient.get("/dashboard/admin/completed-overview", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as AdminCompletedOverview;
};

export interface AdminLostApprovalOverview {
  thisWeekArray: number[];
  thisMonthArray: number[];
  thisYearArray: number[];
  thisWeekTotal: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  overall: number;
}

export const getAdminLostApprovalOverview = async (
  vendorId: number,
  franchiseId?: number
): Promise<AdminLostApprovalOverview> => {
  const res = await apiClient.get("/dashboard/admin/lost-approval-overview", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as AdminLostApprovalOverview;
};

// Admin orders in pipeline
export interface OrdersInPipelineBucket {
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  overall: number;
}

export interface AdminOrdersInPipeline {
  onGoing: OrdersInPipelineBucket;
  onHold: OrdersInPipelineBucket;
  lostApproval: OrdersInPipelineBucket;
  lost: OrdersInPipelineBucket;
}

export const getAdminOrdersInPipeline = async (
  vendorId: number
): Promise<AdminOrdersInPipeline> => {
  const res = await apiClient.get("/dashboard/admin/orders-in-pipeline", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as AdminOrdersInPipeline;
};

// Admin total revenue
export interface AdminTotalRevenue {
  thisWeekArray: number[];
  thisMonthArray: number[];
  thisYearArray: number[];
  thisWeekTotal: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  lastSixMonthsAvg: number;
  overall: number;
}

export const getAdminTotalRevenue = async (
  vendorId: number,
  franchiseId?: number
): Promise<AdminTotalRevenue> => {
  const res = await apiClient.get("/dashboard/admin/total-revenue", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as AdminTotalRevenue;
};

// Admin stage counts
export interface AdminStageCounts {
  leads: number;
  leadsAmount: number;
  project: number;
  projectAmount: number;
  production: number;
  productionAmount: number;
  installation: number;
  installationAmount: number;
}

export interface FranchiseLeadCount {
  franchise_id: number;
  name: string;
  code: string;
  leads: number;
}

export interface FranchisePerformanceRow {
  franchise_id: number;
  name: string;
  leads: number;
  closures: number;
  revenue: number;
}

export interface AvgDaysPerStage {
  lead: number;
  project: number;
  production: number;
  installation: number;
}

export const getAvgDaysPerStage = async (
  vendorId: number,
  franchiseId?: number
): Promise<AvgDaysPerStage> => {
  const res = await apiClient.get("/dashboard/admin/avg-days-per-stage", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as AvgDaysPerStage;
};

export const getFranchisePerformance = async (
  vendorId: number
): Promise<FranchisePerformanceRow[]> => {
  const res = await apiClient.get("/dashboard/admin/franchise-performance", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as FranchisePerformanceRow[];
};

export const getOverdueProjectsCount = async (
  vendorId: number
): Promise<{ count: number }> => {
  const res = await apiClient.get("/dashboard/admin/overdue-projects-count", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as { count: number };
};

export const getLeadsByFranchise = async (
  vendorId: number
): Promise<FranchiseLeadCount[]> => {
  const res = await apiClient.get("/dashboard/admin/leads-by-franchise", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as FranchiseLeadCount[];
};

export const getLeadsThisMonth = async (
  vendorId: number
): Promise<{ count: number }> => {
  const res = await apiClient.get("/dashboard/admin/leads-this-month", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as { count: number };
};

export interface OverdueInstallation {
  id: number;
  lead_code: string | null;
  name: string;
  account_id: number | null;
  franchise_name: string | null;
  expected_end: string;
  stage_tag: string | null;
  instance_id: number | null;
  instance_title: string | null;
  quantity_index: number | null;
  days_overdue: number;
}

export const getOverdueInstallations = async (
  vendorId: number,
  franchiseId?: number
): Promise<OverdueInstallation[]> => {
  const res = await apiClient.get("/dashboard/admin/overdue-installations", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as OverdueInstallation[];
};

export interface OverdueProduction {
  id: number;
  lead_code: string | null;
  name: string;
  account_id: number | null;
  franchise_name: string | null;
  client_required_date: string;
  expected_ready_date: string;
  stage_tag: string | null;
  instance_id: number | null;
  instance_title: string | null;
  quantity_index: number | null;
  days_overdue: number;
}

export const getOverdueProductionCount = async (
  vendorId: number
): Promise<{ count: number }> => {
  const res = await apiClient.get("/dashboard/admin/overdue-production-count", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as { count: number };
};

export const getOverdueProduction = async (
  vendorId: number,
  franchiseId?: number
): Promise<OverdueProduction[]> => {
  const res = await apiClient.get("/dashboard/admin/overdue-production", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as OverdueProduction[];
};

export const getActiveFranchiseeCount = async (
  vendorId: number
): Promise<{ count: number }> => {
  const res = await apiClient.get("/dashboard/admin/active-franchisee-count", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as { count: number };
};

export const getAdminStageCounts = async (
  vendorId: number,
  franchiseId?: number
): Promise<AdminStageCounts> => {
  const res = await apiClient.get("/dashboard/admin/stage-counts", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as AdminStageCounts;
};

export interface PriorityLeadCounts {
  open:      { high: number; medium: number; low: number };
  ism:       { high: number; medium: number; low: number };
  designing: { high: number; medium: number; low: number };
}

export const getPriorityLeadCounts = async (
  vendorId: number,
  franchiseId?: number
): Promise<PriorityLeadCounts> => {
  const res = await apiClient.get("/dashboard/admin/priority-leads", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as PriorityLeadCounts;
};

export interface LostApprovalLead {
  id: number;
  lead_code: string;
  name: string;
  contact: string;
  furniture_type: string;
  sales_executive: string;
  priority: string;
  account_id: number;
}

export const getAdminLostApprovalLeads = async (
  vendorId: number,
  franchiseId?: number
): Promise<LostApprovalLead[]> => {
  const res = await apiClient.get("/dashboard/admin/lost-approval-leads", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as LostApprovalLead[];
};

export interface AdminTaskOverviewRow {
  id: number;
  lead_code: string;
  sales_executive: string;
  task_type: string;
  status: "open" | "in_progress" | "completed";
  due_date: string;
}

export interface AdminTaskOverviewResponse {
  data: AdminTaskOverviewRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminTaskOverviewParams {
  franchiseId?: number;
  salesExecutiveId?: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  overview?: string;
}

export const getAdminTaskOverview = async (
  vendorId: number,
  params: AdminTaskOverviewParams = {}
): Promise<AdminTaskOverviewResponse> => {
  const res = await apiClient.get("/dashboard/admin/task-overview", {
    params: {
      vendor_id: vendorId,
      ...(params.franchiseId ? { franchise_id: params.franchiseId } : {}),
      ...(params.salesExecutiveId ? { sales_executive_id: params.salesExecutiveId } : {}),
      ...(params.page ? { page: params.page } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status !== "all" ? { status: params.status } : {}),
      ...(params.overview && params.overview !== "all" ? { overview: params.overview } : {}),
    },
  });
  return res.data.data as AdminTaskOverviewResponse;
};

// -------------------------------
// 📌 EXPORT AS SINGLE OBJECT (Optional)
// -------------------------------
export const getSiteSupervisorAvgDaysToInstallation = async (
  vendorId: number,
  userId: number
): Promise<UiAvgDaysToBooking> => {
  const res = await apiClient.get("/dashboard/site-supervisor/avg-days-to-installation", {
    params: { vendor_id: vendorId, user_id: userId },
  });
  return res.data.data as UiAvgDaysToBooking;
};

export const DashboardApi = {
  getSalesExecutiveTaskStats,
  getPerformanceSnapshot,
  getLeadStatusWiseCounts,
};

// Avg days to convert lead to booking
export interface ApiAvgDaysToBooking {
  avgDays: number;
  readable: { days: number; hours: number; minutes: number };
}
export type UiAvgDaysToBooking = ApiAvgDaysToBooking;

export const getAvgDaysToConvertLeadToBooking = async (
  vendorId: number,
  userId: number,
  franchiseId?: number
): Promise<UiAvgDaysToBooking> => {
  const res = await apiClient.get(
    "/dashboard/avg-days-to-convert-lead-to-booking",
    { params: { vendor_id: vendorId, user_id: userId, ...(franchiseId ? { franchise_id: franchiseId } : {}) } }
  );
  return res.data.data as UiAvgDaysToBooking;
};

// Stage counts
export interface SalesExecutiveStageCounts {
  [key: string]: number | undefined;
  openLead: number;
  ismLead: number;
  designing: number;
  bookingDone: number;
  clientDocumentation: number;
  clientApproval: number;
  techCheck: number;
  readyToDispatch: number;
  dispatchPlanning: number;
}

// Stage leads (minimal)
export interface SalesExecutiveStageLead {
  id: number;
  lead_code: string | null;
  account_id: number | null;
  name: string;
}

export interface SalesExecutiveStageLeads {
  openLead: SalesExecutiveStageLead[];
  ismLead: SalesExecutiveStageLead[];
  designing: SalesExecutiveStageLead[];
  bookingDone: SalesExecutiveStageLead[];
  clientDocumentation: SalesExecutiveStageLead[];
  clientApproval: SalesExecutiveStageLead[];
  techCheck: SalesExecutiveStageLead[];
  readyToDispatch: SalesExecutiveStageLead[];
  dispatchPlanning: SalesExecutiveStageLead[];
}

export const getSalesExecutiveStageCounts = async (
  vendorId: number,
  userId: number,
  franchiseId?: number
): Promise<SalesExecutiveStageCounts> => {
  const res = await apiClient.get("/dashboard/sales-executive/stage-counts", {
    params: { vendor_id: vendorId, user_id: userId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as SalesExecutiveStageCounts;
};

export const getSalesExecutiveStageLeads = async (
  vendorId: number,
  userId: number
): Promise<SalesExecutiveStageLeads> => {
  const res = await apiClient.get("/dashboard/sales-executive/stage-leads", {
    params: { vendor_id: vendorId, user_id: userId },
  });
  return res.data.data as SalesExecutiveStageLeads;
};

export interface LeadStageItem {
  id: number;
  lead_code: string;
  account_id: number;
  name: string;
}

export interface StageData {
  openStage: LeadStageItem[];
  initialSiteMeasurementStage: LeadStageItem[];
  designingStage: LeadStageItem[];
  bookingStage: LeadStageItem[];
  finalSiteMeasurementStage: LeadStageItem[];
  clientDocumentationStage: LeadStageItem[];
  clientApprovalStage: LeadStageItem[];
  techCheckStage: LeadStageItem[];
  orderLoginStage: LeadStageItem[];
  productionStage: LeadStageItem[];
  readyToDispatchStage: LeadStageItem[];
  siteReadinessStage: LeadStageItem[];
  dispatchPlanningStage: LeadStageItem[];
  dispatchStage: LeadStageItem[];
  underInstallationStage: LeadStageItem[];
  finalHandoverStage: LeadStageItem[];
  projectCompletedStage: LeadStageItem[];
}

export interface StageResponse {
  success: boolean;
  data: StageData;
}

export const addPaymentLeads = async (
  vendorId: number,
  userId: number
): Promise<StageData> => {
  const res = await apiClient.get<StageResponse>(
    "/dashboard/sales-executive/post-booking-stage-leads",
    {
      params: { vendor_id: vendorId, user_id: userId },
    }
  );

  return res.data.data;
};

// Activity status counts (onHold, lostApproval, lost)
export interface SalesExecutiveActivityStatusCounts {
  onHold: number;
  lostApproval: number;
  lost: number;
}

export const getSalesExecutiveActivityStatusCounts = async (
  vendorId: number,
  userId: number
): Promise<SalesExecutiveActivityStatusCounts> => {
  const res = await apiClient.get(
    "/dashboard/sales-executive/activity-status-counts",
    {
      params: { vendor_id: vendorId, user_id: userId },
    }
  );

  return res.data.data as SalesExecutiveActivityStatusCounts;
};

export const getDashboardAllLeads = async (
  vendorId: number,
  userId: number
): Promise<StageData> => {
  const res = await apiClient.get<StageResponse>(
    "/dashboard/sales-executive/all-stage-leads",
    {
      params: { vendor_id: vendorId, user_id: userId },
    }
  );

  return res.data.data;
};

export const getAdminDashboardAllLeads = async (
  vendorId: number,
  franchiseId?: number
): Promise<StageData> => {
  const res = await apiClient.get<StageResponse>(
    "/dashboard/admin/all-stage-leads",
    {
      params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
    }
  );

  return res.data.data;
};

export interface StageWiseCount {
  tag: string;
  type: string;
  count: number;
}

export const getStageWiseCounts = async (
  vendorId: number,
  franchiseId?: number
): Promise<StageWiseCount[]> => {
  const res = await apiClient.get("/dashboard/admin/stage-wise-counts", {
    params: { vendor_id: vendorId, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as StageWiseCount[];
};

export interface FranchiseLead {
  id: number;
  lead_code: string | null;
  name: string;
  franchise_name?: string | null;
  account_id: number | null;
  stage_tag: string | null;
  instance_id: number | null;
}

export const getFranchiseLeads = async (
  vendorId: number,
  franchiseId: number
): Promise<FranchiseLead[]> => {
  const res = await apiClient.get("/dashboard/admin/franchise-leads", {
    params: { vendor_id: vendorId, franchise_id: franchiseId },
  });
  return res.data.data as FranchiseLead[];
};

export const getStageLeads = async (
  vendorId: number,
  tag: string,
  franchiseId?: number
): Promise<FranchiseLead[]> => {
  const res = await apiClient.get("/dashboard/admin/stage-leads", {
    params: { vendor_id: vendorId, tag, ...(franchiseId ? { franchise_id: franchiseId } : {}) },
  });
  return res.data.data as FranchiseLead[];
};
