"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import LeadDetailsPage from "@/app/dashboard/leads/leadstable/details/[leadId]/page";

export default function OnlineLeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.leadId;

  const isOnlineLeadFeatureEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.is_online_lead_feature_enabled === true
  );

  useEffect(() => {
    if (!isOnlineLeadFeatureEnabled && leadId) {
      router.replace(`/dashboard/leads/draft-lead/details/${leadId}`);
    }
  }, [isOnlineLeadFeatureEnabled, leadId, router]);

  return <LeadDetailsPage />;
}
