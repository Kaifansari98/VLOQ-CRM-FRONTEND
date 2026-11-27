import type { LeadStageItem } from "@/api/dashboard/dashboard.api";

export interface LeadSearchItem extends LeadStageItem {
  instance_id?: number;
  instance_label?: string;
}

// Keep eligibility and suffixes aligned with UniversalTable's Type 8/9/10 rows.
export function getLeadSearchItems(
  stageKey: string,
  leads: LeadStageItem[],
  handlesLargeScaleProjects: boolean,
): LeadSearchItem[] {
  if (
    handlesLargeScaleProjects ||
    !["techCheckStage", "orderLoginStage", "productionStage"].includes(stageKey)
  ) {
    return leads;
  }

  return leads.flatMap((lead) => {
    const instances = lead.productStructureInstances ?? [];
    const eligible = instances.filter((instance) => {
      if (stageKey === "techCheckStage") {
        return instance.is_tech_check_completed !== true;
      }
      if (stageKey === "orderLoginStage") {
        return (
          instance.is_tech_check_completed === true &&
          instance.is_order_login_completed !== true
        );
      }
      return (
        instance.is_tech_check_completed === true &&
        instance.is_order_login_completed === true
      );
    });

    return eligible.map((instance, index) => ({
      ...lead,
      instance_id: instance.id,
      instance_label: instance.title || instance.productStructure?.type || undefined,
      lead_code: `${lead.lead_code ?? ""}${
        instances.length > 1
          ? `.${instance.quantity_index ?? (eligible.length === 1 ? 1 : index + 1)}`
          : ""
      }`,
    }));
  });
}

export function getLeadSearchDetailsPath(
  basePath: string,
  stageKey: string,
  lead: LeadSearchItem,
): string {
  const params = new URLSearchParams({ accountId: String(lead.account_id) });
  if (lead.instance_id != null) {
    params.set("instance_id", String(lead.instance_id));
  }
  if (stageKey === "projectCompletedStage") {
    params.set("tab", "servicing");
    params.set("source", "servicing");
  }
  return `${basePath}/${lead.id}?${params.toString()}`;
}
