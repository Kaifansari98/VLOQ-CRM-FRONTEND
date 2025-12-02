"use client";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import OpenLeadDetails from "@/components/tabScreens/OpenLeadDetails";
import BookingLeadsDetails from "../sales-executive/booking-stage/view-booking-modal";
import SiteMeasurementLeadDetails from "../tabScreens/SiteMeasurementLeadDetails";
import DesigningLeadsDetails from "../tabScreens/DesigningLeadDetails";
import FinalMeasurementLeadDetails from "../tabScreens/FinalMeasurementDetails";
import ClientDocumentationDetails from "../site-supervisor/client-documentation/view-client-documentation";
import ClientApprovalDetails from "../site-supervisor/client-approval/client-approval-details";
import TechCheckDetails from "../production/tech-check-stage/TechCheckDetails";
import OrderLoginDetails from "../production/order-login-stage/OrderLoginDetails";
import LeadDetailsProductionUtil from "../production/pre-production-stage/lead-details-production-tabs";

interface LeadDetailsUtilProps {
  status:
    | "details"
    | "measurement"
    | "designing"
    | "booking"
    | "finalMeasurement"
    | "clientdocumentation"
    | "clientApproval"
    | "techcheck"
    | "orderLogin"
    | "production";
  leadId?: number;
  accountId?: number;
  leadInfo?: any;
  defaultTab?: string;
  onlyThisTab?: string;
  forceDefaultTab?: string;
}

export default function LeadDetailsUtil({
  status,
  leadId,
  accountId,
  leadInfo,
  defaultTab = "details",
  onlyThisTab,
  forceDefaultTab
}: LeadDetailsUtilProps) {
  const allTabs = [
    {
      id: "details",
      title: "Details",
      color: "bg-zinc-900 hover:bg-zinc-800",
      cardContent: <OpenLeadDetails leadId={leadId ?? 0} />,
    },
    {
      id: "measurement",
      title: "Site Measurement",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <SiteMeasurementLeadDetails leadId={leadId ?? 0} />,
    },
    {
      id: "designing",
      title: "Designing Stage",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <DesigningLeadsDetails leadId={leadId ?? 0} />,
    },
    {
      id: "booking",
      title: "Booking Done",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <BookingLeadsDetails leadId={leadId ?? 0} />,
    },
    {
      id: "finalMeasurement",
      title: "Final Measurement",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <FinalMeasurementLeadDetails leadId={leadId ?? 0} />,
    },
    {
      id: "clientdocumentation",
      title: "Client Documentation",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <ClientDocumentationDetails
          leadId={leadId ?? 0}
          accountId={accountId ?? 0}
      
        />
      ),
    },
    {
      id: "clientApproval",
      title: "Client Approval",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: <ClientApprovalDetails leadId={leadId ?? 0} />,
    },
    {
      id: "techcheck",
      title: "Tech Check",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <TechCheckDetails
          leadId={leadId ?? 0}

        />
      ),
    },
    {
      id: "orderLogin",
      title: "Order Login",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <OrderLoginDetails
          leadId={leadId ?? 0}
          accountId={accountId ?? 0}
          name={leadInfo?.name}
          forceDefaultTab={forceDefaultTab} // ⭐ forward the control
        />
      ),
    },
    {
      id: "production",
      title: "Production Stage",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <LeadDetailsProductionUtil
          leadId={leadId ?? 0}
          accountId={accountId ?? 0}
        />
      ),
    },
  ];

  const statusFlow: Record<LeadDetailsUtilProps["status"], string[]> = {
    details: ["details"],
    measurement: ["details", "measurement"],
    designing: ["details", "measurement", "designing"],
    booking: ["details", "measurement", "designing", "booking"],
    finalMeasurement: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
    ],
    clientdocumentation: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
      "clientdocumentation",
    ],
    clientApproval: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
      "clientdocumentation",
      "clientApproval",
    ],
    techcheck: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
      "clientdocumentation",
      "clientApproval",
      "techcheck",
    ],
    orderLogin: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
      "clientdocumentation",
      "clientApproval",
      "techcheck",
      "orderLogin",
    ],
    production: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
      "clientdocumentation",
      "clientApproval",
      "techcheck",
      "orderLogin",
      "production", // ✅ new
    ],
  };

  const visibleTabs = allTabs.filter((tab) =>
    statusFlow[status].includes(tab.id)
  );

  // Single Tab Force Rendering
  let finalTabs = visibleTabs;

  if (onlyThisTab) {
    finalTabs = visibleTabs.filter((t) => t.id === onlyThisTab);
  }

  return <SmoothTab items={finalTabs} defaultTabId={defaultTab} />;
}
