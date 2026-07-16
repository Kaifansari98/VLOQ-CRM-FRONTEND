"use client";

import { useAppSelector } from "@/redux/store";
import { useOrderLoginByLead } from "@/api/production/order-login";
import OrderLoginCard from "./OrderLoginCard";
import ComingSoon from "@/components/generics/ComingSoon";
import ClientRequiredDeliveryDateBanner from "@/components/shared/ClientRequiredDeliveryDateBanner";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";

interface PreProductionDetailsProps {
  leadId?: number;
  accountId?: number;
  instanceId?: number | null;
}

export interface CompanyVendor {
  id: number;
  company_name: string;
  contact_no: string;
}

export interface OrderLoginItem {
  id: number;
  item_type: string;
  item_desc: string;

  factory_user_vendor_selection_remark: string;

  estimated_completion_date: string; // ISO string
  completion_date: string; // ISO string

  companyVendor?: CompanyVendor;
  company_vendor_id?: number | null;

  created_at?: string;
  updated_at?: string;
}

export default function PreProductionDetails({
  leadId,
  instanceId,
}: PreProductionDetailsProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadId,
    vendorId,
  );

  const structureInstances: any[] = Array.isArray(instancesResponse?.data)
    ? instancesResponse.data
    : (instancesResponse?.data?.data ?? []);
  const resolvedCurrentInstance =
    instanceId != null
      ? structureInstances.find(
          (instance: any) => Number(instance.id) === Number(instanceId),
        )
      : structureInstances.length === 1
        ? structureInstances[0]
        : null;
  const effectiveInstanceId = resolvedCurrentInstance?.id ?? instanceId;
  const isOrderLoginFilled =
    resolvedCurrentInstance?.is_order_login_filled === true;
  console.log("[PreProductionDetails] order login gate", {
    leadId,
    instanceId,
    effectiveInstanceId,
    resolvedCurrentInstance,
    is_order_login_filled: resolvedCurrentInstance?.is_order_login_filled,
    isOrderLoginFilled,
  });
  const { data, isLoading, isError } = useOrderLoginByLead(
    vendorId,
    leadId,
    effectiveInstanceId ?? undefined
  );

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading order login data...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        Unable to fetch order login data. Please retry.
      </p>
    );
  }

  if (!isOrderLoginFilled) {
    return (
      <ComingSoon
        heading="Order Login Is Still Pending"
        description="The backend user has not marked Order Login as filled for this instance yet."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <ComingSoon
        heading="Order Login Is Still Pending"
        description="Order Login has not been filled for this instance yet. The backend user must finish and mark Order Login as filled before these cards become available."
      />
    );
  }

  return (
    <div className="space-y-4 bg-[#fff] dark:bg-[#0a0a0a]">
      <ClientRequiredDeliveryDateBanner leadId={leadId || 0} />

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No order login details found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item: OrderLoginItem) => (
            <OrderLoginCard
              key={item.id}
              orderLoginId={item.id}
              title={item.item_type}
              desc={item.item_desc}
              companyVendorName={item.companyVendor?.company_name}
              companyVendorContact={item.companyVendor?.contact_no}
              currentCompanyVendorId={item.company_vendor_id}
              leadId={leadId || 0}
              vendorId={vendorId || 0}
              factory_user_vendor_selection_remark={
                item.factory_user_vendor_selection_remark
              }
              estimated_completion_date={item.estimated_completion_date}
              markedAsCompletedDate={item.completion_date}
            />
          ))}
        </div>
      )}
    </div>
  );
}
