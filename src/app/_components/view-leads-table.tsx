"use client";

import { UniversalTable } from "@/components/custom/UniversalTable";

// Route builder for row navigation
const navigateOpenLeads = (row: any) =>
  `/dashboard/leads/leadstable/details/${row.id}?accountId=${row.accountId}`;

export default function ViewOpenLeadTable() {
  return (
    <UniversalTable
      type="Type 1"
      title="Open Leads"
      description="Fresh leads awaiting initial action."
      enableAdminTabs={true}
      onRowNavigate={navigateOpenLeads}
    />
  );
}
