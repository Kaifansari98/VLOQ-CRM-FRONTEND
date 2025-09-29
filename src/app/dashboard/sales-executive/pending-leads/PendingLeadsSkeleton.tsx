"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export default function PendingLeadsSkeleton() {
  return (
    <SidebarProvider>
      <SidebarInset className="w-full h-full flex flex-col">
        <main className="flex-1 p-6 overflow-x-hidden">
          <DataTableSkeleton
            columnCount={8}
            filterCount={2}
            cellWidths={["10rem", "12rem", "12rem", "10rem", "8rem", "12rem"]}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}