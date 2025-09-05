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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ModeToggle";
import PillTabs from "@/components/sales-executive/designing-stage/pill-tabs";
import QuotationTab from "@/components/sales-executive/designing-stage/pill-tabs-component/quotation";
import MettingsTab from "@/components/sales-executive/designing-stage/pill-tabs-component/meetings";
import SelectionsTab from "@/components/sales-executive/designing-stage/pill-tabs-component/selection";
import DesigningTab from "@/components/sales-executive/designing-stage/pill-tabs-component/designs";
import { useSearchParams } from "next/navigation";
import { DetailsProvider } from "@/components/sales-executive/designing-stage/pill-tabs-component/details-context";

export default function Details() {
  const searchParams = useSearchParams();
  const leadId = Number(searchParams.get("leadId") ?? 0);
  const accountId = Number(searchParams.get("accountId") ?? 0);

  console.log("leadId from Click Details Button: ", leadId);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 px-3 sm:px-4 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
            <Breadcrumb className="truncate">
              <BreadcrumbList className="flex flex-wrap gap-1 text-sm sm:text-base">
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/sales-executive/designing-stage">
                    Designing Stage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Details</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 h-full w-full p-3 sm:p-4 md:p-6 overflow-y-auto">
          <DetailsProvider value={{ leadId, accountId }}>
            <PillTabs
              tabs={[
                {
                  id: "quotation",
                  label: "Quotation",
                  content: <QuotationTab />,
                },
                {
                  id: "meetings",
                  label: "Meetings",
                  content: <MettingsTab />,
                },
                {
                  id: "designs",
                  label: "Designs",
                  content: <DesigningTab />,
                },
                {
                  id: "selections",
                  label: "Selections",
                  content: <SelectionsTab />,
                },
              ]}
            />
          </DetailsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
