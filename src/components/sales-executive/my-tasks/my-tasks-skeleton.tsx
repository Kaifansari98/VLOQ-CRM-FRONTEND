import React from "react";
import { Suspense } from "react";

import MyTaskTable from "@/app/_components/tasks-table";
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function MyTaskLeadsSkeleton() {
  return (
    <SidebarProvider>
      <SidebarInset className=" w-full h-full flex flex-col">
        <main className="flex-1 p-4 pt-0 overflow-x-hidden ">
          <FeatureFlagsProvider>
            <Suspense fallback={<DataTableSkeleton columnCount={10} />}>
              <MyTaskTable />
            </Suspense>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
