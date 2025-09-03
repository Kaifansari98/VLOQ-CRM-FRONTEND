import React from "react";
import { Suspense } from "react";


import VendorLeadsTable from "@/app/_components/tasks-table";
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function LeadsTable() {
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
              <VendorLeadsTable />
            </Suspense>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}