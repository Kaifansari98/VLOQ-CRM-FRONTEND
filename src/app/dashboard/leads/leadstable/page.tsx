"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ViewLeadsSkeleton from "@/components/sales-executive/Lead/view-leads-skeleton";
import { Button } from "@/components/ui/button";
import { GenerateLeadFormModal } from "@/components/sales-executive/Lead/leads-generation-form-modal";
import {  useState } from "react";
import { useAppSelector } from "@/redux/store";
import { canCreateLead } from "@/components/utils/privileges";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function LeadsGenerationPage() {
  const [openCreateLead, setOpenCreateLead] = useState(false);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          {/* Left side - SidebarTrigger + Breadcrumb */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Open Leads</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-2 items-center">
              {/* ✅ Show only for admin, super-admin, sales-executive */}
              {canCreateLead(userType) && (
                <>
                  <Button onClick={() => setOpenCreateLead(true)}>
                    Add New Lead
                  </Button>

                  <GenerateLeadFormModal
                    open={openCreateLead}
                    onOpenChange={setOpenCreateLead}
                  />
                </>
              )}

              <AnimatedThemeToggler />
            </div>
          </div>
        </header>

       

        <ViewLeadsSkeleton />
      </SidebarInset>
    </SidebarProvider>
  );
}
