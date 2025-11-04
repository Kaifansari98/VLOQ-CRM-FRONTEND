"use client";

import { Suspense } from "react";
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
import { useAppSelector } from "@/redux/store";
import { useDesigningStageCounts } from "@/hooks/designing-stage/designing-leads-hooks";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

function DetailsContent() {
  const searchParams = useSearchParams();
  const leadId = Number(searchParams.get("leadId") ?? 0);
  const accountId = Number(searchParams.get("accountId") ?? 0);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const { data, isLoading, isError } = useDesigningStageCounts(
    vendorId,
    leadId
  );

  const canBook =
    !!data &&
    (data.QuotationDoc ?? 0) > 0 &&
    (data.SelectionData ?? 0) > 0 &&
    (data.DesignsDoc ?? 0) > 0;

  console.log("Designing stage count: ", data);
  return (
    <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
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
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 h-full w-full p-6">
        <DetailsProvider value={{ leadId, accountId, canBook }}>
          <PillTabs
            tabs={[
              {
                id: "quotation",
                label: "Quotation",
                content: <QuotationTab />,
              },
              { id: "meetings", label: "Meetings", content: <MettingsTab /> },
              { id: "designs", label: "Designs", content: <DesigningTab /> },
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
  );
}

export default function Details() {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* ✅ Wrap in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <DetailsContent />
      </Suspense>
    </SidebarProvider>
  );
}
