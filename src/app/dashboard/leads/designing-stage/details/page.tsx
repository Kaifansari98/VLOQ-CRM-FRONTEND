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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import PillTabs from "@/components/sales-executive/designing-stage/pill-tabs";
import QuotationTab from "@/components/sales-executive/designing-stage/pill-tabs-component/quotation";
import MettingsTab from "@/components/sales-executive/designing-stage/pill-tabs-component/meetings";
import SelectionsTab from "@/components/sales-executive/designing-stage/pill-tabs-component/selection";
import DesigningTab from "@/components/sales-executive/designing-stage/pill-tabs-component/designs";
import SpecificationsTab from "@/components/sales-executive/designing-stage/pill-tabs-component/specifications";
import CostingFileTab from "@/components/sales-executive/designing-stage/pill-tabs-component/costing-file";
import ElectricalPlumbingTab from "@/components/sales-executive/designing-stage/pill-tabs-component/electrical-plumbing";
import FinalIsmUploadTab from "@/components/sales-executive/designing-stage/pill-tabs-component/final-ism-upload";
import { useSearchParams } from "next/navigation";
import { DetailsProvider } from "@/components/sales-executive/designing-stage/pill-tabs-component/details-context";
import { useAppSelector } from "@/redux/store";
import { useDesigningStageCounts } from "@/hooks/designing-stage/designing-leads-hooks";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  FileText,
  Calendar,
  Palette as PaletteIcon,
  ListChecks,
  ClipboardList,
  Receipt,
  Zap,
  Upload,
} from "lucide-react";

function DetailsContent() {
  const searchParams = useSearchParams();
  const leadId = Number(searchParams.get("leadId") ?? 0);
  const accountId = Number(searchParams.get("accountId") ?? 0);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const { data } = useDesigningStageCounts(vendorId, leadId);

  const canBook =
    !!data &&
    (data.QuotationDoc ?? 0) > 0 &&
    (data.SelectionData ?? 0) > 0 &&
    (data.DesignsDoc ?? 0) > 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background">
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
                <BreadcrumbLink href="/dashboard/leads/designing-stage">
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
          <NotificationBell />
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
                icon: FileText,
                content: <QuotationTab />,
              },
              {
                id: "meetings",
                label: "Meetings",
                icon: Calendar,
                content: <MettingsTab />,
              },
              {
                id: "designs",
                label: "Designs",
                icon: PaletteIcon,
                content: <DesigningTab />,
              },
              {
                id: "selections",
                label: "Selections",
                icon: ListChecks,
                content: <SelectionsTab />,
              },
              ...(handlesLargeScaleProjects
                ? [
                    {
                      id: "specifications",
                      label: "Specifications",
                      icon: ClipboardList,
                      content: <SpecificationsTab />,
                    },
                    {
                      id: "costing-file",
                      label: "Costing File",
                      icon: Receipt,
                      content: <CostingFileTab />,
                    },
                    {
                      id: "electrical-plumbing",
                      label: "Electrical & Plumbing",
                      icon: Zap,
                      content: <ElectricalPlumbingTab />,
                    },
                    {
                      id: "final-ism-upload",
                      label: "Final ISM Upload",
                      icon: Upload,
                      content: <FinalIsmUploadTab />,
                    },
                  ]
                : []),
            ]}
          />
        </DetailsProvider>
      </main>
    </>
  );
}

export default function Details() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <DetailsContent />
      </Suspense>
    </>
  );
}
