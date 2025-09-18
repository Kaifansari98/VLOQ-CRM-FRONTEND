"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { GenerateLeadFormModal } from "@/components/sales-executive/Lead/leads-generation-form-modal";
import { Suspense, useState } from "react";
import MyTaskLeadsSkeleton from "@/components/sales-executive/my-tasks/my-tasks-skeleton";
import Loader from "@/components/utils/loader";
export default function MyTaskLeadPage() {
  const [openCreateLead, setOpenCreateLead] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>My Tasks</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-2 items-center">
              <GenerateLeadFormModal
                open={openCreateLead}
                onOpenChange={setOpenCreateLead}
              >
                <Button>Add New Lead</Button>
              </GenerateLeadFormModal>

              <ModeToggle />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pt-0 overflow-x-hidden">
          <Suspense  fallback={
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
                        }>
            <MyTaskLeadsSkeleton />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
