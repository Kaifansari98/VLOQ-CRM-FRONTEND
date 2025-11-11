"use client";

import React from "react";
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
import GroupedSmoothTab from "./grouped-smooth-tab";
import { useAppSelector } from "@/redux/store";
import { StageId } from "@/types/lead-stage-types";

type StatusKey = StageId;

export interface LeadDetailsGroupedProps {
  defaultTab?: StageId;
  status?: StatusKey;
  leadId: number;
  accountId: number;
  onChangeTab?: (tabId: StageId) => void;
  leadName?: string;
  maxVisibleStageGroup?: "leads" | "project" | "production" | "installation"; // 👈 NEW: parent stage control
}

// Define all stage groupings
const GROUPS = {
  leads: ["details", "measurement", "designing", "booking"] as StageId[],
  project: [
    "finalMeasurement",
    "clientdocumentation",
    "clientApproval",
  ] as StageId[],
  production: [
    "techcheck",
    "orderLogin",
    "production",
    "readyToDispatch",
  ] as StageId[],
  installation: ["siteReadiness"] as StageId[],
};

// Define correct group order
const GROUP_ORDER = ["leads", "project", "production", "installation"] as const;

// Default stage for status mapping
const STATUS_TO_DEFAULT: Record<StatusKey, StageId> = {
  details: "details",
  measurement: "measurement",
  designing: "designing",
  booking: "booking",
  finalMeasurement: "finalMeasurement",
  clientdocumentation: "clientdocumentation",
  clientApproval: "clientApproval",
  techcheck: "techcheck",
  orderLogin: "orderLogin",
  production: "production",
  readyToDispatch: "readyToDispatch",
  siteReadiness: "siteReadiness",
};

export default function LeadDetailsGrouped({
  defaultTab,
  status,
  leadId,
  accountId,
  onChangeTab,
  leadName,
  maxVisibleStageGroup = "installation", // 👈 Default = show all
}: LeadDetailsGroupedProps) {
  const initialTab: StageId =
    defaultTab ?? (status ? STATUS_TO_DEFAULT[status] : "details");
  // Map group to components
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
            name={leadName}
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
            accountId={accountId}
            name={leadName}
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
    ],
  } as const;

  // 🔹 Filter groups based on the selected maxVisibleStageGroup
  const visibleGroups = React.useMemo(() => {
    const cutoffIndex = GROUP_ORDER.indexOf(maxVisibleStageGroup);
    const filtered = Object.entries(groups).filter(
      ([key]) => GROUP_ORDER.indexOf(key as any) <= cutoffIndex
    );
    return Object.fromEntries(filtered);
  }, [groups, maxVisibleStageGroup]);

  return (
    <GroupedSmoothTab
      groups={visibleGroups}
      defaultTabId={initialTab}
      onChange={onChangeTab}
    />
  );
}
