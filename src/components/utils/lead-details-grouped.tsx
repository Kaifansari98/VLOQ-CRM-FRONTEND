"use client";

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

import GroupedSmoothTab from "./grouped-smooth-tab";
import ReadyToDispatchDetails from "../production/ready-to-dispatch/ReadyToDispatchDetails";
import SiteReadinessDetails from "../installation/site-readiness/SiteReadinessDetails";
import { StageId } from "@/types/lead-stage-types";
import SiteReadinessTabs from "../installation/site-readiness/SiteReadinessTabs";



type StatusKey = StageId;

export interface LeadDetailsGroupedProps {
  /** which screen should be active initially; if omitted, we infer from `status` */
  defaultTab?: StageId;
  /** semantic status that also maps to a screen; if provided and defaultTab is missing, we use this */
  status?: StatusKey;
  leadId: number;
  accountId: number;
  /** optional: handle tab changes */
  onChangeTab?: (tabId: StageId) => void;
  /** optional: pass a display name if your screens use it */
  leadName?: string;
  maxVisibleStage?: StageId;
}

const GROUPS = {
  leads: ["details", "measurement", "designing", "booking"] as StageId[],
  project: ["finalMeasurement", "clientdocumentation", "clientApproval"] as StageId[],
  production: ["techcheck", "orderLogin", "production", "readyToDispatch"] as StageId[],
  installation: ["siteReadiness"] as StageId[],
};

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
  maxVisibleStage,
}: LeadDetailsGroupedProps) {
  const initialTab: StageId =
    defaultTab ?? (status ? STATUS_TO_DEFAULT[status] : "details");

  const groups = {
    leads: [
      { id: "details", title: "Lead Details", component: <OpenLeadDetails leadId={leadId} /> },
      { id: "measurement", title: "Site Measurement", component: <SiteMeasurementLeadDetails leadId={leadId} /> },
      { id: "designing", title: "Designing", component: <DesigningLeadsDetails leadId={leadId} /> },
      { id: "booking", title: "Booking", component: <BookingLeadsDetails leadId={leadId} /> },
    ],
    project: [
      { id: "finalMeasurement", title: "Final Measurement", component: <FinalMeasurementLeadDetails leadId={leadId} /> },
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
      { id: "clientApproval", title: "Client Approval", component: <ClientApprovalDetails leadId={leadId} /> },
    ],
    production: [
      {
        id: "techcheck",
        title: "Tech Check",
        component: <TechCheckDetails leadId={leadId} accountId={accountId} name={leadName} />,
      },
      {
        id: "orderLogin",
        title: "Order Login",
        component: <OrderLoginDetails leadId={leadId} accountId={accountId} name={leadName} />,
      },
      {
        id: "production",
        title: "Production Stage",
        component: <LeadDetailsProductionUtil leadId={leadId} accountId={accountId} />,
      },
      {
        id: "readyToDispatch",
        title: "Ready To Dispatch",
        component: (
          <ReadyToDispatchDetails
            leadId={leadId}
            accountId={accountId}
            name={leadName}
          />
        ),
      },
    ],
    installation: [
      {
        id: "siteReadiness",
        title: "Site Readiness",
        component: <SiteReadinessTabs leadId={leadId} accountId={accountId} name={leadName} />,
      },
    ],
  } as const;

  return (
    <GroupedSmoothTab
      groups={groups}
      defaultTabId={initialTab}
      onChange={onChangeTab}
      maxVisibleStage={maxVisibleStage}
    />
  );
}
