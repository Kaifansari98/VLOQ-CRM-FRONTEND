"use client";

import React from "react";
import { ClipboardCheck, Images } from "lucide-react";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import SiteReadinessDetails from "./SiteReadinessDetails";
import CurrentSitePhotosReadinessSection from "./CurrentSitePhotosReadinessSection";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";
import { useAppSelector } from "@/redux/store";

interface SiteReadinessTabsProps {
  leadId: number;
  accountId: number;
  name?: string;
  instanceId?: number | null;
}

export default function SiteReadinessTabs({
  leadId,
  accountId,
  name,
}: SiteReadinessTabsProps) {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const canViewCurrentSitePhotos =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "installation.site_readiness.current_site_photos.view",
        )
      : true;

  const tabItems = [
    {
      id: "checklist",
      title: (
        <div className="flex items-center gap-1.5 ">
          <ClipboardCheck className="w-4 h-4" />
          <span>Checklist</span>
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
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
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canViewCurrentSitePhotos,
      disabledReason: "You don’t have permission to access Current Site Photos.",
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
    <div className="w-full h-full">
      <div className="mb-4">
        <ClientRequiredDeliveryDateBanner leadId={leadId} />
      </div>
      <SmoothTab
        items={tabItems}
        defaultTabId="checklist"      
      />
    </div>
  );
}
