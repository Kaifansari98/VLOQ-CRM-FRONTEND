"use client";

import React from "react";
import CurrentSitePhotosSection from "./CurrentSitePhotosSection";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";

interface ReadyToDispatchDetailsProps {
  leadId: number;
  accountId: number;
  instanceId?: number | null;
}

export default function ReadyToDispatchDetails({
  leadId,
  accountId,
}: ReadyToDispatchDetailsProps) {
  return (
    <div className="py-2 space-y-4">
      <ClientRequiredDeliveryDateBanner leadId={leadId} />
      <CurrentSitePhotosSection leadId={leadId} accountId={accountId} />
    </div>
  );
}
