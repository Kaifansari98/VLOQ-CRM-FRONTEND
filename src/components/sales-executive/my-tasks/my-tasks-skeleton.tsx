import React from "react";
import { Suspense } from "react";


import MyTaskTable from "@/app/_components/tasks-table";
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ViewOpenLeadTable from "@/app/_components/view-leads-table";

export default function MyTaskLeadsSkeleton() {
  return (
    <SidebarProvider>
      <SidebarInset className=" w-full h-full flex flex-col">
        {/* Header ...same as before */}

        <main className="flex-1 p-4 pt-0 overflow-x-hidden ">
          <FeatureFlagsProvider>
            <Suspense
              fallback={
                <DataTableSkeleton
                  columnCount={10}
                  filterCount={2}
                  cellWidths={[
                    "10rem",
                    "20rem",
                    "10rem",
                    "10rem",
                    "8rem",
                    "8rem",
                  ]}
                />
              }
            >
              <MyTaskTable />
            </Suspense>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}