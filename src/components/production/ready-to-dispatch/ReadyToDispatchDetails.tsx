"use client";

import React from "react";
import CurrentSitePhotosSection from "./CurrentSitePhotosSection";

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
      <CurrentSitePhotosSection leadId={leadId} accountId={accountId} />
    </div>
  );
}
