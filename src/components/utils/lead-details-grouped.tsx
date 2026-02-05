"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
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

type GroupKey = "leads" | "project" | "production" | "installation";

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
}

const GROUP_ORDER: GroupKey[] = [
  "leads",
  "project",
  "production",
  "installation",
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
}: LeadDetailsGroupedProps) {
  const searchParams = useSearchParams();
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
          />
        ),
      },
      {
        id: "production",
        title: "Production Stage",
        component: (
          <LeadDetailsProductionUtil leadId={leadId} accountId={accountId} />
        ),
      },
      {
        id: "readyToDispatch",
        title: "Ready To Dispatch",
        component: (
          <ReadyToDispatchDetails
            leadId={leadId}
            accountId={accountId}
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
          />
        ),
      },
      {
        id: "dispatchPlanning",
        title: "Dispatch Planning",
        component: (
          <DispatchPlanningDetails leadId={leadId} accountId={accountId} />
        ), // ✅ new component
      },
      {
        id: "dispatch",
        title: "Dispatch",
        component: (
          <DispatchTabsWrapper
            leadId={leadId}
            accountId={accountId}
            name={leadName}
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
          />
        ),
      },
    ],
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
  ];

  const visibleGroups = React.useMemo(() => {
    const allowedKeys = GROUP_ORDER.slice(
      0,
      GROUP_ORDER.indexOf(defaultParentTab) + 1
    );

    const filtered = {} as Record<
      GroupKey,
      { id: StageId; title: string; component: React.ReactNode }[]
    >;

    for (const key of allowedKeys) {
      const stages = groups[key];

      // agar ye last allowed group hai to andar se cutoff lagao
      if (key === defaultParentTab && status) {
        const maxIndex = stageOrder.indexOf(status);
        filtered[key] = stages.filter(
          (s) => stageOrder.indexOf(s.id) <= maxIndex
        );
      } else {
        filtered[key] = [...stages];
      }
    }

    return filtered;
  }, [defaultParentTab, status]);

  const tabParam = searchParams.get("tab") as StageId | null;
  const resolvedTab =
    tabParam && stageOrder.includes(tabParam) ? tabParam : undefined;
  const initialTab: StageId =
    resolvedTab ?? defaultTab ?? (status ? status : "details");

  return (
    <GroupedSmoothTab
      groups={visibleGroups}
      defaultTabId={initialTab}
      onChange={onChangeTab}
      maxVisibleStage={maxVisibleStage}
    />
  );
}
