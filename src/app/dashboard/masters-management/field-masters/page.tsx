"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import SiteMastersTable from "@/components/custom/SiteMastersTable";
import SourceMastersTable from "@/components/custom/SourceMastersTable";
import MiscellaneousTypeMastersTable from "@/components/custom/MiscellaneousTypeMastersTable";
import IssueLogTypeMastersTable from "@/components/custom/IssueLogTypeMastersTable";
import MiscellaneousTeamMastersTable from "@/components/custom/MiscellaneousTeamMastersTable";
import InstallerUserMastersTable from "@/components/custom/InstallerUserMastersTable";
import CompanyVendorMastersTable from "@/components/custom/CompanyVendorMastersTable";

export default function FieldMastersPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Masters Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Field Masters</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="">
          <h1 className="text-xl font-semibold tracking-tight">
            Field Masters
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage CRM master data from one place. Start with site master
            entries and expand this section with more field masters over time.
          </p>
        </div>

        <SmoothTab
          defaultTabId="site-master"
          items={[
            {
              id: "site-master",
              title: "Site Master",
              color: "bg-black hover:bg-black",
              cardContent: <SiteMastersTable />,
            },
            {
              id: "source-master",
              title: "Source Master",
              color: "bg-black hover:bg-black",
              cardContent: <SourceMastersTable />,
            },
            {
              id: "miscellaneous-type-master",
              title: "Miscellaneous Type Master",
              color: "bg-black hover:bg-black",
              cardContent: <MiscellaneousTypeMastersTable />,
            },
            {
              id: "issue-log-type-master",
              title: "Issue Log Type Master",
              color: "bg-black hover:bg-black",
              cardContent: <IssueLogTypeMastersTable />,
            },
            {
              id: "miscellaneous-team-master",
              title: "Miscellaneous Team Master",
              color: "bg-black hover:bg-black",
              cardContent: <MiscellaneousTeamMastersTable />,
            },
            {
              id: "installer-master",
              title: "Installer Master",
              color: "bg-black hover:bg-black",
              cardContent: <InstallerUserMastersTable />,
            },
            {
              id: "company-vendor-master",
              title: "Company Vendor Master",
              color: "bg-black hover:bg-black",
              cardContent: <CompanyVendorMastersTable />,
            },
          ]}
          contentHeightClass="min-h-[240px]"
        />
      </div>
    </>
  );
}
