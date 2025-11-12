"use client";

import React from "react";
import { ClipboardCheck, Images } from "lucide-react";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import SiteReadinessDetails from "./SiteReadinessDetails";
import CurrentSitePhotosReadinessSection from "./CurrentSitePhotosReadinessSection";

interface SiteReadinessTabsProps {
  leadId: number;
  accountId: number;
  name?: string;
}

export default function SiteReadinessTabs({
  leadId,
  accountId,
  name,
}: SiteReadinessTabsProps) {
  const tabItems = [
    {
      id: "checklist",
      title: (
        <div className="flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4" />
          <span>Checklist</span>
        </div>
      ),
      color: "bg-blue-500 hover:bg-blue-600",
      cardContent: (
        <div className="relative w-full h-full p-0">
          <SiteReadinessDetails
            leadId={leadId}
            accountId={accountId}
            name={name}
          />
        </div>
      ),
    },
    {
      id: "current-photos",
      title: (
        <div className="flex items-center gap-1.5">
          <Images className="w-4 h-4" />
          <span>Current Site Photos</span>
        </div>
      ),
      color: "bg-emerald-500 hover:bg-emerald-600",
      cardContent: (
        <div className="relative w-full h-full p-0">
          <CurrentSitePhotosReadinessSection
            leadId={leadId}
            accountId={accountId}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <SmoothTab
        items={tabItems}
        defaultTabId="checklist"
        activeColor="bg-primary"
        className="!justify-start !w-fit border-none shadow-none bg-muted px-0 overflow-scroll"
        contentHeightClass="h-[150vh]"
      />
    </div>
  );
}
