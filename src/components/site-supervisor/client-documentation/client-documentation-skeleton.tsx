"use client";

import React from "react";
import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "../../ui/sidebar";
import { DataTableSkeleton } from "../../data-table/data-table-skeleton";
import { FeatureFlagsProvider } from "../../../app/_components/feature-flags-provider";
import FinalMeasurementLeadsTable from "@/app/_components/final-measurement-table";
import ClientDocumentationLeadsTable from "@/app/_components/client-documentation-table";

export default function ClientDocumentationSkeleton() {
  return (
    <SidebarProvider>
      <SidebarInset className=" w-full h-full flex flex-col">
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
              <ClientDocumentationLeadsTable />
            </Suspense>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
