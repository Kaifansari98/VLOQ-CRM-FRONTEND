"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";

const STAGE_ROUTE_BY_TYPE: Record<string, string> = {
  "Type 1": "/dashboard/leads/leadstable/details",
  "Type 2": "/dashboard/leads/initial-site-measurement/details",
  "Type 3": "/dashboard/leads/designing-stage/details",
  "Type 4": "/dashboard/leads/booking-stage/details",
  "Type 5": "/dashboard/project/final-measurement/details",
  "Type 6": "/dashboard/project/client-documentation/details",
  "Type 7": "/dashboard/project/client-approval/details",
  "Type 8": "/dashboard/production/tech-check/details",
  "Type 9": "/dashboard/production/order-login/details",
  "Type 10": "/dashboard/production/pre-post-prod/details",
  "Type 11": "/dashboard/production/ready-to-dispatch/details",
  "Type 12": "/dashboard/installation/site-readiness/details",
  "Type 13": "/dashboard/installation/dispatch-planning/details",
  "Type 14": "/dashboard/installation/dispatch-stage/details",
  "Type 15": "/dashboard/installation/under-installation/details",
  "Type 16": "/dashboard/installation/final-handover/details",
};

const buildQueryString = (accountId: string | null) => {
  if (!accountId) return "";
  const asNumber = Number(accountId);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return "";
  return `?accountId=${asNumber}`;
};

export default function LeadDetailsRedirectPage() {
  const router = useRouter();
  const { leadId } = useParams();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadIdNum = Number(leadId);

  const { data: leadStatus, isLoading } = useLeadStatus(
    Number.isFinite(leadIdNum) ? leadIdNum : undefined,
    vendorId
  );

  const targetUrl = useMemo(() => {
    if (!Number.isFinite(leadIdNum)) return null;
    const routeBase =
      (leadStatus?.status_tag && STAGE_ROUTE_BY_TYPE[leadStatus.status_tag]) ||
      STAGE_ROUTE_BY_TYPE["Type 1"];
    return `${routeBase}/${leadIdNum}${buildQueryString(accountId)}`;
  }, [accountId, leadIdNum, leadStatus?.status_tag]);

  useEffect(() => {
    if (!vendorId || isLoading) return;
    if (!targetUrl) return;
    router.replace(targetUrl);
  }, [isLoading, router, targetUrl, vendorId]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to lead details...
    </div>
  );
}
