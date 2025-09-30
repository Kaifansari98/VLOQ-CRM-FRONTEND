"use client";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import OpenLeadDetails from "@/components/tabScreens/OpenLeadDetails";
import BookingLeadsDetails from "../sales-executive/booking-stage/view-booking-modal";
import SiteMeasurementLeadDetails from "../tabScreens/SiteMeasurementLeadDetails";
import DesigningLeadsDetails from "../tabScreens/DesigningLeadDetails";

interface LeadDetailsUtilProps {
  status:
    | "details"
    | "measurement"
    | "designing"
    | "booking"
    | "finalmeasurement"
    | "clientdocumentation";
  leadId?: number;
  leadInfo?: any;
}

export default function LeadDetailsUtil({
  status,
  leadId,
  leadInfo,
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
      id: "finalmeasurement",
      title: "Final Measurement",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            Final measurement data goes here.
          </p>
        </div>
      ),
    },
    {
      id: "clientdocumentation",
      title: "Client Documentation",
      color: "bg-zinc-900 hover:bg-gray-600",
      cardContent: (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Client docs go here.</p>
        </div>
      ),
    },
  ];

  const statusFlow: Record<LeadDetailsUtilProps["status"], string[]> = {
    details: ["details"],
    measurement: ["details", "measurement"],
    designing: ["details", "measurement", "designing"],
    booking: ["details", "measurement", "designing", "booking"],
    finalmeasurement: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalmeasurement",
    ],
    clientdocumentation: [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalmeasurement",
      "clientdocumentation",
    ],
  };

  const visibleTabs = allTabs.filter((tab) =>
    statusFlow[status].includes(tab.id)
  );

  return <SmoothTab items={visibleTabs} defaultTabId="details" />;
}