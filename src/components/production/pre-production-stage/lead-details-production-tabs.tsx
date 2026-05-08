"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import PreProductionDetails from "./PreProductionDetails";
import PostProductionDetails from "./PostProductionDetails";
import {
  useCheckPostProductionReady,
  useCheckPreProductionFilesReady,
} from "@/api/production/production-api";
import { useAppSelector } from "@/redux/store";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { canViewDefaultSubTabProductionStage } from "@/components/utils/privileges";
import ProductionFilesSection from "../order-login-stage/ProductionFilesModal";
import PreProductionFilesSection from "./PreProductionFilesSection";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useTechCheckInstanceStatus } from "@/api/tech-check";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import ComingSoon from "@/components/generics/ComingSoon";

interface LeadDetailsProductionUtilProps {
  leadId: number;
  accountId?: number;
  instanceId?: number | null;
}

export default function LeadDetailsProductionUtil({
  leadId,
  accountId,
  instanceId,
}: LeadDetailsProductionUtilProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userType = useAppSelector((s) => s.auth.user?.user_type?.user_type);
  const customPrivilegeCodes = useAppSelector(
    (s) => s.customPrivileges.codes,
  );
  const effectiveUserType = userType === "admin" ? "sales-executive" : userType;
  const userId = useAppSelector((s) => s.auth.user?.id);
  const searchParams = useSearchParams();
  const instanceFromUrlRaw = searchParams.get("instance_id");
  const instanceFromUrl = instanceFromUrlRaw
    ? Number(instanceFromUrlRaw)
    : null;
  const lockInstanceFromUrl =
    Number.isFinite(instanceFromUrl) && !!instanceFromUrl;
  const resolvedInstanceId =
    Number.isFinite(instanceFromUrl) && instanceFromUrl
      ? instanceFromUrl
      : (instanceId ?? null);

  const { data: clientDocs } = useClientDocumentationDetails(
    vendorId!,
    leadId,
    userId!,
    instanceFromUrl!,
  );
  const clientDocInstances = clientDocs?.product_structure_instances ?? [];
  const hasMultipleInstances = (clientDocs?.instance_count ?? 0) > 1;
  const [activeInstanceId, setActiveInstanceId] = useState<number | null>(
    resolvedInstanceId,
  );

  useEffect(() => {
    if (!hasMultipleInstances) {
      setActiveInstanceId(resolvedInstanceId);
      return;
    }
    if (resolvedInstanceId) {
      setActiveInstanceId(resolvedInstanceId);
      return;
    }
    if (!activeInstanceId && clientDocInstances.length > 0) {
      setActiveInstanceId(clientDocInstances[0]?.id ?? null);
    }
  }, [
    hasMultipleInstances,
    resolvedInstanceId,
    clientDocInstances,
    activeInstanceId,
  ]);

  const scopedInstanceId = hasMultipleInstances
    ? activeInstanceId
    : resolvedInstanceId;

  const { data: techCheckInstanceStatus } = useTechCheckInstanceStatus(
    vendorId,
    leadId,
    scopedInstanceId,
  );

  const { data } = useCheckPostProductionReady(
    vendorId,
    leadId,
    scopedInstanceId ?? undefined,
  );

  const { data: preProductionReadyData } = useCheckPreProductionFilesReady(
    vendorId,
    leadId,
    scopedInstanceId ?? undefined,
  );
  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );

  const readyForPostProduction = data?.readyForPostProduction ?? false;
  const structureInstances: any[] = Array.isArray(instancesResponse?.data)
    ? instancesResponse.data
    : (instancesResponse?.data?.data ?? []);
  const resolvedCurrentInstance =
    scopedInstanceId != null
      ? structureInstances.find(
          (instance: any) => Number(instance.id) === Number(scopedInstanceId),
        )
      : structureInstances.length === 1
        ? structureInstances[0]
        : null;
  const effectiveInstanceId = resolvedCurrentInstance?.id ?? scopedInstanceId;
  const isOrderLoginFilled =
    resolvedCurrentInstance?.is_order_login_filled === true;
  const isPreProdDone = resolvedCurrentInstance?.is_pre_prod_done === true;
  const readyForUnderProduction = effectiveInstanceId
    ? isPreProdDone
    : (preProductionReadyData?.readyForUnderProduction ?? false);
  console.log("[LeadDetailsProductionUtil] under production gate", {
    leadId,
    scopedInstanceId,
    effectiveInstanceId,
    resolvedCurrentInstance,
    is_order_login_filled: resolvedCurrentInstance?.is_order_login_filled,
    isOrderLoginFilled,
    is_pre_prod_done: resolvedCurrentInstance?.is_pre_prod_done,
    readyForUnderProduction,
  });

  const defaultTab = canViewDefaultSubTabProductionStage(
    effectiveUserType ?? "",
  );
  const tabFromUrl = searchParams.get("tab");
  const canAccessAllTabs =
    userType === "super-admin" ||
    userType === "factory" ||
    userType === "pre-prod";
  const canViewProductionFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.production_files.view_download",
        )
      : canAccessAllTabs;
  const canViewPreProductionFiles =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.pre_production_files.view",
        )
      : canAccessAllTabs;
  const canAccessUnderProduction =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.under_production.enable_disable",
        )
      : canAccessAllTabs;

  const allTabs = [
    {
      id: "productionFiles",
      title: "Production Files",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canViewProductionFiles,
      disabledReason:
        userType === "custom"
          ? "You don’t have permission to access Production Files."
          : "Only super-admin and factory can access this tab.",
      cardContent: (
        <ProductionFilesSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={effectiveInstanceId}
          readOnly
        />
      ),
    },
    {
      id: "preProductionFiles",
      title: "Pre Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canViewPreProductionFiles,
      disabledReason:
        userType === "custom"
          ? "You don’t have permission to access Pre Production."
          : "Only super-admin and factory can access this tab.",
      cardContent: (
        <PreProductionFilesSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={effectiveInstanceId}
        />
      ),
    },
    {
      id: "preProduction",
      title: "Under Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !canAccessUnderProduction || !readyForUnderProduction,
      disabledReason: !canAccessUnderProduction
        ? userType === "custom"
          ? "You don’t have permission to access Under Production."
          : "Only super-admin and factory can access this tab."
        : "Click Mark Pre Prod Done first to enable Under Production.",
      cardContent: isOrderLoginFilled ? (
        <PreProductionDetails
          leadId={leadId}
          accountId={accountId}
          instanceId={effectiveInstanceId}
        />
      ) : (
        <ComingSoon
          heading="Order Login Is Still Pending"
          description="The backend user has not marked Order Login as filled for this instance yet."
        />
      ),
    },
    {
      id: "postProduction",
      title: "Post Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: canAccessAllTabs && !readyForPostProduction,
      disabledReason:
        "You can access Post Production only after completing Under-Production.",
      cardContent: (
        <PostProductionDetails
          leadId={leadId}
          accountId={accountId}
          instanceId={effectiveInstanceId}
        />
      ),
    },
  ];

  const showInstanceTabs =
    hasMultipleInstances &&
    clientDocInstances.length > 0 &&
    techCheckInstanceStatus?.is_tech_check_completed === true &&
    techCheckInstanceStatus?.is_order_login_completed === true &&
    techCheckInstanceStatus?.is_production_completed === true &&
    !lockInstanceFromUrl;

  return (
    <div className="h-full">
      {showInstanceTabs && (
        <div className="mb-4">
          <div className="border-b border-border">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex items-end gap-2 sm:flex-wrap">
                {clientDocInstances.map((instance: any) => {
                  const isActive = scopedInstanceId === instance.id;
                  return (
                    <div
                      key={instance.id}
                      onClick={() => setActiveInstanceId(instance.id)}
                      className={`
                  cursor-pointer transition-all shrink-0
                  px-3 py-2 rounded-t-lg border border-b-0
                  min-w-[100px] max-w-[160px]
                  ${
                    isActive
                      ? "bg-background text-foreground border-border"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                  }
                `}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-semibold leading-none truncate w-full">
                          {instance.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 truncate w-full">
                          {instance.productStructure?.type ||
                            "Product Structure"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      )}
      <SmoothTab
        items={allTabs}
        defaultTabId={
          canAccessAllTabs
            ? (tabFromUrl ??
              (defaultTab ? "preProductionFiles" : "postProduction"))
            : "postProduction"
        }
      />
    </div>
  );
}
