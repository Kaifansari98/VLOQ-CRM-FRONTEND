"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import PreProductionDetails from "./PreProductionDetails";
import PostProductionDetails from "./PostProductionDetails";
import { useCheckPostProductionReady } from "@/api/production/production-api";
import { useAppSelector } from "@/redux/store";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { canViewDefaultSubTabProductionStage } from "@/components/utils/privileges";
import ProductionFilesSection from "../order-login-stage/ProductionFilesModal";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import { useTechCheckInstanceStatus } from "@/api/tech-check";

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
  const searchParams = useSearchParams();
  const instanceFromUrlRaw = searchParams.get("instance_id");
  const instanceFromUrl = instanceFromUrlRaw ? Number(instanceFromUrlRaw) : null;
  const lockInstanceFromUrl =
    Number.isFinite(instanceFromUrl) && !!instanceFromUrl;
  const resolvedInstanceId =
    Number.isFinite(instanceFromUrl) && instanceFromUrl
      ? instanceFromUrl
      : instanceId ?? null;

  const { data: clientDocs } = useClientDocumentationDetails(vendorId!, leadId);
  const instances = clientDocs?.product_structure_instances ?? [];
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
    if (!activeInstanceId && instances.length > 0) {
      setActiveInstanceId(instances[0]?.id ?? null);
    }
  }, [
    hasMultipleInstances,
    resolvedInstanceId,
    instances,
    activeInstanceId,
  ]);

  const scopedInstanceId = hasMultipleInstances
    ? activeInstanceId
    : resolvedInstanceId;

  const { data: techCheckInstanceStatus } = useTechCheckInstanceStatus(
    vendorId,
    leadId,
    scopedInstanceId
  );

  const { data } = useCheckPostProductionReady(
    vendorId,
    leadId,
    scopedInstanceId ?? undefined
  );

  const readyForPostProduction = data?.readyForPostProduction ?? false;

  const defaultTab = canViewDefaultSubTabProductionStage(userType);

  const allTabs = [
    {
      id: "productionFiles",
      title: "Production Files",
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <ProductionFilesSection
          leadId={leadId}
          accountId={accountId ?? null}
          instanceId={scopedInstanceId}
          readOnly
        />
      ),
    },
    {
      id: "preProduction",
      title: "Under Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !defaultTab,
      disabledReason: readyForPostProduction
        ? "You do not have permission to view this record."
        : "This lead is work on under production",

      cardContent: (
        <PreProductionDetails
          leadId={leadId}
          accountId={accountId}
          instanceId={scopedInstanceId}
        />
      ),
    },
    {
      id: "postProduction",
      title: "Post Production",
      color: "bg-zinc-900 hover:bg-zinc-900",
      disabled: !readyForPostProduction,
      disabledReason:
        "You can access Post Production only after completing Under-Production.",
      cardContent: (
        <PostProductionDetails
          leadId={leadId}
          accountId={accountId}
          instanceId={scopedInstanceId}
        />
      ),
    },
  ];

  const showInstanceTabs =
    hasMultipleInstances &&
    instances.length > 0 &&
    techCheckInstanceStatus?.is_tech_check_completed === true &&
    techCheckInstanceStatus?.is_order_login_completed === true &&
    techCheckInstanceStatus?.is_production_completed === true &&
    !lockInstanceFromUrl;

  return (
    <div className="h-full">
      {showInstanceTabs && (
        <div className="mb-4">
          <div className="flex flex-wrap items-end gap-2 border-b border-border">
            {instances.map((instance: any) => {
              const isActive = scopedInstanceId === instance.id;
              return (
                <div
                  key={instance.id}
                  className={`cursor-pointer transition px-3 py-2 rounded-t-lg border border-b-0 ${
                    isActive
                      ? "bg-background text-foreground border-border"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60"
                  }`}
                  onClick={() => setActiveInstanceId(instance.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold leading-none">
                      {instance.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {instance.productStructure?.type || "Product Structure"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <SmoothTab
        items={allTabs}
        defaultTabId={defaultTab ? "preProduction" : "postProduction"}
      />
    </div>
  );
}
