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
  userId: number
): Promise<UiPerformanceSnapshot> => {
  const res = await apiClient.get(
    "/dashboard/sales-executive/performance-snapshot",
    {
      params: { vendor_id: vendorId, user_id: userId },
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
  vendorId: number
): Promise<AdminProjectsOverview> => {
  const res = await apiClient.get("/dashboard/admin/projects-overview", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as AdminProjectsOverview;
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
  overall: number;
}

export const getAdminTotalRevenue = async (
  vendorId: number
): Promise<AdminTotalRevenue> => {
  const res = await apiClient.get("/dashboard/admin/total-revenue", {
    params: { vendor_id: vendorId },
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

export const getAdminStageCounts = async (
  vendorId: number
): Promise<AdminStageCounts> => {
  const res = await apiClient.get("/dashboard/admin/stage-counts", {
    params: { vendor_id: vendorId },
  });
  return res.data.data as AdminStageCounts;
};

// -------------------------------
// 📌 EXPORT AS SINGLE OBJECT (Optional)
// -------------------------------
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
  userId: number
): Promise<UiAvgDaysToBooking> => {
  const res = await apiClient.get(
    "/dashboard/avg-days-to-convert-lead-to-booking",
    { params: { vendor_id: vendorId, user_id: userId } }
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
  userId: number
): Promise<SalesExecutiveStageCounts> => {
  const res = await apiClient.get("/dashboard/sales-executive/stage-counts", {
    params: { vendor_id: vendorId, user_id: userId },
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
  vendorId: number
): Promise<StageData> => {
  const res = await apiClient.get<StageResponse>(
    "/dashboard/admin/all-stage-leads",
    {
      params: { vendor_id: vendorId },
    }
  );

  return res.data.data;
};
