import React, { useState } from "react";

import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ViewOpenLeadTable from "@/app/_components/view-leads-table";
import PendingLeadsTable from "@/app/dashboard/leads/pending-leads/pending-leads-table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LeadStatusTabs } from "./LeadStatusTabs";
import { useAppSelector } from "@/redux/store";
import { useActivityStatusCounts } from "@/hooks/useActivityStatus";

export default function ViewLeadsSkeleton() {
  const [tab, setTab] = useState<"open" | "onHold" | "lostApproval" | "lost">(
    "open"
  );

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data: counts } = useActivityStatusCounts(vendorId);

  return (
    <SidebarProvider>
      <SidebarInset className="w-full h-full flex flex-col">
        <main className="flex-1 p-4 pt-0 overflow-x-hidden">
          <FeatureFlagsProvider>
            {/* Tab component */}
            <LeadStatusTabs tab={tab} setTab={setTab} counts={counts || {total: 0, open: 0, onHold: 0, lostApproval: 0, lost: 0 }} />

            
              {/* ✅ Use TabsContent to keep components mounted */}
              <Tabs value={tab} className="w-full">
                <TabsContent value="open" className="mt-0">
                  <ViewOpenLeadTable />
                </TabsContent>

                <TabsContent value="onHold" className="mt-0">
                  <PendingLeadsTable tab="onHold" />
                </TabsContent>

                <TabsContent value="lostApproval" className="mt-0">
                  <PendingLeadsTable tab="lostApproval" />
                </TabsContent>

                <TabsContent value="lost" className="mt-0">
                  <PendingLeadsTable tab="lost" />
                </TabsContent>
              </Tabs>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}