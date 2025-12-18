"use client";

import { useState } from "react";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import OpenLeadDetails from "../tabScreens/OpenLeadDetails";
import SiteMeasurementLeadDetails from "../tabScreens/SiteMeasurementLeadDetails";
import DesigningLeadsDetails from "../tabScreens/DesigningLeadDetails";
import FinalMeasurementLeadDetails from "../tabScreens/FinalMeasurementDetails";
import ClientDocumentationDetails from "../site-supervisor/client-documentation/view-client-documentation";
import ClientApprovalDetails from "../site-supervisor/client-approval/client-approval-details";
import BookingLeadsDetails from "../sales-executive/booking-stage/view-booking-modal";

/* ---- imports unchanged ---- */

interface LeadDetailsUtilProps {
  status: string;
  leadId?: number;
  accountId?: number;
  leadInfo?: unknown;
  defaultTab?: string;
  onlyThisTab?: string;
}

export default function LeadDetailsUtil({
  status,
  leadId,
  accountId,
  leadInfo,
  defaultTab = "details",
  onlyThisTab,
}: LeadDetailsUtilProps) {
  const [mobileTab, setMobileTab] = useState(defaultTab);

  const allTabs = [
    {
      id: "details",
      title: "Details",
      color: "bg-zinc-900",
      cardContent: <OpenLeadDetails leadId={leadId ?? 0} />,
    },
    {
      id: "measurement",
      title: "Site Measurement",
      color: "bg-zinc-900",
      cardContent: <SiteMeasurementLeadDetails leadId={leadId ?? 0} />,
    },
    {
      id: "designing",
      title: "Designing Stage",
      color: "bg-zinc-900",
      cardContent: <DesigningLeadsDetails leadId={leadId ?? 0} />,
    },
    {
      id: "booking",
      title: "Booking Done",
      color: "bg-zinc-900",
      cardContent: <BookingLeadsDetails leadId={leadId ?? 0} />,
    },
    {
      id: "finalMeasurement",
      title: "Final Measurement",
      color: "bg-zinc-900",
      cardContent: <FinalMeasurementLeadDetails leadId={leadId ?? 0} />,
    },
    {
      id: "clientdocumentation",
      title: "Client Documentation",
      color: "bg-zinc-900",
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
      color: "bg-zinc-900",
      cardContent: <ClientApprovalDetails leadId={leadId ?? 0} />,
    },
  ];

  const statusFlow: Record<string, string[]> = {
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
  };

  const visibleTabs = allTabs.filter((tab) =>
    statusFlow[status].includes(tab.id)
  );

  const finalTabs = onlyThisTab
    ? visibleTabs.filter((t) => t.id === onlyThisTab)
    : visibleTabs;

  const selectedTab = finalTabs.find((t) => t.id === mobileTab);

  /* ---------------- MOBILE GROUPING ---------------- */
  const leadTabs = ["details", "measurement", "designing", "booking"];
  const projectTabs = [
    "finalMeasurement",
    "clientdocumentation",
    "clientApproval",
  ];

  const leadOptions = finalTabs.filter((t) => leadTabs.includes(t.id));
  const projectOptions = finalTabs.filter((t) => projectTabs.includes(t.id));

  const shouldShowDropdown = leadOptions.length + projectOptions.length > 1;

  return (
    <>
      {/* ================= MOBILE DROPDOWN ================= */}
      {/* ================= MOBILE DROPDOWN ================= */}
      <div className="block md:hidden mb-3">
        {shouldShowDropdown && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-content justify-between flex gap-2 items-center"
              >
                <span className="flex-1 text-left truncate font-medium">
                  {selectedTab?.title}
                </span>
                <ChevronDown size={16} className="flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64" align="start">
              {/* -------- LEADS -------- */}
              {leadOptions.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Leads
                  </DropdownMenuLabel>
                  {leadOptions.map((tab) => (
                    <DropdownMenuItem
                      className={`cursor-pointer flex items-center justify-between ml-4 ${
                        selectedTab?.id === tab.id
                          ? "bg-muted font-medium"
                          : ""
                      }`}
                      key={tab.id}
                      onClick={() => setMobileTab(tab.id)}
                    >
                      <span>{tab.title}</span>
                      {selectedTab?.id === tab.id && (
                        <Check size={16}  />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* -------- PROJECT -------- */}
              {projectOptions.length > 0 && (
                <>
                  {/* {leadOptions.length > 0} */}
                  <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project
                  </DropdownMenuLabel>
                  {projectOptions.map((tab) => (
                    <DropdownMenuItem
                      className={`cursor-pointer flex items-center justify-between ml-4 ${
                        selectedTab?.id === tab.id
                          ? "bg-muted font-medium"
                          : ""
                      }`}
                      key={tab.id}
                      onClick={() => setMobileTab(tab.id)}
                    >
                      <span>{tab.title}</span>
                      {selectedTab?.id === tab.id && (
                        <Check size={16} className="" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* ================= DESKTOP TABS ================= */}
      <div className="hidden md:block">
        <SmoothTab items={finalTabs} defaultTabId={defaultTab} />
      </div>

      {/* ================= MOBILE CONTENT ================= */}
      <div className="block md:hidden">{selectedTab?.cardContent}</div>
    </>
  );
}
