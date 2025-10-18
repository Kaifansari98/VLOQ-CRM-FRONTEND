"use client";

import React, { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import TechCheckStageTable from "@/app/_components/production/tech-check/TechCheckStageTable";

export default function TechCheckStageSkeleton() {
  return (
    <SidebarProvider>
      <SidebarInset className="w-full h-full flex flex-col">
        <main className="flex-1 p-4 pt-0 overflow-x-hidden">
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
              <TechCheckStageTable />
            </Suspense>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}