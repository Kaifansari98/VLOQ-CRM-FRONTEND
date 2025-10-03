"use client";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import OpenLeadDetails from "@/components/tabScreens/OpenLeadDetails";
import BookingLeadsDetails from "../sales-executive/booking-stage/view-booking-modal";
import SiteMeasurementLeadDetails from "../tabScreens/SiteMeasurementLeadDetails";
import DesigningLeadsDetails from "../tabScreens/DesigningLeadDetails";
import FinalMeasurementLeadDetails from "../tabScreens/FinalMeasurementDetails";
import ViewClientDocumentationModal from "../site-supervisor/client-documentation/view-client-documentation";
import ClientDocumentationDetails from "../site-supervisor/client-documentation/view-client-documentation";

interface LeadDetailsUtilProps {
  status:
    | "details"
    | "measurement"
    | "designing"
    | "booking"
    | "finalMeasurement"
    | "clientdocumentation";
  leadId?: number;
  accountId?: number;
  leadInfo?: any;
  defaultTab?: string;
}

export default function LeadDetailsUtil({
  status,
  leadId,
  accountId,
  leadInfo,
  defaultTab = "details",
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
      title: "Booking Stage",
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
          name={leadInfo?.name}
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
  };

  const visibleTabs = allTabs.filter((tab) =>
    statusFlow[status].includes(tab.id)
  );

  return <SmoothTab items={visibleTabs} defaultTabId={defaultTab} />;
}
