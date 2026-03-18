"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadStatusNotification } from "@/hooks/designing-stage/designing-leads-hooks";
import { Loader2 } from "lucide-react";

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

const WORKFLOW_STAGE_ROUTE: Record<string, string> = {
  "tech-check-stage": "/dashboard/production/tech-check/details",
  "order-login-stage": "/dashboard/production/order-login/details",
  "production-stage": "/dashboard/production/pre-post-prod/details",
};

const buildQueryString = (searchParams: URLSearchParams) => {
  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
};

export default function LeadDetailsRedirectPage() {
  const router = useRouter();
  const { leadId } = useParams();
  const searchParams = useSearchParams();

  const accountId = searchParams.get("accountId");
  const instanceId = searchParams.get("instance_id");
  const instanceIdNum = instanceId ? Number(instanceId) : undefined;

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const leadIdNum = Number(leadId);

  const { data: leadStatus, isLoading } = useLeadStatusNotification(
    leadIdNum!,
    vendorId!,
    instanceIdNum,
  );

  const targetUrl = useMemo(() => {
    if (!Number.isFinite(leadIdNum) || !leadStatus) return null;

    let routeBase: string | undefined;

    // 🔑 If production-related → use workflow_stage
    if (leadStatus.workflow_stage) {
      routeBase = WORKFLOW_STAGE_ROUTE[leadStatus.workflow_stage];
    }

    // 🔁 Fallback to lead status tag
    if (!routeBase && leadStatus.lead_status_tag) {
      routeBase = STAGE_ROUTE_BY_TYPE[leadStatus.lead_status_tag];
    }

    if (!routeBase) {
      routeBase = STAGE_ROUTE_BY_TYPE["Type 1"];
    }

    return `${routeBase}/${leadIdNum}${buildQueryString(searchParams)}`;
  }, [leadIdNum, leadStatus, searchParams]);

  useEffect(() => {
    if (!vendorId || isLoading) return;
    if (!targetUrl) return;

    router.replace(targetUrl);
  }, [isLoading, router, targetUrl, vendorId]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white" />
      <p className="text-sm text-black dark:text-white">
        Redirecting to lead details...
      </p>
    </div>
  );
}
