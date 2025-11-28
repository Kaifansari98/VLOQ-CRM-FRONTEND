"use client";

import { UniversalTable } from "@/components/custom/UniversalTable";
import { useInitialSiteMeasurement } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useVendorOverallLeads } from "@/hooks/useLeadsQueries";

import { getUniversalTableColumns } from "@/components/utils/column/Universal-column";

import type { Lead } from "@/api/leads";
import type { LeadColumn } from "@/components/utils/column/column-type";

export const navigateSiteMeasurement = (row: any) =>
  `/dashboard/leads/initial-site-measurement/details/${row.id}?accountId=${row.accountId}`;

export const mapSiteMeasurementRow = (
  lead: Lead,
  index: number
): LeadColumn => ({
  id: lead.id,
  srNo: index + 1,
  lead_code: lead.lead_code ?? "",
  name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
  email: lead.email ?? "",
  contact: `${lead.country_code ?? ""} ${lead.contact_no ?? ""}`.trim(),
  siteAddress: lead.site_address ?? "",
  architechName: lead.archetech_name ?? "",
  designerRemark: lead.designer_remark ?? "",
  productTypes:
    lead.productMappings?.map((pm) => pm.productType?.type).join(", ") ?? "",
  productStructures:
    lead.leadProductStructureMapping
      ?.map((psm) => psm.productStructure?.type)
      .join(", ") ?? "",
  source: lead.source?.type ?? "",
  siteType: lead.siteType?.type ?? "",
  createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
  updatedAt: lead.updated_at ?? "",
  altContact: lead.alt_contact_no ?? "",
  status: lead.statusType?.type ?? "",
  site_map_link: lead.site_map_link ?? "",
  assign_to: lead.assignedTo?.user_name ?? "",
  accountId: lead.account?.id ?? lead.account_id ?? 0,
});

export default function SiteMeasurementTable() {
  return (
    <UniversalTable
      title="Initial Site Measurement"
      description="Centralized record of all initial site-measurement entries for quick review and action."
      fetchMyFn={useInitialSiteMeasurement} // My leads API
      fetchOverallFn={useVendorOverallLeads} // Overall API
      type="Type 2" // Stage type for overall API
      enableAdminTabs={true} // Show My vs Overall
      rowMapper={mapSiteMeasurementRow} // Transform backend data
      getColumns={getUniversalTableColumns} // Table columns
      onRowNavigate={navigateSiteMeasurement} // Navigation
    />
  );
}
