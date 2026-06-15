"use client";
import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import OpenLeadDetails from "@/components/tabScreens/OpenLeadDetails";
import BookingLeadsDetails from "@/components/sales-executive/booking-stage/view-booking-modal";
import SiteMeasurementLeadDetails from "@/components/tabScreens/SiteMeasurementLeadDetails";
import DesigningLeadsDetails from "@/components/tabScreens/DesigningLeadDetails";
import FinalMeasurementLeadDetails from "@/components/tabScreens/FinalMeasurementDetails";
import ClientDocumentationDetails from "@/components/site-supervisor/client-documentation/view-client-documentation";
import ClientApprovalDetails from "@/components/site-supervisor/client-approval/client-approval-details";
import TechCheckDetails from "@/components/production/tech-check-stage/TechCheckDetails";
import OrderLoginDetails from "@/components/production/order-login-stage/OrderLoginDetails";
import LeadDetailsProductionUtil from "@/components/production/pre-production-stage/lead-details-production-tabs";
import ReadyToDispatchDetails from "../production/ready-to-dispatch/ReadyToDispatchDetails";
import SiteReadinessTabs from "../installation/site-readiness/SiteReadinessTabs";
import DispatchPlanningDetails from "../installation/dispatch-planning/DispatchPlanningDetails";
import DispatchTabsWrapper from "../installation/dispatch/DispatchTabsWrapper";
import GroupedSmoothTab from "./grouped-smooth-tab";
import { StageId } from "@/types/lead-stage-types";
import UnderInstallationTabsWrapper from "../installation/under-installation/UnderInstallationTabsWrapper";
import FinalHandoverWrapper from "../installation/final-handover/FinalHandoverWrapper";
import ServicingWrapper from "../installation/servicing/ServicingWrapper";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
type GroupKey =
  | "leads"
  | "project"
  | "production"
  | "installation"
  | "servicing";

export interface LeadDetailsGroupedProps {
  defaultTab?: StageId;
  status?: StageId;
  leadId: number;
  accountId: number;
  onChangeTab?: (tabId: StageId) => void;
  leadName?: string;
  maxVisibleStage?: StageId;
  /** 👇 NEW PROP to control visible group range */
  defaultParentTab?: GroupKey;
  techCheckInstanceId?: number | null;
  orderLoginInstanceId?: number | null;
  productionInstanceId?: number | null;
  readyToDispatchInstanceId?: number | null;
  siteReadinessInstanceId?: number | null;
  dispatchPlanningInstanceId?: number | null;
  dispatchInstanceId?: number | null;
  underInstallationInstanceId?: number | null;
  finalHandoverInstanceId?: number | null;
  allowServicingTabFromDeliveredProjects?: boolean;
}

const GROUP_ORDER: GroupKey[] = [
  "leads",
  "project",
  "production",
  "installation",
  "servicing",
];

export default function LeadDetailsGrouped({
  defaultTab,
  status,
  leadId,
  accountId,
  onChangeTab,
  leadName,
  maxVisibleStage,
  defaultParentTab = "installation", // default: show all
  techCheckInstanceId,
  orderLoginInstanceId,
  productionInstanceId,
  readyToDispatchInstanceId,
  siteReadinessInstanceId,
  dispatchPlanningInstanceId,
  dispatchInstanceId,
  underInstallationInstanceId,
  finalHandoverInstanceId,
  allowServicingTabFromDeliveredProjects = false,
}: LeadDetailsGroupedProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: leadResponse } = useLeadById(leadId, vendorId, userId);
  const lead = leadResponse?.data?.lead;
  const servicingSource = searchParams.get("source");
  const showServicingTab =
    pathname?.startsWith("/dashboard/installation/servicing") ||
    servicingSource === "servicing" ||
    (servicingSource === "delivered-projects" &&
      allowServicingTabFromDeliveredProjects);
  const isSmallOrderLead = Boolean(lead?.is_small_order_request);
  const smallOrderRequestSource = lead?.smallOrderRequest?.request_source;
  const groups = {
    leads: [
      {
        id: "details",
        title: "Lead Details",
        component: <OpenLeadDetails leadId={leadId} />,
      },
      {
        id: "measurement",
        title: "Site Measurement",
        component: <SiteMeasurementLeadDetails leadId={leadId} />,
      },
      {
        id: "designing",
        title: "Designing",
        component: <DesigningLeadsDetails leadId={leadId} />,
      },
      {
        id: "booking",
        title: "Booking",
        component: <BookingLeadsDetails leadId={leadId} />,
      },
    ],
    project: [
      {
        id: "finalMeasurement",
        title: "Final Measurement",
        component: <FinalMeasurementLeadDetails leadId={leadId} />,
      },
      {
        id: "clientdocumentation",
        title: "Client Documentation",
        component: (
          <ClientDocumentationDetails
            leadId={leadId}
            accountId={accountId}
           
          />
        ),
      },
      {
        id: "clientApproval",
        title: "Client Approval",
        component: <ClientApprovalDetails leadId={leadId} />,
      },
    ],
    production: [
      {
        id: "techcheck",
        title: "Tech Check",
        component: (
          <TechCheckDetails
            leadId={leadId}
            instanceId={techCheckInstanceId}
          />
        ),
      },
      {
        id: "orderLogin",
        title: "Order Login",
        component: (
          <OrderLoginDetails
            leadId={leadId}
            accountId={accountId}
            name={leadName}
            instanceId={orderLoginInstanceId}
          />
        ),
      },
      {
        id: "production",
        title: "Production Stage",
        component: (
          <LeadDetailsProductionUtil
            leadId={leadId}
            accountId={accountId}
            instanceId={productionInstanceId}
          />
        ),
      },
      {
        id: "readyToDispatch",
        title: "Ready To Dispatch",
        component: (
          <ReadyToDispatchDetails
            leadId={leadId}
            accountId={accountId}
            instanceId={readyToDispatchInstanceId}
          />
        ),
      },
    ],
    installation: [
      {
        id: "siteReadiness",
        title: "Site Readiness",
        component: (
          <SiteReadinessTabs
            leadId={leadId}
            accountId={accountId}
            name={leadName}
            instanceId={siteReadinessInstanceId}
          />
        ),
      },
      {
        id: "dispatchPlanning",
        title: "Dispatch Planning",
        component: (
          <DispatchPlanningDetails leadId={leadId} accountId={accountId} instanceId={dispatchPlanningInstanceId} />
        ),
      },
      {
        id: "dispatch",
        title: "Dispatch",
        component: (
          <DispatchTabsWrapper
            leadId={leadId}
            accountId={accountId}
            name={leadName}
            instanceId={dispatchInstanceId}
          />
        ),
      },
      {
        id: "underInstallation",
        title: "Under Installation",
        component: (
          <UnderInstallationTabsWrapper
            leadId={leadId}
            accountId={accountId}
            name={leadName}
            instanceId={underInstallationInstanceId}
          />
        ),
      },
      {
        id: "finalHandover",
        title: "Final Handover",
        component: (
          <FinalHandoverWrapper
            leadId={leadId}
            accountId={accountId}
            instanceId={finalHandoverInstanceId}
          />
        ),
      },
    ],
    servicing: showServicingTab
      ? [
          {
            id: "servicing" as StageId,
            title: "Servicing",
            component: <ServicingWrapper leadId={leadId} />,
          },
        ]
      : [],
  } as const;

  // ✅ Filter based on defaultParentTab
  const stageOrder: StageId[] = [
    "details",
    "measurement",
    "designing",
    "booking",
    "finalMeasurement",
    "clientdocumentation",
    "clientApproval",
    "techcheck",
    "orderLogin",
    "production",
    "readyToDispatch",
    "siteReadiness",
    "dispatchPlanning",
    "dispatch",
    "underInstallation",
    "finalHandover",
    "servicing",
  ];

  const visibleGroups = React.useMemo(() => {
    const smallOrderAllowedTabs = new Set<StageId>([
      "details",
      "orderLogin",
      "production",
      "dispatchPlanning",
      "dispatch",
      ...(smallOrderRequestSource === "final_handover"
        ? (["underInstallation"] as StageId[])
        : []),
    ]);

    const effectiveParentTab =
      showServicingTab && defaultParentTab === "installation"
        ? "servicing"
        : defaultParentTab;

    const allowedKeys = GROUP_ORDER.slice(
      0,
      GROUP_ORDER.indexOf(effectiveParentTab) + 1
    );

    const filtered = {} as Record<
      GroupKey,
      { id: StageId; title: string; component: React.ReactNode }[]
    >;

    for (const key of allowedKeys) {
      const stages = groups[key];

      // agar ye last allowed group hai to andar se cutoff lagao
      if (key === effectiveParentTab && status) {
        const effectiveStatus =
          showServicingTab && status === "finalHandover" ? "servicing" : status;
        const maxIndex = stageOrder.indexOf(effectiveStatus);
        filtered[key] = stages.filter((s) => {
          const withinStatusRange = stageOrder.indexOf(s.id) <= maxIndex;
          const allowedForSmallOrder = isSmallOrderLead
            ? smallOrderAllowedTabs.has(s.id)
            : true;

          return withinStatusRange && allowedForSmallOrder;
        });
      } else {
        filtered[key] = stages.filter((s) =>
          isSmallOrderLead ? smallOrderAllowedTabs.has(s.id) : true,
        );
      }
    }

    return filtered;
  }, [
    defaultParentTab,
    isSmallOrderLead,
    showServicingTab,
    smallOrderRequestSource,
    status,
  ]);

  React.useEffect(() => {
    if (status && !stageOrder.includes(status)) {
      console.warn("[LeadDetailsGrouped] Status missing from stageOrder", {
        status,
        stageOrder,
        leadId,
        accountId,
        pathname,
      });
    }

    const visibleTabIds = Object.values(visibleGroups).flatMap((group) =>
      group.map((item) => item.id),
    );

    console.info("[LeadDetailsGrouped] resolved tabs", {
      leadId,
      accountId,
      pathname,
      defaultTab,
      status,
      defaultParentTab,
      visibleTabIds,
    });
  }, [
    accountId,
    defaultParentTab,
    defaultTab,
    leadId,
    pathname,
    status,
    visibleGroups,
  ]);

  const tabParam = searchParams.get("tab") as StageId | null;
  const resolvedTab =
    tabParam && stageOrder.includes(tabParam) ? tabParam : undefined;
  const visibleTabIds = Object.values(visibleGroups).flatMap((group) =>
    group.map((item) => item.id),
  );
  const preferredInitialTab =
    resolvedTab ?? defaultTab ?? (status ? status : "details");
  const initialTab: StageId = visibleTabIds.includes(preferredInitialTab)
    ? preferredInitialTab
    : (visibleTabIds[0] ?? "details");

  return (
    <GroupedSmoothTab
      groups={visibleGroups}
      defaultTabId={initialTab}
      onChange={onChangeTab}
      maxVisibleStage={maxVisibleStage}
    />
  );
}
